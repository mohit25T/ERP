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
      },
    ],
    productionDate: {
      type: Date,
      default: Date.now,
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
