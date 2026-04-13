import BOM from "../models/BOM.js";
import Product from "../models/Product.js";

// Get All BOMs
export const getBoms = async (req, res) => {
  try {
    const boms = await BOM.find().populate("product", "name sku").populate("items.material", "name unit stock");
    res.json(boms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get BOM by Product ID
export const getBomByProduct = async (req, res) => {
  try {
    const bom = await BOM.findOne({ product: req.params.productId })
      .populate("items.material", "name unit stock price");
    
    if (!bom) return res.status(404).json({ msg: "BOM not found for this product" });
    res.json(bom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create or Update BOM (Upsert)
export const upsertBom = async (req, res) => {
  try {
    const { productId } = req.params;
    const { items, wastagePercentage, outputQuantity, size, notes } = req.body;

    let bom = await BOM.findOne({ product: productId });

    if (bom) {
      bom.items = items;
      bom.wastagePercentage = wastagePercentage || bom.wastagePercentage;
      bom.outputQuantity = outputQuantity || bom.outputQuantity;
      bom.size = size || bom.size;
      bom.notes = notes || bom.notes;
      await bom.save();
    } else {
      bom = await BOM.create({
        product: productId,
        items,
        wastagePercentage,
        outputQuantity,
        size,
        notes
      });
    }

    res.json(bom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete BOM
export const deleteBom = async (req, res) => {
  try {
    await BOM.findByIdAndDelete(req.params.id);
    res.json({ msg: "BOM deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
