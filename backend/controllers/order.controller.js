import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Create Order
export const createOrder = async (req, res) => {
  try {
    const { customer, product, quantity, dueDate } = req.body;

    const existingProduct = await Product.findById(product);
    if (!existingProduct) {
      return res.status(404).json({ msg: "Product not found" });
    }

    if (existingProduct.stock < quantity) {
      return res.status(400).json({ msg: "Insufficient stock" });
    }

    const totalAmount = existingProduct.price * quantity;

    const order = await Order.create({
      customer,
      product,
      quantity,
      totalAmount,
      dueDate
    });

    // Reduce stock
    existingProduct.stock -= quantity;
    await existingProduct.save();

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

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};