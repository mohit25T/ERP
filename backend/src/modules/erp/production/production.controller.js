import Production from "./Production.js";
import Product from "../products/Product.js";
import BOM from "./BOM.js";
import ScrapInventory from "../inventory/ScrapInventory.js";
import User from "../../core/users/User.js";
import Notification from "../../core/notifications/Notification.js";
import Order from "../orders/Order.js";
import InventoryService from "../inventory/InventoryService.js";
import ExpectedScrapService from "./ExpectedScrapService.js";
import AccountingService from "../../billing/ledger/AccountingService.js";
import UnitService from "../products/UnitService.js";
import TransactionManager from "../../../shared/utils/TransactionManager.js";

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
    const { id } = req.params;

    const result = await TransactionManager.execute(async (session) => {
      const production = await Production.findById(id).populate("product").session(session);
      if (!production) throw new Error("Production order not found");
      if (production.status !== "pending") {
        throw new Error(`Cannot start production from status: ${production.status}`);
      }

      const finishedGood = production.product;
      if (!finishedGood) {
        throw new Error("Manufacturing Blocked: Finished product record missing or deleted.");
      }
      
      // Relaxed validation: Geometric parameters are now optional for the 'RM - FG' scrap model.
      // We only keep the unitWeightGrams check as it is essential for weight-based yield analysis.
      if (finishedGood.unitWeightGrams <= 0) {
        throw new Error(`Manufacturing Blocked: Product ${finishedGood.name} missing 'Unit Weight Grams'. Fix in Settings.`);
      }

      const bom = await BOM.findOne({ product: finishedGood._id }).populate("items.material").session(session);
      
      if (!bom || !bom.items) {
        throw new Error("BOM not found or empty for this product.");
      }

      const consumedMaterials = [];
      let totalRMCost = 0;

      // 1. Validate and Deduct Stock Atomically
      for (const item of bom.items) {
        if (!item.material) {
          throw new Error("Manufacturing Blocked: One or more materials in the BOM no longer exist in the system.");
        }
        const material = await Product.findById(item.material._id).session(session);
        if (!material) throw new Error(`Material ${item.material.name || 'Unknown'} not found in inventory.`);
        
        const itemUnit = item.unit || material.unit || "pcs";
        
        // Calculate required pieces
        const requiredPieces = await UnitService.normalize(item.quantity * production.quantity, itemUnit);
        
        // Stock deduction (with session propagation)
        await InventoryService.updateStock({
          productId: material._id,
          quantity: requiredPieces,
          type: "OUT",
          referenceType: "production",
          referenceId: production._id,
          reason: `Material consumption for Batch ${production.batchNumber}`,
          session
        });

        // Determine how many units to deduct from inventory
        const materialUnit = material.unit || "pcs";
        const qtyInMaterialUnit = await UnitService.convertFromBase(requiredPieces, materialUnit);
        const materialCost = (material.price || 0) * qtyInMaterialUnit;
        totalRMCost += materialCost;

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
      
      await production.save({ session });
      return production;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Step 3: Complete Production (Intelligence Engine Upgrade)
export const completeProduction = async (req, res) => {
  try {
    const { 
      inputWeight = 0, 
      outputWeight = 0, 
      outputQuantity = 0, 
      scrapProductId 
    } = req.body;
    
    const { id } = req.params;

    const result = await TransactionManager.execute(async (session) => {
      const production = await Production.findById(id).populate("product").session(session);

      if (!production) throw new Error("Production order not found");
      if (!production.product) {
        throw new Error("Operational Failure: The product associated with this batch has been deleted.");
      }
      if (production.status !== "in_progress") {
        throw new Error("Only batches in progress can be completed.");
      }

      // 1. INTELLIGENCE CALCULATIONS & VALIDATIONS
      let outQ = production.quantity;
      if (req.body.outputQuantity !== undefined && req.body.outputQuantity !== "" && req.body.outputQuantity !== null) {
        const parsed = Number(req.body.outputQuantity);
        if (!isNaN(parsed)) outQ = parsed;
      }
      
      // Calculate Defective Pieces (Scrap Pcs)
      let scrapPcs = Number(req.body.scrapQuantity) || 0;
      if (req.body.scrapQuantity === undefined || req.body.scrapQuantity === null || req.body.scrapQuantity === "") {
        scrapPcs = Math.max(0, production.quantity - outQ);
      }
      const reportedScrapUnit = req.body.scrapUnit || 'pcs';
      
      const fgWeightGrams = production.product.unitWeightGrams || 0;
      const outW = Number(outputWeight) || (outQ * fgWeightGrams) / 1000;
      
      let inW = Number(inputWeight);
      
      // Aggregating from consumed materials if not provided
      if (!inW && production.consumedMaterials && production.consumedMaterials.length > 0) {
        inW = production.consumedMaterials.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
      }

      let scrapW = 0;
      if (inW > 0) {
        scrapW = inW - outW;
      } else {
        const reportedVal = Number(req.body.scrapQuantity) || 0;
        scrapW = reportedScrapUnit === 'pcs' 
          ? (reportedVal * (fgWeightGrams || 0)) / 1000 
          : reportedVal;
      }

      if (inW <= 0 && outW > 0) {
        inW = outW + scrapW;
      }

      if (inW <= 0) throw new Error("Input weight must be greater than zero. Please ensure BOM is defined or provide weights directly.");

      const efficiency = inW > 0 ? (outW / inW) * 100 : 0;

      // 1b. GEOMETRY-BASED EXPECTED SCRAP CALCULATION
      let expectedScrap = null;
      let lossGap = null;

      if (production.product.productionConfig && inW > 0) {
        expectedScrap = ExpectedScrapService.calculateExpectedScrap(production.product.productionConfig, inW);
        if (expectedScrap !== null) {
          lossGap = scrapW - expectedScrap; // Positive means more waste than expected
        }
      }

      // 2. INVENTORY UPDATES (Atomic)
      
      // A. Finished Good (by pieces/quantity)
      await InventoryService.updateStock({
        productId: production.product._id,
        quantity: outQ,
        type: "IN",
        reason: `Production Completion: Batch ${production.batchNumber}`,
        referenceType: "production",
        referenceId: production._id,
        session
      });

      // B. Scrap Item Tracking
      // B1. Update dedicated Scrap Product (if assigned and weight exists)
      if (scrapProductId && scrapW > 0) {
        await InventoryService.updateStock({
          productId: scrapProductId,
          quantity: scrapW,
          type: "IN",
          reason: `Production Yield Loss: Batch ${production.batchNumber}`,
          referenceType: "production",
          referenceId: production._id,
          session
        });
      }

      // B2. Update Main Product's own scrapStock field for yield tracking
      if (scrapPcs > 0 || scrapW > 0) {
        await InventoryService.updateStock({
          productId: production.product._id,
          quantity: scrapPcs, // Use the count of defective pieces
          type: "IN",
          isScrap: true,
          reason: `Production Yield Loss (Item): Batch ${production.batchNumber}`,
          referenceType: "production",
          referenceId: production._id,
          session
        });
      }

      // B3. Attribution to Raw Material (The Source of the loss)
      if (production.consumedMaterials && production.consumedMaterials.length > 0 && scrapW > 0) {
        const mainMaterial = production.consumedMaterials[0]; // Assuming first item is the primary source
        await InventoryService.updateStock({
          productId: mainMaterial.material,
          quantity: scrapW, // Mass of material lost
          type: "IN",
          isScrap: true,
          reason: `Material Loss Attribution: Batch ${production.batchNumber}`,
          referenceType: "production",
          referenceId: production._id,
          session
        });
      }

        // Always log to the legacy ScrapInventory for reporting & Analytics
        await ScrapInventory.create([{
          material: production.product._id,
          quantity: scrapW,
          reason: "Production Yield Loss",
          batchReference: production._id,
          notes: `Intelligence Engine auto-log. Expected Scrap: ${expectedScrap ? expectedScrap.toFixed(2) : 'N/A'} kg. Gap: ${lossGap !== null ? lossGap.toFixed(2) : 'N/A'} kg.`
        }], { session });

      // 3. ACCOUNTING SYNC
      await AccountingService.recordProduction(production, production.product.name, session);

      // 4. FINALIZE INTELLIGENCE DATA
      production.status = "completed";
      production.completedAt = new Date();
      production.inputWeight = inW;
      production.outputWeight = outW;
      production.outputQuantity = outQ;
      production.scrapWeight = scrapW;
      production.scrapQuantity = scrapPcs;
      production.scrapUnit = reportedScrapUnit;
      production.efficiency = efficiency;
      production.expectedScrap = expectedScrap;
      production.lossGap = lossGap;
      production.scrapProduct = scrapProductId;
      
      await production.save({ session });
      return production;
    });

    // 5. NOTIFICATIONS
    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser) {
      Notification.create({
        user: adminUser._id,
        title: "Batch Quality Finalized 📊",
        message: `Batch ${result.batchNumber} completed with ${result.efficiency.toFixed(1)}% efficiency.`,
        type: "success",
        link: "/production"
      }).catch(err => console.error("[ERP WARNING] Notification error:", err.message));
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Production Batch (State-Aware Editing)
export const updateProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, quantity, notes, batchNumber } = req.body;

    const production = await Production.findById(id);
    if (!production) return res.status(404).json({ msg: "Production not found" });

    // Safety: If not pending, restrict critical field updates
    if (production.status !== "pending" && (productId || quantity)) {
      return res.status(400).json({ 
        msg: "Manufacturing Protection: Product and Quantity cannot be modified once a batch has started. Only Notes and Batch References are editable." 
      });
    }

    if (productId) production.product = productId;
    if (quantity) production.quantity = quantity;
    if (notes !== undefined) production.notes = notes;
    if (batchNumber) production.batchNumber = batchNumber;

    await production.save();
    
    const updatedData = await Production.findById(id)
      .populate("product", "name sku unit unitWeightGrams productionConfig")
      .populate("consumedMaterials.material", "name unit");

    res.json(updatedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Production History
export const getProductions = async (req, res) => {
  try {
    const productions = await Production.find()
      .populate("product", "name sku unit unitWeightGrams productionConfig")
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
    const { id } = req.params;

    const result = await TransactionManager.execute(async (session) => {
      const production = await Production.findById(id).session(session);
      if (!production) throw new Error("Production record not found");

      // 1. REVERSE RAW MATERIALS (Restore used RM Stock)
      if (["in_progress", "completed"].includes(production.status)) {
        for (const item of production.consumedMaterials) {
          if (!item.material) continue; // Skip if material record is missing
          await InventoryService.updateStock({
            productId: item.material,
            quantity: item.quantity,
            type: "IN",
            referenceType: "production_reversal",
            referenceId: production._id,
            reason: `Reversal of Production Batch ${production.batchNumber}`,
            session
          });
        }
      }

      // 2. REVERSE FINISHED GOODS & SCRAP (Adjust FG and Scrap Stock)
      if (production.status === "completed") {
        // Reverse Finished Good Pieces
        await InventoryService.updateStock({
          productId: production.product,
          quantity: production.outputQuantity,
          type: "OUT",
          referenceType: "production_reversal",
          referenceId: production._id,
          reason: `Reversal of Production Batch ${production.batchNumber}`,
          session
        });

        // Reverse Scrap Weight (if any)
        if (production.scrapWeight > 0 && production.scrapProduct) {
          await InventoryService.updateStock({
            productId: production.scrapProduct,
            quantity: production.scrapWeight,
            type: "OUT",
            referenceType: "production_reversal",
            referenceId: production._id,
            reason: `Reversal of Production Batch ${production.batchNumber} (Scrap Reversal)`,
            session
          });
        }

        // Clean up Accounting logs
        await AccountingService.deleteReferenceEntries(production._id, session);
      }

      // 3. Delete Record
      await Production.findByIdAndDelete(id).session(session);
      return { msg: "Production Intelligence Batch reversed & erased." };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Adjust Scrap for Completed Batch (Typo Correction / Final Audit)
export const adjustScrap = async (req, res) => {
  try {
    const { id } = req.params;
    const { scrapQuantity, scrapWeight, outputQuantity } = req.body;

    const result = await TransactionManager.execute(async (session) => {
      const production = await Production.findById(id).populate("product").session(session);
      if (!production) throw new Error("Production record not found");
      if (production.status !== "completed") throw new Error("Only completed batches can have their yield adjusted.");

      const oldScrapPcs = production.scrapQuantity || 0;
      const oldScrapW = production.scrapWeight || 0;
      const oldOutputQ = production.outputQuantity || 0;

      // 1. Adjust Finished Good Stock
      if (outputQuantity !== undefined) {
        const diff = outputQuantity - oldOutputQ;
        if (diff !== 0) {
          await InventoryService.updateStock({
            productId: production.product._id,
            quantity: Math.abs(diff),
            type: diff > 0 ? "IN" : "OUT",
            reason: `Yield Adjustment: Batch ${production.batchNumber}`,
            referenceType: "production_adjustment",
            referenceId: production._id,
            session
          });
          production.outputQuantity = outputQuantity;
        }
      }

      // 2. Adjust Scrap Piece Stock (on the product record)
      if (scrapQuantity !== undefined) {
        const diff = scrapQuantity - oldScrapPcs;
        if (diff !== 0) {
          await InventoryService.updateStock({
            productId: production.product._id,
            quantity: Math.abs(diff),
            type: diff > 0 ? "IN" : "OUT",
            isScrap: true,
            reason: `Yield Adjustment (Items): Batch ${production.batchNumber}`,
            referenceType: "production_adjustment",
            referenceId: production._id,
            session
          });
          production.scrapQuantity = scrapQuantity;
        }
      }

      // 3. Adjust Scrap Weight (Mass Balance)
      if (scrapWeight !== undefined) {
        const diff = scrapWeight - oldScrapW;
        if (diff !== 0) {
          // Update Legacy ScrapInventory
          await ScrapInventory.findOneAndUpdate(
            { batchReference: production._id },
            { 
              quantity: scrapWeight,
              notes: (production.notes || "") + ` [Adjusted from ${oldScrapW}kg]`
            },
            { session }
          );

          // Update Dedicated Scrap Product if it exists
          if (production.scrapProduct) {
            await InventoryService.updateStock({
              productId: production.scrapProduct,
              quantity: Math.abs(diff),
              type: diff > 0 ? "IN" : "OUT",
              reason: `Yield Adjustment (Mass): Batch ${production.batchNumber}`,
              referenceType: "production_adjustment",
              referenceId: production._id,
              session
            });
          }
          
          production.scrapWeight = scrapWeight;
        }
      }

      await production.save({ session });
      return production;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Manufacturing Insights (In Use vs Pending)
export const getManufacturingInsights = async (req, res) => {
  try {
    const products = await Product.find({ 
      type: "finished_good",
      isDeleted: { $ne: true } 
    });
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

    // 4. SCRAP EFFICIENCY (The "Loss Matrix" Data)
    const completedBatches = await Production.find({ 
      status: "completed",
      inputWeight: { $gt: 0 } 
    });

    let globalInputWeight = 0;
    let globalScrapWeight = 0;

    completedBatches.forEach(b => {
      globalInputWeight += (b.inputWeight || 0);
      globalScrapWeight += (b.scrapWeight || 0);
    });

    const scrapEfficiency = globalInputWeight > 0 ? (globalScrapWeight / globalInputWeight) * 100 : 0;

    res.json({
      summary: {
        readyAssets: totalStock,
        wip: totalWIP,
        inUse: totalAllocated,
        pendingBacklog: totalShortage,
        scrapEfficiency: scrapEfficiency
      },
      breakdown: productBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
