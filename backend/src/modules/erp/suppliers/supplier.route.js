import express from "express";
import { 
  createSupplier, 
  getSuppliers, 
  getSupplierById, 
  updateSupplier, 
  deleteSupplier,
  generateShareToken
} from "./supplier.controller.js";
import { authMiddleware, adminMiddleware } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", adminMiddleware, createSupplier);
router.get("/", getSuppliers);
router.get("/:id", getSupplierById);
router.put("/:id", adminMiddleware, updateSupplier);
router.delete("/:id", adminMiddleware, deleteSupplier);
router.patch("/:id/share-token", generateShareToken);

export default router;
