import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import { ShoppingCart, Search, Package2, Calendar, IndianRupee, Truck, CheckCircle2, Clock, AlertCircle, X, ExternalLink, Filter, Plus } from "lucide-react";
import Modal from "../components/common/Modal";
import { api, paymentApi } from "../api/erpApi";
import { Wallet, CreditCard, History } from "lucide-react";

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplier: "",
    material: "",
    quantity: 1,
    taxableAmount: 0
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
      // Filter only raw materials or just all products if type not set
      setProducts(prodRes.data);
      setSuppliers(supRes.data);
    } catch (err) {
      console.error("Error fetching purchase data:", err);
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
      await api.post("/purchases", formData);
      fetchData();
      setIsModalOpen(false);
      setFormData({ supplier: "", material: "", quantity: 1, taxableAmount: 0 });
    } catch (err) {
      console.error("Error creating purchase:", err);
      alert("Failed to create purchase. Check console.");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/purchases/${id}/status`, { status });
      fetchData();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleAddPayment = async () => {
    try {
      const balance = (selectedPurchase.totalAmount - selectedPurchase.amountPaid).toFixed(2);
      if (Number(paymentAmount) > Number(balance)) {
        alert(`Warning: Payment amount (₹${paymentAmount}) exceeds the balance payable (₹${balance}).`);
        return;
      }
      setFormLoading(true);
      await paymentApi.addPurchasePayment(selectedPurchase._id, {
        amount: Number(paymentAmount),
        date: paymentDate,
        description: paymentNote
      });
      setIsPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentPercent("");
      setPaymentNote("");
      fetchData();
    } catch (err) {
      alert("Payment recording failed: " + (err.response?.data?.msg || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const fetchPaymentHistory = async (purchaseId) => {
    try {
      setFormLoading(true);
      const res = await paymentApi.getHistory("purchase", purchaseId);
      setPaymentHistory(res.data);
      setIsHistoryModalOpen(true);
    } catch (err) {
      alert("Failed to fetch payment history");
    } finally {
      setFormLoading(false);
    }
  };

  const handlePercentChange = (percent) => {
    setPaymentPercent(percent);
    if (selectedPurchase && percent) {
      const amount = (selectedPurchase.totalAmount * (Number(percent) / 100)).toFixed(2);
      setPaymentAmount(amount);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "received": return "bg-green-50 text-green-700 border-green-100 ring-4 ring-green-500/5";
      case "pending": return "bg-orange-50 text-orange-700 border-orange-100 ring-4 ring-orange-500/5";
      case "cancelled": return "bg-red-50 text-red-600 border-red-100 ring-4 ring-red-500/5";
      default: return "bg-gray-50 text-gray-600";
    }
  };

  const selectedProduct = products.find(p => p._id === formData.material);
  const gstRate = selectedProduct?.gstRate || 18;
  const gstAmount = (formData.taxableAmount * gstRate) / 100;
  const totalAmount = Number(formData.taxableAmount) + gstAmount;

  return (
    <AppLayout>
      <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-tr from-orange-600 to-red-600 rounded-3xl shadow-xl shadow-orange-500/20 -rotate-2 hover:rotate-0 transition-transform duration-500">
               <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Inward Ledger</h2>
              <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></span>
                Procurement & Inventory Receipt
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="group relative px-8 py-4 bg-gray-900 rounded-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl hover:shadow-orange-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Plus className="w-5 h-5 text-white relative z-10" />
            <span className="text-white font-black text-sm relative z-10">Record Inward Stock</span>
          </button>
        </div>

        {/* Main Ledger Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100/50 backdrop-blur-xl overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-gray-50/50 to-white">
            <div className="flex items-center gap-8">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Purchases</span>
                  <span className="text-2xl font-black text-gray-900 tabular-nums">{purchases.length}</span>
               </div>
               <div className="w-px h-10 bg-gray-100"></div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Inward</span>
                  <span className="text-2xl font-black text-orange-600 tabular-nums">
                    {purchases.filter(p => p.status === "pending").length}
                  </span>
               </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center">
                <div className="inline-block w-12 h-12 border-4 border-gray-100 border-t-orange-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-400 font-bold uppercase text-[10px] tracking-widest tracking-widest">Opening Purchase Registry...</p>
              </div>
            ) : purchases.length === 0 ? (
              <div className="p-20 text-center">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package2 className="w-10 h-10 text-gray-300" />
                 </div>
                 <p className="text-gray-900 font-black text-xl mb-2">Registry Empty</p>
                 <p className="text-gray-400 text-sm max-w-xs mx-auto font-medium">Capture incoming raw materials and finished stock from vendors to track procurement GST and inventory levels.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                    <th className="px-8 py-4">Inward Details</th>
                    <th className="px-8 py-4">Vendor & GST</th>
                    <th className="px-8 py-4 text-center">Qty / Status</th>
                    <th className="px-8 py-4 text-center">Payment</th>
                    <th className="px-8 py-4 text-right">Value (₹)</th>
                    <th className="px-8 py-4 text-right pr-12">Flow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchases.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/80 transition-all group">
                      <td className="px-8 py-6">
                         <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">SKU: {p.material?.sku}</span>
                            <span className="font-black text-gray-900 group-hover:text-orange-600 transition-colors uppercase tracking-tighter">{p.material?.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[10px] text-orange-500 font-bold uppercase">{p.material?.type === 'raw_material' ? '⛓️ Raw Material' : '📦 Finished Good'}</span>
                               <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                               <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Stock: {p.material?.stock || 0}</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="font-black text-gray-700 text-sm">{p.supplier?.company || p.supplier?.name}</div>
                          <div className="text-[10px] font-black text-blue-500 bg-blue-50 inline-block px-2 py-0.5 rounded uppercase tracking-widest border border-blue-100">
                             {p.supplier?.gstin || 'UNREGISTERED'}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <div className="flex flex-col items-center gap-2">
                            <span className="px-4 py-1 bg-gray-100 rounded-full text-xs font-black text-gray-900">{p.quantity} Units</span>
                            <span className={`px-4 py-1.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${getStatusStyle(p.status)}`}>
                              {p.status}
                            </span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <div className="flex flex-col items-center gap-1">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                              p.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 
                              p.paymentStatus === 'partial' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'
                            }`}>
                              {p.paymentStatus}
                            </span>
                            <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                               <div 
                                 className="h-full bg-blue-500 transition-all duration-500" 
                                 style={{ width: `${Math.min((p.amountPaid / p.totalAmount) * 100, 100)}%` }}
                               ></div>
                            </div>
                            <span className="text-[8px] font-black text-gray-400 mt-0.5">₹{p.amountPaid?.toLocaleString()} PAID</span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex flex-col">
                            <span className="text-gray-900 font-black tracking-tight text-lg">₹{p.totalAmount?.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase text-right">GST: ₹{p.gstAmount?.toLocaleString('en-IN')}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right pr-8">
                         <div className="flex justify-end gap-2">
                            {p.status === "pending" && (
                              <>
                                <button 
                                  onClick={() => handleUpdateStatus(p._id, "received")}
                                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-105 transition-transform"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Receive
                                </button>
                                <button 
                                  onClick={() => handleUpdateStatus(p._id, "cancelled")}
                                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-red-600 hover:border-red-200 transition-all"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Cancel
                                </button>
                              </>
                            )}
                            {p.paymentStatus !== 'paid' && !['cancelled', 'refunded'].includes(p.status) && (
                               <button 
                                 onClick={() => { setSelectedPurchase(p); setIsPaymentModalOpen(true); }}
                                 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
                               >
                                  <Wallet className="w-3.5 h-3.5" />
                                  Payment
                               </button>
                            )}
                            <button 
                               onClick={() => fetchPaymentHistory(p._id)}
                               className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-gray-900 transition-all font-bold"
                             >
                                <History className="w-3.5 h-3.5" />
                                Timeline
                             </button>
                            {p.status === "received" && (
                              <div className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase border border-green-100 font-bold whitespace-nowrap">
                                 Received: {new Date(p.receivedAt || p.updatedAt).toLocaleDateString()}
                              </div>
                            )}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Record Purchase Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Document Inward Stock">
          <form onSubmit={handleCreatePurchase} className="space-y-6 pt-4">
             <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                   <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Select Vendor / Supplier</label>
                   <select 
                     required
                     className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                     value={formData.supplier}
                     onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                   >
                      <option value="">Choose Supplier...</option>
                      {suppliers.map(s => <option key={s._id} value={s._id}>{s.company} ({s.name})</option>)}
                   </select>
                </div>

                <div className="col-span-2">
                   <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Select Material / Product</label>
                   <select 
                     required
                     className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                     value={formData.material}
                     onChange={(e) => setFormData({...formData, material: e.target.value})}
                   >
                      <option value="">Choose Item...</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock})</option>)}
                   </select>
                   {selectedProduct && (
                      <div className="mt-2 ml-4 flex items-center gap-2">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available in Warehouse:</span>
                         <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${selectedProduct.stock <= 5 ? "bg-red-50 text-red-600 border border-red-100" : "bg-gray-100 text-gray-600"}`}>
                            {selectedProduct.stock} Units
                         </span>
                      </div>
                   )}
                </div>

                <div className="col-span-2 md:col-span-1">
                   <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Inward Quantity</label>
                   <input 
                     required
                     type="number"
                     className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                     value={formData.quantity}
                     onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                   />
                </div>

                <div className="col-span-2 md:col-span-1">
                   <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Unit Taxable Price (₹)</label>
                   <input 
                     required
                     type="number"
                     className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                     value={formData.taxableAmount}
                     onChange={(e) => setFormData({...formData, taxableAmount: e.target.value})}
                   />
                </div>

                {/* Real-time Summary Card */}
                <div className="col-span-2 bg-orange-50 rounded-3xl p-6 border-2 border-orange-100/50 space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                       <span>Procurement Summary</span>
                       <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded">{gstRate}% GST Rate Applied</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                           <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Total Inward GST</p>
                           <p className="text-xl font-black text-gray-900 tabular-nums">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-orange-500 font-black uppercase mb-1 underline underline-offset-4 decoration-2">Net Purchase Value</p>
                           <p className="text-3xl font-black text-orange-600 tabular-nums tracking-tighter">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>
             </div>

             <div className="flex gap-4 pt-4 border-t border-gray-50">
               <button 
                 type="button" 
                 onClick={() => setIsModalOpen(false)}
                 className="flex-1 py-4 bg-white text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all"
               >
                 Discard
               </button>
               <button 
                 type="submit"
                 className="flex-1 py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-400/20 hover:bg-orange-600 active:scale-95 transition-all"
               >
                 Confirm Inward Stock
               </button>
            </div>
          </form>
        </Modal>

        {/* Payment Modal */}
        <Modal 
          isOpen={isPaymentModalOpen} 
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentAmount("");
            setPaymentPercent("");
            setPaymentNote("");
          }} 
          title="Record Vendor Payment"
        >
          <div className="p-6">
             {selectedPurchase && (
               <div className="space-y-6">
                  <div className="p-6 bg-orange-50 rounded-[2rem] border border-orange-100">
                     <p className="text-[10px] font-black uppercase text-orange-400 tracking-widest mb-2 text-center">Remaining Balance</p>
                     <p className="text-4xl font-black text-orange-900 text-center tracking-tighter italic">₹{(selectedPurchase.totalAmount - selectedPurchase.amountPaid).toLocaleString('en-IN')}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Amount (₹)</label>
                      <input 
                        type="number"
                        max={selectedPurchase ? (selectedPurchase.totalAmount - selectedPurchase.amountPaid).toFixed(2) : undefined}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-lg font-black text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/10 transition-all font-mono"
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          const balance = selectedPurchase.totalAmount - selectedPurchase.amountPaid;
                          if (Number(val) > balance) {
                             setPaymentAmount(balance.toFixed(2));
                             setPaymentPercent("100");
                          } else {
                             setPaymentAmount(val);
                             setPaymentPercent("");
                          }
                        }}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Percent (%)</label>
                      <input 
                        type="number"
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-lg font-black text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/10 transition-all font-mono"
                        placeholder="%"
                        value={paymentPercent}
                        onChange={(e) => handlePercentChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                     <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Transaction Date</label>
                     <input 
                       type="date"
                       className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-xs font-black text-gray-900 outline-none hover:bg-gray-100 transition-colors"
                       value={paymentDate}
                       onChange={(e) => setPaymentDate(e.target.value)}
                     />
                  </div>

                  <div>
                     <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Transaction Note</label>
                     <textarea 
                       className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold text-gray-900 outline-none h-20 resize-none placeholder:text-gray-300 focus:bg-white focus:ring-1 focus:ring-gray-100"
                       placeholder="Enter reference or note..."
                       value={paymentNote}
                       onChange={(e) => setPaymentNote(e.target.value)}
                     />
                  </div>

                  <div className="flex gap-4">
                     <button 
                       onClick={() => setIsPaymentModalOpen(false)}
                       className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all font-bold"
                     >Cancel</button>
                     <button 
                       onClick={handleAddPayment}
                       disabled={formLoading || !paymentAmount}
                       className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/30 active:scale-95 disabled:opacity-50 font-bold"
                     >
                       {formLoading ? "Saving..." : `Pay ₹${Number(paymentAmount).toLocaleString()}`}
                     </button>
                  </div>
               </div>
             )}
          </div>
        </Modal>

        {/* Payment History Modal */}
        <Modal 
          isOpen={isHistoryModalOpen} 
          onClose={() => setIsHistoryModalOpen(false)} 
          title="Payment History"
        >
          <div className="p-8">
             {paymentHistory.length === 0 ? (
               <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No transaction history</p>
               </div>
             ) : (
               <div className="relative border-l-4 border-gray-100 ml-6 space-y-10 py-2">
                  {paymentHistory.map((item, idx) => (
                     <div key={item._id} className="relative pl-10 group">
                        <div className="absolute -left-[14px] top-0 w-6 h-6 bg-white border-4 border-orange-600 rounded-full group-hover:scale-125 transition-transform shadow-sm"></div>
                        <div>
                           <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">
                              {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                           </p>
                           <h4 className="text-2xl font-black text-gray-900 tracking-tighter tabular-nums">₹{item.amount.toLocaleString()}</h4>
                           <p className="text-xs font-bold text-gray-400 mt-1 italic leading-relaxed">"{item.description || 'No notes provided'}"</p>
                        </div>
                     </div>
                  ))}
               </div>
             )}
             <button 
               onClick={() => setIsHistoryModalOpen(false)}
               className="w-full mt-12 py-5 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black active:scale-95 transition-all shadow-xl shadow-gray-200"
             >Close Record</button>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Purchases;
