import Order from "../models/Order.js";
import Purchase from "../models/Purchase.js";
import Ledger from "../models/Ledger.js";
import Product from "../models/Product.js";

// GSTR-1 Summary (Sales categorization)
export const getGSTR1 = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ["cancelled", "refunded"] }
    }).populate("customer");

    const b2b = orders.filter(o => o.customerGstin || o.customer?.gstin);
    const b2c = orders.filter(o => !o.customerGstin && !o.customer?.gstin);

    const summary = {
      b2b: {
        count: b2b.length,
        taxableValue: b2b.reduce((sum, o) => sum + (o.taxableAmount || 0), 0),
        taxAmount: b2b.reduce((sum, o) => sum + (o.gstAmount || 0), 0),
        totalValue: b2b.reduce((sum, o) => sum + o.totalAmount, 0)
      },
      b2c: {
        count: b2c.length,
        taxableValue: b2c.reduce((sum, o) => sum + (o.taxableAmount || 0), 0),
        taxAmount: b2c.reduce((sum, o) => sum + (o.gstAmount || 0), 0),
        totalValue: b2c.reduce((sum, o) => sum + o.totalAmount, 0)
      }
    };

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GSTR-3B Summary (Liability vs ITC)
export const getGSTR3B = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Outward Liability (Sales)
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ["cancelled", "refunded"] }
    });

    const outwardTax = orders.reduce((sum, o) => sum + (o.gstAmount || 0), 0);
    const outwardValue = orders.reduce((sum, o) => sum + (o.taxableAmount || 0), 0);

    // Inward ITC (Purchases)
    const purchases = await Purchase.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $ne: "cancelled" }
    });

    const inwardTax = purchases.reduce((sum, p) => sum + (p.gstAmount || 0), 0);
    const inwardValue = purchases.reduce((sum, p) => sum + (p.taxableAmount || 0), 0);

    res.json({
      outward: { taxableValue: outwardValue, taxAmount: outwardTax },
      inward: { taxableValue: inwardValue, taxAmount: inwardTax },
      netPayable: outwardTax - inwardTax
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Balance Sheet (Assets vs Liabilities)
export const getBalanceSheet = async (req, res) => {
  try {
    // ASSETS
    // 1. Inventory Value (At cost price)
    const products = await Product.find();
    const inventoryValue = products.reduce((sum, p) => sum + (p.stock * (p.price * 0.7)), 0); // Simplified cost logic

    // 2. Receivables (Unpaid Sales)
    const unpaidOrders = await Order.find({ paymentStatus: { $ne: "paid" }, status: { $nin: ["cancelled", "refunded"] } });
    const receivables = unpaidOrders.reduce((sum, o) => sum + (o.totalAmount - o.amountPaid), 0);

    // 3. Cash/Bank (From Ledger entries)
    const income = await Ledger.find({ type: "income" });
    const expense = await Ledger.find({ type: "expense" });
    const cashBalance = income.reduce((sum, i) => sum + i.amount, 0) - expense.reduce((sum, e) => sum + e.amount, 0);

    // LIABILITIES
    // 1. Payables (Unpaid Purchases)
    const unpaidPurchases = await Purchase.find({ paymentStatus: { $ne: "paid" }, status: { $ne: "cancelled" } });
    const payables = unpaidPurchases.reduce((sum, p) => sum + (p.totalAmount - p.amountPaid), 0);

    res.json({
      assets: {
        inventory: inventoryValue,
        receivables,
        cashAndBank: cashBalance,
        total: inventoryValue + receivables + cashBalance
      },
      liabilities: {
        payables,
        total: payables
      },
      equity: (inventoryValue + receivables + cashBalance) - payables
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unified Party Statement (Statement of Account)
export const getPartyStatement = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'customer' or 'supplier'

    let transactions = [];
    let payments = [];

    if (type === "customer") {
      transactions = await Order.find({ customer: id, status: { $ne: "cancelled" } }).lean();
      payments = await Ledger.find({ customer: id }).lean();
    } else {
      transactions = await Purchase.find({ supplier: id, status: { $ne: "cancelled" } }).lean();
      payments = await Ledger.find({ supplier: id }).lean();
    }

    // Combine and Format with Safe Number Casting
    const combined = [
      ...transactions.map(t => ({
        date: t.createdAt,
        type: type === "customer" ? "invoice" : "purchase",
        ref: t._id,
        debit: type === "customer" ? Number(t.totalAmount || 0) : 0,
        credit: type === "supplier" ? Number(t.totalAmount || 0) : 0,
        description: type === "customer" ? `Sales Invoice (Order #${t._id.slice(-6)})` : `Inward Stock (Pur #${t._id.slice(-6)})`
      })),
      ...payments.map(p => ({
        date: p.date,
        type: "payment",
        ref: p._id,
        debit: type === "supplier" ? Number(p.amount || 0) : 0,
        credit: type === "customer" ? Number(p.amount || 0) : 0,
        description: p.description || "Settlement / Receipt Payment"
      }))
    ];

    // Sort by Date
    combined.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate Running Balance with Absolute Logic
    let runningBalance = 0;
    const timeline = combined.map(item => {
       if (type === "customer") {
          runningBalance += (item.debit - item.credit);
       } else {
          runningBalance += (item.credit - item.debit);
       }
       return { ...item, balance: Number(runningBalance.toFixed(2)) };
    });

    res.json({
      partyId: id,
      type,
      timeline,
      totalOutstanding: Number(runningBalance.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
