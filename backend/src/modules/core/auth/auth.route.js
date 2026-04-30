import express from "express";
import { register, loginStep1, loginStep2, changePassword, updateProfile, getGlobalCompanyProfile, verifyPassword } from "./auth.controller.js";
import { authMiddleware } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login-step1", loginStep1);
router.post("/login-step2", loginStep2);
router.post("/verify-password", authMiddleware, verifyPassword);
router.post("/change-password", authMiddleware, changePassword);
router.put("/profile", authMiddleware, updateProfile);
router.get("/company-profile", authMiddleware, getGlobalCompanyProfile);

export default router;
