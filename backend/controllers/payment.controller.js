import Order from "../models/Order.js";
import Purchase from "../models/Purchase.js";
import Ledger from "../models/Ledger.js";

// Record Payment for Order (Receivable)
export const recordOrderPayment = async (req, res) => {
  try {
    const { amount, date, description } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id).populate("customer");
    if (!order) return res.status(404).json({ msg: "Order not found" });

    const currentPaid = Number(order.amountPaid || 0);
    const outstanding = Number(order.totalAmount) - currentPaid;

    if (Number(amount) > outstanding) {
      return res.status(400).json({ 
        error: `Cannot pay ₹${amount}. The remaining balance on this order is only ₹${outstanding.toLocaleString()}.` 
      });
    }

    order.amountPaid = currentPaid + Number(amount);
    
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
      description: description || `Payment for Order #${id.substring(id.length - 6).toUpperCase()}`,
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

    const currentPaid = Number(purchase.amountPaid || 0);
    const outstanding = Number(purchase.totalAmount) - currentPaid;

    if (Number(amount) > outstanding) {
      return res.status(400).json({ 
        error: `Cannot pay ₹${amount}. The remaining balance on this purchase is only ₹${outstanding.toLocaleString()}.` 
      });
    }

    purchase.amountPaid = currentPaid + Number(amount);

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
      description: description || `Payment for Purchase #${id.substring(id.length - 6).toUpperCase()}`,
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
    const orders = await Order.find({ paymentStatus: { $ne: "paid" } });
    const purchases = await Purchase.find({ paymentStatus: { $ne: "paid" } });

    const totalReceivable = orders.reduce((sum, o) => sum + (o.totalAmount - o.amountPaid), 0);
    const totalPayable = purchases.reduce((sum, p) => sum + (p.totalAmount - p.amountPaid), 0);

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
