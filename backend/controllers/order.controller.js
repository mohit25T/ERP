import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Notification from "../models/Notification.js";

// Create Order
export const createOrder = async (req, res) => {
  try {
    const { customer, product, quantity, unit, dueDate, ewayBillData } = req.body;

    // TAX CALCULATION (GST)
    const adminUser = await User.findById(req.user.id);
    const orderCustomer = await Customer.findById(customer);
    const existingProduct = await Product.findById(product);
    
    if (!existingProduct) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const taxableAmount = existingProduct.price * quantity;
    const gstRate = existingProduct.gstRate || 18;
    const gstAmount = (taxableAmount * gstRate) / 100;
    const totalAmount = taxableAmount + gstAmount;

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
      taxableAmount,
      gstAmount,
      totalAmount,
      cgst,
      sgst,
      igst,
      hsnCode: existingProduct.hsnCode,
      customerGstin: orderCustomer?.gstin || "",
      dueDate,
      ewayBillData: ewayBillData || { active: false }
    });

    // NOTIFICATION TRIGGERS
    if (adminUser?.notificationSettings?.newOrder) {
      await Notification.create({
        user: adminUser._id,
        title: "New Sales Order",
        message: `Order #${order._id.toString().substring(18)} generated for ${orderCustomer?.name} (₹${totalAmount.toLocaleString()})`,
        type: "info",
        link: "/orders"
      });
    }

    res.status(201).json(order);
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
    await Order.findByIdAndDelete(orderId);
    res.json({ msg: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};