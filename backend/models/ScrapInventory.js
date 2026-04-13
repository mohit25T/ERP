import mongoose from "mongoose";

const scrapInventorySchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true, // In kg
    },
    reason: {
      type: String, // e.g., "Production Waste", "Damaged Batch"
      default: "Production Waste",
    },
    batchReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Production",
    },
    notes: {
      type: String,
    }
  },
  { timestamps: true }
);

const ScrapInventory = mongoose.model("ScrapInventory", scrapInventorySchema);

export default ScrapInventory;
