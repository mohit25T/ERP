import express from "express";
import { 
  createInvoice, 
  finalizeInvoice, 
  getInvoices, 
  downloadInvoicePdf 
} from "../controllers/invoice.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createInvoice);
router.get("/", getInvoices);
router.patch("/:id/finalize", finalizeInvoice);
router.get("/:id/pdf", downloadInvoicePdf);

export default router;
