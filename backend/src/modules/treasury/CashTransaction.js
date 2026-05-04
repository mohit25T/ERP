import mongoose from "mongoose";

const cashTransactionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ["salary", "daily_wage", "cash_purchase", "opening_balance", "other"],
      required: true,
    },
    employeeName: {
      type: String, // Simplified as requested: "Employee Name (for salary)"
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    transactionFlow: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    runningBalance: {
      type: Number,
    }
  },
  { timestamps: true }
);

const CashTransaction = mongoose.model("CashTransaction", cashTransactionSchema);
export default CashTransaction;
