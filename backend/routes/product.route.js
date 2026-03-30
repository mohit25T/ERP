import express from "express";
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Routes
router.route("/")
  .get(authMiddleware, getProducts)
  .post(authMiddleware, adminMiddleware, createProduct);

router.route("/:id")
  .put(authMiddleware, adminMiddleware, updateProduct)
  .delete(authMiddleware, adminMiddleware, deleteProduct);

export default router;
