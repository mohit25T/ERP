import express from "express";
import { createPurchase, getPurchases, updatePurchaseStatus, deletePurchase } from "./purchase.controller.js";
import { authMiddleware, adminMiddleware } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", adminMiddleware, createPurchase);
router.get("/", getPurchases);
router.put("/:id/status", adminMiddleware, updatePurchaseStatus);
router.delete("/:id", adminMiddleware, deletePurchase);

export default router;
