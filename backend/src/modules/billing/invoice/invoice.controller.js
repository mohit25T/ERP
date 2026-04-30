import Invoice from "./Invoice.js";
import Order from "../../erp/orders/Order.js";
import User from "../../core/users/User.js";
import GstService from "../../gst/compliance/GstService.js";
import AuditService from "../../analytics/audit/AuditService.js";
import PdfService from "./PdfService.js";
import EWayBill from "../../gst/compliance/EWayBill.js";
import ErpOrchestrator from "../../../shared/utils/ErpOrchestrator.js";
import EInvoiceService from "../../gst/compliance/EInvoiceService.js";
import EWayBillService from "../../gst/compliance/EWayBillService.js";
import CompanyGSTConfig from "../../gst/compliance/CompanyGSTConfig.js";

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
    
    // Check if invoice already exists for this order
    const existingInvoice = await Invoice.findOne({ order: orderId });
    if (existingInvoice) {
      return res.status(200).json(existingInvoice);
    }

    const order = await Order.findById(orderId).populate("customer").populate("product");
    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (!order.product) {
      return res.status(400).json({ msg: "Associated product not found for this order. It may have been deleted." });
    }
    if (!order.customer) {
      return res.status(400).json({ msg: "Associated customer not found for this order." });
    }

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
          price: order.unitPrice || (order.taxableAmount / order.quantity) || order.product.price,
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
    const invoice = await Invoice.findById(id).populate("customer");
    if (!invoice) return res.status(404).json({ msg: "Invoice not found" });

    if (invoice.status !== "draft") {
      return res.status(400).json({ msg: "Only draft invoices can be finalized" });
    }

    // --- ORCHESTRATED ATOMIC WORKFLOW ---
    const result = await ErpOrchestrator.finalizeSalesInvoice({
      orderId: invoice.order,
      invoiceData: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customer?.name
      },
      user: req.user,
      req
    });

    // Handle Compliance (E-Way Bill)
    if (result.success) {
      const order = await Order.findById(invoice.order);
      const needsEWayBill = GstService.requiresEWayBill(invoice.totalAmount) || order?.ewayBillData?.active;
      
      if (needsEWayBill && order) {
        const ewbData = order.ewayBillData || {};
        const ewayBill = await EWayBill.create({
          invoice: invoice._id,
          transporterName: ewbData.transport || "",
          transporterId: ewbData.transporterId || "",
          vehicleNo: ewbData.vehicleNo || "",
          mode: ewbData.mode || "road",
          distance: ewbData.distance || 0,
          lrNo: ewbData.lrNo || "",
          lrDate: ewbData.lrDate || "",
          status: "pending"
        });
        await Invoice.findByIdAndUpdate(id, { ewayBill: ewayBill._id });
      }
    }

    res.json({ msg: "Invoice finalized and synchronized across system", invoice: result.invoice });
  } catch (err) {
    console.error("[INVOICE ERROR]:", err.message);
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
    const invoice = await Invoice.findById(id).populate("customer").populate("items.product").populate("ewayBill");
    if (!invoice) return res.status(404).json({ msg: "Invoice not found" });

    const user = await User.findById(req.user.id);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`);

    await PdfService.generateInvoicePdf(invoice, user, invoice.customer, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const downloadEinvoiceJson = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("customer");
    if (!invoice) return res.status(404).json({ msg: "Invoice not found" });

    const companyId = req.user.companyId || req.user.id;
    const sellerConfig = await CompanyGSTConfig.findOne({ companyId });
    
    if (!sellerConfig) {
        return res.status(400).json({ msg: "Company GST Configuration missing. Please configure in Settings > Compliance." });
    }

    const json = EInvoiceService.generateJson(invoice, sellerConfig, invoice.customer);
    
    invoice.eInvoiceJson = json;
    await invoice.save();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=EInvoice_${invoice.invoiceNumber}.json`);
    res.send(JSON.stringify(json, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const downloadEwayBillJson = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("customer");
    if (!invoice) return res.status(404).json({ msg: "Invoice not found" });

    const companyId = req.user.companyId || req.user.id;
    const sellerConfig = await CompanyGSTConfig.findOne({ companyId });
    
    if (!sellerConfig) {
        return res.status(400).json({ msg: "Company GST Configuration missing." });
    }

    let ewayBill = await EWayBill.findOne({ invoice: invoice._id });
    if (!ewayBill) {
      const order = await Order.findById(invoice.order);
      if (order) {
        const ewbData = order.ewayBillData || {};
        ewayBill = await EWayBill.create({
          invoice: invoice._id,
          transporterName: ewbData.transport || "",
          transporterId: ewbData.transporterId || "",
          vehicleNo: ewbData.vehicleNo || "",
          mode: ewbData.mode || "road",
          distance: ewbData.distance || 0,
          lrNo: ewbData.lrNo || "",
          lrDate: ewbData.lrDate || "",
          status: "pending"
        });
        invoice.ewayBill = ewayBill._id;
        await invoice.save();
      } else {
        return res.status(404).json({ msg: "E-Way Bill data not found." });
      }
    }
    
    const json = EWayBillService.generateJson(invoice, sellerConfig, invoice.customer, ewayBill);
    
    invoice.eWayBillJson = json;
    await invoice.save();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=EWayBill_${invoice.invoiceNumber}.json`);
    res.send(JSON.stringify(json, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateEinvoiceDetails = async (req, res) => {
  try {
    const { irn, ackNo, qrCodeUrl } = req.body;
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { 
         irnNumber: irn,
         irnStatus: "generated",
         "einvoice.irn": irn,
         "einvoice.qrCodeUrl": qrCodeUrl,
         "einvoice.ackNo": ackNo,
         "einvoice.status": "generated"
       },
       { returnDocument: 'after' }
     );
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateEwayBillDetails = async (req, res) => {
  try {
    const { ewbNo, ewbDate, validityDate } = req.body;
    const ewb = await EWayBill.findOneAndUpdate(
      { invoice: req.params.id },
      { 
         ewayBillNo: ewbNo,
         validityDate,
         status: "generated"
       },
       { returnDocument: 'after' }
     );

     // Sync status back to invoice
     await Invoice.findByIdAndUpdate(req.params.id, {
        ewbNumber: ewbNo,
        ewbStatus: "generated"
     });

    res.json(ewb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
