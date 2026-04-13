import Invoice from "../models/Invoice.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import GstService from "../services/GstService.js";
import InventoryService from "../services/InventoryService.js";
import AccountingService from "../services/AccountingService.js";
import AuditService from "../services/AuditService.js";
import PdfService from "../services/PdfService.js";
import EWayBill from "../models/EWayBill.js";

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
    const invoice = await Invoice.findById(id).populate("customer").populate("items.product").populate("ewayBill");
    if (!invoice) return res.status(404).json({ msg: "Invoice not found" });

    if (invoice.status !== "draft") {
      return res.status(400).json({ msg: "Only draft invoices can be finalized" });
    }

    // 1. Stock deduction is now handled at the Order Level (Real-time).
    // This allows users to see stock decrease immediately upon sales order creation.

    // 2. Automated Accounting (Journal Entry)
    await AccountingService.recordSalesInvoiceAccount(invoice, invoice.customer);

    // 3. E-Way Bill Requirement Check & Record Creation
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
      invoice.ewayBill = ewayBill._id;
      console.log(`[ERP COMPLIANCE] E-Way Bill record ${ewayBill._id} created for Invoice ${invoice.invoiceNumber}`);
    }

    // 4. Update Invoice Status
    invoice.status = "finalized";
    invoice.finalizedAt = new Date();
    await invoice.save();

    // 5. Update Order Status & Deduct Physical Stock
    if (order && !['shipped', 'completed'].includes(order.status)) {
      await InventoryService.updateStock({
        productId: order.product,
        quantity: order.quantity,
        type: "OUT",
        referenceType: "order",
        referenceId: order._id,
        reason: `Order Fulfillment: Invoice ${invoice.invoiceNumber} Finalized`
      });
    }
    
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

// State Codes for Indian GST
const stateCodes = {
  "jammu & kashmir": "01", "himachal pradesh": "02", "punjab": "03", "chandigarh": "04", "uttarakhand": "05",
  "haryana": "06", "delhi": "07", "rajasthan": "08", "uttar pradesh": "09", "bihar": "10", "sikkim": "11",
  "arunachal pradesh": "12", "nagaland": "13", "manipur": "14", "mizoram": "15", "tripura": "16",
  "meghalaya": "17", "assam": "18", "west bengal": "19", "jharkhand": "20", "odisha": "21", "chhattisgarh": "22",
  "madhya pradesh": "23", "gujarat": "24", "dadra & nagar haveli and daman & diu": "26", "maharashtra": "27",
  "karnataka": "29", "goa": "30", "lakshadweep": "31", "kerala": "32", "tamil nadu": "33", "puducherry": "34",
  "andaman & nicobar islands": "35", "telangana": "36", "andhra pradesh": "37", "ladakh": "38", "other": "97"
};

const getStateCode = (stateName) => {
  if (!stateName) return "24"; // Default to Gujarat
  const clean = stateName.toLowerCase().trim();
  return stateCodes[clean] || "24";
};

// Helper: Generate Official Einvoice JSON (NIC v1.03 Schema)
const generateEinvoiceJSONHelper = (invoice, seller) => {
  const sellerStcd = getStateCode(seller.state);
  const buyerStcd = getStateCode(invoice.customer.state);

  return {
    Version: "1.1",
    TranDtls: { TaxSch: "GST", SupTyp: "B2B" },
    DocDtls: { Typ: "INV", No: invoice.invoiceNumber, Dt: new Date(invoice.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-') },
    SellerDtls: {
      Gstin: seller.gstin,
      LglNm: seller.companyName,
      Addr1: seller.address,
      Loc: seller.state,
      Pin: parseInt(seller.pincode),
      Stcd: sellerStcd
    },
    BuyerDtls: {
      Gstin: invoice.customer.gstin,
      LglNm: invoice.customer.company || invoice.customer.name,
      Addr1: invoice.customer.address || "",
      Loc: invoice.customer.state || "",
      Pin: parseInt(invoice.customer.pincode) || 0,
      Stcd: buyerStcd
    },
    ItemList: invoice.items.map((item, index) => ({
      SlNo: (index + 1).toString(),
      PrdDesc: item.name,
      IsServc: "N",
      HsnCd: item.hsnCode,
      Qty: item.quantity,
      Unit: item.unit === "kg" ? "KGS" : "NOS",
      UnitPrice: item.price,
      TotAmt: item.taxableAmount,
      SgstAmt: item.sgst || 0,
      CgstAmt: item.cgst || 0,
      IgstAmt: item.igst || 0,
      AssAmt: item.taxableAmount,
      GstRt: item.gstRate,
      TotItemVal: item.totalAmount
    })),
    ValDtls: {
      AssVal: invoice.taxableAmount,
      CgstVal: invoice.cgst,
      SgstVal: invoice.sgst,
      IgstVal: invoice.igst,
      TotInvVal: invoice.totalAmount
    }
  };
};

// Helper: Generate E-Way Bill JSON
const generateEwayBillJSONHelper = (invoice, seller, ewb) => {
  return {
    supplyType: "O",
    subSupplyType: "1",
    docType: "INV",
    docNo: invoice.invoiceNumber,
    docDate: new Date(invoice.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-'),
    fromGstin: seller.gstin,
    toGstin: invoice.customer.gstin,
    fromPincode: parseInt(seller.pincode),
    toPincode: parseInt(invoice.customer.pincode),
    fromStateCode: parseInt(getStateCode(seller.state)),
    toStateCode: parseInt(getStateCode(invoice.customer.state)),
    transDistance: ewb.distance?.toString() || "0",
    transporterName: ewb.transporterName || "",
    transporterId: ewb.transporterId || "",
    vehicleNo: ewb.vehicleNo || "",
    actualDist: ewb.distance || 0,
    mainHsnCode: parseInt(invoice.items[0]?.hsnCode) || 0,
    itemList: invoice.items.map(item => ({
      productName: item.name,
      hsnCode: parseInt(item.hsnCode),
      quantity: item.quantity,
      qtyUnit: item.unit === "kg" ? "KGS" : "NOS",
      taxableAmount: item.taxableAmount,
      sgstRate: (item.sgst > 0) ? (item.gstRate / 2) : 0,
      cgstRate: (item.cgst > 0) ? (item.gstRate / 2) : 0,
      igstRate: (item.igst > 0) ? item.gstRate : 0
    })),
    totalTaxableValue: invoice.taxableAmount,
    cgstValue: invoice.cgst,
    sgstValue: invoice.sgst,
    igstValue: invoice.igst,
    totalInvoiceValue: invoice.totalAmount
  };
};

export const downloadEinvoiceJson = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("customer");
    const seller = await User.findById(req.user.id);
    const json = generateEinvoiceJSONHelper(invoice, seller);
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
    const seller = await User.findById(req.user.id);
    let ewayBill = await EWayBill.findOne({ invoice: invoice._id });
    
    // Fallback: If no EWayBill record exists (legacy or missed during finalize), create one now
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
        return res.status(404).json({ msg: "E-Way Bill data not found for this invoice. It may not require one." });
      }
    }
    
    const json = generateEwayBillJSONHelper(invoice, seller, ewayBill);
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
        "einvoice.irn": irn,
        "einvoice.ackNo": ackNo,
        "einvoice.qrCodeUrl": qrCodeUrl,
        "einvoice.status": "generated"
      },
      { new: true }
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
        ewbDate,
        validityDate,
        status: "generated"
      },
      { new: true }
    );
    res.json(ewb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
