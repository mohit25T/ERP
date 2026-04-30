import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../api/erpApi";
import AppLayout from "../components/layout/AppLayout";
import KPICard from "../components/dashboard/KPICard";
import StatusBadge from "../components/common/StatusBadge";
import {
  Package, Activity, ShoppingCart, Database, 
  ArrowRight, ShieldAlert
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";


// Mock data for trends not yet in the backend, illustrating the requested design.
// Production trend data mapping - will pull from API when integrated
const productionTrend = [];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes] = await Promise.all([
          dashboardApi.getStats().catch(e => ({ data: null }))
        ]);
        setStats(statsRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading Insights...</p>
        </div>
      </AppLayout>
    );
  }

  // Derive metrics from real stats
  const summary = stats?.summary || {};
  const pendingOrders = stats?.pendingOrders || 0;
  const availableStock = summary?.totalStockQuantity || 0;
  const lowStockAlerts = stats?.lowStockAlerts || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time business insights and operational overview.</p>
          </div>
          <div className="flex gap-3">
            <button className="erp-button-secondary">
              <Database className="w-4 h-4" /> Download Report
            </button>
            <Link to="/production" className="erp-button-primary">
              Add Production
            </Link>
          </div>
        </div>

        {/* A. KPI CARDS (Top Section) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Production Today"
            value={`${(stats?.summary?.totalProductionToday || 0).toLocaleString()} kg`}
            trend="Live"
            isPositive={true}
            icon={Package}
          />
          <KPICard
            title="Efficiency"
            value={`${(stats?.summary?.efficiency || 0).toFixed(1)}%`}
            trend="Live"
            isPositive={true}
            icon={Activity}
          />
          <KPICard
            title="Pending Orders"
            value={`${pendingOrders} Orders`}
            trend="Awaiting dispatch"
            isPositive={false}
            icon={ShoppingCart}
          />
          <KPICard
            title="Available Stock"
            value={`${availableStock.toLocaleString()} kg`}
            trend="Live Registry"
            isPositive={true}
            icon={Database}
          />
        </div>

        {/* Middle Section: Charts & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* B. CHARTS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Production Output Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
              <h3 className="text-base font-semibold text-slate-900 mb-6">Production Output</h3>
              <div className="h-[300px] w-full min-w-[10px] min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.productionTrend || []} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '0.75rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="output" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Output (kg)" maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {(!stats?.productionTrend || stats.productionTrend.length === 0) && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No production history available</p>
                </div>
              )}
            </div>

            {/* Efficiency vs Scrap Trend */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
              <h3 className="text-base font-semibold text-slate-900 mb-6">Efficiency & Scrap Trend</h3>
              <div className="h-[300px] w-full min-w-[10px] min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.productionTrend || []} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '0.75rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={3} name="Efficiency (%)" dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="scrap" stroke="#f43f5e" strokeWidth={3} name="Scrap (kg)" dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* C. ALERT PANEL */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full h-[650px]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" /> System Alerts
                </h3>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">{lowStockAlerts.length}</span>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">

                {/* Dynamic Low Stock Alerts */}
                {lowStockAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400">No inventory alerts.</p>
                  </div>
                ) : (
                  lowStockAlerts.map(alert => (
                    <div key={alert.id} className="p-4 rounded-xl border border-slate-100 bg-white flex items-start gap-3 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer">
                      <Database className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-800">{alert.name}</p>
                          <StatusBadge status="Critical" />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Stock level critically low: <span className="font-bold text-rose-500">{alert.stock} {alert.unit || 'units'}</span> remaining.</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-slate-100">
                <Link to="/products" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 w-full py-2 hover:bg-indigo-50 rounded-lg transition-colors">
                  View full inventory <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;


