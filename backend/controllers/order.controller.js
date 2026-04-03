import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";

// Create Order
export const createOrder = async (req, res) => {
  try {
    const { customer, product, quantity, dueDate } = req.body;

    const existingProduct = await Product.findById(product).populate("bom.material");
    if (!existingProduct) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // STRICT STOCK CHECK: Verify Finished Good Stock
    if (existingProduct.stock < quantity) {
      return res.status(400).json({ msg: `Insufficient finished good stock. Available: ${existingProduct.stock}, Needed: ${quantity}` });
    }

    // STRICT BOM CHECK: Verify all raw materials before any deduction
    if (existingProduct.bom && existingProduct.bom.length > 0) {
      for (const item of existingProduct.bom) {
        const requiredQty = item.quantity * quantity;
        if (!item.material || item.material.stock < requiredQty) {
          return res.status(400).json({ 
            msg: `Insufficient raw material: ${item.material?.name || 'Unknown Item'}. Needed: ${requiredQty}, Available: ${item.material?.stock || 0}`
          });
        }
      }

      // Deduct raw materials ONLY AFTER all checks pass
      for (const item of existingProduct.bom) {
        const materialProduct = await Product.findById(item.material._id);
        if (materialProduct) {
          materialProduct.stock -= (item.quantity * quantity);
          await materialProduct.save();
          console.log(`[ERP LOG] Raw material deducted: ${materialProduct.name} (-${item.quantity * quantity})`);
        }
      }
    }

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
        // Restore Finished Good
        product.stock += existingOrder.quantity;
        await product.save();
        console.log(`[ERP LOG] Stock restored for product ${product.name} (+${existingOrder.quantity})`);

        // Restore Raw Materials from BOM
        if (product.bom && product.bom.length > 0) {
           for (const item of product.bom) {
              const materialProduct = await Product.findById(item.material);
              if (materialProduct) {
                 materialProduct.stock += (item.quantity * existingOrder.quantity);
                 await materialProduct.save();
                 console.log(`[ERP LOG] Raw material restored: ${materialProduct.name} (+${item.quantity * existingOrder.quantity})`);
              }
           }
        }
      }
    }
    
    // Handle Stock Re-deduction if moving FROM cancelled BACK to active states (Bonus logic)
    const isMovingToActive = ["pending", "in_progress", "shipped", "completed"].includes(status);
    if (wasAlreadyReturned && isMovingToActive) {
        const product = await Product.findById(existingOrder.product);
        if (product) {
          // Check Finished Good Stock
          if (product.stock < existingOrder.quantity) {
             return res.status(400).json({ msg: "Insufficient finished good stock to reactivate." });
          }

          // Check Raw Materials Stock if BOM exists
          if (product.bom && product.bom.length > 0) {
             for (const item of product.bom) {
                const materialProduct = await Product.findById(item.material);
                const required = item.quantity * existingOrder.quantity;
                if (!materialProduct || materialProduct.stock < required) {
                   return res.status(400).json({ msg: `Insufficient raw material (${materialProduct?.name || 'Unknown'}) to reactivate.` });
                }
             }

             // Deduct components
             for (const item of product.bom) {
                const materialProduct = await Product.findById(item.material);
                materialProduct.stock -= (item.quantity * existingOrder.quantity);
                await materialProduct.save();
             }
          }

          product.stock -= existingOrder.quantity;
          await product.save();
        }
    }

    existingOrder.status = status;
    await existingOrder.save();

    res.json(existingOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};