import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },
    targetField: {
      type: String,
      enum: ["stock", "scrapStock"],
      default: "stock",
    },
    referenceType: {
      type: String,
      enum: ["invoice", "purchase", "production", "order", "manual_adjustment", "return"],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
    },
    previousStock: {
      type: Number,
    },
    newStock: {
      type: Number,
    },
  },
  { timestamps: true }
);

const InventoryLog = mongoose.model("InventoryLog", inventoryLogSchema);

export default InventoryLog;
