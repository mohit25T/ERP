import Product from "../models/Product.js";
import InventoryLog from "../models/InventoryLog.js";

class InventoryService {
  /**
   * Update stock with logging
   */
  static async updateStock({ productId, quantity, type, referenceType, referenceId, reason, isScrap = false }) {
    const product = await Product.findById(productId);
    if (!product) throw new Error(`Product with ID ${productId} not found`);

    const field = isScrap ? "scrapStock" : "stock";
    const previousStock = product[field] || 0;
    const change = type === "IN" ? quantity : -quantity;
    
    // Check for insufficient stock on OUT operations
    if (type === "OUT" && (product[field] || 0) < quantity) {
      throw new Error(`Insufficient ${isScrap ? 'Scrap' : ''} stock for ${product.name}. Available: ${product[field]}, Needed: ${quantity}`);
    }

    product[field] = (product[field] || 0) + change;
    await product.save();

    const log = await InventoryLog.create({
      product: productId,
      quantity,
      type,
      targetField: field,
      referenceType,
      referenceId,
      reason,
      previousStock,
      newStock: product[field]
    });

    console.log(`[INVENTORY LOG] ${product.name} (${field}): ${previousStock} -> ${product[field]} (${type})`);
    return log;
  }
}

export default InventoryService;
