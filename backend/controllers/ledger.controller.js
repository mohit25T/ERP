import Ledger from "../models/Ledger.js";
import Order from "../models/Order.js";
import Purchase from "../models/Purchase.js";
import mongoose from "mongoose";

// Record new Ledger Entry (Manual Income/Expense)
export const createLedgerEntry = async (req, res) => {
  try {
    const { type, category, amount, description, customer, supplier, date, order, purchase } = req.body;
    
    // Financial Guard: Account-Wide Outstanding Validation
    if (type === "income" && customer) {
      const orders = await Order.find({ customer, status: { $ne: "cancelled" } });
      const totalInvoiced = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      const previousPayments = await Ledger.find({ customer, type: "income" });
      const totalPaid = previousPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const outstanding = totalInvoiced - totalPaid;
      if (Number(amount) > outstanding) {
        return res.status(400).json({ 
          error: `Cannot record receipt of ₹${amount}. Customer total account outstanding is only ₹${outstanding.toLocaleString()}.` 
        });
      }
    }

    if (type === "expense" && supplier) {
      const purchases = await Purchase.find({ supplier, status: { $ne: "cancelled" } });
      const totalInvoiced = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      
      const previousPayments = await Ledger.find({ supplier, type: "expense" });
      const totalPaid = previousPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const outstanding = totalInvoiced - totalPaid;
      if (Number(amount) > outstanding) {
        return res.status(400).json({ 
          error: `Cannot record payment of ₹${amount}. Supplier total account outstanding is only ₹${outstanding.toLocaleString()}.` 
        });
      }
    }

    const entry = new Ledger({
      type,
      category,
      amount: Number(amount),
      description,
      customer: customer || undefined,
      supplier: supplier || undefined,
      order: order || undefined,
      purchase: purchase || undefined,
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
    if (order && mongoose.Types.ObjectId.isValid(order)) query.order = order;
    if (purchase && mongoose.Types.ObjectId.isValid(purchase)) query.purchase = purchase;
    if (customer && mongoose.Types.ObjectId.isValid(customer)) query.customer = customer;
    if (supplier && mongoose.Types.ObjectId.isValid(supplier)) query.supplier = supplier;

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
