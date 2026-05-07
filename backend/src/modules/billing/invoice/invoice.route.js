import express from "express";
import { 
  createInvoice, 
  finalizeInvoice, 
  getInvoices, 
  downloadInvoicePdf,
  downloadEinvoiceJson,
  downloadEwayBillJson,
  updateEinvoiceDetails,
  updateEwayBillDetails,
  getNextInvoiceNumber,
  deleteInvoice
} from "./invoice.controller.js";
import { authMiddleware } from "../../../shared/middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);


router.get("/next-number", getNextInvoiceNumber);
router.post("/", createInvoice);
router.get("/", getInvoices);
router.patch("/:id/finalize", finalizeInvoice);
router.get("/:id/pdf", downloadInvoicePdf);
router.delete("/:id", deleteInvoice);

// E-Invoice & E-Way Bill JSON Downloads
router.get("/:id/json/einvoice", downloadEinvoiceJson);
router.get("/:id/json/ewaybill", downloadEwayBillJson);

// Manual Govt Detail Updates
router.patch("/:id/einvoice-details", updateEinvoiceDetails);
router.patch("/:id/ewaybill-details", updateEwayBillDetails);

export default router;
