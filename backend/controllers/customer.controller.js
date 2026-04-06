import Customer from "../models/Customer.js";
import crypto from "crypto";

// Create Customer
export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Customers
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ msg: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Customer
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!customer) return res.status(404).json({ msg: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Customer
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ msg: "Customer not found" });
    res.json({ msg: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Generate Share Token
export const generateShareToken = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ msg: "Customer not found" });

    // Generate token directly in controller for higher reliability
    customer.shareToken = crypto.randomBytes(16).toString("hex");
    await customer.save();
    
    console.log(`[SHARE TOKEN] Generated new token for customer: ${customer._id}`);
    res.json(customer);
  } catch (err) {
    console.error(`[SHARE TOKEN ERROR] Customer ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
};
