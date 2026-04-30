import express from "express";
import { getInventoryLogs, getProductLogs, getScrapLogs } from "./inventory.controller.js";
import { authMiddleware } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/logs", getInventoryLogs);
router.get("/logs/:productId", getProductLogs);
router.get("/scrap", getScrapLogs);

export default router;
