import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, Landmark as BankIcon, Calendar, Hash, FileText } from "lucide-react";
import erpApi from "../../api/erpApi";
import HammerLoader from "../../components/common/HammerLoader";
import Modal from "../../components/common/Modal";
import AppLayout from "../../components/layout/AppLayout";

const BankManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", bankName: "", type: "" });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    bankName: "",
    type: "credit",
    amount: "",
    referenceNumber: "",
    remarks: ""
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters).toString();
      const res = await erpApi.get(`/treasury/bank?${query}`);
      setTransactions(res.data);
    } catch (err) {
      console.error("Bank Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await erpApi.post("/treasury/bank", formData);
      setShowModal(false);
      fetchTransactions();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        bankName: "",
        type: "credit",
        amount: "",
        referenceNumber: "",
        remarks: ""
      });
    } catch (err) {
      alert("Error saving transaction: " + err.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Sector Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Bank <span className="text-indigo-600 ">Accounts</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
            Bank transaction history
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      {/* Filter Matrix */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Search Bank</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by Bank..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
              value={filters.bankName}
              onChange={(e) => setFilters({ ...filters, bankName: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transaction Type</label>
          <select 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="credit">Credit (IN)</option>
            <option value="debit">Debit (OUT)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
          <input 
            type="date" 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
          <input 
            type="date" 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20"><HammerLoader /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank & Ref</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-4">
                      <p className="text-xs font-black text-slate-900">{formatDate(tx.date)}</p>
                      <p className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-md text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <BankIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{tx.bankName}</p>
                          <p className="text-[10px] font-medium text-slate-400">REF: {tx.referenceNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                        tx.type === 'credit' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {tx.type}
                      </span>
                      {tx.remarks && <p className="text-[9px] text-slate-400 mt-1 ">{tx.remarks}</p>}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className={`text-sm font-black ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'} {tx.amount.toLocaleString()}
                      </p>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-20 text-center">
                      <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">No Transactions Found</p>
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
        title="Add Bank Entry"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3"/> Transaction Date</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BankIcon className="w-3 h-3"/> Bank Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. HDFC, SBI..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Money Movement</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'credit' })}
                      className={`py-2 px-4 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.type === 'credit' ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      Credit (IN)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'debit' })}
                      className={`py-2 px-4 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.type === 'debit' ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      Debit (OUT)
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Amount</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="₹ 0.00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-black focus:ring-2 focus:ring-indigo-500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Hash className="w-3 h-3"/> Reference Number</label>
                <input 
                  type="text" 
                  placeholder="UTR, Check No, Transaction ID..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText className="w-3 h-3"/> Internal Remarks</label>
                <textarea 
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-slate-900 text-white rounded-md font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl active:scale-95"
              >
                Save Entry
              </button>
            </form>
          </Modal>
        </div>
    </AppLayout>
  );
};

export default BankManagement;
