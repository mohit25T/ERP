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

export const getNextInvoiceNumber = async (req, res) => {
  try {
    const nextNumber = await generateInvoiceNumber();
    res.json({ nextNumber });
  } catch (err) {
    res.status(500).json({ msg: "Failed to generate invoice number" });
  }
};

// Create Invoice (Draft)
export const createInvoice = async (req, res) => {
  try {
    const { 
      orderId, 
      customer,
      dueDate, 
      notes, 
      items, 
      invoiceNumber: manualInvoiceNumber,
      shipTo,
      poNo,
      billToCustomer,
      shipToCustomer,
      billToAddress,
      shipToAddress,
      paymentMode,
      paymentTerms,
      billSeries,
      billQty
    } = req.body;
    
    const effectiveOrderId = orderId || req.body.order;
    
    // Debug log to catch hidden data issues
    console.log("[INVOICE DEBUG]: Request Body:", JSON.stringify(req.body));
    console.log("[INVOICE DEBUG]: effectiveOrderId:", effectiveOrderId);

    // Allow multiple drafts for partial invoicing flexibility
    
    if (!effectiveOrderId && (!items || items.length === 0)) {
        console.error("[INVOICE ERROR]: Missing both orderId and items");
        return res.status(400).json({ msg: "Either orderId or explicit items are required to generate an invoice." });
    }

    const orderDoc = effectiveOrderId ? await Order.findById(effectiveOrderId).populate("customer").populate("product") : null;
    
    if (effectiveOrderId && !orderDoc) {
        console.error("[INVOICE ERROR]: Order not found for ID:", effectiveOrderId);
        return res.status(404).json({ msg: "The specified order was not found." });
    }

    // If items are not provided, derive from Order (backward compatibility)
    let invoiceItems = items;
    if (!invoiceItems || invoiceItems.length === 0) {
      if (!orderDoc) {
          console.error("[INVOICE ERROR]: No items provided and no order found to derive them from");
          return res.status(400).json({ msg: "Order document required when items are not specified." });
      }
      if (!orderDoc.product) {
          console.error("[INVOICE ERROR]: Order product node missing for order:", orderDoc._id);
          return res.status(400).json({ msg: "Order product node is missing or corrupted" });
      }
      
      const orderQty = orderDoc.orderedQty || orderDoc.quantity || 0;
      const qty = billQty ? Number(billQty) : orderQty;
      
      const unitPrice = orderDoc.unitPrice || (orderQty > 0 ? (orderDoc.taxableAmount / orderQty) : 0) || orderDoc.product.price || 0;
      const taxableAmount = qty * unitPrice;
      const gstRate = orderDoc.product.gstRate || 18;
      const gstAmount = taxableAmount * (gstRate / 100);
      const isIgst = orderDoc.igst > 0; // simplistic check, ideally use customer state
      const cgst = isIgst ? 0 : gstAmount / 2;
      const sgst = isIgst ? 0 : gstAmount / 2;
      const igst = isIgst ? gstAmount : 0;
      const totalAmount = taxableAmount + gstAmount;

      invoiceItems = [
        {
          product: orderDoc.product._id,
          name: orderDoc.product.name,
          sku: orderDoc.product.sku,
          hsnCode: orderDoc.hsnCode || orderDoc.product.hsnCode,
          quantity: qty,
          price: unitPrice,
          unit: orderDoc.unit,
          gstRate,
          taxableAmount,
          gstAmount,
          cgst,
          sgst,
          igst,
          totalAmount,
        },
      ];
    }


    const isIgst = req.body.isIgst === true || req.body.isIgst === "true" || orderDoc?.igst > 0;

    // If items are provided explicitly (e.g. from Custom Invoice Form), ensure cgst/sgst/igst are calculated
    if (invoiceItems && invoiceItems.length > 0) {
      invoiceItems = invoiceItems.map(item => {
        if (item.cgst === undefined && item.sgst === undefined && item.igst === undefined) {
          const itemGst = item.gstAmount || ((item.taxableAmount || 0) * (item.gstRate || 18) / 100);
          return {
            ...item,
            gstAmount: itemGst,
            cgst: isIgst ? 0 : itemGst / 2,
            sgst: isIgst ? 0 : itemGst / 2,
            igst: isIgst ? itemGst : 0
          };
        }
        return item;
      });
    }

    const invoiceNumber = manualInvoiceNumber || await generateInvoiceNumber();
    const finalOrderRef = orderDoc?._id || (effectiveOrderId && effectiveOrderId !== "undefined" ? effectiveOrderId : null);

    // Only block if BOTH orderId and explicit items are missing
    if (!finalOrderRef && (!invoiceItems || invoiceItems.length === 0)) {
        console.error("[INVOICE ERROR]: Neither order reference nor items provided");
        return res.status(400).json({ msg: "A valid order reference or item list is required." });
    }

    const invoiceData = {
      invoiceNumber,
      order: finalOrderRef || undefined, // Mongoose will ignore if undefined and not required
      customer: orderDoc?.customer?._id || req.body.customer,
      items: invoiceItems,
      taxableAmount: invoiceItems.reduce((sum, item) => sum + (item.taxableAmount || 0), 0),
      gstAmount: invoiceItems.reduce((sum, item) => sum + (item.gstAmount || 0), 0),
      cgst: invoiceItems.reduce((sum, item) => sum + (item.cgst || 0), 0),
      sgst: invoiceItems.reduce((sum, item) => sum + (item.sgst || 0), 0),
      igst: invoiceItems.reduce((sum, item) => sum + (item.igst || 0), 0),
      totalAmount: invoiceItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
      dueDate,
      notes,
      poNo: poNo || orderDoc?.poNumber || "",
      billToCustomer: billToCustomer || orderDoc?.billToCustomer || orderDoc?.customer?._id || req.body.customer,
      shipToCustomer: shipToCustomer || orderDoc?.shipToCustomer || orderDoc?.customer?._id || req.body.customer,
      billToAddress: billToAddress || orderDoc?.billToAddress,
      shipToAddress: shipToAddress || orderDoc?.shipToAddress,
      paymentMode,
      paymentTerms,
      billSeries,
      status: "draft",
    };

    console.log("[INVOICE DEBUG] FINAL DATA TO MONGOOSE:", JSON.stringify(invoiceData));

    const invoice = await Invoice.create(invoiceData);

    await AuditService.logAction({
      user: req.user,
      action: "create",
      resource: "invoice",
      resourceId: invoice._id,
      changes: invoice,
      req
    });

    // Update Order invoicedQty
    if (orderDoc) {
      const addedQty = invoiceItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
      orderDoc.invoicedQty = (orderDoc.invoicedQty || 0) + addedQty;
      
      // Update status if fully invoiced
      if (orderDoc.invoicedQty >= (orderDoc.orderedQty || orderDoc.quantity)) {
        if (orderDoc.status === 'pending' || orderDoc.status === 'in_progress') {
          orderDoc.status = 'invoiced';
        }
      } else if (orderDoc.status === 'pending') {
        orderDoc.status = 'in_progress';
      }
      
      await orderDoc.save();
    }

    res.status(201).json(invoice);
  } catch (err) {
    console.error("[INVOICE CREATE FATAL]:", err);
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

    invoice.status = "finalized";
    invoice.finalizedAt = new Date();

    const order = invoice.order ? await Order.findById(invoice.order) : null;
    
    // Auto-map payment status from the Order if applicable
    if (order && order.amountPaid > 0) {
      if (order.amountPaid >= invoice.totalAmount) {
        invoice.amountPaid = invoice.totalAmount;
        invoice.status = "paid";
      } else {
        invoice.amountPaid = order.amountPaid;
        invoice.status = "partially_paid";
      }
    }

    await invoice.save();

    // Handle Compliance (E-Way Bill)
    if (result.success || true) { // We bypass the stub result
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
        invoice.ewayBill = ewayBill._id;
        await invoice.save();
      }
    }

    res.json({ msg: "Invoice finalized", invoice });
  } catch (err) {
    console.error("[INVOICE ERROR]:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Delete Draft Invoice
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ msg: "Invoice not found" });

    if (invoice.status !== "draft") {
      return res.status(400).json({ msg: "Only draft invoices can be deleted. Finalized invoices are permanently etched into the ledger." });
    }

    // Revert the ordered quantity from the parent Order
    if (invoice.order) {
      const orderDoc = await Order.findById(invoice.order);
      if (orderDoc) {
        const removedQty = invoice.items.reduce((acc, it) => acc + (it.quantity || 0), 0);
        orderDoc.invoicedQty = Math.max(0, (orderDoc.invoicedQty || 0) - removedQty);
        
        // Only revert status if it was specifically 'invoiced'
        if (orderDoc.status === 'invoiced' && orderDoc.invoicedQty < (orderDoc.orderedQty || orderDoc.quantity)) {
           orderDoc.status = 'in_progress';
        } else if (orderDoc.status === 'in_progress' && orderDoc.invoicedQty === 0 && orderDoc.shippedQty === 0 && orderDoc.reservedQty === 0) {
           orderDoc.status = 'pending';
        }
        await orderDoc.save();
      }
    }

    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ msg: "Invoice successfully purged" });
  } catch (err) {
    console.error("[INVOICE DELETE ERROR]:", err.message);
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

    const currentUser = await User.findById(req.user.id);
    const masterAdmin = await User.findOne({ role: "super_admin" });

    // Merge logic to ensure global branding settings are used
    const companyProfile = {
      ...currentUser.toObject(),
      companyLogo: masterAdmin?.companyLogo || currentUser.companyLogo,
      companyName: masterAdmin?.companyName || currentUser.companyName,
      address: masterAdmin?.address || currentUser.address,
      state: masterAdmin?.state || currentUser.state,
      pincode: masterAdmin?.pincode || currentUser.pincode,
      gstin: masterAdmin?.gstin || currentUser.gstin,
      invoiceSettings: masterAdmin?.invoiceSettings || currentUser.invoiceSettings,
      bankDetails: masterAdmin?.bankDetails || currentUser.bankDetails
    };
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`);

    await PdfService.generateInvoicePdf(invoice, companyProfile, invoice.customer, res);
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
