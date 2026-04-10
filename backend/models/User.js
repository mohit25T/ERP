import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    mobile: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    passwordLength: { type: Number, default: 8 },
    otp: { type: String },
    otpExpiry: { type: Date },
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager", "worker"],
      default: "worker",
    },
    gstin: { type: String, default: "" },
    pan: { type: String, default: "" },
    companyName: { type: String, default: "" },
    address: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    invoiceSettings: {
      columns: {
        product: {
          label: { type: String, default: "Product Details" },
          show: { type: Boolean, default: true }
        },
        hsn: {
          label: { type: String, default: "HSN/SAC" },
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
    bankDetails: {
      bankName: { type: String, default: "" },
      branchName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" }
    },
    invoiceTerms: {
      type: [String],
      default: [
        "Goods once sold will not be taken back.",
        "Interest @18% p.a. will be charged if payment is not made within due date.",
        "Our risk and responsibility ceases as soon as the goods leave our premises.",
        "'Subject to Rajkot' Jurisdiction only. E.&O.E."
      ]
    },
    notificationSettings: {
      lowStock: { type: Boolean, default: true },
      weeklySummary: { type: Boolean, default: false },
      newOrder: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
      channelEmail: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;