import PDFDocument from "pdfkit";
import axios from "axios";
import sharp from "sharp";

class PdfService {
  /**
   * Helper to fetch image buffer from URL or base64
   * Converts all incoming images to PNG using sharp for PDFKit compatibility
   */
  static async fetchImageBuffer(url) {
    if (!url) return null;
    try {
      let buffer;
      if (url.startsWith("data:image")) {
        const [header, base64Data] = url.split(",");
        buffer = Buffer.from(base64Data, "base64");
      } else {
        const response = await axios.get(url, { responseType: "arraybuffer", timeout: 5000 });
        buffer = Buffer.from(response.data);
      }

      if (!buffer) return null;

      // Convert any format (AVIF, SVG, WebP, etc.) to PNG for PDFKit
      const pngBuffer = await sharp(buffer)
        .png()
        .toBuffer();

      return pngBuffer;
    } catch (err) {
      console.error("[PDF IMAGE PROCESSING ERROR]:", err.message);
      // Fallback: If sharp conversion fails, return original buffer and let PDFKit try its best
      // or return null if it was likely an unsupported format that sharp also couldn't handle
      return null;
    }
  }

  /**
   * Converts numbers to Indian English Words (Lakh/Crore system)
   */
  static numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
      if ((n = n.toString()).length > 9) return 'Overflow';
      let n_arr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n_arr) return '';
      let str = '';
      str += n_arr[1] != 0 ? (a[Number(n_arr[1])] || b[n_arr[1][0]] + ' ' + a[n_arr[1][1]]) + 'Crore ' : '';
      str += n_arr[2] != 0 ? (a[Number(n_arr[2])] || b[n_arr[2][0]] + ' ' + a[n_arr[2][1]]) + 'Lakh ' : '';
      str += n_arr[3] != 0 ? (a[Number(n_arr[3])] || b[n_arr[3][0]] + ' ' + a[n_arr[3][1]]) + 'Thousand ' : '';
      str += n_arr[4] != 0 ? (a[Number(n_arr[4])] || b[n_arr[4][0]] + ' ' + a[n_arr[4][1]]) + 'Hundred ' : '';
      str += n_arr[5] != 0 ? ((str != '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) : '';
      return str.trim() + ' Rupees Only';
    };

    const parts = num.toFixed(2).split('.');
    const amt = parseInt(parts[0]);
    const paisa = parseInt(parts[1]);

    let finalStr = inWords(amt);
    if (paisa > 0) {
      finalStr = finalStr.replace(' Only', '') + ' and ' + inWords(paisa).replace(' Only', '') + ' Paisa Only';
    }
    return finalStr;
  }

  /**
   * Generates a professional Tax Invoice PDF
   */
  static async generateInvoicePdf(invoice, user, customer, stream) {
    const doc = new PDFDocument({ margin: 20, size: "A4" });
    doc.pipe(stream);

    const margin = 20;
    const pageWidth = 595.28; // Standard A4 width in points
    const pageHeight = 841.89; // Standard A4 height in points
    const contentWidth = pageWidth - (margin * 2);

    // Helpers for drawing grid
    const drawBox = (x, y, w, h) => doc.rect(x, y, w, h).stroke();
    const vLine = (x, y1, y2) => doc.moveTo(x, y1).lineTo(x, y2).stroke();
    const hLine = (y, x1, x2) => doc.moveTo(x1, y).lineTo(x2, y).stroke();

    doc.lineWidth(0.5);

    // Add Logo as global centered watermark if exists and enabled
    if (user.companyLogo && user.invoiceSettings?.showLogo !== false) {
      const logoBuffer = await this.fetchImageBuffer(user.companyLogo);
      if (logoBuffer) {
        try {
          const meta = await sharp(logoBuffer).metadata();
          const imgWidth = meta.width || 300;
          const imgHeight = meta.height || 300;

          // Scale down if image is too large for the page
          let scale = 1;
          const maxW = contentWidth * 0.8;
          const maxH = pageHeight * 0.5;
          if (imgWidth > maxW || imgHeight > maxH) {
            scale = Math.min(maxW / imgWidth, maxH / imgHeight);
          }

          const renderW = imgWidth * scale;
          const renderH = imgHeight * scale;

          doc.save();
          doc.opacity(0.5); // User requested 0.5 opacity for the watermark
          doc.image(logoBuffer, (pageWidth - renderW) / 2, (pageHeight - renderH) / 2, {
            width: renderW,
            height: renderH
          });
        } catch (err) {
          console.warn("Global watermark rendering failed:", err.message);
        } finally {
          doc.restore(); // CRITICAL: Always restore opacity to 1.0 for the rest of the text
        }
      }
    }

    // --- Header Section ---
    let headerH = 70;
    const hasLogo = user.companyLogo && user.invoiceSettings?.showLogo !== false;
    // if (hasLogo) headerH = 110;

    drawBox(margin, 20, contentWidth, headerH);

    let currentHeaderY = 32;

    // if (hasLogo) {
    //   const headerLogoBuffer = await this.fetchImageBuffer(user.companyLogo);
    //   if (headerLogoBuffer) {
    //     try {
    //       // Center the logo above the name
    //       doc.image(headerLogoBuffer, (pageWidth - 60) / 2, 25, { height: 45 });
    //       currentHeaderY = 75; // Push text down to make room for logo
    //     } catch (err) {
    //       console.warn("Header logo rendering failed:", err.message);
    //     }
    //   }
    // }

    doc.fontSize(16).font("Helvetica-Bold").text(user.companyName || user.name, margin, currentHeaderY, { align: "center", width: contentWidth });
    doc.fontSize(8).font("Helvetica").text(user.address || "", margin, currentHeaderY + 18, { align: "center", width: contentWidth });
    doc.text(`PH: ${user.mobile || ""} EMAIL: ${user.email || ""}`, margin, currentHeaderY + 30, { align: "center", width: contentWidth });

    // --- E-Invoice Info (IRN/Ack) ---
    let currentY = 20 + headerH + 5;
    drawBox(margin, currentY, contentWidth, 50);
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("IRN No.:", margin + 5, currentY + 5);
    doc.text("Ack No.:", margin + 5, currentY + 20);
    doc.text("Ack Date:", margin + 5, currentY + 35);

    doc.font("Helvetica");
    const einvoice = invoice.einvoice || {};
    doc.text(einvoice.irn || "Not Generated", margin + 60, currentY + 5);
    doc.text(einvoice.ackNo || "Not Generated", margin + 60, currentY + 20);
    doc.text(invoice.finalizedAt ? new Date(invoice.finalizedAt).toLocaleString("en-GB") : "Not Finalized", margin + 60, currentY + 35);

    // Optional QR Code
    if (einvoice.qrCodeUrl) {
      try {
        // Drawing QR code on the right side of the IRN box
        doc.image(einvoice.qrCodeUrl, margin + contentWidth - 45, currentY + 5, { width: 40 });
      } catch (err) {
        console.warn("QR Code image failed to load:", err.message);
      }
    }

    // --- Invoice Type Header ---
    currentY += 50;
    drawBox(margin, currentY, contentWidth, 15);
    doc.fontSize(7).font("Helvetica-Bold");
    doc.text("Debit Memo", margin + 5, currentY + 4);
    doc.fontSize(10).text("TAX INVOICE", margin, currentY + 3, { align: "center", width: contentWidth });
    doc.fontSize(7).text("Original", margin + contentWidth - 40, currentY + 4);

    // --- Party Details & Specs Box ---
    currentY += 15;
    const splitX = margin + (contentWidth * 0.6);
    drawBox(margin, currentY, contentWidth, 100);
    vLine(splitX, currentY, currentY + 100);

    // Bill To
    doc.fontSize(8).font("Helvetica-Bold").text("M/s.:", margin + 5, currentY + 5);
    doc.fontSize(10).text(customer.company || customer.name, margin + 45, currentY + 5, { width: (splitX - margin) - 50 });
    doc.fontSize(8).font("Helvetica").text(customer.address || "", margin + 45, currentY + 20, { width: (splitX - margin) - 50 });
    doc.fontSize(9).font("Helvetica-Bold").text(`${customer.state?.toUpperCase() || ""} - ${customer.pincode || ""}`, margin + 45, currentY + 65);

    doc.fontSize(8).text("Place of Supply:", margin + 5, currentY + 80);
    doc.font("Helvetica").text(customer.state || "", margin + 75, currentY + 80);
    doc.font("Helvetica-Bold").text("GSTIN No. :", margin + 5, currentY + 90);
    doc.font("Helvetica").text(customer.gstin || "URD", margin + 75, currentY + 90);

    // Invoice Meta
    const rMargin = splitX + 5;
    const rValPos = splitX + 70;
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("Invoice No. :", rMargin, currentY + 5);
    doc.font("Helvetica").text(invoice.invoiceNumber, rValPos, currentY + 5);

    doc.font("Helvetica-Bold").text("Date :", rMargin, currentY + 18);
    doc.font("Helvetica").text(new Date(invoice.createdAt).toLocaleDateString("en-IN"), rValPos, currentY + 18);

    hLine(currentY + 35, splitX, margin + contentWidth);

    const eway = invoice.ewayBill || {};
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("EWB No.", rMargin, currentY + 40);
    doc.font("Helvetica").text(`: ${eway.ewayBillNo || "."}`, rValPos - 20, currentY + 40);

    doc.font("Helvetica-Bold").text("EWB Date", rMargin, currentY + 55);
    doc.font("Helvetica").text(`: ${eway.ewbDate ? new Date(eway.ewbDate).toLocaleDateString("en-GB") : "/ /"}`, rValPos - 20, currentY + 55);

    doc.font("Helvetica-Bold").text("Valid Until", rMargin, currentY + 70);
    doc.font("Helvetica").text(`: ${eway.validityDate ? new Date(eway.validityDate).toLocaleDateString("en-GB") : "/ /"}`, rValPos - 20, currentY + 70);

    doc.font("Helvetica-Bold").text("Vehicle No.", rMargin, currentY + 85);
    doc.font("Helvetica").text(`: ${eway.vehicleNo || "."}`, rValPos - 20, currentY + 85);

    // --- Items Grid ---
    currentY += 100;
    const tableHeaderY = currentY;
    const tableHeight = 350;
    drawBox(margin, currentY, contentWidth, tableHeight);
    hLine(currentY + 20, margin, margin + contentWidth);

    const cols = {
      sn: { x: margin, w: 25, label: "SrNo" },
      desc: { x: margin + 25, w: 215, label: "Description" },
      hsn: { x: margin + 240, w: 45, label: "HSN/SAC" },
      qty: { x: margin + 285, w: 50, label: "Qty" },
      unit: { x: margin + 335, w: 35, label: "Unit" },
      rate: { x: margin + 370, w: 60, label: "Rate" },
      gst: { x: margin + 430, w: 40, label: "GST %" },
      amt: { x: margin + 470, w: contentWidth - 470, label: "Amount" }
    };

    doc.fontSize(8).font("Helvetica-Bold");
    Object.values(cols).forEach(c => {
      doc.text(c.label, c.x, tableHeaderY + 6, { width: c.w, align: "center" });
      if (c.x > margin) vLine(c.x, tableHeaderY, tableHeaderY + tableHeight);
    });

    let itemY = tableHeaderY + 25;
    doc.font("Helvetica").fontSize(8);
    invoice.items.forEach((item, i) => {
      doc.text(i + 1, cols.sn.x, itemY, { width: cols.sn.w, align: "center" });
      doc.text(item.name, cols.desc.x + 5, itemY, { width: cols.desc.w - 10 });
      doc.text(item.hsnCode || "", cols.hsn.x, itemY, { width: cols.hsn.w, align: "center" });
      doc.text(item.quantity.toFixed(3), cols.qty.x, itemY, { width: cols.qty.w, align: "center" });
      doc.text((item.unit || "pcs").toUpperCase(), cols.unit.x, itemY, { width: cols.unit.w, align: "center" });
      doc.text(item.price.toFixed(2), cols.rate.x, itemY, { width: cols.rate.w, align: "right" });
      doc.text(`${item.gstRate}%`, cols.gst.x, itemY, { width: cols.gst.w, align: "center" });
      doc.text(item.totalAmount.toFixed(2), cols.amt.x - 5, itemY, { width: cols.amt.w, align: "right" });
      itemY += 15;
    });

    // --- Footer Grid ---
    currentY = tableHeaderY + tableHeight;
    const footerH = 100;
    drawBox(margin, currentY, contentWidth, footerH);
    vLine(splitX, currentY, currentY + 85);

    hLine(currentY + 15, margin, margin + contentWidth);
    hLine(currentY + 45, margin, margin + contentWidth);
    hLine(currentY + 70, margin, margin + contentWidth);
    hLine(currentY + 85, margin, margin + contentWidth);

    doc.fontSize(8).font("Helvetica-Bold");
    doc.text(`GSTIN No.: ${user.gstin || ""}`, margin + 5, currentY + 4);
    const totalQty = invoice.items.reduce((s, it) => s + (it.quantity || 0), 0);
    doc.text(totalQty.toFixed(3), cols.qty.x, currentY + 4, { width: cols.qty.w, align: "center" });
    doc.text("Sub Total", splitX + 5, currentY + 4);
    doc.text(invoice.taxableAmount.toFixed(2), margin + contentWidth - 85, currentY + 4, { width: 80, align: "right" });

    const bank = user.bankDetails || {};
    doc.fontSize(7).font("Helvetica");
    doc.text(`Bank Name      : ${bank.bankName}`, margin + 5, currentY + 18);
    doc.text(`Branch Name    : ${bank.branchName}`, margin + 5, currentY + 25);
    doc.text(`Bank A/c. No.  : ${bank.accountNumber}`, margin + 5, currentY + 32);
    doc.text(`RTGS/IFSC Code : ${bank.ifscCode}`, margin + 5, currentY + 39);

    doc.fontSize(8).font("Helvetica-Bold").text("Taxable Amount", splitX + 5, currentY + 18);
    doc.font("Helvetica").text(invoice.taxableAmount.toFixed(2), margin + contentWidth - 85, currentY + 18, { width: 80, align: "right" });

    if (invoice.cgst > 0) {
      doc.text("CGST", splitX + 5, currentY + 28);
      doc.text("9%", splitX + 60, currentY + 28);
      doc.text(invoice.cgst.toFixed(2), margin + contentWidth - 85, currentY + 28, { width: 80, align: "right" });
      doc.text("SGST", splitX + 5, currentY + 38);
      doc.text("9%", splitX + 60, currentY + 38);
      doc.text(invoice.sgst.toFixed(2), margin + contentWidth - 85, currentY + 38, { width: 80, align: "right" });
    } else {
      doc.text("IGST", splitX + 5, currentY + 28);
      doc.text("18%", splitX + 60, currentY + 28);
      doc.text(invoice.igst.toFixed(2), margin + contentWidth - 85, currentY + 28, { width: 80, align: "right" });
    }

    doc.fontSize(7).font("Helvetica-Bold").text("Total GST :", margin + 5, currentY + 48);
    doc.font("Helvetica-Oblique").text(this.numberToWords(invoice.gstAmount), margin + 55, currentY + 48);

    doc.font("Helvetica-Bold").text("Bill Amount :", margin + 5, currentY + 58);
    doc.font("Helvetica-Oblique").text(this.numberToWords(invoice.totalAmount), margin + 55, currentY + 58);

    doc.fontSize(10).font("Helvetica-Bold").text("Grand Total", splitX + 5, currentY + 87);
    doc.fontSize(11).text(invoice.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 }), margin + contentWidth - 105, currentY + 87, { width: 100, align: "right" });

    // --- Signature Area ---
    currentY += 100;
    drawBox(margin, currentY, contentWidth, 60);
    vLine(splitX, currentY, currentY + 60);
    doc.fontSize(8).font("Helvetica-Bold").text(`For, ${user.companyName?.toUpperCase() || user.name.toUpperCase()}`, splitX, currentY + 5, { align: "center", width: contentWidth - (splitX - margin) });
    doc.fontSize(7).text("(Authorised Signatory)", splitX, currentY + 50, { align: "center", width: contentWidth - (splitX - margin) });

    doc.end();
  }
}

export default PdfService;
