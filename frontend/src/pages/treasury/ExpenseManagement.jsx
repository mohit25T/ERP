import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, Plus, Search, Trash2, Edit3, Calendar, Tag, CreditCard, FileText } from "lucide-react";
import erpApi from "../../api/erpApi";
import HammerLoader from "../../components/common/HammerLoader";
import Modal from "../../components/common/Modal";
import AppLayout from "../../components/layout/AppLayout";

const CATEGORIES = ["Tea & Snacks", "Petrol/Diesel", "Maintenance", "Office Supplies", "Rent", "Electricity", "Miscellaneous"];

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", category: "" });
  const [formData, setFormData] = useState({
    category: "Tea & Snacks",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    paymentMethod: "cash",
    description: ""
  });

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters).toString();
      const res = await erpApi.get(`/treasury/expenses?${query}`);
      setExpenses(res.data);
    } catch (err) {
      console.error("Expense Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await erpApi.put(`/treasury/expenses/${editingId}`, formData);
      } else {
        await erpApi.post("/treasury/expenses", formData);
      }
      setShowModal(false);
      fetchExpenses();
      resetForm();
    } catch (err) {
      alert("Error saving expense: " + err.message);
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense._id);
    setFormData({
      category: expense.category,
      amount: expense.amount,
      date: new Date(expense.date).toISOString().split('T')[0],
      paymentMethod: expense.paymentMethod,
      description: expense.description || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to erase this expense record?")) return;
    try {
      await erpApi.delete(`/treasury/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      alert("Error deleting record: " + err.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      category: "Tea & Snacks",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      paymentMethod: "cash",
      description: ""
    });
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Sector Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Daily <span className="text-rose-600 ">Expenses</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
            Track daily small expenses
          </p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-md font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Filter Matrix */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</label>
          <select 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:ring-2 focus:ring-rose-500"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
          <input 
            type="date" 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-rose-500"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
          <input 
            type="date" 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-rose-500"
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
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount (₹)</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-4">
                      <p className="text-xs font-black text-slate-900">{formatDate(e.date)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{e.category}</p>
                        <p className="text-[10px] font-medium text-slate-400 truncate max-w-[200px]">{e.description || 'No Description'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-widest">
                        {e.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm font-black text-rose-600">
                        ₹ {e.amount.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(e)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(e._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-md transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-20 text-center">
                      <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">No Expense Records</p>
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
        title={editingId ? "Update Expense" : "Add New Expense"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3"/> Date</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-rose-500"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Tag className="w-3 h-3"/> Category</label>
                  <select 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:ring-2 focus:ring-rose-500"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Amount</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="₹ 0.00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-black focus:ring-2 focus:ring-rose-500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CreditCard className="w-3 h-3"/> Payment Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                      className={`py-2 px-4 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.paymentMethod === 'cash' ? 'bg-slate-900 text-white border-black' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      Cash
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: 'bank' })}
                      className={`py-2 px-4 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.paymentMethod === 'bank' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      Bank
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText className="w-3 h-3"/> Description</label>
                <textarea 
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-rose-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-rose-600 text-white rounded-md font-black text-[10px] uppercase tracking-[0.3em] hover:bg-rose-700 transition-all shadow-xl active:scale-95"
              >
                Save Expense
              </button>
            </form>
          </Modal>
        </div>
    </AppLayout>
  );
};

export default ExpenseManagement;
