import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import { Link, useNavigate } from "react-router-dom";
import { dashboardApi, paymentApi, api } from "../api/erpApi";
import {
  TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle,
  IndianRupee, AlertTriangle, ArrowUpRight, ArrowDownRight,
  TrendingUpDown, BarChart4, Activity, Target
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b"];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [pnl, setPnl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parties, setParties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeScale, setTimeScale] = useState("month");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, financialsRes, pnlRes] = await Promise.all([
          dashboardApi.getStats(),
          paymentApi.getSummary(),
          dashboardApi.getPnLSummary()
        ]);
        setStats(statsRes.data);
        setFinancials(financialsRes.data);
        setPnl(pnlRes.data);
      } catch (err) {
        console.error("Dashboard data fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Intelligence...</p>
      </div>
    </AppLayout>
  );

  const statCards = [
    {
      title: "Business Health",
      value: `₹${pnl?.netProfit?.toLocaleString('en-IN') || "0"}`,
      trend: `${pnl?.margin || "0"}% Margin`,
      icon: pnl?.netProfit >= 0 ? TrendingUp : TrendingDown,
      color: pnl?.netProfit >= 0 ? "text-emerald-500" : "text-rose-500",
      bg: "bg-emerald-500/10",
      description: "Net Profitability"
    },
    {
      title: "Net Receivable",
      value: `₹${financials?.totalReceivable?.toLocaleString('en-IN') || "0"}`,
      trend: `${financials?.receivableCount || "0"} Parties`,
      icon: ArrowUpCircle,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      description: "Account Receivables"
    },
    {
      title: "Net Payable",
      value: `₹${financials?.totalPayable?.toLocaleString('en-IN') || "0"}`,
      trend: `${financials?.payableCount || "0"} Pending`,
      icon: ArrowDownCircle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      description: "Supplier Obligations"
    },
    {
      title: "Revenue",
      value: `₹${pnl?.totalSales?.toLocaleString('en-IN') || "0"}`,
      trend: "Gross Invoiced",
      icon: Target,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      description: "Total Operating Sales"
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-12">
        {/* Modern Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              Enterprise <span className="text-primary italic">Intelligence</span>
            </h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Operational Command & Control Center</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {i}
                </div>
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Active Users: 03</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="relative group p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <Icon className="w-24 h-24 rotate-12" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className={`w-7 h-7 ${stat.color}`} />
                  </div>

                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.title}</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter mb-4 group-hover:text-primary transition-colors">
                    {stat.value}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${stat.color}`}>
                      {stat.trend}
                    </span>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                      {stat.description}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Analytics Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Stream Chart */}
          <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/5 rounded-2xl">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Stream</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Sold: ₹{pnl?.totalSales?.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest italic">Bought: ₹{pnl?.totalPurchases?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex bg-slate-50 p-1 rounded-xl">
                <button 
                  onClick={() => setTimeScale("week")}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase transition-all rounded-lg ${timeScale === 'week' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-900'}`}
                >Week</button>
                <button 
                  onClick={() => setTimeScale("month")}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase transition-all rounded-lg ${timeScale === 'month' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-900'}`}
                >Month</button>
              </div>
            </div>

            <div className="w-full h-[400px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.tradeTrend || []}>
                  <defs>
                    <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBought" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8', letterSpacing: '0.1em' }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ fontWeight: 800, fontSize: '14px' }}
                    labelStyle={{ fontWeight: 900, color: '#0f172a', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                    formatter={(value, name) => [
                      `₹${value?.toLocaleString('en-IN')}`, 
                      name === 'sold' ? 'Sold' : 'Bought'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="sold"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorSold)"
                    animationDuration={2000}
                  />
                  <Area
                    type="monotone"
                    dataKey="bought"
                    stroke="#f43f5e"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorBought)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Allocation Matrix */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col group">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-indigo-50 rounded-2xl">
                <BarChart4 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Asset Matrix</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inventory Distribution</p>
              </div>
            </div>

            <div className="flex-1 w-full flex items-center justify-center min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.categoryDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={10}
                    strokeWidth={0}
                    dataKey="value"
                  >
                    {stats?.categoryDistribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 cursor-pointer transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {stats?.categoryDistribution?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{item.name}</span>
                    <span className="text-xs font-black text-slate-900">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operational Excellence / Critical State */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-50 rounded-2xl relative">
                <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-ping"></div>
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Critical State Monitor</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inventory Depletion Alerts</p>
              </div>
            </div>
            <Link to="/products" className="px-6 py-2.5 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-xl hover:bg-slate-900 hover:text-white transition-all">
              Deep Audit
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  <th className="pb-6 px-4">Entity Identity</th>
                  <th className="pb-6">Sector</th>
                  <th className="pb-6 text-center">Velocity State</th>
                  <th className="pb-6 text-right px-4">Operational Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {!stats?.lowStockAlerts || stats.lowStockAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-3xl">✅</span>
                        <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Global Stability Maintained</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stats.lowStockAlerts.map(alert => (
                    <tr key={alert.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-xs text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {alert.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-sm tracking-tight">{alert.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">UID: {alert.id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-6">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{alert.category}</span>
                      </td>
                      <td className="py-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-500 rounded-full">
                          <TrendingDown className="w-3 h-3" />
                          <span className="text-[10px] font-black tracking-widest uppercase">{alert.stock} PCS LEFT</span>
                        </div>
                      </td>
                      <td className="py-6 text-right px-4">
                        <button 
                          onClick={() => navigate("/purchases")}
                          className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-colors shadow-lg shadow-slate-900/10"
                        >
                          Initialize Restock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;

