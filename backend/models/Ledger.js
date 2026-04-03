import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Salary", "Rent", "Marketing", "Electricity", "Utilities", "Direct Sales", "Refund", "Service Fee", "Material Cost", "Stock Purchase", "Other"],
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Ledger = mongoose.model("Ledger", ledgerSchema);

export default Ledger;
