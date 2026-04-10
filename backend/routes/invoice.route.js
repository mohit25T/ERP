import express from "express";
import { 
  createInvoice, 
  finalizeInvoice, 
  getInvoices, 
  downloadInvoicePdf 
} from "../controllers/invoice.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);



router.post("/", createInvoice);
router.get("/", getInvoices);
router.patch("/:id/finalize", finalizeInvoice);
router.get("/:id/pdf", downloadInvoicePdf);

export default router;
