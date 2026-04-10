import mongoose from "mongoose";
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// Create Purchase (Inward Stock)
export const createPurchase = async (req, res) => {
  try {
    const { supplier, material, quantity, taxableAmount, unit = "kg", category = "Uncategorized" } = req.body;

    let productId = material;
    let existingProduct;

    // Smart Material Resolution: Handle both ID and Manual Name
    if (mongoose.Types.ObjectId.isValid(material)) {
      existingProduct = await Product.findById(material);
    }

    if (!existingProduct) {
      // Try to find by name (case-insensitive)
      existingProduct = await Product.findOne({ name: { $regex: new RegExp(`^${material}$`, 'i') } });

      if (!existingProduct) {
        // On-the-fly creation of Raw Material
        existingProduct = await Product.create({
          name: material,
          sku: `MAT-${Math.random().toString(36).substring(7).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          price: (taxableAmount / quantity) || 0,
          type: "raw_material",
          category: category, // Apply the selected category
          unit: unit || "kg",
          gstRate: 18 // Default GST for new materials
        });
        console.log(`[ERP SMART PROCURE] New Material Registered: ${material} in Category: ${category}`);
      }
      productId = existingProduct._id;
    }

    const adminUser = await User.findById(req.user.id);
    const purchaseSupplier = await Supplier.findById(supplier);

    const gstRate = existingProduct.gstRate || 18;
    
    // Unit Price Normalization: If unit is 'gram', we assume 'taxableAmount' is Price per KG
    const unitConversion = {
      "kg": 1,
      "gram": 0.001,
      "dagina": 1, // Price is per Dagina/Bag
      "unit": 1,
      "amount": 1
    };

    const factor = unitConversion[unit.toLowerCase()] || 1;
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
      status: "pending"
    });

    // 🏆 NOTIFICATION: New Purchase Registered
    if (adminUser?.notificationSettings?.newOrder) { // Re-using notification preference for business flow
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
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) return res.status(404).json({ msg: "Purchase not found" });

    // If transitioning to received, increase product stock
    if (status === "received" && purchase.status !== "received") {
      const product = await Product.findById(purchase.material);
      if (product) {
        // Multi-Unit Storage Conversion Logic
        const conversions = {
          "dagina": 50, // 1 Bag = 50kg
          "kg": 1,
          "gram": 0.001,
          "unit": 1,
          "amount": 1
        };
        const stockFactor = conversions[purchase.unit.toLowerCase()] || 1;
        product.stock += (purchase.quantity * stockFactor);
        await product.save();
      }
      purchase.receivedAt = new Date();
    }

    purchase.status = status;
    await purchase.save();

    res.json(purchase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Purchase
export const deletePurchase = async (req, res) => {
  try {
    const purchaseId = req.params.id;
    const purchase = await Purchase.findById(purchaseId);

    if (!purchase) {
      return res.status(404).json({ msg: "Purchase not found" });
    }

    // If purchase was received, remove it from stock
    if (purchase.status === "received") {
      const product = await Product.findById(purchase.material);
      if (product) {
        const conversions = {
          "dagina": 50,
          "kg": 1,
          "gram": 0.001,
          "unit": 1,
          "amount": 1
        };
        const stockFactor = conversions[purchase.unit.toLowerCase()] || 1;
        product.stock -= (purchase.quantity * stockFactor);
        await product.save();
      }
    }

    await Purchase.findByIdAndDelete(purchaseId);
    res.json({ msg: "Purchase deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
