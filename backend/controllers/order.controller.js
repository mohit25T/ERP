import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Notification from "../models/Notification.js";
import InventoryService from "../services/InventoryService.js";
import AccountingService from "../services/AccountingService.js";

// Create Order
export const createOrder = async (req, res) => {
  try {
    const { customer, product, quantity, unit, price, dueDate, ewayBillData, saleType } = req.body;

    // TAX CALCULATION (GST)
    const adminUser = await User.findById(req.user.id);
    const orderCustomer = await Customer.findById(customer);
    const existingProduct = await Product.findById(product);
    
    if (!existingProduct) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Use price override from frontend if available, fallback to DB price
    const unitPrice = (price !== undefined && price !== null) ? Number(price) : (existingProduct.price || 0);
    const taxableAmount = (unitPrice || 0) * (Number(quantity) || 0);
    const gstRate = existingProduct.gstRate || 18;
    const gstAmount = (taxableAmount * gstRate) / 100;
    const totalAmount = (taxableAmount + gstAmount) || 0;

    // 🛑 PROACTIVE STOCK CHECK REMOVED: Allow demand tracking even if stock is 0.

    // E-Way Bill Requirement Alert (> 50,000)
    if (totalAmount > 50000 && (!ewayBillData || !ewayBillData.active)) {
      console.warn(`[ERP WARNING] Order created above ₹50,000 without E-Way Bill data. ID: ${customer}`);
    }

    let cgst = 0, sgst = 0, igst = 0;

    // Check for Intra-state (CGST+SGST) or Inter-state (IGST)
    const adminState = adminUser?.state?.trim().toLowerCase() || "";
    const customerState = orderCustomer?.state?.trim().toLowerCase() || "";

    if (adminState && customerState && adminState === customerState) {
      cgst = gstAmount / 2;
      sgst = gstAmount / 2;
    } else {
      igst = gstAmount;
    }

    const order = await Order.create({
      customer,
      product,
      quantity,
      unit,
      unitPrice,
      taxableAmount,
      gstAmount,
      totalAmount,
      cgst,
      sgst,
      igst,
      hsnCode: existingProduct.hsnCode,
      customerGstin: orderCustomer?.gstin || "",
      dueDate,
      ewayBillData: ewayBillData || { active: false },
      saleType: saleType || "yield"
    });

    // NOTIFICATION TRIGGERS (Non-blocking side-effect)
    if (adminUser?.notificationSettings?.newOrder) {
      Notification.create({
        user: adminUser._id,
        title: "New Sales Order",
        message: `Order #${order._id.toString().substring(18)} generated for ${orderCustomer?.name} (₹${totalAmount.toLocaleString()})`,
        type: "info",
        link: "/orders"
      }).catch(err => console.error("[ERP WARNING] Notification failed:", err.message));
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Order (Mistake Correction)
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer, product, quantity, unit, price, dueDate, ewayBillData } = req.body;

    const existingOrder = await Order.findById(id);
    if (!existingOrder) return res.status(404).json({ msg: "Order not found" });

    // Lock updates if already invoiced or completed
    if (["invoiced", "completed"].includes(existingOrder.status)) {
      return res.status(400).json({ msg: "This order is already finalized or invoiced and cannot be edited. Please cancel and create a new one if needed." });
    }

    // TAX RE-CALCULATION
    const adminUser = await User.findById(req.user.id);
    const orderCustomer = await Customer.findById(customer || existingOrder.customer);
    const targetProduct = await Product.findById(product || existingOrder.product);

    if (!targetProduct) return res.status(404).json({ msg: "Product not found" });

    const unitPrice = (price !== undefined && price !== null) ? Number(price) : (targetProduct.price || 0);
    const qty = (quantity !== undefined) ? Number(quantity) : existingOrder.quantity;
    
    const taxableAmount = (unitPrice || 0) * (qty || 0);
    const gstRate = targetProduct.gstRate || 18;
    const gstAmount = (taxableAmount * gstRate) / 100;
    const totalAmount = (taxableAmount + gstAmount) || 0;

    let cgst = 0, sgst = 0, igst = 0;
    const adminState = adminUser?.state?.trim().toLowerCase() || "";
    const customerState = orderCustomer?.state?.trim().toLowerCase() || "";

    if (adminState && customerState && adminState === customerState) {
      cgst = gstAmount / 2;
      sgst = gstAmount / 2;
    } else {
      igst = gstAmount;
    }

    // Proactive stock check removed for demand tracking.

    // --- STOCK ADJUSTMENT LOGIC REMOVED ---
    // Physical stock is now only deducted on shipment/completion.

    const updatedOrder = await Order.findByIdAndUpdate(id, {
      customer: customer || existingOrder.customer,
      product: product || existingOrder.product,
      quantity: qty,
      unit: unit || existingOrder.unit,
      unitPrice,
      taxableAmount,
      gstAmount,
      totalAmount,
      cgst,
      sgst,
      igst,
      hsnCode: targetProduct.hsnCode,
      saleType: req.body.saleType || existingOrder.saleType || "yield",
      dueDate: dueDate || existingOrder.dueDate,
      ewayBillData: ewayBillData || existingOrder.ewayBillData
    }, { new: true });

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email context")
      .populate("product", "name price sku")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Order Status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    // Fetch existing order to check current status
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // --- AUTOMATED INVENTORY HANDLER (Demand vs Physical) ---
    const fulfilledStatuses = ['shipped', 'completed'];
    const wasFulfilled = fulfilledStatuses.includes(existingOrder.status);
    const isFulfilled = fulfilledStatuses.includes(status);
    if (isFulfilled && !wasFulfilled) {
      // Deduct physical stock only when moving to fulfilled state
      await InventoryService.updateStock({
        productId: existingOrder.product,
        quantity: existingOrder.quantity,
        type: "OUT",
        referenceType: "order",
        referenceId: orderId,
        reason: `Order Fulfillment: Status updated to ${status}${existingOrder.saleType === 'scrap' ? ' (Scrap Sale)' : ''}`,
        isScrap: existingOrder.saleType === 'scrap'
      });
    } else if (!isFulfilled && wasFulfilled) {
      // Restore physical stock if moving back from fulfilled (e.g., return/correction)
      await InventoryService.updateStock({
        productId: existingOrder.product,
        quantity: existingOrder.quantity,
        type: "IN",
        referenceType: "order",
        referenceId: orderId,
        reason: `Order Reversal: Status reverted from ${existingOrder.status} to ${status}${existingOrder.saleType === 'scrap' ? ' (Scrap Restoration)' : ''}`,
        isScrap: existingOrder.saleType === 'scrap'
      });
    } else if (status === 'cancelled' && existingOrder.status !== 'cancelled' && !wasFulfilled) {
       // Cancellation logic (No stock to restore if it was never fulfilled, but logging is good)
       console.log(`[INVENTORY] Order ${orderId} cancelled before fulfillment. No physical stock restoration needed.`);
    }

    existingOrder.status = status;
    await existingOrder.save();

    res.json(existingOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Order
export const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const existingOrder = await Order.findById(orderId);
    
    if (existingOrder && existingOrder.status !== 'cancelled') {
       // Defensive Restoration: Try to restore stock, but don't block deletion if it fails
       try {
         if (existingOrder.product && existingOrder.quantity) {
           await InventoryService.updateStock({
             productId: existingOrder.product,
             quantity: existingOrder.quantity,
             type: "IN",
             referenceType: "order",
             referenceId: orderId,
             reason: `Order Deleted: Permanent Removal (Restoring ${existingOrder.saleType === 'scrap' ? 'Scrap' : 'Stock'})`,
             isScrap: existingOrder.saleType === 'scrap'
           });
         }
       } catch (stockErr) {
         console.error(`[ERP WARNING] Could not restore stock for deleted order ${orderId}: ${stockErr.message}`);
       }
    }

    // Clean up Accounting & Record
    await AccountingService.deleteReferenceEntries(orderId);
    await Order.findByIdAndDelete(orderId);
    res.json({ msg: "Order and associated logs deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};