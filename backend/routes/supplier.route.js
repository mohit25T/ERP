import express from "express";
import { createSupplier, getSuppliers, updateSupplier, deleteSupplier } from "../controllers/supplier.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", adminMiddleware, createSupplier);
router.get("/", getSuppliers);
router.put("/:id", adminMiddleware, updateSupplier);
router.delete("/:id", adminMiddleware, deleteSupplier);

export default router;
