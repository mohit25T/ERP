import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    type: {
      type: String,
      enum: ["sales", "credit_note", "debit_note"],
      default: "sales",
    },
    status: {
      type: String,
      enum: ["draft", "finalized", "paid", "partially_paid", "cancelled"],
      default: "draft",
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        sku: String,
        hsnCode: String,
        quantity: Number,
        price: Number,
        unit: String,
        gstRate: Number,
        taxableAmount: Number,
        gstAmount: Number,
        cgst: Number,
        sgst: Number,
        igst: Number,
        totalAmount: Number,
      },
    ],
    taxableAmount: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    dueDate: { type: Date },
    ewayBill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EWayBill",
    },
    irnNumber: { type: String, default: "" },
    irnStatus: { 
      type: String, 
      enum: ["pending", "generated", "cancelled"], 
      default: "pending" 
    },
    ewbNumber: { type: String, default: "" },
    ewbStatus: { 
      type: String, 
      enum: ["pending", "generated", "cancelled"], 
      default: "pending" 
    },
    eInvoiceJson: { type: Object }, // Snapshot of generated JSON
    eWayBillJson: { type: Object }, // Snapshot of generated JSON
    einvoice: {
      irn: { type: String, default: "" },
      ackNo: { type: String, default: "" },
      qrCodeUrl: { type: String, default: "" },
      status: { 
        type: String, 
        enum: ["pending", "generated"], 
        default: "pending" 
      }
    },
    notes: { type: String },
    finalizedAt: { type: Date },
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
