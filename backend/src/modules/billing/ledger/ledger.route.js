import express from "express";
import { createLedgerEntry, getLedgerEntries, getPnLSummary } from "./ledger.controller.js";
import { authMiddleware } from "../../../shared/middleware/auth.middleware.js";
import { financialLock } from "../../../shared/middleware/financial-lock.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, financialLock, getLedgerEntries);
router.post("/", authMiddleware, financialLock, createLedgerEntry);
router.get("/summary", authMiddleware, getPnLSummary);

export default router;
