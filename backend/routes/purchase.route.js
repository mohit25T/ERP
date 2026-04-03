import express from "express";
import { createPurchase, getPurchases, updatePurchaseStatus } from "../controllers/purchase.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", adminMiddleware, createPurchase);
router.get("/", getPurchases);
router.put("/:id/status", adminMiddleware, updatePurchaseStatus);

export default router;
