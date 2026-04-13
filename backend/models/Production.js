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
    notes: {
      type: String,
    },
    batchNumber: {
      type: String,
      unique: true,
    }
  },
  { timestamps: true }
);

const Production = mongoose.model("Production", productionSchema);

export default Production;
