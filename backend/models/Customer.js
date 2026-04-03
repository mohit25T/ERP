import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
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
    address: {
      type: String,
    },
    company: {
      type: String,
    },
    state: {
      type: String,
      default: "",
    },
    gstin: {
      type: String,
      default: "",
    },
    shareToken: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

import crypto from "crypto";

customerSchema.pre("save", function (next) {
  if (!this.shareToken) {
    this.shareToken = crypto.randomBytes(16).toString("hex");
  }
  next();
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
