import express from "express";
import { createPayroll, getPayrollEntries, paySalary, deletePayroll } from "./payroll.controller.js";
import { authMiddleware } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getPayrollEntries);
router.post("/", authMiddleware, createPayroll);
router.put("/:id/pay", authMiddleware, paySalary);
router.delete("/:id", authMiddleware, deletePayroll);

export default router;
