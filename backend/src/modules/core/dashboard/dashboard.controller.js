import Order from "../../erp/orders/Order.js";
import Product from "../../erp/products/Product.js";
import Production from "../../erp/production/Production.js";
import AlertService from "../../analytics/bi/AlertService.js";

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Unified Aggregation Pipeline for Summary Stats
    const summaryStats = await Promise.all([
      // Revenue & Orders
      Order.aggregate([
        { $match: { status: { $nin: ["cancelled", "refunded"] } } },
        { 
          $group: { 
            _id: null, 
            totalRevenue: { $sum: "$totalAmount" },
            count: { $sum: 1 },
            pendingCount: { $sum: { $cond: [{ $in: ["$status", ["pending", "in_progress"]] }, 1, 0] } }
          } 
        }
      ]),
      
      // Inventory Value
      Product.aggregate([
        { 
          $group: { 
            _id: null, 
            totalStockQuantity: { $sum: "$totalStock" },
            totalStockValue: { $sum: { $multiply: ["$totalStock", "$price"] } },
            catalogSize: { $sum: 1 }
          } 
        }
      ]),
      
      // Production Efficiency & Cost Allocation (Intelligence)
      Production.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: null,
            totalInputWeight: { $sum: "$inputWeight" },
            totalOutputWeight: { $sum: "$outputWeight" },
            totalScrapWeight: { $sum: "$scrapWeight" },
            totalBaseCost: { $sum: "$totalCost" },
            productionToday: {
              $sum: { $cond: [{ $gte: ["$completedAt", today] }, "$outputWeight", 0] }
            }
          }
        },
        {
          $project: {
            totalInputWeight: 1,
            totalOutputWeight: 1,
            totalScrapWeight: 1,
            totalBaseCost: 1,
            productionToday: 1,
            // Calculate components based on weight ratio
            avgCostPerKG: { $cond: [{ $gt: ["$totalInputWeight", 0] }, { $divide: ["$totalBaseCost", "$totalInputWeight"] }, 0] }
          }
        },
        {
          $project: {
            totalInputWeight: 1,
            totalOutputWeight: 1,
            totalScrapWeight: 1,
            totalBaseCost: 1,
            productionToday: 1,
            materialCostValue: { $multiply: ["$totalOutputWeight", "$avgCostPerKG"] },
            scrapLossValue: { $multiply: ["$totalScrapWeight", "$avgCostPerKG"] }
          }
        }
      ])
    ]);

    const ord = summaryStats[0][0] || { totalRevenue: 0, count: 0, pendingCount: 0 };
    const inv = summaryStats[1][0] || { totalStockQuantity: 0, totalStockValue: 0, catalogSize: 0 };
    const prod = summaryStats[2][0] || { totalInputWeight: 0, totalOutputWeight: 0, totalScrapWeight: 0, materialCostValue: 0, scrapLossValue: 0, productionToday: 0 };

    const scrapRate = prod.totalInputWeight > 0 ? ((prod.totalInputWeight - prod.totalOutputWeight) / prod.totalInputWeight) * 100 : 0;
    const efficiency = prod.totalInputWeight > 0 ? (prod.totalOutputWeight / prod.totalInputWeight) * 100 : 0;

    // 2. Trend Queries (Limited for performance)
    const productionTrend = await Production.find({ status: "completed" })
      .sort({ completedAt: -1 })
      .limit(7)
      .select("batchNumber outputWeight scrapWeight efficiency");

    // Monthly Trade Trend (Sales vs Purchases)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);

    const tradeTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          sold: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Format trend data for frontend
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedTradeTrend = tradeTrend.map(t => ({
      name: months[t._id.month - 1],
      sold: t.sold,
      bought: 0 
    }));

    // 3. Operational Insights (Aggregated Alerts)
    const operationalAlerts = await AlertService.getAlerts();

    res.json({
      summary: {
        totalRevenue: ord.totalRevenue,
        totalOrders: ord.count,
        totalProducts: inv.catalogSize,
        totalStockQuantity: inv.totalStockQuantity,
        totalStockValue: inv.totalStockValue,
        totalProductionToday: prod.productionToday,
        scrapRate,
        efficiency,
        scrapLoss: prod.scrapLossValue // Exposing scrap loss value to dashboard
      },
      pendingOrders: ord.pendingCount,
      tradeTrend: formattedTradeTrend,
      productionTrend: productionTrend.reverse().map(p => ({
        name: p.batchNumber,
        output: p.outputWeight,
        scrap: p.scrapWeight,
        efficiency: p.efficiency
      })),
      lowStockAlerts: operationalAlerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * P&L Intelligence Summary: Revenue - materialCost - scrapLoss
 */
export const getPnLSummary = async (req, res) => {
  try {
    const stats = await Promise.all([
      // Revenue (Invoiced Sales)
      Order.aggregate([
        { $match: { status: { $in: ["invoiced", "completed"] } } },
        { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
      ]),
      // Production Costs (Weighted Allocation)
      Production.aggregate([
        { $match: { status: "completed" } },
        { 
          $group: { 
            _id: null, 
            totalInputWeight: { $sum: "$inputWeight" },
            totalOutputWeight: { $sum: "$outputWeight" },
            totalScrapWeight: { $sum: "$scrapWeight" },
            totalBaseCost: { $sum: "$totalCost" } 
          } 
        },
        {
          $project: {
            totalSalesValue: 1, // Placeholder if needed
            totalInputWeight: 1,
            totalOutputWeight: 1,
            totalScrapWeight: 1,
            totalBaseCost: 1,
            avgCostPerKG: { 
              $cond: [{ $gt: ["$totalInputWeight", 0] }, { $divide: ["$totalBaseCost", "$totalInputWeight"] }, 0] 
            }
          }
        },
        {
          $project: {
            materialCostOnly: { $multiply: ["$totalOutputWeight", "$avgCostPerKG"] },
            scrapLossValue: { $multiply: ["$totalScrapWeight", "$avgCostPerKG"] }
          }
        }
      ])
    ]);

    const totalSales = stats[0][0]?.totalSales || 0;
    const prodCosts = stats[1][0] || { materialCostOnly: 0, scrapLossValue: 0 };
    
    // Formula: profit = revenue - materialCost - scrapLoss
    const materialCost = prodCosts.materialCostOnly;
    const scrapLoss = prodCosts.scrapLossValue;
    
    const netProfit = totalSales - materialCost - scrapLoss;
    const margin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0;

    res.json({
      totalSales,
      materialCost,
      scrapLoss,
      netProfit,
      margin
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
