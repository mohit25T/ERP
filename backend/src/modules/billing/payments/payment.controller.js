import Invoice from "../invoice/Invoice.js";
import Order from "../../erp/orders/Order.js";
import Purchase from "../../erp/purchasing/Purchase.js";
import Ledger from "../ledger/Ledger.js";
import AccountingService from "../ledger/AccountingService.js";

// Helper: Calculate total account balance for a party
async function getAccountOutstanding(partyId, type) {
  if (!partyId) return 0;
  if (type === "customer") {
    const orders = await Order.find({ customer: partyId, status: { $ne: "cancelled" } });
    const totalInvoiced = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const previousPayments = await Ledger.find({ customer: partyId, type: "income" });
    const totalPaid = previousPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return Math.max(0, totalInvoiced - totalPaid);
  } else {
    const purchases = await Purchase.find({ supplier: partyId, status: { $ne: "cancelled" } });
    const totalInvoiced = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const previousPayments = await Ledger.find({ supplier: partyId, type: "expense" });
    const totalPaid = previousPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return Math.max(0, totalInvoiced - totalPaid);
  }
}


// Record Payment for Order/Invoice (Receivable)
export const recordOrderPayment = async (req, res) => {
  try {
    const { amount, date, description, invoiceId } = req.body;
    const { id } = req.params; // Order ID (backward compatibility) or Invoice ID

    let order, invoice;
    
    if (invoiceId || req.url.includes("invoice")) {
      invoice = await Invoice.findById(invoiceId || id).populate("customer");
      if (!invoice) return res.status(404).json({ msg: "Invoice not found" });
      order = await Order.findById(invoice.order);
    } else {
      order = await Order.findById(id).populate("customer");
      invoice = await Invoice.findOne({ order: id });
    }

    if (!order && !invoice) return res.status(404).json({ msg: "Transaction target not found" });

    const target = invoice || order;
    const currentPaid = Number(target.amountPaid || 0);
    const outstanding = Number(target.totalAmount) - currentPaid;

    if (Number(amount) > outstanding) {
      return res.status(400).json({ 
        error: `Cannot pay ₹${amount}. The remaining balance is only ₹${outstanding.toLocaleString()}.` 
      });
    }

    target.amountPaid = currentPaid + Number(amount);
    
    // Status Logic for Invoice/Order
    if (target.amountPaid >= target.totalAmount) {
      target.paymentStatus = "paid";
      if (invoice) target.status = "paid";
    } else if (target.amountPaid > 0) {
      target.paymentStatus = "partial";
      if (invoice) target.status = "partially_paid";
    }

    await target.save();

    // If it's an order and has an invoice, update invoice too
    if (!invoiceId && !invoice && order) {
       // Just update order
    } else if (invoice && order) {
       order.amountPaid = target.amountPaid;
       order.paymentStatus = target.paymentStatus;
       await order.save();
    }

    // Automated Accounting
    await AccountingService.recordPaymentReceived({
      amount: Number(amount),
      customerName: target.customer?.name || "Customer",
      referenceId: target._id,
      referenceType: invoice ? "invoice" : "payment"
    });

    // Create Ledger Entry
    const ledgerEntry = new Ledger({
      type: "income",
      category: "Direct Sales",
      amount: Number(amount),
      description: description || `Payment for ${invoice ? 'Invoice ' + invoice.invoiceNumber : 'Order #' + id.substring(id.length - 6).toUpperCase()}`,
      customer: target.customer?._id,
      order: order?._id,
      date: date || new Date()
    });
    await ledgerEntry.save();

    res.json(target);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Record Payment for Purchase (Payable)
export const recordPurchasePayment = async (req, res) => {
  try {
    const { amount, date, description } = req.body;
    const { id } = req.params;

    const purchase = await Purchase.findById(id).populate("supplier");
    if (!purchase) return res.status(404).json({ msg: "Purchase not found" });

    const currentBillPaid = Number(purchase.amountPaid || 0);
    const billOutstanding = Number(purchase.totalAmount) - currentBillPaid;

    // Step 2: Global Account Outstanding
    const accountOutstanding = await getAccountOutstanding(purchase.supplier?._id, "supplier");

    if (Number(amount) > billOutstanding) {
      return res.status(400).json({ 
        error: `Cannot pay ₹${amount}. The remaining balance on this specific purchase is only ₹${billOutstanding.toLocaleString()}.` 
      });
    }

    purchase.amountPaid = currentBillPaid + Number(amount);


    // Status Logic
    if (purchase.amountPaid >= purchase.totalAmount) {
      purchase.paymentStatus = "paid";
    } else if (purchase.amountPaid > 0) {
      purchase.paymentStatus = "partial";
    }

    await purchase.save();

    // Automated Accounting
    await AccountingService.recordPaymentMade({
      amount: Number(amount),
      supplierName: purchase.supplier?.company || purchase.supplier?.name || "Supplier",
      referenceId: purchase._id,
      referenceType: "purchase"
    });

    // Create Ledger Entry for installment tracking
    const ledgerEntry = new Ledger({
      type: "expense",
      category: "Material Cost",
      amount: Number(amount),
      description: description || `Payment for Purchase #${id.substring(id.length - 6).toUpperCase()} — ${purchase.supplier?.company || purchase.supplier?.name}`,
      supplier: purchase.supplier?._id,
      purchase: id,
      date: date || new Date()
    });
    await ledgerEntry.save();

    res.json(purchase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Financial Summary (For Dashboard)
export const getFinancialSummary = async (req, res) => {
  try {
    const orders = await Order.find({ paymentStatus: { $ne: "paid" }, status: { $nin: ["cancelled", "refunded"] } });
    const purchases = await Purchase.find({ paymentStatus: { $ne: "paid" }, status: { $nin: ["cancelled", "refunded"] } });

    const totalReceivable = orders.reduce((sum, o) => sum + ((o.totalAmount || 0) - (o.amountPaid || 0)), 0);
    const totalPayable = purchases.reduce((sum, p) => sum + ((p.totalAmount || 0) - (p.amountPaid || 0)), 0);

    res.json({
        totalReceivable,
        totalPayable,
        receivableCount: orders.length,
        payableCount: purchases.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
