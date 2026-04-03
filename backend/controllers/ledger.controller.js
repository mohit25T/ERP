import Ledger from "../models/Ledger.js";
import Order from "../models/Order.js";
import Purchase from "../models/Purchase.js";

// Record new Ledger Entry (Manual Income/Expense)
export const createLedgerEntry = async (req, res) => {
  try {
    const { type, category, amount, description, customer, supplier, date } = req.body;
    const entry = new Ledger({
      type,
      category,
      amount,
      description,
      customer: customer || undefined,
      supplier: supplier || undefined,
      date: date || new Date()
    });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all Ledger Entries (With precise filtering)
export const getLedgerEntries = async (req, res) => {
  try {
    const { order, purchase, customer, supplier } = req.query;
    let query = {};
    
    if (order) query.order = order;
    if (purchase) query.purchase = purchase;
    if (customer) query.customer = customer;
    if (supplier) query.supplier = supplier;

    const entries = await Ledger.find(query).populate("customer supplier").sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Profit & Loss Summary
export const getPnLSummary = async (req, res) => {
  try {
    // 1. Direct Sales Income (Only what's actually paid as per Ledger philosophy, or Total Sales)
    // We'll use Total Sales Revenue for standard accrual-based P&L
    const salesInvoices = await Order.find({ status: { $ne: "cancelled" } });
    const totalSales = salesInvoices.reduce((sum, o) => sum + o.totalAmount, 0);

    // 2. Direct Purchase Expenses (Stock)
    const purchaseInvoices = await Purchase.find({ status: { $ne: "cancelled" } });
    const totalPurchases = purchaseInvoices.reduce((sum, p) => sum + p.totalAmount, 0);

    // 3. Manual Ledger Entries (Operating Expenses & Other Income)
    const manualEntries = await Ledger.find();
    const manualIncome = manualEntries.filter(e => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
    const manualExpense = manualEntries.filter(e => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);

    // 4. Calculations
    const grossIncome = totalSales + manualIncome;
    const grossExpense = totalPurchases + manualExpense;
    const netProfit = grossIncome - grossExpense;

    res.json({
      totalSales,
      totalPurchases,
      manualIncome,
      manualExpense,
      totalRevenue: grossIncome,
      totalExpenses: grossExpense,
      netProfit,
      margin: ((netProfit / grossIncome) * 100).toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
