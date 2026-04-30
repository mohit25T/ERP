import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      lowercase: true,
    },
    position: {
      type: String,
      default: "Worker",
    },
    salaryType: {
      type: String,
      enum: ["monthly", "daily"],
      default: "monthly",
    },
    baseSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    bankDetails: {
      accountNo: String,
      ifsc: String,
      bankName: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
