import express from "express";
import { getNotifications, markAsRead, markAllAsRead } from "./notification.controller.js";
import { authMiddleware as auth } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.get("/", auth, getNotifications);
router.patch("/read-all", auth, markAllAsRead);
router.patch("/:id/read", auth, markAsRead);

export default router;
