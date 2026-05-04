import express from "express";
import * as TreasuryController from "./treasury.controller.js";

const router = express.Router();

// Dashboard Summary
router.get("/summary", TreasuryController.getTreasurySummary);

// Bank Transactions
router.get("/bank", TreasuryController.getBankTransactions);
router.post("/bank", TreasuryController.createBankTransaction);

// General Expenses
router.get("/expenses", TreasuryController.getExpenses);
router.post("/expenses", TreasuryController.createExpense);
router.put("/expenses/:id", TreasuryController.updateExpense);
router.delete("/expenses/:id", TreasuryController.deleteExpense);

// Cash Transactions
router.get("/cash", TreasuryController.getCashTransactions);
router.post("/cash", TreasuryController.createCashTransaction);

export default router;
