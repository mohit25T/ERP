import express from "express";
import { createProduction, getProductions, deleteProduction } from "../controllers/production.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createProduction);
router.get("/", authMiddleware, getProductions);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduction);

export default router;
