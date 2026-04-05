import express from "express";
import { getGSTR1, getGSTR3B, getBalanceSheet, getPartyStatement, getCompanyStatement } from "../controllers/reports.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/gstr1", authMiddleware, getGSTR1);
router.get("/gstr3b", authMiddleware, getGSTR3B);
router.get("/balance-sheet", authMiddleware, getBalanceSheet);
router.get("/party/:id", authMiddleware, getPartyStatement);
router.get("/company", authMiddleware, getCompanyStatement);

export default router;
