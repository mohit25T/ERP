import express from "express";
import { getDistance } from "../controllers/distance.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/fetch", authMiddleware, getDistance);

export default router;
