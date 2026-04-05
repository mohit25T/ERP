import Order from "../models/Order.js";
import Purchase from "../models/Purchase.js";
import Ledger from "../models/Ledger.js";

// Helper: Calculate Global Account Outstanding for a Party
const getAccountOutstanding = async (partyId, type) => {
  if (type === "customer") {
    const orders = await Order.find({ customer: partyId, status: { $ne: "cancelled" } });
    const totalInvoiced = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const payments = await Ledger.find({ customer: partyId, type: "income" });
    const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return totalInvoiced - totalReceived;
  } else {
    const purchases = await Purchase.find({ supplier: partyId, status: { $ne: "cancelled" } });
    const totalPurchased = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const payments = await Ledger.find({ supplier: partyId, type: "expense" });
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return totalPurchased - totalPaid;
  }
};


// Record Payment for Order (Receivable)
export const recordOrderPayment = async (req, res) => {
  try {
    const { amount, date, description } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id).populate("customer");
    if (!order) return res.status(404).json({ msg: "Order not found" });

    const currentBillPaid = Number(order.amountPaid || 0);
    const billOutstanding = Number(order.totalAmount) - currentBillPaid;

    // Step 2: Global Account Outstanding
    const accountOutstanding = await getAccountOutstanding(order.customer?._id, "customer");

    if (Number(amount) > billOutstanding) {
      return res.status(400).json({ 
        error: `Cannot pay ₹${amount}. The remaining balance on this specific bill is only ₹${billOutstanding.toLocaleString()}.` 
      });
    }

    order.amountPaid = currentBillPaid + Number(amount);

    
    // Status Logic
    if (order.amountPaid >= order.totalAmount) {
      order.paymentStatus = "paid";
    } else if (order.amountPaid > 0) {
      order.paymentStatus = "partial";
    }

    await order.save();

    // Create Ledger Entry for installment tracking
    const ledgerEntry = new Ledger({
      type: "income",
      category: "Direct Sales",
      amount: Number(amount),
      description: description || `Payment for Order #${id.substring(id.length - 6).toUpperCase()} — ${order.customer?.name}`,
      customer: order.customer?._id,
      order: id,
      date: date || new Date()
    });
    await ledgerEntry.save();

    res.json(order);
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
