import Product from "../models/Product.js";
import InventoryLog from "../models/InventoryLog.js";

class InventoryService {
  /**
   * Update stock with logging
   */
  static async updateStock({ productId, quantity, type, referenceType, referenceId, reason }) {
    const product = await Product.findById(productId);
    if (!product) throw new Error(`Product with ID ${productId} not found`);

    const previousStock = product.stock;
    const change = type === "IN" ? quantity : -quantity;
    
    // Check for insufficient stock on OUT operations
    if (type === "OUT" && product.stock < quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Needed: ${quantity}`);
    }

    product.stock += change;
    await product.save();

    const log = await InventoryLog.create({
      product: productId,
      quantity,
      type,
      referenceType,
      referenceId,
      reason,
      previousStock,
      newStock: product.stock
    });

    console.log(`[INVENTORY LOG] ${product.name}: ${previousStock} -> ${product.stock} (${type})`);
    return log;
  }
}

export default InventoryService;
