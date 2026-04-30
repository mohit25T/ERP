import express from "express";
import { getAuditLogs } from "./audit.controller.js";
import { authMiddleware, adminMiddleware } from "../../../shared/middleware/auth.middleware.js";
import { financialLock } from "../../../shared/middleware/financial-lock.middleware.js";

const router = express.Router();

// Access restricted to Administrative profiles with Master Key clearance
router.get("/", authMiddleware, adminMiddleware, financialLock, getAuditLogs);

export default router;
