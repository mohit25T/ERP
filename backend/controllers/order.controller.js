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

    // SMART FULFILMENT LOGIC (Stock vs. Composition)
    // If ANY stock is available, fulfill the entire quantity from stock to skip BOM check
    const fulfilmentFromStock = existingProduct.stock > 0 ? quantity : 0;
    const productionRequired = quantity - fulfilmentFromStock;

    // If production is required, check BOM
    if (productionRequired > 0) {
       if (existingProduct.bom && existingProduct.bom.length > 0) {
          // STRICT BOM CHECK: Verify all raw materials for the production shortfall
          for (const item of existingProduct.bom) {
             const requiredQty = item.quantity * productionRequired;
             if (!item.material || item.material.stock < requiredQty) {
                return res.status(400).json({ 
                   msg: `Insufficient raw material: ${item.material?.name || 'Unknown'}. Needed: ${requiredQty.toFixed(2)}, Available: ${item.material?.stock?.toFixed(2) || 0}`
                });
             }
          }

          // Deduct raw materials for PRODUCTION only
          for (const item of existingProduct.bom) {
             const materialProduct = await Product.findById(item.material._id);
             if (materialProduct) {
                materialProduct.stock -= (item.quantity * productionRequired);
                await materialProduct.save();
                console.log(`[ERP LOG] Raw material deducted for Production (+${productionRequired}): ${materialProduct.name} (-${item.quantity * productionRequired})`);
             }
          }
       } else {
          // No BOM defined? Then we must have enough finished stock or we fail.
          if (existingProduct.stock < quantity) {
             return res.status(400).json({ msg: `Insufficient finished good stock and no production composition (BOM) defined.` });
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

    // Reduce Finished Good Stock ONLY by the amount fulfilled from stock
    // (Items "produced" via BOM are not subtracted from warehouse stock as they are new)
    if (fulfilmentFromStock > 0) {
       existingProduct.stock -= fulfilmentFromStock;
       await existingProduct.save();
       console.log(`[ERP LOG] Finished good stock deducted: ${existingProduct.name} (-${fulfilmentFromStock})`);
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
    
    // Handle Stock Re-deduction if moving FROM cancelled BACK to active states (Bonus logic)
    const isMovingToActive = ["pending", "in_progress", "shipped", "completed"].includes(status);
    if (wasAlreadyReturned && isMovingToActive) {
        const product = await Product.findById(existingOrder.product);
        if (product) {
          const qty = existingOrder.quantity;
          // If ANY stock is available, fulfill entire quantity from stock to skip BOM
          const fulfilmentFromStock = product.stock > 0 ? qty : 0;
          const productionRequired = qty - fulfilmentFromStock;

          // If reactivation requires production...
          if (productionRequired > 0) {
             if (product.bom && product.bom.length > 0) {
                // Check BOM for shortfall
                for (const item of product.bom) {
                   const materialProduct = await Product.findById(item.material);
                   const required = item.quantity * productionRequired;
                   if (!materialProduct || materialProduct.stock < required) {
                      return res.status(400).json({ msg: `Insufficient raw material (${materialProduct?.name || 'Unknown'}) to reactivate production.` });
                   }
                }

                // Deduct components for shortfall
                for (const item of product.bom) {
                   const materialProduct = await Product.findById(item.material);
                   materialProduct.stock -= (item.quantity * productionRequired);
                   await materialProduct.save();
                   console.log(`[ERP LOG] Reactivation: Raw material deducted for Production (+${productionRequired}): ${materialProduct.name}`);
                }
             } else if (product.stock < qty) {
                return res.status(400).json({ msg: "Insufficient finished good stock and no BOM defined to reactivate." });
             }
          }

          // Deduct from finished stock if available
          if (fulfilmentFromStock > 0) {
             product.stock -= fulfilmentFromStock;
             await product.save();
             console.log(`[ERP LOG] Reactivation: Finished good stock deducted (-${fulfilmentFromStock})`);
          }
        }
    }

    existingOrder.status = status;
    await existingOrder.save();

    res.json(existingOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};