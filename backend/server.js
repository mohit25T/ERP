import express from "express";
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

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors({
  origin: "https://erp-1-et0w.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE"],
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

// GST MOCK LOOKUP API (For Demonstration)
app.get("/api/gst/lookup/:gstin", (req, res) => {
  const { gstin } = req.params;
  const stateCode = gstin.substring(0, 2);
  
  // Real State Mapping for Demo
  const states = {
    "27": "MAHARASHTRA",
    "07": "DELHI",
    "24": "GUJARAT",
    "29": "KARNATAKA",
    "33": "TAMIL NADU",
    "19": "WEST BENGAL"
  };

  // Simulated Delay for realism
  setTimeout(() => {
    res.json({
      companyName: `MOCK BUSINESS (${gstin}) PVT LTD`,
      address: `Industrial Complex No. ${Math.floor(Math.random() * 100)}, GIDC Area, Block ${gstin.substring(2,5)}`,
      state: states[stateCode] || "OTHER STATE",
      status: "Active"
    });
  }, 800);
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});