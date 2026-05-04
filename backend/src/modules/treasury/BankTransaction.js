import mongoose from "mongoose";

const bankTransactionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    balanceAfter: {
      type: Number, // Optional: for running balance tracking
    }
  },
  { timestamps: true }
);

const BankTransaction = mongoose.model("BankTransaction", bankTransactionSchema);
export default BankTransaction;
