import mongoose from "mongoose";
import Purchase from "./Purchase.js";
import Product from "../products/Product.js";
import Supplier from "../suppliers/Supplier.js";
import User from "../../core/users/User.js";
import Notification from "../../core/notifications/Notification.js";
import InventoryService from "../inventory/InventoryService.js";
import AccountingService from "../../billing/ledger/AccountingService.js";
import TransactionManager from "../../../shared/utils/TransactionManager.js";
import UnitService from "../products/UnitService.js";
import ErpOrchestrator from "../../../shared/utils/ErpOrchestrator.js";

// Create Purchase (Inward Stock)
export const createPurchase = async (req, res) => {
  try {
    const { 
      supplier, 
      material, 
      quantity, 
      taxableAmount, 
      unit = "kg", 
      category = "Uncategorized",
      materialGrade = "",
      thickness = 0,
      width = 0,
      length = 0
    } = req.body;

    let productId = material;
    let existingProduct;

    // Smart Material Resolution: Handle both ID and Manual Name + Dimensions
    if (mongoose.Types.ObjectId.isValid(material)) {
      existingProduct = await Product.findById(material);
    }

    if (!existingProduct) {
      // Try to find by name, grade, and dimensions (case-insensitive name)
      existingProduct = await Product.findOne({ 
        name: { $regex: new RegExp(`^${material}$`, 'i') },
        materialGrade: materialGrade,
        thickness: thickness,
        width: width,
        length: length,
        isDeleted: { $ne: true }
      });

      if (!existingProduct) {
        // On-the-fly creation of Raw Material with specifications
        existingProduct = await Product.create({
          name: material,
          sku: `MAT-${Math.random().toString(36).substring(7).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          price: (taxableAmount / quantity) || 0,
          type: "raw_material",
          category: category, 
          unit: unit || "kg",
          gstRate: 18,
          materialGrade,
          thickness,
          width,
          length
        });
        console.log(`[ERP SMART PROCURE] New Specified Material Registered: ${material} (${materialGrade} ${thickness}x${width})`);
      }
      productId = existingProduct._id;
    }

    const adminUser = await User.findById(req.user.id);
    const purchaseSupplier = await Supplier.findById(supplier);

    const gstRate = existingProduct.gstRate || 18;
    
    // Unit Price Normalization: If unit is 'gram', we assume 'taxableAmount' is Price per KG
    const factor = (await UnitService.getUnits()).find(u => u.name === unit.toLowerCase())?.conversionFactor || 1;
    const totalTaxable = Number(taxableAmount) * Number(quantity) * factor;
    const gstAmount = (totalTaxable * gstRate) / 100;
    const totalAmount = totalTaxable + gstAmount;

    let cgst = 0, sgst = 0, igst = 0;

    const adminState = adminUser?.state?.trim().toLowerCase() || "";
    const supplierState = purchaseSupplier?.state?.trim().toLowerCase() || "";

    if (adminState && supplierState && adminState === supplierState) {
      cgst = gstAmount / 2;
      sgst = gstAmount / 2;
    } else {
      igst = gstAmount;
    }

    const purchase = await Purchase.create({
      supplier,
      material: productId,
      quantity,
      unit,
      taxableAmount: totalTaxable,
      gstAmount,
      totalAmount,
      cgst,
      sgst,
      igst,
      status: "pending",
      materialGrade,
      thickness,
      width,
      length
    });

    if (adminUser?.notificationSettings?.newOrder) {
       await Notification.create({
         user: adminUser._id,
         title: "Stock Inward Pending",
         message: `New purchase from ${purchaseSupplier?.name || 'Supplier'} is registered and pending verification.`,
         type: "info",
         link: "/purchases"
       });
    }

    res.status(201).json(purchase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Purchases
export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate("supplier", "name company state gstin")
      .populate("material", "name sku type unit")
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Purchase Status (e.g. mark as received)
export const updatePurchaseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const purchaseId = req.params.id;

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) return res.status(404).json({ msg: "Purchase not found" });

    if (status === "received" && purchase.status !== "received") {
      const result = await ErpOrchestrator.processMaterialInbound({
        purchaseId,
        user: req.user,
        req
      });
      return res.json({ msg: "Material received and inventory/accounts synchronized", purchase: result.purchase });
    }

    purchase.status = status;
    await purchase.save();

    res.json(purchase);
  } catch (err) {
    console.error("[PROCUREMENT ERROR]:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Delete Purchase (Atomic Reversal)
export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await TransactionManager.execute(async (session) => {
      const purchase = await Purchase.findById(id).session(session);
      if (!purchase) throw new Error("Purchase not found");

      if (purchase.status === "received") {
        const revertQty = await UnitService.normalize(purchase.quantity, purchase.unit);

        await InventoryService.updateStock({
          productId: purchase.material,
          quantity: revertQty,
          type: "OUT",
          referenceType: "purchase",
          referenceId: purchase._id,
          reason: `Purchase Deletion: Reverting stock inward`
        });
      }

      await AccountingService.deleteReferenceEntries(purchase._id, session);
      await Purchase.findByIdAndDelete(id).session(session);
      
      return { msg: "Purchase and associated inventory/accounting logs reverted successfully" };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
