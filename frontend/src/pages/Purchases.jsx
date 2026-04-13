import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import { 
  ShoppingCart, Search, Package2, Calendar, IndianRupee, Truck, 
  CheckCircle2, Clock, AlertCircle, X, ExternalLink, Filter, Plus,
  Wallet, CreditCard, History, Trash2, TrendingDown, ArrowDownLeft,
  ArrowUpRight, ShieldCheck, Zap, Download, Anchor, Box
} from "lucide-react";
import Modal from "../components/common/Modal";
import { api, paymentApi } from "../api/erpApi";

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplier: "",
    material: "",
    category: "Raw Materials",
    quantity: 1,
    unit: "kg",
    taxableAmount: 0,
    gstRate: 18
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentPercent, setPaymentPercent] = useState("");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, prodRes, supRes] = await Promise.all([
        api.get("/purchases"),
        api.get("/products"),
        api.get("/suppliers")
      ]);
      setPurchases(pRes.data);
      setProducts(prodRes.data);
      setSuppliers(supRes.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Registry access failure.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      await api.post("/purchases", formData);
      fetchData();
      setIsModalOpen(false);
      setFormData({ supplier: "", material: "", category: "Raw Materials", quantity: 1, taxableAmount: 0, unit: "kg", gstRate: 18 });
    } catch (err) {
      alert("Validation Error: Check registry parameters");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/purchases/${id}/status`, { status });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePurchase = async (id) => {
    if (window.confirm("CRITICAL: Permanent deletion of inward record? Stock levels will be recalculated.")) {
      try {
        await api.delete(`/purchases/${id}`);
        fetchData();
      } catch (err) {
        alert("Deletion failed: Inventory lock detected.");
      }
    }
  };

  const handleAddPayment = async () => {
    try {
      setFormLoading(true);
      await paymentApi.addPurchasePayment(selectedPurchase._id, {
        amount: Number(paymentAmount),
        date: paymentDate,
        description: paymentNote
      });
      setIsPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentNote("");
      fetchData();
    } catch (err) {
      alert("Transaction failed: " + (err.response?.data?.msg || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const fetchPaymentHistory = async (purchaseId) => {
    try {
      setFormLoading(true);
      const res = await paymentApi.getHistory("purchase", purchaseId);
      const purchase = purchases.find(p => p._id === purchaseId);
      const events = [
        { _id: "birth", date: purchase.createdAt, type: 'milestone', amount: purchase.totalAmount, description: "Procurement Initialized" },
        ...res.data.map(p => ({ ...p, type: 'payment' }))
      ];
      if (purchase.status === 'received') {
        events.push({ _id: "completion", date: purchase.receivedAt || purchase.updatedAt, type: 'milestone', amount: 0, description: "Full Inward Stock Received" });
      }
      events.sort((a, b) => new Date(a.date) - new Date(b.date));
      setPaymentHistory(events);
      setIsHistoryModalOpen(true);
    } catch (err) {
      alert("Timeline retrieval failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const handlePercentChange = (percent) => {
    setPaymentPercent(percent);
    if (selectedPurchase && percent) {
      const balance = selectedPurchase.totalAmount - (selectedPurchase.amountPaid || 0);
      setPaymentAmount((balance * (Number(percent) / 100)).toFixed(2));
    }
  };

  const filteredPurchases = purchases.filter(p => {
    const searchLow = searchTerm.toLowerCase();
    const matchSearch = (p._id?.toString() || "").toLowerCase().includes(searchLow) ||
           (p.material?.name || p.material || "").toLowerCase().includes(searchLow) ||
           (p.supplier?.company || p.supplier?.name || "").toLowerCase().includes(searchLow) ||
           (p.supplier?.gstin || "").toLowerCase().includes(searchLow);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;

    return matchSearch && matchStatus;
  });

  const selectedProduct = products.find(p => p.name.toLowerCase() === (formData.material?.toLowerCase() || ""));
  const gstRate = Number(formData.gstRate) || 18;
  const totalTaxable = (Number(formData.taxableAmount) || 0) * (Number(formData.quantity) || 1);
  const gstAmount = (totalTaxable * gstRate) / 100;
  const totalAmount = totalTaxable + gstAmount;

  return (
    <AppLayout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Elite Command Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-sm border border-emerald-500/10">
                 <Anchor className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                 <h2 className="text-5xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Procurement <span className="text-emerald-600 not-italic">Terminal</span></h2>
                 <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-1.5">
                       <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Inward Logistics & Vendor Settlement Hub</span>
                 </div>
              </div>
           </div>

           <button onClick={() => setIsModalOpen(true)} className="erp-button-primary !py-5 !bg-slate-900 !rounded-[2rem] hover:!bg-black group">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Initialize Inward Stock
           </button>
        </div>

        {/* Global Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Capital Outflow (MTD)</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums italic">₹{(purchases.reduce((acc, p) => acc + p.totalAmount, 0) / 100000).toFixed(1)}L</h3>
              <div className="flex items-center gap-2 mt-4 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                 <TrendingDown className="w-3.5 h-3.5" />
                 <span>Strategic Acquisition</span>
              </div>
           </div>
           <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Supply Chain Risk</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums underline decoration-orange-200 decoration-8 underline-offset-4">{purchases.filter(p => p.status === 'pending').length} Nodes</h3>
              <div className="flex items-center gap-2 mt-4 text-orange-500 font-bold text-[10px] uppercase tracking-widest">
                 <Clock className="w-3.5 h-3.5 animate-pulse" />
                 <span>Pending Inward Receipts</span>
              </div>
           </div>
           <div className="p-10 bg-slate-900 rounded-[3rem] shadow-2xl shadow-slate-900/20 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Zap className="w-16 h-16 text-white rotate-12" />
              </div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">Creditor Balance</p>
              <h3 className="text-4xl font-black text-white tracking-tightest tabular-nums">₹{(purchases.reduce((acc, p) => acc + (p.totalAmount - p.amountPaid), 0) / 1000).toFixed(1)}K</h3>
              <div className="flex items-center gap-2 mt-4 text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
                 <Wallet className="w-3.5 h-3.5" />
                 <span>Next Cycle Settlement</span>
              </div>
           </div>
        </div>

        {/* Unified Registry Container */}
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden mb-20">
           <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative group w-full max-w-md">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                 <input 
                    type="text"
                    placeholder="Registry lookup: Vendor, GSTIN or Material UID..."
                    className="w-full pl-14 pr-8 py-5 bg-slate-50 border-transparent rounded-[2rem] text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-4 rounded-2xl transition-all active:scale-95 ${showFilters ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                  <button className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-all active:scale-95">
                    <Download className="w-5 h-5" />
                  </button>
               </div>
            </div>

            {/* Advanced Filter Manifold */}
            {showFilters && (
               <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-50 flex flex-wrap gap-10 animate-in slide-in-from-top-2 duration-500">
                  <div className="space-y-4">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Procurement Lifecycle</p>
                     <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'received'].map(status => (
                           <button 
                              key={status}
                              onClick={() => setFilterStatus(status)}
                              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filterStatus === status ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                           >
                              {status}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex-1 flex justify-end items-end pb-1">
                     <button 
                        onClick={() => { setFilterStatus("all"); setSearchTerm(""); }}
                        className="text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                     >
                        <Trash2 className="w-3.5 h-3.5" /> Synchronize All
                     </button>
                  </div>
               </div>
            )}

           <div className="overflow-x-auto">
              {loading ? (
                <div className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] animate-pulse text-[10px]">Accessing Master Registry...</div>
              ) : (
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
                         <th className="px-12 py-8">Procurement UID</th>
                         <th className="px-12 py-8">Inward Context</th>
                         <th className="px-12 py-8 text-center">Qty / Lifecycle</th>
                         <th className="px-12 py-8 text-center">Settlement Status</th>
                         <th className="px-12 py-8 text-right pr-20">Financial Value</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredPurchases.map((p) => (
                        <tr key={p._id} className="group hover:bg-slate-50/80 transition-all duration-500">
                           <td className="px-12 py-10">
                              <div className="flex items-center gap-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 ${p.status === 'received' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                    <Box className="w-6 h-6" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-900 tracking-tightest">PO-{p._id.slice(-6).toUpperCase()}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(p.createdAt).toLocaleDateString()}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-12 py-10">
                              <div className="flex flex-col">
                                 <span className="text-base font-black text-slate-900 tracking-tightest group-hover:text-emerald-600 transition-colors uppercase italic">{p.material?.name || p.material}</span>
                                 <div className="flex items-center gap-2 mt-1.5">
                                    <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.supplier?.company || p.supplier?.name}</span>
                                    <span className="text-[8px] px-2 py-0.5 bg-slate-100 rounded text-slate-400">{p.supplier?.gstin || 'B2C'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-12 py-10 text-center">
                              <div className="flex flex-col items-center gap-3">
                                 <span className="text-sm font-black text-slate-900 tracking-tightest">{p.quantity} <span className="opacity-40 text-[10px]">{p.unit}</span></span>
                                 <span className={`px-4 py-1.5 rounded-2xl text-[8px] font-black uppercase tracking-[0.1em] border transition-all ${
                                    p.status === 'received' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 
                                    p.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse' : 'bg-rose-50 text-rose-600'
                                 }`}>
                                    {p.status}
                                 </span>
                              </div>
                           </td>
                           <td className="px-12 py-10 text-center">
                              <div className="flex flex-col items-center gap-2">
                                 <div className="flex items-center gap-2 mb-1">
                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                       <div className="h-full bg-emerald-500" style={{ width: `${Math.min((p.amountPaid / p.totalAmount) * 100, 100)}%` }}></div>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400">{Math.round((p.amountPaid / p.totalAmount) * 100)}%</span>
                                 </div>
                                 <button onClick={() => { setSelectedPurchase(p); setIsPaymentModalOpen(true); }} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all">Record TX</button>
                              </div>
                           </td>
                           <td className="px-12 py-10 text-right pr-20">
                              <div className="flex items-center justify-end gap-10">
                                 <div className="flex flex-col items-end">
                                    <span className="text-2xl font-black text-slate-900 tracking-tightest tabular-nums">₹{p.totalAmount.toLocaleString()}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tax Included (₹{p.gstAmount?.toLocaleString()})</span>
                                 </div>
                                 <div className="flex items-center gap-2 transition-opacity">
                                    {p.status === 'pending' && <button onClick={() => handleUpdateStatus(p._id, "received")} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-sm"><CheckCircle2 className="w-5 h-5" /></button>}
                                    <button onClick={() => fetchPaymentHistory(p._id)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><History className="w-5 h-5" /></button>
                                    <button onClick={() => handleDeletePurchase(p._id)} className="p-3 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
                                 </div>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              )}
           </div>
        </div>

      </div>

      {/* Advanced Modals */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initialize Inward Provision">
        <form onSubmit={handleCreatePurchase} className="p-10 space-y-8">
           <div className="grid grid-cols-2 gap-8">
              <div className="col-span-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Target Logistics Entity (Supplier)</label>
                 <select 
                    required 
                    className="erp-input !py-5"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                 >
                    <option value="">Select Vendor...</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.company} ({s.name})</option>)}
                 </select>
              </div>
              <div className="col-span-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Material Node Label</label>
                 <input 
                    required 
                    className="erp-input !py-5 uppercase tabular-nums"
                    placeholder="Identify Resource SKU or Name..."
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                 />
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Resource Quantity</label>
                 <input 
                    required type="number" 
                    className="erp-input !py-5" 
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                 />
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Unit Identity</label>
                 <select 
                    className="erp-input !py-5"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                 >
                    <option value="kg">KILOGRAM (KG)</option>
                    <option value="dagina">DAGINA (UNIT)</option>
                    <option value="pcs">PIECES (PCS)</option>
                    <option value="amount">VALUATION (AMT)</option>
                 </select>
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Base Unit Rate (₹)</label>
                 <input 
                    required type="number" 
                    className="erp-input !py-5"
                    value={formData.taxableAmount}
                    onChange={(e) => setFormData({ ...formData, taxableAmount: e.target.value })}
                 />
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Tax Index (GST%)</label>
                 <select 
                    className="erp-input !py-5"
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                 >
                    <option value="18">18% (Industrial)</option>
                    <option value="12">12% (Standard)</option>
                    <option value="5">5% (Essential)</option>
                    <option value="0">0% (Exempt)</option>
                 </select>
              </div>
           </div>
           
           <div className="p-8 bg-slate-900 rounded-[3rem] shadow-2xl shadow-slate-900/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Zap className="w-12 h-12 text-white" /></div>
              <div className="flex justify-between items-end">
                 <div>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Projected Commitment</p>
                    <p className="text-3xl font-black text-white tracking-tightest tabular-nums italic">₹{totalAmount.toLocaleString()}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Calculated Flux</p>
                    <p className="text-xs font-black text-slate-400">GST Impact: ₹{gstAmount.toLocaleString()}</p>
                 </div>
              </div>
           </div>

           <div className="flex gap-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="erp-button-secondary flex-1 !py-6">Abort Entry</button>
              <button type="submit" className="erp-button-primary flex-1 !py-6 !bg-slate-900 !text-white hover:!bg-black">Authorize Inward Stock</button>
           </div>
        </form>
      </Modal>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Treasury: Disbursement Registry">
        <div className="p-10 space-y-8">
           <div className="p-10 bg-emerald-50 rounded-[3rem] border border-emerald-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-20"><Wallet className="w-10 h-10 text-emerald-600" /></div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Balance Payable</p>
              <h3 className="text-5xl font-black text-emerald-900 tracking-tightest tabular-nums">₹{selectedPurchase ? (selectedPurchase.totalAmount - selectedPurchase.amountPaid).toLocaleString() : 0}</h3>
           </div>
           
           <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Disbursement Magnitude (₹)</label>
                 <div className="relative">
                    <input 
                       type="number" 
                       className="erp-input !py-6 !text-2xl font-black tabular-nums placeholder:text-slate-200"
                       value={paymentAmount}
                       onChange={(e) => setPaymentAmount(e.target.value)}
                       placeholder="0.00"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                       {['25', '50', '100'].map(p => (
                          <button key={p} onClick={() => handlePercentChange(p)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl text-[10px] font-black transition-all">{p}%</button>
                       ))}
                    </div>
                 </div>
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Execution Date</label>
                 <input type="date" className="erp-input !py-5" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Transaction Reference</label>
                 <input className="erp-input !py-5" placeholder="UTR / Ref ID / Chq No..." value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
              </div>
           </div>

           <div className="flex gap-4 pt-4">
              <button disabled={formLoading} onClick={handleAddPayment} className="erp-button-primary w-full !py-6 !bg-slate-900 !text-white hover:!bg-black group">
                 <CreditCard className="w-5 h-5 group-hover:animate-bounce" />
                 {formLoading ? "Synchronizing..." : `Commit Disbursement: ₹${Number(paymentAmount).toLocaleString()}`}
              </button>
           </div>
        </div>
      </Modal>

      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Audit Vault: Financial Timeline">
        <div className="p-10">
           <div className="space-y-12 relative before:absolute before:left-[1.35rem] before:top-2 before:bottom-2 before:w-1 before:bg-slate-50 before:rounded-full">
              {paymentHistory.map((event, idx) => (
                <div key={idx} className="relative pl-14 group">
                   <div className={`absolute left-0 top-1 w-12 h-12 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${event.type === 'milestone' ? 'bg-slate-900 text-white' : 'bg-emerald-500 text-white'}`}>
                      {event.type === 'milestone' ? <Zap className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(event.date).toLocaleDateString()} — {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <h4 className={`text-xl font-black tracking-tightest leading-tight ${event.type === 'milestone' ? 'text-slate-900 uppercase italic' : 'text-emerald-600'}`}>
                         {event.type === 'milestone' ? event.description : `Disbursement Executed: ₹${event.amount.toLocaleString()}`}
                      </h4>
                      {event.description && event.type !== 'milestone' && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic leading-none opacity-60">REF: {event.description}</p>}
                   </div>
                </div>
              ))}
           </div>
           <button onClick={() => setIsHistoryModalOpen(false)} className="w-full mt-12 py-6 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">Exit Archive</button>
        </div>
      </Modal>

    </AppLayout>
  );
};

const ChevronRight = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>;

export default Purchases;
