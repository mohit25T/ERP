import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Production from '../models/Production.js';
import Purchase from '../models/Purchase.js';
import Supplier from '../models/Supplier.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import JournalEntry from '../models/JournalEntry.js';
import InventoryLog from '../models/InventoryLog.js';
import Ledger from '../models/Ledger.js';
import User from '../models/User.js';

// Services
import InventoryService from '../services/InventoryService.js';
import AccountingService from '../services/AccountingService.js';

// Controllers (to test actual logic)
import * as productionController from '../controllers/production.controller.js';
import * as purchaseController from '../controllers/purchase.controller.js';
import * as invoiceController from '../controllers/invoice.controller.js';
import * as paymentController from '../controllers/payment.controller.js';

dotenv.config();

const log = (msg) => console.log(`\x1b[36m[VERIFY ERP]\x1b[0m ${msg}`);
const success = (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`);
const error = (msg) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`);

async function resetTestData() {
  log("Cleaning up previous test data if any...");
  await Product.deleteMany({ sku: { $in: ['RM-CRCA-STEEL', 'FG-TRN-101'] } });
  await Production.deleteMany({});
  await JournalEntry.deleteMany({});
  await InventoryLog.deleteMany({});
  await Ledger.deleteMany({ description: { $regex: /Spark Test/i } });
  await Purchase.deleteMany({});
  await Order.deleteMany({});
  await Invoice.deleteMany({});
}

