import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.route.js";
import orderRoutes from "./routes/order.route.js";
import productRoutes from "./routes/product.route.js";
import customerRoutes from "./routes/customer.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import supplierRoutes from "./routes/supplier.route.js";
import purchaseRoutes from "./routes/purchase.route.js";
import paymentRoutes from "./routes/payment.route.js";
import ledgerRoutes from "./routes/ledger.route.js";
import staffRoutes from "./routes/staff.route.js";
import payrollRoutes from "./routes/payroll.route.js";
import reportRoutes from "./routes/reports.route.js";
import publicRoutes from "./routes/public.route.js";
import distanceRoutes from "./routes/distance.route.js";
import productionRoutes from "./routes/production.route.js";
import notificationRoutes from "./routes/notification.route.js";
import invoiceRoutes from "./routes/invoice.route.js";
import bomRoutes from "./routes/bom.route.js";
import inventoryRoutes from "./routes/inventory.route.js";

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors({
  origin: ["https://erp-1-et0w.onrender.com", "https://erp-1i9o.onrender.com", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.send("ERP Backend Running 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/distance", distanceRoutes);
app.use("/api/productions", productionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/boms", bomRoutes);
app.use("/api/inventory", inventoryRoutes);


// REAL GST LOOKUP API (gstincheck.co.in)
app.get("/api/gst/lookup/:gstin", async (req, res) => {
  const { gstin } = req.params;
  const apiKey = process.env.GST_API_KEY;

  if (!apiKey) {
    console.error("[GST LOOKUP]: GST_API_KEY missing from .env");
    return res.status(500).json({ error: "Server Configuration Error: GST API Key not found." });
  }

  try {
    const response = await axios.get(`https://sheet.gstincheck.co.in/check/${apiKey}/${gstin}`);
    const result = response.data;

    if (!result.flag || !result.data) {
      return res.status(404).json({ error: result.message || "GSTIN not found or invalid." });
    }

    const biz = result.data;
    const addr = biz.pradr.addr;

    console.log(`[GST FETCH SUCCESS]: Captured details for ${biz.lgnm || biz.tradeNam}`);
    console.log(`[GST DATA DEBUG]:`, JSON.stringify(biz, null, 2));

    // Combine address parts into a clean string
    const combinedAddress = [
      addr.bnm, addr.bno, addr.flno, addr.st, addr.loc, addr.dst, addr.city
    ].filter(Boolean).join(", ");

    res.json({
      companyName: biz.lgnm || biz.tradeNam,
      address: combinedAddress,
      state: addr.stcd,
      pincode: addr.pncd,
      status: biz.sts
    });
  } catch (err) {
    console.error("[GST LOOKUP ERROR]:", err.message);
    res.status(500).json({ error: "Connectivity error with GST network. Please enter details manually." });
  }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});