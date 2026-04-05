import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";

export const getDashboardStats = async (req, res) => {
  try {
    const [orders, products, customers] = await Promise.all([
      Order.find().populate("product"),
      Product.find(),
      Customer.find()
    ]);

    // Calculate Total Revenue
    const totalRevenue = orders
      .filter(o => !["cancelled", "refunded"].includes(o.status))
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    // Calculate Sales Trends (by month)
    const monthlySales = orders.reduce((acc, order) => {
      const month = new Date(order.createdAt).toLocaleString("default", { month: "short" });
      acc[month] = (acc[month] || 0) + order.totalAmount;
      return acc;
    }, {});

    const salesTrendData = Object.entries(monthlySales).map(([name, total]) => ({
      name,
      total
    }));

    // Category Distribution
    const categoryCounts = products.reduce((acc, prod) => {
      acc[prod.category || "General"] = (acc[prod.category || "General"] || 0) + 1;
      return acc;
    }, {});

    const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value
    }));

    // Low Stock Alerts
    const lowStockAlerts = products.filter(p => p.stock < 10).map(p => ({
      id: p._id,
      name: p.name,
      stock: p.stock,
      category: p.category
    }));

    res.json({
      summary: {
        totalRevenue,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalProducts: products.length
      },
      salesTrend: salesTrendData,
      categoryDistribution: categoryData,
      lowStockAlerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
