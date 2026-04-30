import express from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  dispatchOrder,
} from "./order.controller.js";

import { authMiddleware, adminMiddleware } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getOrders);
router.put("/:id/status", authMiddleware, adminMiddleware, updateOrderStatus);
router.patch("/:id/dispatch", authMiddleware, adminMiddleware, dispatchOrder);
router.put("/:id", authMiddleware, adminMiddleware, updateOrder);
router.delete("/:id", authMiddleware, adminMiddleware, deleteOrder);

export default router;
