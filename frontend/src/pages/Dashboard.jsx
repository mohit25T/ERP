import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import { Link } from "react-router-dom";
import { dashboardApi, paymentApi, api } from "../api/erpApi";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  TrendingDown,
  Building2,
  Search,
  FileText
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b"];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [pnl, setPnl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parties, setParties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingParties, setLoadingParties] = useState(false);

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
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
       setLoadingParties(true);
       const [cus, sup] = await Promise.all([
          api.get("/customers"),
          api.get("/suppliers")
       ]);
       const combined = [
          ...cus.data.map(c => ({ ...c, type: 'customer' })),
          ...sup.data.map(s => ({ ...s, type: 'supplier' }))
       ];
       setParties(combined);
    } catch (err) {
       console.error("Failed to fetch dashboard parties", err);
    } finally {
       setLoadingParties(false);
    }
 };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-96">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    </AppLayout>
  );

  const filteredParties = parties.filter(p =>
    (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.company || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.gstin || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statCards = [
    { title: "Business Health", value: `₹${pnl?.netProfit.toLocaleString('en-IN')}`, trend: `${pnl?.margin}% Margin`, icon: pnl?.netProfit >= 0 ? TrendingUp : TrendingDown, color: pnl?.netProfit >= 0 ? "text-green-600" : "text-red-600", bg: pnl?.netProfit >= 0 ? "bg-green-100" : "bg-red-100" },
    { title: "Net Receivable", value: `₹${financials?.totalReceivable.toLocaleString('en-IN')}`, trend: `${financials?.receivableCount} Pending`, icon: ArrowUpCircle, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Net Payable", value: `₹${financials?.totalPayable.toLocaleString('en-IN')}`, trend: `${financials?.payableCount} Pending`, icon: ArrowDownCircle, color: "text-red-600", bg: "bg-red-100" },
    { title: "Operating Revenue", value: `₹${pnl?.totalSales.toLocaleString('en-IN')}`, trend: "Gross Sales", icon: DollarSign, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            Enterprise Overview
          </h2>
          <p className="mt-1 text-sm text-gray-500 font-medium">Real-time business intelligence for your ERP operation.</p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="relative overflow-hidden bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.title}</p>
                    <p className="mt-2 text-3xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{stat.value}</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${stat.color}`} />
                  </div>
                </div>
                 <div className="mt-6 flex items-center gap-2">
                    <div className={`flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${stat.trend.startsWith("+") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                       {stat.trend.startsWith("+") ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                       {stat.trend}
                    </div>
                    <span className="text-xs text-gray-400 font-medium tracking-tight whitespace-nowrap">vs last month</span>
                 </div>
              </div>
            );
          })}
        </div>


        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Sales Trend Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-bold text-gray-800">Revenue Performance</h3>
               <select className="text-xs font-bold bg-gray-50 border-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/10">
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
               </select>
            </div>
            <div className="h-[350px] w-full" style={{ minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.salesTrend}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
 
          {/* Category Distribution */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-8">Inventory Mix</h3>
            <div className="flex-1 flex items-center justify-center h-[250px] w-full" style={{ minWidth: 0 }}>
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {stats?.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
               {stats?.categoryDistribution.map((item, idx) => (
                 <div key={idx} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase truncate">{item.name}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                 <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Critical Stock Alerts</h3>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-tighter">
                       <th className="pb-4">Product</th>
                       <th className="pb-4">Category</th>
                       <th className="pb-4 text-center">Remaining Stock</th>
                       <th className="pb-4 text-right">Action Req.</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {stats?.lowStockAlerts.length === 0 ? (
                       <tr>
                          <td colSpan="4" className="py-8 text-center text-sm font-medium text-gray-400 italic">All inventory levels are healthy.</td>
                       </tr>
                    ) : (
                      stats?.lowStockAlerts.map(alert => (
                        <tr key={alert.id} className="group hover:bg-gray-50/50 transition-colors">
                           <td className="py-4 font-bold text-gray-800 text-sm">{alert.name}</td>
                           <td className="py-4 text-xs font-semibold text-gray-500 uppercase">{alert.category}</td>
                           <td className="py-4 text-center">
                              <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-black">
                                 {alert.stock} PCS
                              </span>
                           </td>
                           <td className="py-4 text-right">
                              <button className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest underline underline-offset-4">
                                 Restock Now
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
