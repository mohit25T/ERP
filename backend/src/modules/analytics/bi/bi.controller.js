import DashboardService from "./DashboardService.js";
import AnalyticsService from "./AnalyticsService.js";
import AlertService from "./AlertService.js";
import ProfitService from "./ProfitService.js";

export const getDashboard = async (req, res) => {
  try {
    const summary = await DashboardService.getSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getScrapAndEfficiencyAnalytics = async (req, res) => {
  try {
    const analytics = await AnalyticsService.getScrapAndEfficiency();
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAlerts = async (req, res) => {
  try {
    const alerts = await AlertService.getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProfit = async (req, res) => {
  try {
    const profits = await ProfitService.getProfitability();
    res.json(profits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
