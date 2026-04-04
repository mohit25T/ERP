import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    mobile: { type: String, unique: true, required: true },
    password: String,
    otp: { type: String },
    otpExpiry: { type: Date },
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager", "worker"],
      default: "worker",
    },
    gstin: { type: String, default: "" },
    companyName: { type: String, default: "" },
    address: { type: String, default: "" },
    state: { type: String, default: "" },
    invoiceSettings: {
      headers: {
        product: { type: String, default: "Product Details / HSN" },
        quantity: { type: String, default: "Qty" },
        price: { type: String, default: "Unit Price" },
        taxable: { type: String, default: "Taxable Val." },
        amount: { type: String, default: "Net Amount" },
      },
      showLogo: { type: Boolean, default: true },
      footerText: { type: String, default: "Certified that the particulars given above are true and correct. Taxes shown above are extra as applicable." },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;