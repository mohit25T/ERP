import mongoose from "mongoose";

const productionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    consumedMaterials: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          required: true,
        },
        unitPrice: {
          type: Number, // Cost of material at the time of production
        }
      },
    ],
    costPerUnit: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    scrapQuantity: {
      type: Number,
      default: 0,
    },
    scrapUnit: {
      type: String,
      enum: ["pcs", "kg"],
      default: "pcs",
    },
    productionDate: {
      type: Date,
      default: Date.now,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    inputWeight: {
      type: Number, // Total raw material input in KG
      default: 0
    },
    outputWeight: {
      type: Number, // Finished good output weight in KG
      default: 0
    },
    outputQuantity: {
      type: Number, // Number of pieces produced
      default: 0
    },
    scrapWeight: {
      type: Number, // inputWeight - outputWeight
      default: 0
    },
    efficiency: {
      type: Number, // (outputWeight / inputWeight) * 100
      default: 0
    },
    expectedScrap: {
      type: Number,
      default: null // In KG, geometry-based calculated value
    },
    lossGap: {
      type: Number,
      default: null // actualScrapWeight - expectedScrap
    },
    scrapProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    notes: {
      type: String,
    },
    batchNumber: {
      type: String,
      unique: true,
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Production = mongoose.model("Production", productionSchema);

export default Production;
