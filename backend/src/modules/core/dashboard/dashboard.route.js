import express from "express";
import { getDashboardStats, getPnLSummary } from "./dashboard.controller.js";
import { authMiddleware } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.get("/stats", authMiddleware, getDashboardStats);
router.get("/pnl-summary", authMiddleware, getPnLSummary);

export default router;
