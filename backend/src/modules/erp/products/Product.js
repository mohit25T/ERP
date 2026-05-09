import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    totalStock: {
      type: Number,
      required: true,
      default: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
    },
    scrapStock: {
      type: Number,
      default: 0,
    },
    reservedScrapStock: {
      type: Number,
      default: 0,
    },
    minStock: {
      type: Number,
      default: 10, // Re-order point
    },
    unit: {
       type: String,
       default: "kg", // Options: kg, dagina, meters, unit, amount
    },
    category: {
      type: String,
    },
    type: {
      type: String,
      enum: ["raw_material", "finished_good", "scrap"],
      default: "finished_good",
    },
    hsnCode: {
      type: String,
      default: "",
    },
    gstRate: {
      type: Number, // Example: 18 (for 18%)
      default: 18,
    },
    materialGrade: {
      type: String,
      default: "",
    },
    thickness: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: 0,
    },
    length: {
      type: Number,
      default: 0,
    },
    unitWeightGrams: {
      type: Number,
      default: 0,
    },
    productionConfig: {
      shapeType: { type: String, enum: ["cylindrical", "rectangular", "custom"] },
      feedLengthPerPiece: { type: Number },
      stripWidth: { type: Number },
      thickness: { type: Number },
      circleRadius: { type: Number },
      holeType: { type: String, enum: ["circle", "rectangle", null], default: null },
      holeConfig: {
        count: { type: Number },
        radius: { type: Number },
        length: { type: Number },
        width: { type: Number }
      },
      machiningLossPercent: { type: Number, default: 0 }
    },
    batchNumber: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for Available Stock
productSchema.virtual("availableStock").get(function () {
  return this.totalStock - this.reservedStock;
});

// Backward Compatibility Alias for 'stock'
productSchema.virtual("stock")
  .get(function () {
    return this.totalStock;
  })
  .set(function (val) {
    this.totalStock = val;
  });

const Product = mongoose.model("Product", productSchema);

export default Product;
