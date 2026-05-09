import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Wallet, Banknote, TrendingDown, ArrowUpRight, ArrowDownLeft, 
  Calendar, RefreshCcw, Landmark, PieChart as PieIcon 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import erpApi from "../../api/erpApi";
import HammerLoader from "../../components/common/HammerLoader";
import AppLayout from "../../components/layout/AppLayout";

const TreasuryDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await erpApi.get("/treasury/summary");
      setData(res.data);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AppLayout><HammerLoader /></AppLayout>;

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header Domain */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Bank & Cash <span className="text-indigo-600 ">Overview</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
            Money in/out history
          </p>
        </div>
        <button 
          onClick={fetchSummary}
          className="p-2 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm self-start md:self-center"
        >
          <RefreshCcw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Primary Balance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Bank Balance" 
          value={data.balances.bank} 
          icon={Landmark} 
          color="indigo" 
          subtitle="Total in all banks"
        />
        <MetricCard 
          title="Cash In Hand" 
          value={data.balances.cash} 
          icon={Wallet} 
          color="emerald" 
          subtitle="Daily Operational Liquidity"
        />
        <MetricCard 
          title="Monthly Expenses" 
          value={data.expenses.monthlyTotal} 
          icon={TrendingDown} 
          color="rose" 
          subtitle="Total spent this month"
        />
      </div>

      {/* Analytics & Transactions Sector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expense Analytics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-md border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-500" /> Category Breakdown
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.expenses.breakdown}
                  dataKey="total"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {data.expenses.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.expenses.breakdown.map((item, idx) => (
              <div key={item._id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item._id}</span>
                <span className="text-[10px] font-black text-slate-900 ml-auto">₹{item.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Flux */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-md border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-emerald-500" /> Recent Activity
            </h3>
          </div>
          <div className="space-y-4">
            {data.recent.map((tx, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-md hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className={`p-2 rounded-md ${
                  tx.displayType === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {tx.displayType === 'IN' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                      {tx.source === 'Expense' ? tx.category : (tx.remarks || tx.notes || tx.type)}
                    </p>
                    <p className={`text-sm font-black ${
                      tx.displayType === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {tx.displayType === 'IN' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                      {tx.source}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {formatDate(tx.date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {data.recent.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">No Recent Activity</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  </AppLayout>
  );
};

const MetricCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorMap = {
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-4 rounded-md border border-slate-200 shadow-sm relative overflow-hidden group"
    >
      <div className={`inline-flex p-3 rounded-md mb-4 border ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          ₹{value.toLocaleString()}
        </h2>
        <p className="text-[9px] font-medium text-slate-400">{subtitle}</p>
      </div>
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500`}>
        <Icon className="w-24 h-24" />
      </div>
    </motion.div>
  );
};

export default TreasuryDashboard;
