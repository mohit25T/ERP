import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    month: {
      type: String, // e.g. "January" or "01"
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    workingDays: {
      type: Number,
      default: 30,
    },
    bonus: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    grossSalary: {
      type: Number,
      required: true,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    paymentDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

const Payroll = mongoose.model("Payroll", payrollSchema);

export default Payroll;
