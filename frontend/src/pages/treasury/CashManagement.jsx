import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Plus, Search, User, ArrowUpRight, ArrowDownLeft, Calendar, FileText, Banknote } from "lucide-react";
import erpApi from "../../api/erpApi";
import HammerLoader from "../../components/common/HammerLoader";
import Modal from "../../components/common/Modal";
import AppLayout from "../../components/layout/AppLayout";

const CashManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", type: "", employeeName: "" });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "salary",
    employeeName: "",
    amount: "",
    transactionFlow: "out",
    notes: ""
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters).toString();
      const res = await erpApi.get(`/treasury/cash?${query}`);
      setTransactions(res.data);
    } catch (err) {
      console.error("Cash Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await erpApi.post("/treasury/cash", formData);
      setShowModal(false);
      fetchTransactions();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: "salary",
        employeeName: "",
        amount: "",
        transactionFlow: "out",
        notes: ""
      });
    } catch (err) {
      alert("Error saving transaction: " + err.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Sector Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Cash <span className="text-emerald-600 italic">Flow</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
            Manual Liquidity & Salary Registry
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Log Cash Flux
        </button>
      </div>

      {/* Filter Matrix */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entity Lookup</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by Employee..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
              value={filters.employeeName}
              onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Flux Category</label>
          <select 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="salary">Salary</option>
            <option value="daily_wage">Daily Wage</option>
            <option value="cash_purchase">Cash Purchase</option>
            <option value="opening_balance">Opening Balance</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
          <input 
            type="date" 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
          <input 
            type="date" 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20"><HammerLoader /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Flux (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900">{new Date(tx.date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                        tx.type === 'salary' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tx.type.replace('_', ' ')}
                      </span>
                      {tx.notes && <p className="text-[9px] text-slate-400 mt-1 italic">{tx.notes}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {tx.employeeName ? (
                          <>
                            <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-bold">
                              {tx.employeeName[0].toUpperCase()}
                            </div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{tx.employeeName}</p>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-300 uppercase italic font-bold">General Flux</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={`text-sm font-black ${tx.transactionFlow === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.transactionFlow === 'in' ? '+' : '-'} {tx.amount.toLocaleString()}
                      </p>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center">
                      <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">No Cash Flux Recorded</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Entry Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="New Cash Flux Registration"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3"/> Timeline</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Banknote className="w-3 h-3"/> Classification</label>
                  <select 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="salary">Salary</option>
                    <option value="daily_wage">Daily Wage</option>
                    <option value="cash_purchase">Cash Purchase</option>
                    <option value="opening_balance">Opening Balance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Magnitude (Amount)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="₹ 0.00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-emerald-500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Flux Direction</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, transactionFlow: 'in' })}
                      className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.transactionFlow === 'in' ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      IN
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, transactionFlow: 'out' })}
                      className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.transactionFlow === 'out' ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      OUT
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User className="w-3 h-3"/> Entity Name (e.g. Employee)</label>
                <input 
                  type="text" 
                  placeholder="Employee or Supplier Name..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText className="w-3 h-3"/> Internal Notes</label>
                <textarea 
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl active:scale-95"
              >
                Initialize Flux Protocol
              </button>
            </form>
          </Modal>
        </div>
    </AppLayout>
  );
};

export default CashManagement;
