import Order from "../models/Order.js";
import Purchase from "../models/Purchase.js";
import Ledger from "../models/Ledger.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// GSTR-1 Summary (Sales categorization)
export const getGSTR1 = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Disable Caching for fresh financial data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

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

    // Disable Caching for fresh financial data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

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
    // Disable Caching for fresh financial data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Party ID format" });
    }

    let transactions = [];
    let payments = [];

    if (type === "customer") {
      transactions = await Order.find({ customer: id, status: { $ne: "cancelled" } }).lean();
      payments = await Ledger.find({ customer: id }).lean();
    } else {
      transactions = await Purchase.find({ supplier: id, status: { $ne: "cancelled" } }).lean();
      payments = await Ledger.find({ supplier: id }).lean();
    }

    // Fetch Party details for descriptions (Guard against missing partyDoc)
    let partyDoc = (type === "customer") 
      ? await Customer.findById(id).lean() 
      : await Supplier.findById(id).lean();

    if (!partyDoc) {
      return res.status(404).json({ error: "Statement creation failed: Party not found" });
    }

    // Combine and Format with Safe Number Casting & Missing Data Guard
    const combined = [
      ...transactions.map(t => ({
        date: t.createdAt || new Date(),
        type: type === "customer" ? "invoice" : "purchase",
        ref: t._id,
        debit: type === "customer" ? Number(t.totalAmount || 0) : 0,
        credit: type === "supplier" ? Number(t.totalAmount || 0) : 0,
        description: type === "customer" 
          ? `Sales Invoice (Order #${String(t._id || 'N/A').slice(-6)}) — ${partyDoc.company || partyDoc.name}` 
          : `Inward Stock (Pur #${String(t._id || 'N/A').slice(-6)}) — ${partyDoc.company || partyDoc.name}`
      })),
      ...payments.map(p => ({
        date: p.date || new Date(),
        type: "payment",
        ref: p._id,
        debit: type === "supplier" ? Number(p.amount || 0) : 0,
        credit: type === "customer" ? Number(p.amount || 0) : 0,
        description: p.description || `Settlement / Receipt (Ref #${String(p._id || 'N/A').slice(-6)}) — ${partyDoc.company || partyDoc.name}`
      }))
    ];

    // Sort by Date (Guaranteed Stability with Safe Date Objects)
    combined.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

    // Calculate Running Balance with Absolute Logic (Hardened against NaN)
    let runningBalance = 0;
    const timeline = combined.map(item => {
       const debitValue = Number(item.debit || 0);
       const creditValue = Number(item.credit || 0);

       if (type === "customer") {
          runningBalance += (debitValue - creditValue);
       } else {
          runningBalance += (creditValue - debitValue);
       }
       return { ...item, balance: Number(Number(runningBalance).toFixed(2)) };
    });

    // Disable Caching for fresh financial data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

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

