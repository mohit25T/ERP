import express from "express";
import {
  getDashboard,
  getScrapAndEfficiencyAnalytics,
  getAlerts,
  getProfit
} from "./bi.controller.js";
import { authMiddleware, adminMiddleware } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

// Because this is analytical data, we protect it under standard auth or admin level if preferred.
// Left as standard protect for general dashboard viewers, assuming Role checks apply at UI level.

router.get("/dashboard", authMiddleware, getDashboard);
router.get("/analytics/scrap", authMiddleware, getScrapAndEfficiencyAnalytics);
router.get("/analytics/efficiency", authMiddleware, getScrapAndEfficiencyAnalytics); // Aliased as they pull same dataset currently
router.get("/alerts", authMiddleware, getAlerts);
router.get("/profit", authMiddleware, adminMiddleware, getProfit); // Financials strictly admin

export default router;
