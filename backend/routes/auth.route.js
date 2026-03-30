import express from "express";
import { register, loginStep1, loginStep2 } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login-step1", loginStep1);
router.post("/login-step2", loginStep2);

export default router;