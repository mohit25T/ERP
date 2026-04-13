import Production from "../models/Production.js";
import Product from "../models/Product.js";
import BOM from "../models/BOM.js";
import ScrapInventory from "../models/ScrapInventory.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import InventoryService from "../services/InventoryService.js";
import AccountingService from "../services/AccountingService.js";
import unitsUtil from "../utils/units.js";

// Step 1: Initialize Production Order (Draft/Pending)
export const createProduction = async (req, res) => {
  try {
    const { productId, quantity, notes, batchNumber } = req.body;

    const finishedGood = await Product.findById(productId);
    if (!finishedGood) return res.status(404).json({ msg: "Product not found" });

    if (finishedGood.type !== "finished_good") {
      return res.status(400).json({ msg: "Only products of type 'finished_good' can be manufactured." });
    }

    const bom = await BOM.findOne({ product: productId });
    if (!bom || !bom.items || bom.items.length === 0) {
      return res.status(400).json({ msg: "No Bill of Materials (BOM) defined for this product." });
    }

    const production = await Production.create({
      product: productId,
      quantity,
      batchNumber: batchNumber || `BCH-${Date.now().toString().substring(8)}`,
      notes,
      status: "pending"
    });

    res.status(201).json(production);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const startProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id).populate("product");
    if (!production) return res.status(404).json({ msg: "Production order not found" });
    if (production.status !== "pending") {
      return res.status(400).json({ msg: `Cannot start production from status: ${production.status}` });
    }

    const finishedGood = production.product;
    const bom = await BOM.findOne({ product: finishedGood._id }).populate("items.material");
    
    if (!bom || !bom.items) {
      return res.status(400).json({ msg: "BOM not found or empty for this product." });
    }

    const consumedMaterials = [];
    let totalRMCost = 0;

    // 1. Validate and Deduct Stock
    for (const item of bom.items) {
      const material = await Product.findById(item.material._id);
      
      const itemUnit = item.unit || material.unit || "pcs";
      const materialUnit = material.unit || "pcs";

      // 1. Calculate required pieces based on the UNIT specified in the BOM
      const requiredPieces = unitsUtil.normalizeToPieces(item.quantity * production.quantity, itemUnit);
      
      // 2. STOCK is stored in pieces. Validate against pieces.
      if (material.stock < requiredPieces) {
        return res.status(400).json({ msg: `Insufficient stock for ${material.name}. (Need ${requiredPieces} pcs, Have ${material.stock} pcs)` });
      }

      // 3. Price is for 1 MATERIAL UNIT. Convert required pieces back to Material Unit for cost.
      const qtyInMaterialUnit = unitsUtil.convertFromPieces(requiredPieces, materialUnit);
      const materialCost = (material.price || 0) * qtyInMaterialUnit;
      totalRMCost += materialCost;

      // Update Stock via Service
      await InventoryService.updateStock({
        productId: material._id,
        quantity: requiredPieces,
        type: "OUT",
        referenceType: "production",
        referenceId: production._id,
        reason: `Material consumption for Batch ${production.batchNumber}`
      });

      consumedMaterials.push({
        material: material._id,
        quantity: requiredPieces,
        unit: itemUnit,
        unitPrice: material.price || 0
      });
    }

    // 2. Update Production Record
    production.status = "in_progress";
    production.startedAt = new Date();
    production.consumedMaterials = consumedMaterials;
    production.totalCost = totalRMCost; // Initial RM Cost
    production.costPerUnit = totalRMCost / production.quantity;
    await production.save();

    res.json(production);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Step 3: Complete Production (Status -> Completed, Add Finished Stock)
export const completeProduction = async (req, res) => {
  try {
    const { scrapQuantity = 0 } = req.body;
    const production = await Production.findById(req.params.id).populate("product");

    if (!production) return res.status(404).json({ msg: "Production order not found" });
    if (production.status !== "in_progress") {
      return res.status(400).json({ msg: "Only 'in-progress' batches can be completed." });
    }

    const netQuantity = production.quantity - (Number(scrapQuantity) || 0);

    // 1. Add Finished Product Stock & Scrap Tracking
    const finishedProduct = await Product.findById(production.product._id);
    if (finishedProduct) {
      finishedProduct.stock += netQuantity;
      finishedProduct.scrapStock = (finishedProduct.scrapStock || 0) + (Number(scrapQuantity) || 0);
      await finishedProduct.save();
    }

    // 2. Accounting Hook
    await AccountingService.recordProduction(production, production.product.name);

    // 3. Log Scrap (If any)
    if (Number(scrapQuantity) > 0) {
      await ScrapInventory.create({
        material: production.product._id, // Log against the Finished Good node
        quantity: Number(scrapQuantity),
        reason: "Production Waste/Defect",
        batchReference: production._id,
        notes: `Automatic scrap log for Batch ${production.batchNumber} (${production.product.name})`
      });
    }

    // 4. Update Status
    production.status = "completed";
    production.completedAt = new Date();
    production.scrapQuantity = Number(scrapQuantity);
    await production.save();

    // Notification
    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser) {
      await Notification.create({
        user: adminUser._id,
        title: "Production Completed ✅",
        message: `Batch ${production.batchNumber} for ${production.product.name} is ready. Qty: ${netQuantity}`,
        type: "success",
        link: "/production"
      });
    }

    res.json(production);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Production History
export const getProductions = async (req, res) => {
  try {
    const productions = await Production.find()
      .populate("product", "name sku unit")
      .populate("consumedMaterials.material", "name unit")
      .sort({ createdAt: -1 });
    res.json(productions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete/Reverse Production (Restore Raw, Remove Finished - State Aware)
export const deleteProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) return res.status(404).json({ msg: "Production record not found" });

    // 1. REVERSE RAW MATERIALS (If batch was started or completed)
    if (["in_progress", "completed"].includes(production.status)) {
      for (const item of production.consumedMaterials) {
        await InventoryService.updateStock({
          productId: item.material,
          quantity: item.quantity,
          type: "IN",
          referenceType: "production_reversal",
          referenceId: production._id,
          reason: `Reversal of Production Batch ${production.batchNumber}`
        });
      }
    }

    // 2. REVERSE FINISHED GOODS (Only if batch was completed)
    if (production.status === "completed") {
      const netQuantity = production.quantity - (production.scrapQuantity || 0);
      await InventoryService.updateStock({
        productId: production.product,
        quantity: netQuantity,
        type: "OUT",
        referenceType: "production_reversal",
        referenceId: production._id,
        reason: `Reversal of Production Batch ${production.batchNumber}`
      });
    }

    // 3. Delete Record
    await Production.findByIdAndDelete(req.params.id);
    res.json({ msg: "Production reversed & entry deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Manufacturing Insights (In Use vs Pending)
export const getManufacturingInsights = async (req, res) => {
  try {
    const products = await Product.find({ type: 'finished_good' });
    const activeOrders = await Order.find({ 
      status: { $in: ['pending', 'in_progress', 'invoiced'] } 
    });

    let totalAllocated = 0;
    let totalStock = 0;
    let totalShortage = 0;

    const productBreakdown = products.map(p => {
      const allocated = activeOrders
        .filter(o => o.product.toString() === p._id.toString())
        .reduce((acc, curr) => acc + curr.quantity, 0);

      const shortage = Math.max(0, allocated - p.stock);
      
      totalAllocated += allocated;
      totalStock += p.stock;
      totalShortage += shortage;

      return {
        id: p._id,
        name: p.name,
        stock: p.stock,
        allocated,
        shortage,
        unit: p.unit || 'kg'
      };
    });

    // Calculate WIP (Work in Progress) - Units currently in pending or in_progress batches
    const activeBatches = await Production.find({ status: { $in: ['pending', 'in_progress'] } });
    const totalWIP = activeBatches.reduce((acc, curr) => acc + curr.quantity, 0);

    res.json({
      summary: {
        readyAssets: totalStock,
        wip: totalWIP,
        inUse: totalAllocated,
        pendingBacklog: totalShortage
      },
      breakdown: productBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
