import mongoose from "mongoose";

const bomSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true, // One primary BOM per product for now
    },
    items: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number, // In kg (standard RM unit)
          required: true,
        },
        unit: {
           type: String,
           default: "kg"
        }
      },
    ],
    wastagePercentage: {
      type: Number,
      default: 0,
    },
    outputQuantity: {
      type: Number, // In pieces (standard FG unit)
      default: 1,
    },
    size: {
      type: String, // Dynamic product sizes
    },
    notes: {
      type: String,
    }
  },
  { timestamps: true }
);

const BOM = mongoose.model("BOM", bomSchema);

export default BOM;
