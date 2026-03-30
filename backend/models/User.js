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
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;