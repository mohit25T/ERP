import express from "express";
import { createStaff, getStaff, updateStaff, deleteStaff } from "./staff.controller.js";
import { authMiddleware } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getStaff);
router.post("/", authMiddleware, createStaff);
router.put("/:id", authMiddleware, updateStaff);
router.delete("/:id", authMiddleware, deleteStaff);

export default router;
