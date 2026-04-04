import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";

// Create Order
export const createOrder = async (req, res) => {
  try {
    const { customer, product, quantity, dueDate } = req.body;

    const existingProduct = await Product.findById(product);
    if (!existingProduct) {
      return res.status(404).json({ msg: "Product not found" });
    }

    if (existingProduct.stock < quantity) {
      return res.status(400).json({ msg: `Insufficient finished good stock. Available: ${existingProduct.stock}, Needed: ${quantity}` });
    }

    // Order fulfillment logic: Always deduct from finished good stock (allow negative)
    existingProduct.stock -= quantity;
    await existingProduct.save();
    console.log(`[ERP LOG] Finished good stock deducted: ${existingProduct.name} (-${quantity})`);

    // TAX CALCULATION (GST)
    const adminUser = await User.findById(req.user.id);
    const orderCustomer = await Customer.findById(customer);
    
    const taxableAmount = existingProduct.price * quantity;
    const gstRate = existingProduct.gstRate || 18;
    const gstAmount = (taxableAmount * gstRate) / 100;
    const totalAmount = taxableAmount + gstAmount;

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
      taxableAmount,
      gstAmount,
      totalAmount,
      cgst,
      sgst,
      igst,
      hsnCode: existingProduct.hsnCode,
      customerGstin: orderCustomer?.gstin || "",
      dueDate
    });


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

    // Handle Stock Restoration if transitioning to 'cancelled' or 'refunded'
    // and ONLY if the order was not already cancelled/refunded
    const isReturningToStock = ["cancelled", "refunded"].includes(status);
    const wasAlreadyReturned = ["cancelled", "refunded"].includes(existingOrder.status);

    if (isReturningToStock && !wasAlreadyReturned) {
      const product = await Product.findById(existingOrder.product);
      if (product) {
        // Restore Finished Good to Stock
        product.stock += existingOrder.quantity;
        await product.save();
        console.log(`[ERP LOG] Finished good stock restored for product ${product.name} (+${existingOrder.quantity})`);
      }
    }
    
    if (wasAlreadyReturned && isMovingToActive) {
      const product = await Product.findById(existingOrder.product);
      if (product) {
        const qty = existingOrder.quantity;
        if (product.stock < qty) {
           return res.status(400).json({ msg: `Insufficient finished good stock to reactivate. Available: ${product.stock}, Needed: ${qty}` });
        }
        // Always deduct from finished good stock when reactivating (allow negative)
        product.stock -= qty;
        await product.save();
        console.log(`[ERP LOG] Reactivation: Finished good stock deducted for ${product.name} (-${qty})`);
      }
    }

    existingOrder.status = status;
    await existingOrder.save();

    res.json(existingOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};