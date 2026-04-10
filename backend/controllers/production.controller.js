import Production from "../models/Production.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// Create Production Batch (Convert Raw -> Finished)
export const createProduction = async (req, res) => {
  try {
    const { productId, quantity, notes, batchNumber } = req.body;

    const finishedGood = await Product.findById(productId).populate("bom.material");
    if (!finishedGood) return res.status(404).json({ msg: "Product not found" });

    if (finishedGood.type !== "finished_good") {
      return res.status(400).json({ msg: "Only products of type 'finished_good' can be manufactured." });
    }

    if (!finishedGood.bom || finishedGood.bom.length === 0) {
      return res.status(400).json({ msg: "No Bill of Materials (BOM) defined for this product. Please define it in Inventory." });
    }

    // 1. Validate Stock Availability for all Raw Materials in BOM
    const consumedMaterials = [];
    for (const item of finishedGood.bom) {
      const material = await Product.findById(item.material._id);
      if (!material) {
        return res.status(400).json({ msg: `Material ${item.material.name} no longer exists.` });
      }

      // Multi-Unit Conversion Logic for Consumption (Based on Recipe Unit vs Material Unit)
      const conversions = {
        "dagina": 50, // 1 Bag = 50kg
        "kg": 1,
        "gram": 0.001,
        "unit": 1,
        "amount": 1
      };
      
      const factor = conversions[(item.unit || material.unit || "kg").toLowerCase()] || 1;
      const requiredInBaseStorage = (item.quantity * quantity) * factor;

      // In this system, material.stock is already stored in its base unit (KG)
      const availableInBaseStorage = material.stock || 0;

      if (availableInBaseStorage < (requiredInBaseStorage - 0.0001)) {
        return res.status(400).json({ 
          msg: `Insufficient stock for ${material.name}. Required: ${requiredInBaseStorage.toFixed(2)} kg, Available: ${availableInBaseStorage.toFixed(2)} kg` 
        });
      }
      consumedMaterials.push({ material: material._id, name: material.name, requiredQty: requiredInBaseStorage });
    }

    // 2. Perform Stock Adjustments
    // Deduct Raw Materials (Calculated in base storage units)
    for (const mat of consumedMaterials) {
      await Product.findByIdAndUpdate(mat.material, { $inc: { stock: -mat.requiredQty } });
      console.log(`[ERP PRODUCTION] Deducted ${mat.requiredQty} from ${mat.name} stock`);
    }

    // Add Finished Good to Stock
    finishedGood.stock += Number(quantity);
    await finishedGood.save();
    console.log(`[ERP PRODUCTION] Added ${quantity} to ${finishedGood.name}`);

    // 3. Save Production Record
    const production = await Production.create({
      product: productId,
      quantity,
      batchNumber: batchNumber || `BCH-${Date.now().toString().substring(8)}`,
      notes,
      consumedMaterials: consumedMaterials.map(m => ({ material: m.material, quantity: m.requiredQty }))
    });

    // 🏆 NOTIFICATION: Production Batch Completed
    const adminUser = await User.findById(req.user.id);
    if (adminUser?.notificationSettings?.newOrder) { // Alert on production stock update
       await Notification.create({
         user: adminUser._id,
         title: "Production Batch Ready ✅",
         message: `Successfully manufactured ${quantity} ${finishedGood.unit || "units"} of ${finishedGood.name}. Batch: ${production.batchNumber}`,
         type: "success",
         link: "/production"
       });
    }

    res.status(201).json(production);
  } catch (err) {
    console.error("[PRODUCTION ERROR]", err);
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

// Delete/Reverse Production (Restore Raw, Remove Finished)
export const deleteProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) return res.status(404).json({ msg: "Production record not found" });

    // Restore Raw Materials
    for (const item of production.consumedMaterials) {
      await Product.findByIdAndUpdate(item.material, { $inc: { stock: item.quantity } });
    }

    // Deduct Finished Good
    const finishedGood = await Product.findById(production.product);
    if (finishedGood) {
      finishedGood.stock -= production.quantity;
      await finishedGood.save();
    }

    await Production.findByIdAndDelete(req.params.id);
    res.json({ msg: "Production reversed & entry deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
