import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    billToCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    shipToCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    saleType: {
      type: String,
      enum: ["yield", "scrap"],
      default: "yield",
    },
    orderedQty: {
      type: Number,
      required: true,
    },
    reservedQty: {
      type: Number,
      default: 0,
    },
    shippedQty: {
      type: Number,
      default: 0,
    },
    invoicedQty: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: "kg",
    },
    unitPrice: {
      type: Number,
      default: 0,
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
      enum: ["pending", "in_progress", "partially_shipped", "invoiced", "shipped", "completed", "cancelled", "refunded"],
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
      active: { type: Boolean, default: false },
      transport: { type: String, default: "" },
      lrNo: { type: String, default: "" },
      lrDate: { type: String, default: "" }
    },
    poNumber: {
      type: String,
      default: "",
    },
    billToAddress: {
      label: String,
      companyName: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      gstin: String,
    },
    shipToAddress: {
      label: String,
      companyName: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      gstin: String,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for Pending Quantity
orderSchema.virtual("pendingQty").get(function () {
  return this.orderedQty - this.shippedQty;
});

// Virtual for Unbilled Quantity
orderSchema.virtual("unbilledQty").get(function () {
  return this.orderedQty - this.invoicedQty;
});

// Backward Compatibility Alias for 'quantity'
orderSchema.virtual("quantity")
  .get(function () {
    return this.orderedQty;
  })
  .set(function (val) {
    this.orderedQty = val;
  });

const Order = mongoose.model("Order", orderSchema);

export default Order;