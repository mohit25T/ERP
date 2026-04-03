import express from "express";
import { recordOrderPayment, recordPurchasePayment, getFinancialSummary } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/summary", authMiddleware, getFinancialSummary);
router.post("/order/:id", authMiddleware, recordOrderPayment);
router.post("/purchase/:id", authMiddleware, recordPurchasePayment);

export default router;
