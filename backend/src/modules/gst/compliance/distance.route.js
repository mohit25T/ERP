import express from "express";
import { getDistance } from "./distance.controller.js";
import { authMiddleware } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.get("/fetch", authMiddleware, getDistance);

export default router;
