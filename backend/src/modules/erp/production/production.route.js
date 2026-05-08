import express from "express";
import {
  createProduction,
  getProductions,
  deleteProduction,
  getManufacturingInsights,
  startProduction,
  completeProduction,
  updateProduction,
  adjustScrap
} from "./production.controller.js";
import { authMiddleware, adminMiddleware } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.get("/insights", authMiddleware, getManufacturingInsights);
router.post("/", authMiddleware, createProduction);
router.get("/", authMiddleware, getProductions);
router.patch("/:id/start", authMiddleware, startProduction);
router.patch("/:id/complete", authMiddleware, completeProduction);
router.patch("/:id", authMiddleware, updateProduction);
router.patch("/:id/adjust-scrap", authMiddleware, adjustScrap);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduction);


export default router;
