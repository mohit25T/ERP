import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
    },
    company: {
      type: String,
    },
    gstin: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    address: {
      type: String,
    },
    shareToken: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

import crypto from "crypto";

supplierSchema.pre("save", function (next) {
  if (!this.shareToken) {
    this.shareToken = crypto.randomBytes(16).toString("hex");
  }
  next();
});

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;
