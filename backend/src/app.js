import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";

// Import Middlewares
import checkPlan from "./shared/middleware/plan.middleware.js";
import errorHandler from "./shared/middleware/error.middleware.js";

// Core routes
import authRoutes from "./modules/core/auth/auth.route.js";
import dashboardRoutes from "./modules/core/dashboard/dashboard.route.js";
import staffRoutes from "./modules/core/users/staff.route.js";
import notificationRoutes from "./modules/core/notifications/notification.route.js";

// ERP routes
import orderRoutes from "./modules/erp/orders/order.route.js";
import productRoutes from "./modules/erp/products/product.route.js";
import customerRoutes from "./modules/erp/customers/customer.route.js";
import supplierRoutes from "./modules/erp/suppliers/supplier.route.js";
import purchaseRoutes from "./modules/erp/purchasing/purchase.route.js";
import distanceRoutes from "./modules/gst/compliance/distance.route.js";
import productionRoutes from "./modules/erp/production/production.route.js";
import bomRoutes from "./modules/erp/production/bom.route.js";
import inventoryRoutes from "./modules/erp/inventory/inventory.route.js";

// Billing routes
import paymentRoutes from "./modules/billing/payments/payment.route.js";
import ledgerRoutes from "./modules/billing/ledger/ledger.route.js";
import payrollRoutes from "./modules/billing/payroll/payroll.route.js";
import invoiceRoutes from "./modules/billing/invoice/invoice.route.js";
import publicRoutes from "./modules/billing/invoice/public.route.js";

// GST routes
import complianceRoutes from "./modules/gst/compliance/compliance.route.js";

// Analytics routes
import reportRoutes from "./modules/analytics/reports/reports.route.js";
import auditRoutes from "./modules/analytics/audit/audit.route.js";
import biRoutes from "./modules/analytics/bi/bi.route.js";
import treasuryRoutes from "./modules/treasury/treasury.route.js";

// Services
import UnitService from "./modules/erp/products/UnitService.js";

connectDB();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Absolute Preflight Termination (Must be BEFORE CORS)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-financial-key');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }
  next();
});

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-financial-key"],
  credentials: true
}));

// Global Request Logger
app.use((req, res, next) => {
  console.log(`[ERP NETWORK] ${req.method} ${req.url} from ${req.headers.origin || 'Direct'}`);
  next();
});

app.get("/", (req, res) => {
  res.send("ERP Backend Running 🚀");
});

// Health Check Route (Static - No DB required for reachability test)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), db: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected" });
});

// REAL GST LOOKUP API (gstincheck.co.in)
app.get("/api/v1/gst/lookup/:gstin", checkPlan(['ERP_BILLING']), async (req, res, next) => {
  const { gstin } = req.params;
  const apiKey = process.env.GST_API_KEY;

  if (!apiKey) {
    console.error("[GST LOOKUP]: GST_API_KEY missing from .env");
    return next(new Error("Server Configuration Error: GST API Key not found."));
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
    next(new Error("Connectivity error with GST network. Please enter details manually."));
  }
});


// Define API v1 Router
const apiV1 = express.Router();

// --- Core Modules ---
apiV1.use("/auth", authRoutes);
apiV1.use("/dashboard", dashboardRoutes);
apiV1.use("/staff", staffRoutes);
apiV1.use("/notifications", notificationRoutes);

// --- ERP Modules (Available to ERP_BASIC and above) ---
apiV1.use("/orders", orderRoutes);
apiV1.use("/products", productRoutes);
apiV1.use("/customers", customerRoutes);
apiV1.use("/suppliers", supplierRoutes);
apiV1.use("/purchases", purchaseRoutes);
apiV1.use("/productions", productionRoutes);
apiV1.use("/boms", bomRoutes);
apiV1.use("/inventory", inventoryRoutes);

// --- Billing Modules (Requires ERP_BILLING) ---
const billingMiddleware = checkPlan(['ERP_BILLING']);
apiV1.use("/payments", billingMiddleware, paymentRoutes);
apiV1.use("/ledger", billingMiddleware, ledgerRoutes);
apiV1.use("/payroll", billingMiddleware, payrollRoutes);
apiV1.use("/invoices", billingMiddleware, invoiceRoutes);
apiV1.use("/public", publicRoutes); // Assuming public routes shouldn't be locked by plan

// --- GST Modules (Requires ERP_BILLING) ---
apiV1.use("/distance", billingMiddleware, distanceRoutes);
apiV1.use("/compliance", billingMiddleware, complianceRoutes);

// --- Analytics Modules ---
apiV1.use("/reports", reportRoutes);
apiV1.use("/audit", auditRoutes);
apiV1.use("/bi", biRoutes);
apiV1.use("/treasury", treasuryRoutes);

// Mount API v1
app.use("/api/v1", apiV1);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await UnitService.seedDefaultUnits();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[MIRACLE ERP] Core Intel Server active on port ${PORT}`);
      console.log(`[NETWORK] Local: http://localhost:${PORT}`);
      console.log(`[NETWORK] Loopback: http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error("[CRITICAL SHUTDOWN]: Database synchronization failed.", err.message);
    process.exit(1);
  }
};

startServer();
