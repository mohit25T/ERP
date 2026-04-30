import mongoose from "mongoose";

const ewayBillSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    ewayBillNo: {
      type: String,
      default: "", // To be filled manually after government portal upload
    },
    ewbDate: { type: Date },
    validityDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "generated", "cancelled", "expired"],
      default: "pending",
    },
    transporterName: { type: String, default: "" },
    transporterId: { type: String, default: "" },
    vehicleNo: { type: String, default: "" },
    mode: {
      type: String,
      enum: ["road", "rail", "air", "ship"],
      default: "road",
    },
    distance: { type: Number, default: 0 },
    fromPincode: { type: String },
    toPincode: { type: String },
    lrNo: { type: String },
    lrDate: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

const EWayBill = mongoose.model("EWayBill", ewayBillSchema);

export default EWayBill;
