import mongoose from "mongoose";
import Order from "./Order.js";
import Product from "../products/Product.js";
import User from "../../core/users/User.js";
import Customer from "../customers/Customer.js";
import InventoryService from "../inventory/InventoryService.js";
import UnitService from "../products/UnitService.js";
import AccountingService from "../../billing/ledger/AccountingService.js";
import TransactionManager from "../../../shared/utils/TransactionManager.js";

// Create Order
export const createOrder = async (req, res) => {
  try {
    const { customer, product, quantity, unit, price, dueDate, ewayBillData, saleType } = req.body;

    const result = await TransactionManager.execute(async (session) => {
      // 1. Data Retrieval
      const adminUser = await User.findById(req.user.id).session(session);
      const orderCustomer = await Customer.findById(customer).session(session);
      const existingProduct = await Product.findById(product).session(session);

      if (!existingProduct) throw new Error("Product not found");

      // 2. Tax Calculation
      const unitPrice = (price !== undefined && price !== null) ? Number(price) : (existingProduct.price || 0);
      const qty = Number(quantity) || 0;
      
      // Normalize quantity for stock reservation AND for financial calculation 
      // (assuming price is per base unit, e.g. per KG for scrap)
      const normalizedQty = await UnitService.normalize(qty, unit);
      
      const taxableAmount = unitPrice * normalizedQty;
      const gstRate = existingProduct.gstRate || 18;
      const gstAmount = (taxableAmount * gstRate) / 100;
      const totalAmount = taxableAmount + gstAmount;

      let cgst = 0, sgst = 0, igst = 0;
      const adminState = adminUser?.state?.trim().toLowerCase() || "";
      const customerState = orderCustomer?.state?.trim().toLowerCase() || "";

      if (adminState && customerState && adminState === customerState) {
        cgst = gstAmount / 2;
        sgst = gstAmount / 2;
      } else {
        igst = gstAmount;
      }

      // 3. Stock Reservation (Atomic)
      await InventoryService.reserveStock(product, normalizedQty, {
        reason: saleType === 'scrap' ? `Salvage Order Commitment` : `Sales Order Commitment`,
        referenceType: "order",
        referenceId: new mongoose.Types.ObjectId(),
        isScrap: saleType === 'scrap'
      }, session);

      // 4. Create Order Record
      const order = await Order.create([{
        customer,
        product,
        orderedQty: qty,
        reservedQty: qty,
        shippedQty: 0,
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
      }], { session });

      // Update reservation log with real order ID
      // (Optional: we can just use the order ID directly in reserveStock if we generate it first)

      return order[0];
    });

    // 5. Post-Transaction side-effects (Notifications)
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Order (Mistake Correction)
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer, product, quantity, unit, price, dueDate, ewayBillData, saleType } = req.body;

    const result = await TransactionManager.execute(async (session) => {
      const existingOrder = await Order.findById(id).session(session);
      if (!existingOrder) throw new Error("Order not found");

      // Lock updates if already invoiced or completed
      if (["invoiced", "completed"].includes(existingOrder.status)) {
        throw new Error("This order is already finalized and cannot be edited. Please cancel and create a new one.");
      }

      // TAX RE-CALCULATION
      const adminUser = await User.findById(req.user.id).session(session);
      const orderCustomer = await Customer.findById(customer || existingOrder.customer).session(session);
      const targetProduct = await Product.findById(product || existingOrder.product).session(session);

      if (!targetProduct) throw new Error("Product not found");

      const unitPrice = (price !== undefined && price !== null) ? Number(price) : (targetProduct.price || 0);
      const qty = (quantity !== undefined) ? Number(quantity) : existingOrder.quantity;
      const targetUnit = unit || existingOrder.unit;
      
      const normalizedQty = await UnitService.normalize(qty, targetUnit);

      const taxableAmount = (unitPrice || 0) * (normalizedQty || 0);
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
        saleType: saleType || existingOrder.saleType || "yield",
        dueDate: dueDate || existingOrder.dueDate,
        ewayBillData: ewayBillData || existingOrder.ewayBillData
      }, { new: true, session });

      return updatedOrder;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Dispatch Order (Full or Partial)
export const dispatchOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body; // Quantity to dispatch in this batch

    const result = await TransactionManager.execute(async (session) => {
      const order = await Order.findById(id).session(session);
      if (!order) throw new Error("Order not found");

      const dispatchQty = Number(quantity);
      if (dispatchQty <= 0) throw new Error("Invalid dispatch quantity");
      if (dispatchQty > order.reservedQty) {
        throw new Error(`Cannot dispatch more than reserved (${order.reservedQty}). Please reserve more first or adjust order.`);
      }

      // 1. Sync Inventory (Physical OUT, Reserved RELEASE)
      await InventoryService.decreaseStock(order.product, dispatchQty, {
        reason: `Dispatch for Order #${order._id.toString().slice(-6)}`,
        referenceType: "order",
        referenceId: order._id,
        targetField: order.saleType === 'scrap' ? 'scrapStock' : 'totalStock'
      }, session);

      await InventoryService.releaseReservedStock(order.product, dispatchQty, {
        reason: `Dispatch fulfillment`,
        referenceType: "order",
        referenceId: order._id
      }, session);

      // 2. Update Order Totals
      order.shippedQty += dispatchQty;
      order.reservedQty -= dispatchQty;

      // 3. Dynamic Status Update
      if (order.shippedQty === order.orderedQty) {
        order.status = "completed";
      } else {
        order.status = "partially_shipped";
      }

      await order.save({ session });
      return order;
    });

    res.json(result);
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

    const result = await TransactionManager.execute(async (session) => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new Error("Order not found");

      // Handle Cancellation: Release any remaining reservations
      if (status === 'cancelled' && order.status !== 'cancelled') {
        if (order.reservedQty > 0) {
          await InventoryService.releaseReservedStock(order.product, order.reservedQty, {
            referenceType: "order",
            referenceId: orderId,
            reason: "Reservation release on order cancellation"
          }, session);
          order.reservedQty = 0;
        }
      }

      // Note: Physical stock updates are now handled via dispatchOrder.
      // updateOrderStatus is for administrative state changes.

      order.status = status;
      await order.save({ session });
      return order;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Order
export const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    await TransactionManager.execute(async (session) => {
      const order = await Order.findById(orderId).session(session);
      if (!order) return; // Already gone or never existed

      // 1. Clean release of any remaining reservations
      if (order.reservedQty > 0) {
        await InventoryService.releaseReservedStock(order.product, order.reservedQty, {
          referenceType: "order",
          referenceId: orderId,
          reason: `Order Permanent Deletion: Releasing remaining reservation`
        }, session);
      }

      // 2. Clean up Accounting & Record
      await AccountingService.deleteReferenceEntries(orderId);
      await Order.findByIdAndDelete(orderId).session(session);
    });

    res.json({ msg: "Order and associated logs deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
