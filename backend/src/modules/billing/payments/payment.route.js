import express from "express";
import { recordOrderPayment, recordPurchasePayment, getFinancialSummary } from "./payment.controller.js";
import { authMiddleware } from "../../../shared/middleware/auth.middleware.js";
import { financialLock } from "../../../shared/middleware/financial-lock.middleware.js";

const router = express.Router();

router.get("/summary", authMiddleware, getFinancialSummary);
router.post("/order/:id", authMiddleware, financialLock, recordOrderPayment);
router.post("/purchase/:id", authMiddleware, financialLock, recordPurchasePayment);

export default router;
