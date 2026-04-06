import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    taxableAmount: {
      type: Number,
      default: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    cgst: {
      type: Number,
      default: 0,
    },
    sgst: {
      type: Number,
      default: 0,
    },
    igst: {
      type: Number,
      default: 0,
    },
    hsnCode: {
      type: String,
    },
    customerGstin: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "shipped", "completed", "cancelled", "refunded"],
      default: "pending",
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    dueDate: {
      type: Date,
    },
    ewayBillData: {
      distance: { type: Number, default: 0 },
      transporterId: { type: String, default: "" },
      vehicleNo: { type: String, default: "" },
      mode: { type: String, enum: ["road", "rail", "air", "ship"], default: "road" },
      active: { type: Boolean, default: false }
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;