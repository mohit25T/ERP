import express from "express";
import { getInventoryLogs, getProductLogs, getScrapLogs } from "../controllers/inventory.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/logs", getInventoryLogs);
router.get("/logs/:productId", getProductLogs);
router.get("/scrap", getScrapLogs);

export default router;
