import BankTransaction from "./BankTransaction.js";
import Expense from "./Expense.js";
import CashTransaction from "./CashTransaction.js";
import mongoose from "mongoose";

// --- BANK MANAGEMENT ---

export const getBankTransactions = async (req, res) => {
  try {
    const { startDate, endDate, bankName, type } = req.query;
    let query = {};
    if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    if (bankName) query.bankName = bankName;
    if (type) query.type = type;

    const transactions = await BankTransaction.find(query).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createBankTransaction = async (req, res) => {
  try {
    const transaction = await BankTransaction.create(req.body);
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- EXPENSE MANAGEMENT ---

export const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    let query = {};
    if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    if (category) query.category = category;

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ msg: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- CASH MANAGEMENT ---

export const getCashTransactions = async (req, res) => {
  try {
    const { startDate, endDate, type, employeeName } = req.query;
    let query = {};
    if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    if (type) query.type = type;
    if (employeeName) query.employeeName = { $regex: employeeName, $options: "i" };

    const transactions = await CashTransaction.find(query).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createCashTransaction = async (req, res) => {
  try {
    const transaction = await CashTransaction.create(req.body);
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- TREASURY DASHBOARD ---

export const getTreasurySummary = async (req, res) => {
  try {
    // 1. Bank Balance calculation
    const bankSummary = await BankTransaction.aggregate([
      {
        $group: {
          _id: null,
          totalCredits: { $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] } },
          totalDebits: { $sum: { $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0] } }
        }
      }
    ]);

    const bankBalance = bankSummary.length > 0 
      ? bankSummary[0].totalCredits - bankSummary[0].totalDebits 
      : 0;

    // 2. Cash in Hand calculation
    const cashSummary = await CashTransaction.aggregate([
      {
        $group: {
          _id: null,
          totalIn: { $sum: { $cond: [{ $eq: ["$transactionFlow", "in"] }, "$amount", 0] } },
          totalOut: { $sum: { $cond: [{ $eq: ["$transactionFlow", "out"] }, "$amount", 0] } }
        }
      }
    ]);

    const cashInHand = cashSummary.length > 0 
      ? cashSummary[0].totalIn - cashSummary[0].totalOut 
      : 0;

    // 3. Monthly Expenses Breakdown
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const expenseBreakdown = await Expense.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } }
    ]);

    const totalMonthlyExpense = expenseBreakdown.reduce((acc, curr) => acc + curr.total, 0);

    // 4. Recent Transactions (Mixed)
    const recentBank = await BankTransaction.find().sort({ createdAt: -1 }).limit(5).lean();
    const recentCash = await CashTransaction.find().sort({ createdAt: -1 }).limit(5).lean();
    const recentExpenses = await Expense.find().sort({ createdAt: -1 }).limit(5).lean();

    const recentCombined = [
      ...recentBank.map(t => ({ ...t, source: 'Bank', displayType: t.type === 'credit' ? 'IN' : 'OUT' })),
      ...recentCash.map(t => ({ ...t, source: 'Cash', displayType: t.transactionFlow.toUpperCase() })),
      ...recentExpenses.map(e => ({ ...e, source: 'Expense', displayType: 'OUT' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    res.json({
      balances: {
        bank: bankBalance,
        cash: cashInHand
      },
      expenses: {
        monthlyTotal: totalMonthlyExpense,
        breakdown: expenseBreakdown
      },
      recent: recentCombined
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
