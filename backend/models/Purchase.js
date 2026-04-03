import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: "kg",
    },
    taxableAmount: {
      type: Number,
      default: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
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
    status: {
      type: String,
      enum: ["pending", "received", "cancelled"],
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
    receivedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;
