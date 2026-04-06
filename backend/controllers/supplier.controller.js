import Supplier from "../models/Supplier.js";
import crypto from "crypto";

// Create Supplier
export const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Suppliers
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Supplier by ID
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ msg: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Supplier
export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!supplier) return res.status(404).json({ msg: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Supplier
export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ msg: "Supplier not found" });
    res.json({ msg: "Supplier deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Generate Share Token
export const generateShareToken = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ msg: "Supplier not found" });

    // Generate token directly in controller for higher reliability
    supplier.shareToken = crypto.randomBytes(16).toString("hex");
    await supplier.save();
    
    console.log(`[SHARE TOKEN] Generated new token for supplier: ${supplier._id}`);
    res.json(supplier);
  } catch (err) {
    console.error(`[SHARE TOKEN ERROR] Supplier ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
};
