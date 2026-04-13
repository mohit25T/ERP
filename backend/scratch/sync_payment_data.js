import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/Order.js";
import Ledger from "../models/Ledger.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function syncMismatchedOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for self-healing...");

    const orders = await Order.find({ status: { $ne: "cancelled" } });
    let fixedCount = 0;

    for (const order of orders) {
      const ledgerEntries = await Ledger.find({ order: order._id, type: "income" });
      const totalActuallyPaid = ledgerEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

      if (Math.abs(order.amountPaid - totalActuallyPaid) > 0.01) {
        console.log(`Mismatch found for Order ${order._id}: DB says ₹${order.amountPaid}, Ledger says ₹${totalActuallyPaid}`);
        
        order.amountPaid = totalActuallyPaid;
        if (order.amountPaid >= order.totalAmount - 0.1) {
          order.paymentStatus = "paid";
        } else if (order.amountPaid > 0) {
          order.paymentStatus = "partial";
        } else {
          order.paymentStatus = "unpaid";
        }
        
        await order.save();
        fixedCount++;
      }
    }

    console.log(`Self-healing complete. Corrected ${fixedCount} orders.`);
    process.exit(0);
  } catch (err) {
    console.error("Healing failed:", err);
    process.exit(1);
  }
}

syncMismatchedOrders();
