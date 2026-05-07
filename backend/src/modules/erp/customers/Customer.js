import mongoose from "mongoose";
import crypto from "crypto";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["regular", "scrap_buyer"],
      default: "regular",
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
    pincode: {
      type: String,
      default: "",
    },
    addresses: [
      {
        label: { type: String, trim: true }, // e.g., "Main Office", "Warehouse 1"
        companyName: { type: String, trim: true }, // For child companies/branches
        address: { type: String, required: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        pincode: { type: String, trim: true },
        gstin: { type: String, trim: true },
        isDefaultBilling: { type: Boolean, default: false },
        isDefaultShipping: { type: Boolean, default: false },
        type: { type: String, enum: ["billing", "shipping", "both"], default: "both" }
      }
    ],
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);


customerSchema.pre("save", async function () {
  if (!this.shareToken) {
    this.shareToken = crypto.randomBytes(16).toString("hex");
  }
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
