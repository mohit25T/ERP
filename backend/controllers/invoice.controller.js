import Invoice from "../models/Invoice.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import GstService from "../services/GstService.js";
import InventoryService from "../services/InventoryService.js";
import AccountingService from "../services/AccountingService.js";
import AuditService from "../services/AuditService.js";
import PdfService from "../services/PdfService.js";

// Helper: Generate Invoice Number (INV-YYYY-XXXX)
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments({
    invoiceNumber: new RegExp(`INV-${year}-`, "i"),
  });
  const nextNumber = (count + 1).toString().padStart(4, "0");
  return `INV-${year}-${nextNumber}`;
};

// Create Invoice (Draft)
export const createInvoice = async (req, res) => {
  try {
    const { orderId, dueDate, notes, items } = req.body;

    const order = await Order.findById(orderId).populate("customer").populate("product");
    if (!order) return res.status(404).json({ msg: "Order not found" });

    // If items are not provided, derive from Order (backward compatibility)
    let invoiceItems = items;
    if (!invoiceItems || invoiceItems.length === 0) {
      invoiceItems = [
        {
          product: order.product._id,
          name: order.product.name,
          sku: order.product.sku,
          hsnCode: order.hsnCode || order.product.hsnCode,
          quantity: order.quantity,
          price: order.product.price,
          unit: order.unit,
          gstRate: order.product.gstRate || 18,
          taxableAmount: order.taxableAmount,
          gstAmount: order.gstAmount,
          cgst: order.cgst,
          sgst: order.sgst,
          igst: order.igst,
          totalAmount: order.totalAmount,
        },
      ];
    }

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      order: orderId,
      customer: order.customer._id,
      items: invoiceItems,
      taxableAmount: invoiceItems.reduce((sum, item) => sum + item.taxableAmount, 0),
      gstAmount: invoiceItems.reduce((sum, item) => sum + item.gstAmount, 0),
      cgst: invoiceItems.reduce((sum, item) => sum + (item.cgst || 0), 0),
      sgst: invoiceItems.reduce((sum, item) => sum + (item.sgst || 0), 0),
      igst: invoiceItems.reduce((sum, item) => sum + (item.igst || 0), 0),
      totalAmount: invoiceItems.reduce((sum, item) => sum + item.totalAmount, 0),
      dueDate,
      notes,
      status: "draft",
    });

    await AuditService.logAction({
      user: req.user,
      action: "create",
      resource: "invoice",
      resourceId: invoice._id,
      changes: invoice,
      req
    });

    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Finalize Invoice
export const finalizeInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id).populate("customer").populate("items.product");
    if (!invoice) return res.status(404).json({ msg: "Invoice not found" });

    if (invoice.status !== "draft") {
      return res.status(400).json({ msg: "Only draft invoices can be finalized" });
    }

    // 1. Deduct Stock
    for (const item of invoice.items) {
      await InventoryService.updateStock({
        productId: item.product,
        quantity: item.quantity,
        type: "OUT",
        referenceType: "invoice",
        referenceId: invoice._id,
        reason: `Sales Invoice: ${invoice.invoiceNumber}`
      });
    }

    // 2. Automated Accounting (Journal Entry)
    await AccountingService.recordSalesInvoiceAccount(invoice, invoice.customer.name);

    // 3. Update Invoice Status
    invoice.status = "finalized";
    invoice.finalizedAt = new Date();
    await invoice.save();

    // 4. Update Order Status
    await Order.findByIdAndUpdate(invoice.order, { status: "completed" });

    await AuditService.logAction({
      user: req.user,
      action: "finalize",
      resource: "invoice",
      resourceId: invoice._id,
      req
    });

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Invoices
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("customer", "name company email")
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Download PDF
export const downloadInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id).populate("customer").populate("items.product");
    if (!invoice) return res.status(404).json({ msg: "Invoice not found" });

    const user = await User.findById(req.user.id);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`);

    await PdfService.generateInvoicePdf(invoice, user, invoice.customer, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
