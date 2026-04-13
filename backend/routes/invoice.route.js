import express from "express";
import { 
  createInvoice, 
  finalizeInvoice, 
  getInvoices, 
  downloadInvoicePdf,
  downloadEinvoiceJson,
  downloadEwayBillJson,
  updateEinvoiceDetails,
  updateEwayBillDetails
} from "../controllers/invoice.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);



router.post("/", createInvoice);
router.get("/", getInvoices);
router.patch("/:id/finalize", finalizeInvoice);
router.get("/:id/pdf", downloadInvoicePdf);

// E-Invoice & E-Way Bill JSON Downloads
router.get("/:id/json/einvoice", downloadEinvoiceJson);
router.get("/:id/json/ewaybill", downloadEwayBillJson);

// Manual Govt Detail Updates
router.patch("/:id/einvoice-details", updateEinvoiceDetails);
router.patch("/:id/ewaybill-details", updateEwayBillDetails);

export default router;
