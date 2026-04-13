import InventoryLog from "../models/InventoryLog.js";
import ScrapInventory from "../models/ScrapInventory.js";

// Get All Inventory Logs
export const getInventoryLogs = async (req, res) => {
  try {
    const logs = await InventoryLog.find()
      .populate("product", "name sku")
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Logs for Specific Product
export const getProductLogs = async (req, res) => {
  try {
    const logs = await InventoryLog.find({ product: req.params.productId })
      .populate("product", "name sku")
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Scrap Logs
export const getScrapLogs = async (req, res) => {
  try {
    const logs = await ScrapInventory.find()
      .populate("material", "name unit")
      .populate("batchReference", "batchNumber status")
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
