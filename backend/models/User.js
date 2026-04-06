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
    pincode: { type: String, default: "" },
    invoiceSettings: {
      columns: {
        product: {
          label: { type: String, default: "Product Details / HSN" },
          show: { type: Boolean, default: true }
        },
        quantity: {
          label: { type: String, default: "Qty" },
          show: { type: Boolean, default: true }
        },
        price: {
          label: { type: String, default: "Unit Price" },
          show: { type: Boolean, default: true }
        },
        taxable: {
          label: { type: String, default: "Taxable Val." },
          show: { type: Boolean, default: true }
        },
        amount: {
          label: { type: String, default: "Net Amount" },
          show: { type: Boolean, default: true }
        }
      },
      showLogo: { type: Boolean, default: true },
      footerText: { type: String, default: "Certified that the particulars given above are true and correct. Taxes shown above are extra as applicable." },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;