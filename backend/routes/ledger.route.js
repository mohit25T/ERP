import express from "express";
import { createLedgerEntry, getLedgerEntries, getPnLSummary } from "../controllers/ledger.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getLedgerEntries);
router.post("/", authMiddleware, createLedgerEntry);
router.get("/summary", authMiddleware, getPnLSummary);

export default router;
