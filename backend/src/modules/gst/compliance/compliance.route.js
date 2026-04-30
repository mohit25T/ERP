import express from "express";
import { getGstConfig, updateGstConfig } from "./compliance.controller.js";
import { authMiddleware as protect, checkRole as authorize } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

/**
 * GST Configuration (Secure Credential Vault)
 * Only Admins or Super Admins can manage these settings
 */
router.get("/gst-config", protect, authorize("admin", "super_admin"), getGstConfig);
router.post("/gst-config", protect, authorize("admin", "super_admin"), updateGstConfig);

export default router;