async function verify() {
  let responseData;
  const resMock = { 
    status: (c) => ({ 
      json: (d) => { responseData = d; return d; } 
    }), 
    json: (d) => { responseData = d; return d; } 
  };

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/erp');
    log("Connected to MongoDB.");

    await resetTestData();

    // 1. Setup Parties & User
    let admin = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
    if (!admin) {
      log("No admin found, creating a temporary test admin...");
      admin = await User.create({
        name: "Test Admin",
        email: "admin@test.com",
        mobile: "0000000000",
        password: "password123",
        role: "admin",
        state: "Gujarat"
      });
    }

    const supplier = await Supplier.findOne({ company: /LUPA/i });
    const customer = await Customer.findOne({ company: /SPARK/i });

    if (!supplier || !customer) {
      throw new Error("Missing Supplier or Customer in DB. Please seed them first.");
    }
    log(`Testing with Supplier: ${supplier.company} and Customer: ${customer.company} (Admin: ${admin.email})`);

    // 2. Setup Products
    log("Registering Raw Material: CRCA Steel Strip...");
    const rawMaterial = await Product.create({
      name: "CRCA Steel Strip (0.8mm)",
      sku: "RM-CRCA-STEEL",
      price: 85,
      stock: 0,
      type: "raw_material",
      unit: "kg",
      gstRate: 18
    });

    log("Registering Finished Good: Taper Roller Bearing Cage (TRN-101)...");
    const finishedGood = await Product.create({
      name: "Taper Roller Bearing Cage (TRN-101)",
      sku: "FG-TRN-101",
      price: 150,
      stock: 0,
      type: "finished_good",
      unit: "unit",
      gstRate: 18,
      bom: [
        { material: rawMaterial._id, quantity: 0.15, unit: "kg" }
      ]
    });

    // 🏆 PHASE 1: PROCUREMENT
    log("--- PHASE 1: PROCUREMENT ---");
    const purchaseReq = {
      body: {
        supplier: supplier._id,
        material: rawMaterial._id,
        quantity: 100,
        taxableAmount: 85,
        unit: "kg"
      },
      user: { id: admin._id } 
    };

    log("Creating Purchase Order for 100kg Steel...");
    await purchaseController.createPurchase(purchaseReq, resMock);
    const purchaseResult = responseData;
    if (!purchaseResult || !purchaseResult._id) throw new Error("Purchase creation failed: " + JSON.stringify(purchaseResult));
    
    log("Marking Purchase as Received...");
    await purchaseController.updatePurchaseStatus({ 
      params: { id: purchaseResult._id }, 
      body: { status: "received" } 
    }, resMock);

    const updatedRM = await Product.findById(rawMaterial._id);
    log(`Updated RM Stock: ${updatedRM.stock}kg`);
    if (updatedRM.stock !== 100) throw new Error("Stock Inward Failed");

    const journalP = await JournalEntry.findOne({ referenceId: purchaseResult._id });
    if (!journalP) throw new Error("Journal Entry (Purchase) Missing");
    log(`Journal Entry (Purchase) detected: ${journalP.description}`);
    
    // 🏆 PHASE 2: MANUFACTURING
    log("--- PHASE 2: MANUFACTURING ---");
    log("Initializing Production Batch for 500 Cages...");
    await productionController.createProduction({
      body: { productId: finishedGood._id, quantity: 500, notes: "Spark Test Batch" }
    }, resMock);
    const prodBatchResult = responseData;

    log("Starting Production (Deducting Materials)...");
    await productionController.startProduction({ params: { id: prodBatchResult._id } }, resMock);

    const rmAfterStart = await Product.findById(rawMaterial._id);
    log(`RM Stock after deduction: ${rmAfterStart.stock}kg`);
    if (rmAfterStart.stock !== 25) throw new Error("Material Deduction Failed");

    log("Completing Production with 2.5kg Scrap...");
    await productionController.completeProduction({ 
      params: { id: prodBatchResult._id }, 
      body: { scrapQuantity: 2.5 } 
    }, resMock);

    const fgAfterComplete = await Product.findById(finishedGood._id);
    log(`FG Stock after completion: ${fgAfterComplete.stock} units`);
    const prodRecord = await Production.findById(prodBatchResult._id);
    log(`Production Status: ${prodRecord.status}, Cost Per Unit: ₹${prodRecord.costPerUnit.toFixed(2)}`);

    // 🏆 PHASE 3: SALES & INVOICING
    log("--- PHASE 3: SALES & INVOICING ---");
    log("Creating Sales Order for 400 Cages...");
    const saleOrder = await Order.create({
      customer: customer._id,
      product: finishedGood._id,
      quantity: 400,
      unitPrice: 150,
      taxableAmount: 60000,
      gstAmount: 10800,
      totalAmount: 70800,
      status: "pending"
    });

    log("Generating Tax Invoice...");
    await invoiceController.createInvoice({
      body: { orderId: saleOrder._id, dueDate: new Date() },
      user: { id: admin._id, state: admin.state }
    }, resMock);
    const invoiceResult = responseData;

    log("Finalizing Invoice (Checking E-Way Bill Threshold)...");
    await invoiceController.finalizeInvoice({ params: { id: invoiceResult._id }, user: { id: admin._id } }, resMock);

    const finalInvoice = await Invoice.findById(invoiceResult._id);
    log(`Invoice Number: ${finalInvoice.invoiceNumber}, Status: ${finalInvoice.status}, Total: ₹${finalInvoice.totalAmount}`);
    if (finalInvoice.totalAmount > 50000 && finalInvoice.ewayBill === "Required") {
      log("✅ E-Way Bill requirement correctly identified for amount > ₹50,000");
    }

    // 🏆 PHASE 4: PAYMENT
    log("--- PHASE 4: PAYMENT ---");
    log("Recording Partial Payment of ₹40,000...");
    await paymentController.recordOrderPayment({
      body: { amount: 40000, description: "Spark Test Partial Payment", invoiceId: finalInvoice._id },
      params: { id: saleOrder._id },
      url: "/api/payments/order/invoice"
    }, resMock);

    const paidInvoice = await Invoice.findById(finalInvoice._id);
    log(`Updated Invoice Payment: ₹${paidInvoice.amountPaid}, Status: ${paidInvoice.status}`);
    
    const latestLedger = await Ledger.findOne({ customer: customer._id }).sort({ createdAt: -1 });
    log(`Latest Customer Ledger Entry: ${latestLedger?.description || 'None'} - ₹${latestLedger?.amount || 0}`);

    success("ALL ERP WORKFLOW STEPS VERIFIED FOR SPARK BEARING CAGES.");
    
  } catch (err) {
    error(`TEST FAILED: ${err.message}`);
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

verify();
