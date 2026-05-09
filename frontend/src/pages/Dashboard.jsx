import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../api/erpApi";
import AppLayout from "../components/layout/AppLayout";
import KPICard from "../components/dashboard/KPICard";
import StatusBadge from "../components/common/StatusBadge";
import HammerLoader from "../components/common/HammerLoader";
import {
  Package, Activity, ShoppingCart, Database, 
  ArrowRight, ShieldAlert
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";


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
        <HammerLoader />
      </AppLayout>
    );
  }

  const summary = stats?.summary || {};
  const pendingOrders = stats?.pendingOrders || 0;
  const availableStock = summary?.totalStockQuantity || 0;
  const lowStockAlerts = stats?.lowStockAlerts || [];

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Business Overview</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-widest opacity-70">Current status of your business.</p>
          </div>
          <div className="flex gap-2">
            <button className="erp-button-secondary">
              <Database className="w-3.5 h-3.5" /> Save Data
            </button>
            <Link to="/production" className="erp-button-primary">
              Start Making Product
            </Link>
          </div>
        </div>

        {/* A. KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Made Today"
            value={`${(stats?.summary?.totalProductionToday || 0).toLocaleString()} kg`}
            trend="Updated"
            isPositive={true}
            icon={Package}
          />
          <KPICard
            title="Work Efficiency"
            value={`${(stats?.summary?.efficiency || 0).toFixed(1)}%`}
            trend="Live"
            isPositive={true}
            icon={Activity}
          />
          <KPICard
            title="Pending Orders"
            value={`${pendingOrders} Orders`}
            trend="Waiting"
            isPositive={false}
            icon={ShoppingCart}
          />
          <KPICard
            title="Total Stock"
            value={`${availableStock.toLocaleString()} kg`}
            trend="Checked"
            isPositive={true}
            icon={Database}
          />
        </div>

        {/* Middle Section: Charts & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* B. CHARTS */}
          <div className="lg:col-span-2 space-y-4">
            {/* Production Output Chart */}
            <div className="bg-card p-3 rounded border border-border relative overflow-hidden">
              <h3 className="text-xs font-bold text-foreground mb-4 uppercase tracking-widest opacity-80">Production Chart</h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.productionTrend || []} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/30" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'currentColor', opacity: 0.05 }}
                      contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px' }}
                    />
                    <Bar dataKey="output" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="Output (kg)" maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {(!stats?.productionTrend || stats.productionTrend.length === 0) && (
                <div className="absolute inset-0 bg-card/80 backdrop-blur-[1px] flex items-center justify-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">No data available</p>
                </div>
              )}
            </div>

            {/* Efficiency vs Scrap Trend */}
            <div className="bg-card p-3 rounded border border-border relative overflow-hidden">
              <h3 className="text-xs font-bold text-foreground mb-4 uppercase tracking-widest opacity-80">Efficiency vs Scrap</h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.productionTrend || []} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/30" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                    <Line yAxisId="left" type="monotone" dataKey="efficiency" stroke="hsl(var(--primary))" strokeWidth={2} name="Efficiency (%)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line yAxisId="right" type="monotone" dataKey="scrap" stroke="#f43f5e" strokeWidth={2} name="Scrap (kg)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* C. ALERT PANEL */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded border border-border flex flex-col h-full lg:max-h-[660px]">
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-widest">
                  <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Low Stock Warnings
                </h3>
                <span className="bg-destructive/10 text-destructive text-[10px] font-black px-2 py-0.5 rounded border border-destructive/20">{lowStockAlerts.length}</span>
              </div>

              <div className="p-3 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {lowStockAlerts.length === 0 ? (
                  <div className="text-center py-10 opacity-40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Everything is okay. No alerts.</p>
                  </div>
                ) : (
                  lowStockAlerts.map(alert => (
                    <div key={alert.id} className="p-3 rounded border border-border bg-muted/5 flex items-start gap-3 hover:bg-muted/10 transition-colors cursor-pointer group">
                      <Database className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-foreground tracking-tight">{alert.name}</p>
                          <StatusBadge status="Critical" />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">Stock level: <span className="font-bold text-destructive">{alert.stock} {alert.unit || 'units'}</span> remaining.</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-border">
                <Link to="/products" className="text-[10px] font-black text-primary hover:text-primary/80 flex items-center justify-center gap-1 w-full py-2 bg-primary/5 rounded border border-primary/10 hover:bg-primary/10 transition-all uppercase tracking-widest">
                  Go to Stock <ArrowRight className="w-3 h-3" />
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
