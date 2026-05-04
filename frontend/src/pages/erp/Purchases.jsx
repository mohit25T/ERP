import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import { 
  ShoppingCart, Search, Package2, Calendar, IndianRupee, Truck, 
  CheckCircle2, Clock, AlertCircle, X, ExternalLink, Filter, Plus,
  Wallet, CreditCard, History, Trash2, TrendingDown, ArrowDownLeft,
  ArrowUpRight, ShieldCheck, Zap, Download, Anchor, Box
} from "lucide-react";
import Modal from "../../components/common/Modal";
import HammerLoader from "../../components/common/HammerLoader";
import { api, paymentApi } from "../../api/erpApi";
import unitsUtil from "../../utils/units";

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
  const normalizedQuantity = unitsUtil.normalizeToPieces(Number(formData.quantity) || 1, formData.unit);
  const totalTaxable = (Number(formData.taxableAmount) || 0) * normalizedQuantity;
  const gstAmount = (totalTaxable * gstRate) / 100;
  const totalAmount = totalTaxable + gstAmount;

  return (
    <AppLayout>
      <div className="space-y-6 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center shadow-sm border border-slate-100">
                 <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Purchases</h2>
                 <p className="text-sm font-medium text-slate-500">Manage inward logistics, purchase orders, and supplier payments</p>
              </div>
           </div>

           <button onClick={() => setIsModalOpen(true)} className="erp-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Purchase Order
           </button>
        </div>

        {/* Global Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="p-5 bg-white rounded-md border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-sm font-semibold text-slate-500">Total Capital Outflow</p>
                 <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <TrendingDown className="w-4 h-4" />
                 </div>
              </div>
              <div>
                 <h3 className="text-2xl font-bold text-slate-900">₹{(purchases.reduce((acc, p) => acc + p.totalAmount, 0) / 100000).toFixed(1)}L</h3>
                 <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                    Procurement acquisition value (MTD)
                 </p>
              </div>
           </div>
           
           <div className="p-5 bg-white rounded-md border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-sm font-semibold text-slate-500">Pending Deliveries</p>
                 <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                    <Clock className="w-4 h-4" />
                 </div>
              </div>
              <div>
                 <h3 className="text-2xl font-bold text-slate-900">{purchases.filter(p => p.status === 'pending').length} Orders</h3>
                 <p className="text-xs font-medium text-orange-600 mt-1 flex items-center gap-1">
                    Awaiting inward receipts
                 </p>
              </div>
           </div>

           <div className="p-5 bg-primary/5 rounded-md border border-primary/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-sm font-semibold text-primary">Creditor Balance</p>
                 <div className="p-2 bg-primary/20 rounded-lg text-primary">
                    <Wallet className="w-4 h-4" />
                 </div>
              </div>
              <div>
                 <h3 className="text-2xl font-bold text-slate-900">₹{(purchases.reduce((acc, p) => acc + (p.totalAmount - p.amountPaid), 0) / 1000).toFixed(1)}K</h3>
                 <p className="text-xs font-medium text-primary/80 mt-1 flex items-center gap-1">
                    Pending next cycle settlement
                 </p>
              </div>
           </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden mb-20">
           <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full max-w-sm">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    type="text"
                    placeholder="Search supplier, GSTIN or material..."
                    className="erp-input w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                 <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2.5 rounded-md border transition-colors ${showFilters ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    title="Filters"
                 >
                    <Filter className="w-4 h-4" />
                 </button>
                 <button className="p-2.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors" title="Export">
                    <Download className="w-4 h-4" />
                 </button>
              </div>
           </div>

           {/* Filters */}
           {showFilters && (
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-6 items-end animate-in fade-in slide-in-from-top-2">
                 <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchase Status</p>
                    <div className="flex flex-wrap gap-2">
                       {['all', 'pending', 'received'].map(status => (
                          <button 
                             key={status}
                             onClick={() => setFilterStatus(status)}
                             className={`px-4 py-2 rounded-md text-sm font-semibold transition-all border capitalize ${filterStatus === status ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                          >
                             {status}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex-1 flex justify-end">
                    <button 
                       onClick={() => { setFilterStatus("all"); setSearchTerm(""); }}
                       className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2"
                    >
                       <Trash2 className="w-4 h-4" /> Clear Filters
                    </button>
                 </div>
              </div>
           )}

           <div className="overflow-x-auto">
              {loading ? (
                <HammerLoader />
              ) : filteredPurchases.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center text-slate-500">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Anchor className="w-8 h-8 text-slate-300" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-1">No purchases found</h3>
                   <p className="text-sm font-medium">Adjust your search or filters to find what you're looking for.</p>
                </div>
              ) : (
                <table className="erp-table">
                   <thead>
                      <tr>
                         <th>PO Overview</th>
                         <th>Supplier Details</th>
                         <th className="text-center">Quantity & Status</th>
                         <th className="text-center">Payment Status</th>
                         <th className="text-right">Total Amount</th>
                         <th className="text-center">Actions</th>
                      </tr>
                   </thead>
                   <tbody>
                      <AnimatePresence mode="popLayout">
                        {filteredPurchases.map((p, index) => (
                          <motion.tr 
                            key={p._id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.02 }}
                          >
                           <td>
                              <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-md flex items-center justify-center ${p.status === 'received' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                    <Box className="w-5 h-5" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900">PO-{p._id ? p._id.slice(-6).toUpperCase() : "LEGACY"}</span>
                                    <span className="text-xs font-semibold text-slate-500 mt-0.5">{new Date(p.createdAt).toLocaleDateString()}</span>
                                 </div>
                              </div>
                           </td>
                           <td>
                              <div className="flex flex-col">
                                 <span className="text-sm font-bold text-slate-900">{p.material?.name || p.material || "Unknown Material"}</span>
                                 <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                                    <span className="text-xs font-semibold text-slate-500">{p.supplier?.company || p.supplier?.name || "Unknown Supplier"}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-medium ml-1 border border-slate-200">{p.supplier?.gstin || 'No GSTIN'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                 <span className="text-sm font-bold text-slate-900">{p.quantity} <span className="opacity-60 text-xs font-medium">{p.unit}</span></span>
                                 <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                    p.status === 'received' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                    p.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                                 }`}>
                                    {p.status}
                                 </span>
                              </div>
                           </td>
                           <td className="text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                 {/* Progress Bar */}
                                 <div className="flex items-center gap-2">
                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                       <div
                                          className={`h-full rounded-full ${p.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                          style={{ width: `${p.totalAmount > 0 ? Math.min((p.amountPaid / p.totalAmount) * 100, 100) : 0}%` }}
                                       />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500">
                                       {p.totalAmount > 0 ? Math.round((p.amountPaid / p.totalAmount) * 100) : 0}%
                                    </span>
                                 </div>
                                 {/* Paid / Balance */}
                                 <div className="text-center">
                                    <p className="text-xs font-bold text-emerald-600">
                                       Paid: ₹{(p.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs font-semibold text-rose-500">
                                       Bal: ₹{(p.totalAmount - (p.amountPaid || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                 </div>
                                 {/* Status + Action */}
                                 <div className="flex flex-col items-center gap-1 w-full max-w-[100px]">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border w-full text-center ${
                                       p.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                       p.paymentStatus === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                       'bg-rose-50 text-rose-700 border-rose-100'
                                    }`}>
                                       {p.paymentStatus || 'unpaid'}
                                    </span>
                                    {p.paymentStatus !== 'paid' && (
                                       <button
                                          onClick={() => { setSelectedPurchase(p); setIsPaymentModalOpen(true); }}
                                          className="w-full py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-md hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-1"
                                       >
                                          <Wallet className="w-3 h-3" /> Pay Now
                                       </button>
                                    )}
                                 </div>
                              </div>
                           </td>
                           <td className="text-right">
                              <div className="flex flex-col items-end gap-1">
                                 <span className="text-base font-bold text-slate-900">₹{p.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</span>
                                 <span className="text-xs font-medium text-slate-500">Incl. ₹{p.gstAmount?.toLocaleString('en-IN', { minimumFractionDigits: 1 })} GST</span>
                              </div>
                           </td>
                           <td className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                 {p.status === 'pending' && (
                                    <button 
                                       onClick={() => handleUpdateStatus(p._id, "received")} 
                                       className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md hover:bg-emerald-700 transition-colors shadow-sm"
                                       title="Mark as Received"
                                    >
                                       <CheckCircle2 className="w-3 h-3" /> Inward Stock
                                    </button>
                                 )}
                                 <button onClick={() => fetchPaymentHistory(p._id)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-md transition-colors border border-transparent hover:border-slate-200" title="Payment Timeline"><History className="w-4 h-4" /></button>
                                 <button onClick={() => handleDeletePurchase(p._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors border border-transparent hover:border-slate-200" title="Delete Order"><Trash2 className="w-4 h-4" /></button>
                              </div>
                           </td>
                        </motion.tr>
                      ))}
                      </AnimatePresence>
                   </tbody>
                </table>
              )}
           </div>
        </div>

      </div>

      {/* Modals */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Purchase Order">
        <form onSubmit={handleCreatePurchase} className="p-6 space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">Supplier</label>
                 <select 
                    required 
                    className="erp-input"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                 >
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.company} ({s.name})</option>)}
                 </select>
              </div>
              <div className="col-span-2">
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">Material Name</label>
                 <input 
                    required 
                    className="erp-input"
                    placeholder="Enter material or reference name..."
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                 />
              </div>
              <div>
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">Quantity</label>
                 <input 
                    required type="number" 
                    className="erp-input" 
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                 />
              </div>
              <div>
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">Unit</label>
                 <select 
                    className="erp-input"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                 >
                    <option value="kg">KILOGRAM (KG)</option>
                    <option value="gram">GRAM (GM)</option>
                    <option value="dagina">DAGINA (BAG/UNIT)</option>
                    <option value="pcs">PIECES (PCS)</option>
                    <option value="meters">METERS (MTR)</option>
                    <option value="tons">TONS (TON)</option>
                    <option value="mts">MTS</option>
                    <option value="amount">VALUATION (AMT)</option>
                 </select>
              </div>
              <div>
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">Unit Base Rate (₹)</label>
                 <input 
                    required type="number" 
                    className="erp-input"
                    value={formData.taxableAmount}
                    onChange={(e) => setFormData({ ...formData, taxableAmount: e.target.value })}
                 />
              </div>
              <div>
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">GST Rate (%)</label>
                 <select 
                    className="erp-input"
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                 >
                    <option value="18">18%</option>
                    <option value="12">12%</option>
                    <option value="5">5%</option>
                    <option value="0">0%</option>
                 </select>
              </div>
           </div>
           
           <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
              <div className="flex justify-between items-center">
                 <div>
                    <p className="text-xs font-semibold text-slate-500 mb-0.5">Total Amount (Incl. GST)</p>
                    <p className="text-2xl font-bold text-slate-900">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-medium text-slate-500">GST Impact: ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</p>
                 </div>
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="erp-button-secondary">Cancel</button>
              <button type="submit" className="erp-button-primary">Save Purchase Order</button>
           </div>
        </form>
      </Modal>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Payment">
        <div className="p-6 space-y-6">
           <div className="p-4 bg-slate-50 rounded-md border border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white rounded-md border border-slate-100">
                      <Wallet className="w-5 h-5 text-emerald-600" />
                 </div>
                 <div>
                    <p className="text-xs font-semibold text-slate-500">Remaining Balance</p>
                 </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900">₹{selectedPurchase ? (selectedPurchase.totalAmount - selectedPurchase.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 1 }) : 0}</h3>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">Payment Amount (₹)</label>
                 <div className="relative">
                    <input 
                       type="number" 
                       className="erp-input !text-lg font-bold"
                       value={paymentAmount}
                       onChange={(e) => setPaymentAmount(e.target.value)}
                       placeholder="0.00"
                     />
                     <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5">
                        {['25', '50', '100'].map(p => (
                           <button key={p} onClick={() => handlePercentChange(p)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-bold transition-all">{p}%</button>
                        ))}
                     </div>
                  </div>
               </div>
               <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Payment Date</label>
                  <input type="date" className="erp-input" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
               </div>
               <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Reference Note</label>
                  <input className="erp-input" placeholder="UTR / Ref ID" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
               </div>
            </div>
 
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
               <button disabled={formLoading} onClick={() => setIsPaymentModalOpen(false)} className="erp-button-secondary">Cancel</button>
               <button disabled={formLoading} onClick={handleAddPayment} className="erp-button-primary">
                  {formLoading ? "Processing..." : `Confirm Payment`}
               </button>
            </div>
         </div>
       </Modal>
 
       <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Payment Timeline">
         <div className="p-6">
            <div className="space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
               {paymentHistory.map((event, idx) => (
                 <div key={idx} className="relative pl-12">
                    <div className={`absolute left-1.5 top-0.5 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${event.type === 'milestone' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-500 text-white'}`}>
                       {event.type === 'milestone' ? <Box className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                    </div>
                    <div>
                       <p className="text-xs font-semibold text-slate-500 mb-0.5">{new Date(event.date).toLocaleDateString()} — {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       <h4 className={`text-base font-bold ${event.type === 'milestone' ? 'text-slate-900' : 'text-emerald-600'}`}>
                          {event.type === 'milestone' ? event.description : `Payment: ₹${event.amount.toLocaleString('en-IN', { minimumFractionDigits: 1 })}`}
                       </h4>
                       {event.description && event.type !== 'milestone' && <p className="text-xs font-medium text-slate-500 mt-1">Ref: {event.description}</p>}
                    </div>
                 </div>
               ))}
            </div>
            <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
               <button onClick={() => setIsHistoryModalOpen(false)} className="erp-button-secondary">Close Options</button>
            </div>
         </div>
       </Modal>
 
     </AppLayout>
   );
 };
 
 export default Purchases;
