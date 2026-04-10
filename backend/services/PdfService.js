import PDFDocument from "pdfkit";
import fs from "fs";

class PdfService {
  /**
   * Generates a professional Tax Invoice PDF
   */
  static async generateInvoicePdf(invoice, user, customer, stream) {
    const doc = new PDFDocument({ margin: 50 });

    // Stream the PDF to the provided write stream (usually res)
    doc.pipe(stream);

    // --- Header ---
    doc.fontSize(20).text("TAX INVOICE", { align: "center", underline: true });
    doc.moveDown();

    // --- Seller Details ---
    doc.fontSize(12).font("Helvetica-Bold").text(user.companyName || user.name);
    doc.font("Helvetica").fontSize(10).text(user.address);
    doc.text(`State: ${user.state || ""}, Pincode: ${user.pincode || ""}`);
    doc.text(`GSTIN: ${user.gstin || "N/A"}`);
    doc.moveDown();

    // --- Invoice Info ---
    const top = doc.y;
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 400, top);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, top + 15);
    doc.text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}`, 400, top + 30);
    doc.moveDown();

    // --- Bill To ---
    doc.font("Helvetica-Bold").fontSize(11).text("Bill To:", 50, doc.y);
    doc.font("Helvetica").fontSize(10).text(customer.company || customer.name);
    doc.text(customer.address || "");
    doc.text(`GSTIN: ${customer.gstin || "N/A"}`);
    doc.text(`State: ${customer.state || ""}`);
    doc.moveDown();

    // --- Table Headers ---
    const tableTop = doc.y + 10;
    doc.font("Helvetica-Bold");
    doc.text("SN", 50, tableTop);
    doc.text("Description", 80, tableTop);
    doc.text("HSN", 250, tableTop);
    doc.text("Qty", 300, tableTop);
    doc.text("Rate", 350, tableTop);
    doc.text("Tax%", 400, tableTop);
    doc.text("Amount", 480, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // --- Table Rows ---
    let y = tableTop + 25;
    doc.font("Helvetica");
    invoice.items.forEach((item, index) => {
      doc.text(index + 1, 50, y);
      doc.text(item.name.substring(0, 30), 80, y);
      doc.text(item.hsnCode || "-", 250, y);
      doc.text(`${item.quantity} ${item.unit || ""}`, 300, y);
      doc.text(item.price.toLocaleString(), 350, y);
      doc.text(`${item.gstRate}%`, 400, y);
      doc.text(item.totalAmount.toLocaleString(), 480, y);
      y += 20;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 15;

    // --- Summary ---
    doc.font("Helvetica-Bold");
    doc.text("Taxable Value:", 350, y);
    doc.font("Helvetica").text(invoice.taxableAmount.toLocaleString(), 480, y);
    y += 15;

    if (invoice.cgst > 0) {
      doc.text(`CGST:`, 350, y);
      doc.text(invoice.cgst.toLocaleString(), 480, y);
      y += 15;
      doc.text(`SGST:`, 350, y);
      doc.text(invoice.sgst.toLocaleString(), 480, y);
      y += 15;
    } else {
      doc.text(`IGST:`, 350, y);
      doc.text(invoice.igst.toLocaleString(), 480, y);
      y += 15;
    }

    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Total Amount:", 350, y);
    doc.text(`₹ ${invoice.totalAmount.toLocaleString()}`, 480, y);

    // --- Footer ---
    doc.fontSize(10).font("Helvetica-Oblique").text(user.invoiceSettings?.footerText || "", 50, 700, { width: 500, align: "center" });

    doc.end();
  }
}

export default PdfService;
