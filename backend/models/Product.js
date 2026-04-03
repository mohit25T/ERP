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
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    category: {
      type: String,
    },
    type: {
      type: String,
      enum: ["raw_material", "finished_good"],
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
    bom: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
    batchNumber: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
