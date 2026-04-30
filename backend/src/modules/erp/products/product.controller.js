import Product from "./Product.js";
import Order from "../orders/Order.js";
import Production from "../production/Production.js";

// Create a Product
export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all Products (Filtered by Availability)
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    const sanitizedProducts = products.map(p => {
      const prod = p.toObject();
      if (!prod.sku || prod.sku.trim() === "") {
        prod.sku = "UNIDENTIFIED";
      }
      return prod;
    });
    res.json(sanitizedProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a Product (e.g., adjust stock)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) return res.status(404).json({ msg: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a Product (Safe Dual-Strategy Deletion)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) return res.status(404).json({ msg: "Product configuration not found" });

    // 1. Check for PHYSICAL commitments (Reserved Stock)
    if (product.reservedStock > 0) {
      return res.status(400).json({ 
        msg: `Deletion Blocked: This product has ${product.reservedStock} units reserved for active orders. Please fulfill or cancel orders first.` 
      });
    }

    // 2. Check for OPERATIONAL dependencies (Orders & Production)
    const orderExists = await Order.exists({ product: id });
    const productionExists = await Production.exists({ product: id });
    const hasInventory = product.totalStock > 0 || product.reservedStock > 0;

    // DECISION ENGINE:
    // If the product has NO historical records and NO physical stock -> Hard Delete (Total Removal)
    // Otherwise -> Soft Delete (Archiving) to preserve data integrity
    if (!orderExists && !productionExists && !hasInventory) {
      await Product.findByIdAndDelete(id);
      return res.json({ 
        msg: "Product COMPLETELY PURGED from database (Zero historical dependencies found).",
        hardDeleted: true 
      });
    }

    // Perform Soft Delete to preserve data integrity for existing records
    product.isDeleted = true;
    await product.save();

    res.json({ 
      msg: "Product ARCHIVED (Soft Deleted) to protect historical orders and manufacturing logs.",
      softDeleted: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
