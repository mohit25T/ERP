import Unit from "./Unit.js";

class UnitService {
  /**
   * Caches units in memory to avoid repeated DB calls.
   */
  static cache = null;

  /**
   * Fetches units from DB or cache.
   */
  static async getUnits() {
    if (this.cache) return this.cache;
    this.cache = await Unit.find();
    return this.cache;
  }

  /**
   * Resets unit cache.
   */
  static resetCache() {
    this.cache = null;
  }

  /**
   * Normalizes a value to its base unit (KG, PCS, or MM).
   * @param {Number} value - The quantity to convert.
   * @param {String} unitName - The name of the unit (e.g., 'gram', 'dagina').
   * @returns {Number} The value in base units.
   */
  static async normalize(value, unitName) {
    if (!value) return 0;
    if (!unitName) return value; // Fallback to raw value if unit is missing

    const normalizedName = unitName.toLowerCase().trim();
    const units = await this.getUnits();
    const unit = units.find(u => u.name === normalizedName);

    if (!unit) {
      console.warn(`[UNIT SERVICE] Unknown unit: ${unitName}. Using factor 1.0`);
      return value;
    }

    return value * unit.conversionFactor;
  }

  /**
   * Converts a value from pieces back to a specific unit.
   * Useful for UI or complex reports.
   * @param {Number} valueInBase - The value in base unit.
   * @param {String} targetUnitName - The unit to convert back to.
   */
  static async convertFromBase(valueInBase, targetUnitName) {
    if (!valueInBase) return 0;
    const normalizedName = targetUnitName.toLowerCase().trim();
    const units = await this.getUnits();
    const unit = units.find(u => u.name === normalizedName);

    if (!unit || unit.conversionFactor === 0) return valueInBase;

    return valueInBase / unit.conversionFactor;
  }

  /**
   * Seed default units into the database if they don't exist.
   */
  static async seedDefaultUnits() {
    try {
      const defaults = [
        // Weights (Base: KG)
        { name: "kg", type: "weight", conversionFactor: 1.0 },
        { name: "gram", type: "weight", conversionFactor: 0.001 },
        { name: "mts", type: "weight", conversionFactor: 1000.0 },
        { name: "dagina", type: "weight", conversionFactor: 50.0 }, // Standardized 50kg bag
        
        // Counts (Base: PCS)
        { name: "pcs", type: "count", conversionFactor: 1.0 },
        { name: "unit", type: "count", conversionFactor: 1.0 },
        { name: "dozen", type: "count", conversionFactor: 12.0 },
        
        // Lengths (Base: MM)
        { name: "mm", type: "length", conversionFactor: 1.0 },
        { name: "cm", type: "length", conversionFactor: 10.0 },
        { name: "meter", type: "length", conversionFactor: 1000.0 },
        { name: "mtr", type: "length", conversionFactor: 1000.0 },
      ];

      for (const d of defaults) {
        await Unit.findOneAndUpdate(
          { name: d.name },
          { $setOnInsert: d },
          { upsert: true, returnDocument: 'after' }
        );
      }
      
      this.resetCache();
      console.log("[UNIT SERVICE] Default units synchronized successfully.");
    } catch (err) {
      console.error("[UNIT SERVICE ERROR] Seeding failed:", err.message);
    }
  }
}

export default UnitService;
