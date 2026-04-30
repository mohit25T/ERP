import Product from "../products/Product.js";
import InventoryLog from "./InventoryLog.js";

class InventoryService {
  /**
   * Update stock with logging
   */
  static async updateStock({ productId, quantity, type, referenceType, referenceId, reason, isScrap = false, session }) {
    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error(`Product with ID ${productId} not found`);

    const field = isScrap ? "scrapStock" : "totalStock";
    const previousStock = product[field] || 0;
    const change = type === "IN" ? quantity : -quantity;
    
    // Check for insufficient stock on OUT operations
    if (type === "OUT" && (product[field] || 0) < quantity) {
      throw new Error(`Insufficient ${isScrap ? 'Scrap' : ''} stock for ${product.name}. Available: ${product[field]}, Needed: ${quantity}`);
    }

    product[field] = (product[field] || 0) + change;
    await product.save({ session });

    const log = await InventoryLog.create([{
      product: productId,
      quantity,
      type,
      targetField: field,
      referenceType,
      referenceId,
      reason,
      previousStock,
      newStock: product[field]
    }], { session });

    console.log(`[INVENTORY LOG] ${product.name} (${field}): ${previousStock} -> ${product[field]} (${type})`);
    return log;
  }
  /**
   * Wrapper for backward compatibility: decreaseStock
   */
  static async decreaseStock(productId, quantity, options = {}, session = null) {
    return await this.updateStock({
      productId,
      quantity,
      type: "OUT",
      referenceType: options.referenceType,
      referenceId: options.referenceId,
      reason: options.reason,
      isScrap: options.targetField === "scrapStock",
      session
    });
  }
 
  /**
   * Wrapper for backward compatibility: increaseStock
   */
  static async increaseStock(productId, quantity, options = {}, session = null) {
    return await this.updateStock({
      productId,
      quantity,
      type: "IN",
      referenceType: options.referenceType,
      referenceId: options.referenceId,
      reason: options.reason,
      isScrap: options.targetField === "scrapStock",
      session
    });
  }
 
  /**
   * Specific logic for Reserve Stock (doesn't change totalStock, just moves to reservedStock)
   */
  static async reserveStock(productId, quantity, options = {}, session = null) {
    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error("Product not found");
    
    const isScrap = options.isScrap || false;
    const stockField = isScrap ? "scrapStock" : "totalStock";
    const reservedField = isScrap ? "reservedScrapStock" : "reservedStock";

    const available = (product[stockField] || 0) - (product[reservedField] || 0);
    if (available < quantity) {
      throw new Error(`Insufficient available ${isScrap ? 'scrap ' : ''}stock for reservation. Available: ${available}, Needed: ${quantity}`);
    }
 
    const previousStock = product[reservedField] || 0;
    product[reservedField] = (product[reservedField] || 0) + quantity;
    await product.save({ session });
 
    await InventoryLog.create([{
      product: productId,
      quantity,
      type: "IN", // Inward to reserved pool
      targetField: reservedField,
      referenceType: options.referenceType,
      referenceId: options.referenceId,
      reason: options.reason || "Stock Reservation",
      previousStock,
      newStock: product[reservedField]
    }], { session });
  }
 
  /**
   * Specific logic for Release Reserved Stock
   */
  static async releaseReservedStock(productId, quantity, options = {}, session = null) {
    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error("Product not found");
 
    const previousStock = product.reservedStock || 0;
    product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);
    await product.save({ session });
 
    await InventoryLog.create([{
      product: productId,
      quantity,
      type: "OUT", // Outward from reserved pool
      targetField: "reservedStock",
      referenceType: options.referenceType,
      referenceId: options.referenceId,
      reason: options.reason || "Reservation Release",
      previousStock,
      newStock: product.reservedStock
    }], { session });
  }
}

export default InventoryService;
