import express from "express";
import { getPublicStatement } from "../../analytics/reports/reports.controller.js";

const router = express.Router();

// Public Statement Access (Nexus Connect Portal)
// No auth middleware here as it uses a secure unique shareToken
router.get("/ledger/:token", getPublicStatement);

export default router;
