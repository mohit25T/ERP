import mongoose from "mongoose";

const journalEntrySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      required: true,
    },
    debitAccount: {
      type: String,
      required: true, // e.g., "Cash", "Sales", "Customer Name", "Supplies"
    },
    creditAccount: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    referenceType: {
      type: String,
      enum: ["invoice", "payment", "purchase", "payroll", "production", "manual"],
      default: "manual",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    status: {
      type: String,
      enum: ["active", "reversed"],
      default: "active",
    },
  },
  { timestamps: true }
);

const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);

export default JournalEntry;
