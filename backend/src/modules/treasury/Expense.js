import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["Tea & Snacks", "Petrol/Diesel", "Maintenance", "Office Supplies", "Rent", "Electricity", "Miscellaneous"],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    }
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
