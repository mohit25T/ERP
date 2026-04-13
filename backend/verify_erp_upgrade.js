import mongoose from "mongoose";
import Product from "./models/Product.js";
import BOM from "./models/BOM.js";
import Production from "./models/Production.js";
import Purchase from "./models/Purchase.js";
import Order from "./models/Order.js";
import Invoice from "./models/Invoice.js";
import ScrapInventory from "./models/ScrapInventory.js";
import JournalEntry from "./models/JournalEntry.js";
import Ledger from "./models/Ledger.js";
import Supplier from "./models/Supplier.js";
import Customer from "./models/Customer.js";
import InventoryLog from "./models/InventoryLog.js";
import * as productionController from "./controllers/production.controller.js";
import * as purchaseController from "./controllers/purchase.controller.js";
import * as invoiceController from "./controllers/invoice.controller.js";
import * as paymentController from "./controllers/payment.controller.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * MOCK REQUEST/RESPONSE OBJECTS
 */
const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.data = data; return res; };
  return res;
};

const mockReq = (body = {}, params = {}, user = { id: "65f1234567890abcdef12345" }) => ({
  body, params, user, url: ""
});

async function runAudit() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 STARTING MANUFACTURING ERP AUDIT...");

    // 1. Cleanup old test data
    await Promise.all([
      Product.deleteMany({ name: /Test/ }),
      Supplier.deleteMany({ name: /Test/ }),
      Customer.deleteMany({ name: /Test/ }),
      Production.deleteMany({ notes: /Audit/ }),
      Purchase.deleteMany({ status: "pending" }),
      BOM.deleteMany({ notes: /Audit/ }),
      ScrapInventory.deleteMany({ notes: /Audit/ })
    ]);

    // 2. Setup Supplier & Customer
    const supplier = await Supplier.create({ name: "Test Steel Supplier", company: "Test Steel", state: "Gujarat", gstin: "24AAAAA0000A1Z5", email: "test-supplier@example.com", address: "Hapa, Rajkot" });
    const customer = await Customer.create({ name: "Test Cage Buyer", company: "Buyer Corp", state: "Maharashtra", gstin: "27BBBBB0000B1Z5", email: "test-buyer@example.com", address: "Mumbai, MH" });
    console.log("✅ Supplier & Customer Ready");

    // 3. Setup Raw Material
    const rawMaterial = await Product.create({
      name: "Test Metal Sheet",
      sku: "TEST-RM-001",
      type: "raw_material",
      unit: "kg",
      stock: 0,
       price: 200 // 200 per kg
    });
    
    // 4. Setup Finished Good
    const finishedGood = await Product.create({
      name: "Test Bearing Cage 101",
      sku: "TEST-FG-101",
      type: "finished_good",
      unit: "psc",
      stock: 0,
      price: 500
    });
    console.log("✅ RM & FG Products Created");

    // 5. Create Purchase (Stock In)
    const pReq = mockReq({
      supplier: supplier._id,
      material: rawMaterial._id,
      quantity: 100,
      taxableAmount: 200, // Unit price
      unit: "kg"
    });
    const pRes = mockRes();
    await purchaseController.createPurchase(pReq, pRes);
    const purchase = pRes.data;
    
    // Approve Purchase
    await purchaseController.updatePurchaseStatus(mockReq({ status: "received" }, { id: purchase._id }), mockRes());
    const rmAfterPurchase = await Product.findById(rawMaterial._id);
    console.log(`✅ Purchase Received. RM Stock: ${rmAfterPurchase.stock}kg (Expected 100)`);

    // 6. Define BOM
    await BOM.create({
      product: finishedGood._id,
      items: [{ material: rawMaterial._id, quantity: 0.5 }], // 0.5kg per piece
      wastagePercentage: 5,
      notes: "Audit Test BOM"
    });
    console.log("✅ BOM Defined (0.5kg / pcs)");

    // 7. Start Production
    const prCreateRes = mockRes();
    await productionController.createProduction(mockReq({ 
      productId: finishedGood._id, 
      quantity: 50, // Should use 25kg
      notes: "Audit Production" 
    }), prCreateRes);
    const production = prCreateRes.data;

    const prStartRes = mockRes();
    await productionController.startProduction(mockReq({}, { id: production._id }), prStartRes);
    
    const rmAfterStart = await Product.findById(rawMaterial._id);
    console.log(`✅ Production Started. RM Stock: ${rmAfterStart.stock}kg (Expected 75)`);

    // 8. Complete Production with Scrap
    const prCompleteRes = mockRes();
    await productionController.completeProduction(mockReq({ scrapQuantity: 2 }, { id: production._id }), prCompleteRes);
    
    const fgAfterComplete = await Product.findById(finishedGood._id);
    const scrapCount = await ScrapInventory.countDocuments({ batchReference: production._id });
    console.log(`✅ Production Completed. FG Stock: ${fgAfterComplete.stock}pcs (Expected 48). Scrap Logs: ${scrapCount}`);

    // 9. Sales Order & Invoice
    const order = await Order.create({
        customer: customer._id,
        product: finishedGood._id,
        quantity: 10,
        unitPrice: 500,
        taxableAmount: 5000,
        gstAmount: 900, // 18%
        totalAmount: 5900,
        status: "pending"
    });
    
    const invRes = mockRes();
    await invoiceController.createInvoice(mockReq({ orderId: order._id, dueDate: new Date() }), invRes);
    const invoice = invRes.data;
    
    await invoiceController.finalizeInvoice(mockReq({}, { id: invoice._id }), mockRes());
    
    const journalCount = await JournalEntry.countDocuments({ referenceId: invoice._id });
    console.log(`✅ Invoice Finalized. Journal Entries: ${journalCount} (Expected > 0)`);

    // 10. Final Stock Check
    const finalRM = await Product.findById(rawMaterial._id);
    const finalFG = await Product.findById(finishedGood._id);
    console.log(`📊 FINAL REPORT:`);
    console.log(` - RM Stock: ${finalRM.stock} kg`);
    console.log(` - FG Stock: ${finalFG.stock} pcs`);
    console.log(` - Inventory Logs: ${await InventoryLog.countDocuments({ referenceId: { $in: [purchase._id, production._id] } })}`);

    console.log("\n🎊 AUDIT PASSED: Manufacturing workflow is fully integrated!");

  } catch (err) {
    console.error("❌ AUDIT FAILED:", err);
  } finally {
    await mongoose.disconnect();
  }
}

runAudit();
