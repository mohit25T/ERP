import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import User from "../models/User.js";

// Create Purchase (Inward Stock)
export const createPurchase = async (req, res) => {
  try {
    const { supplier, material, quantity, taxableAmount, unit = "kg" } = req.body;

    const existingProduct = await Product.findById(material);
    if (!existingProduct) {
      return res.status(404).json({ msg: "Material not found" });
    }

    const adminUser = await User.findById(req.user.id);
    const purchaseSupplier = await Supplier.findById(supplier);

    const gstRate = existingProduct.gstRate || 18;
    const gstAmount = (taxableAmount * gstRate) / 100;
    const totalAmount = taxableAmount + gstAmount;

    let cgst = 0, sgst = 0, igst = 0;

    const adminState = adminUser?.state?.trim().toLowerCase() || "";
    const supplierState = purchaseSupplier?.state?.trim().toLowerCase() || "";

    if (adminState && supplierState && adminState === supplierState) {
      cgst = gstAmount / 2;
      sgst = gstAmount / 2;
    } else {
      igst = gstAmount;
    }

    const purchase = await Purchase.create({
      supplier,
      material,
      quantity,
      unit, // Store the unit used during purchase
      taxableAmount,
      gstAmount,
      totalAmount,
      cgst,
      sgst,
      igst,
      status: "pending"
    });

    res.status(201).json(purchase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Purchases
export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate("supplier", "name company state gstin")
      .populate("material", "name sku type")
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Purchase Status (e.g. mark as received)
export const updatePurchaseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) return res.status(404).json({ msg: "Purchase not found" });

    // If transitioning to received, increase product stock
    if (status === "received" && purchase.status !== "received") {
      const product = await Product.findById(purchase.material);
      if (product) {
        // Multi-Unit Conversion Logic
        // 1 Dagina = 50 kg
        const addedStock = purchase.unit === 'dagina' ? (purchase.quantity * 50) : purchase.quantity;
        product.stock += addedStock;
        await product.save();
      }
      purchase.receivedAt = new Date();
    }

    purchase.status = status;
    await purchase.save();

    res.json(purchase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