// Publicly accessible Statement (Nexus Connect Portal)
export const getPublicStatement = async (req, res) => {
  try {
    const { token } = req.params;

    // Find Party by Token
    let partyDoc = await Customer.findOne({ shareToken: token }).lean();
    let type = "customer";

    if (!partyDoc) {
      partyDoc = await Supplier.findOne({ shareToken: token }).lean();
      type = "supplier";
    }

    if (!partyDoc) {
      return res.status(404).json({ error: "Invalid or expired ledger link." });
    }

    // Fetch the company/admin details for branding on public portal
    const adminUser = await User.findOne({ role: "super_admin" }).lean();
    const companyInfo = {
      name: adminUser?.companyName || "Our Company",
      address: adminUser?.address || "Available on request",
      gstin: adminUser?.gstin || "N/A",
      tagline: adminUser?.footerText || "Official Ledger Portal"
    };

    const id = partyDoc._id;
    let transactions = [];
    let payments = [];

    if (type === "customer") {
      transactions = await Order.find({ customer: id, status: { $ne: "cancelled" } }).lean();
      payments = await Ledger.find({ customer: id }).lean();
    } else {
      transactions = await Purchase.find({ supplier: id, status: { $ne: "cancelled" } }).lean();
      payments = await Ledger.find({ supplier: id }).lean();
    }

    const combined = [
      ...transactions.map(t => ({
        date: t.createdAt || new Date(),
        type: type === "customer" ? "invoice" : "purchase",
        ref: t._id,
        debit: type === "customer" ? Number(t.totalAmount || 0) : 0,
        credit: type === "supplier" ? Number(t.totalAmount || 0) : 0,
        description: type === "customer" 
          ? `Sales Invoice (Order #${String(t._id || 'N/A').slice(-6)}) — ${partyDoc.company || partyDoc.name}` 
          : `Inward Stock (Pur #${String(t._id || 'N/A').slice(-6)}) — ${partyDoc.company || partyDoc.name}`
      })),
      ...payments.map(p => ({
        date: p.date || new Date(),
        type: "payment",
        ref: p._id,
        debit: type === "supplier" ? Number(p.amount || 0) : 0,
        credit: type === "customer" ? Number(p.amount || 0) : 0,
        description: p.description || `Settlement / Receipt (Ref #${String(p._id || 'N/A').slice(-6)}) — ${partyDoc.company || partyDoc.name}`
      }))
    ];

    combined.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

    let runningBalance = 0;
    const timeline = combined.map(item => {
       const debitValue = Number(item.debit || 0);
       const creditValue = Number(item.credit || 0);

       if (type === "customer") {
          runningBalance += (debitValue - creditValue);
       } else {
          runningBalance += (creditValue - debitValue);
       }
       return { ...item, balance: Number(Number(runningBalance).toFixed(2)) };
    });

    // Disable Caching for fresh financial data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    res.json({
       party: {
        name: partyDoc.name,
        company: partyDoc.company,
        address: partyDoc.address,
        gstin: partyDoc.gstin
      },
      companyInfo,
      type,
      timeline,
      totalOutstanding: Number(runningBalance.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Whole-Company Financial Statement (Master Ledger)
export const getCompanyStatement = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $nin: ["cancelled", "refunded"] } }).populate("customer").lean();
    const purchases = await Purchase.find({ status: { $ne: "cancelled" } }).populate("supplier").lean();
    const ledgerEntries = await Ledger.find().populate("customer supplier").lean();

    // Fetch the actual company details from the database
    const adminUser = await User.findOne({ role: "super_admin" }).lean();
    const companyName = adminUser?.companyName || "Our Company Statement";

    const combined = [
      ...orders.map(o => ({
        date: o.createdAt || new Date(),
        type: "sales",
        ref: o._id,
        debit: 0,
        credit: Number(o.totalAmount || 0),
        description: `Sales Invoice #${String(o._id).slice(-6)} — ${o.customer?.company || o.customer?.name || "B2C Customer"} (Inc. ₹${o.gstAmount?.toLocaleString()} GST)`
      })),
      ...purchases.map(p => ({
        date: p.createdAt || new Date(),
        type: "purchase",
        ref: p._id,
        debit: Number(p.totalAmount || 0),
        credit: 0,
        description: `Inward Stock #${String(p._id).slice(-6)} — ${p.supplier?.company || p.supplier?.name || "Vendor"}`
      })),
      ...ledgerEntries.map(l => ({
        date: l.date || new Date(),
        type: l.type === "income" ? "receipt" : "payment",
        ref: l._id,
        debit: l.type === "expense" ? Number(l.amount || 0) : 0,
        credit: l.type === "income" ? Number(l.amount || 0) : 0,
        description: l.description || `${l.type === "income" ? "Manual Receipt" : "Manual Payment"} — ${l.customer?.name || l.supplier?.company || "External"}`
      }))
    ];

    combined.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateA.getTime() - dateB.getTime();
    });

    let runningBalance = 0;
    const timeline = combined.map(item => {
      runningBalance += (item.credit - item.debit);
      return { ...item, balance: Number(runningBalance.toFixed(2)) };
    });

    // Disable Caching for fresh financial data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    res.json({
      companyName,
      companyAddress: adminUser?.address,
      companyGstin: adminUser?.gstin,
      timeline,
      totalBalance: Number(runningBalance.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
