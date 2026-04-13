import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/common/Modal";
import OrderForm from "../components/forms/OrderForm";
import { orderApi, paymentApi, invoiceApi } from "../api/erpApi";
import { useAuth } from "../context/AuthContext";
import { 
  Plus, Clock, Search, CheckCircle, PackageSearch, ShoppingCart, 
  TrendingUp, X, Wallet, CreditCard, AlertCircle, History, Trash2, 
  FileText, Pencil, Eye, ArrowDownToLine, Hammer, Activity, Box,
  DollarSign, ShieldCheck, ArrowRight, Layers, Filter
} from "lucide-react";

// 🏦 NUMBER TO WORDS UTILITY (Indian Number System)
const numberToWords = (num) => {
  if (num === 0) return "Zero Only";
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? "and " + convert(n % 100) : "");
    return "";
  };

  const formatAmount = (n) => {
    let str = "";
    if (n >= 10000000) {
      str += convert(Math.floor(n / 10000000)) + "Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      str += convert(Math.floor(n / 100000)) + "Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      str += convert(Math.floor(n / 1000)) + "Thousand ";
      n %= 1000;
    }
    str += convert(n);
    return str;
  };

  const whole = Math.floor(num);
  const fraction = Math.round((num - whole) * 100);

  let result = formatAmount(whole) + "Rupees ";
  if (fraction > 0) {
    result += "and " + formatAmount(fraction) + "Paise ";
  }
  return result + "Only";
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentPercent, setPaymentPercent] = useState("");
  const [editingOrder, setEditingOrder] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeInvoiceForPreview, setActiveInvoiceForPreview] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getAll();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = Array.isArray(orders) ? orders.filter(o => {
    const searchLow = searchTerm.toLowerCase();
    const matchSearch = (o._id?.toString() || "").toLowerCase().includes(searchLow) ||
                        (o.customer?.name || "").toLowerCase().includes(searchLow) ||
                        (o.customer?.company || "").toLowerCase().includes(searchLow);
    
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchType = filterType === "all" || o.saleType === filterType;

    return matchSearch && matchStatus && matchType;
  }) : [];

  const handleSubmit = async (data) => {
    try {
      setFormLoading(true);
      if (editingOrder) {
        await orderApi.update(editingOrder._id, data);
      } else {
        await orderApi.create(data);
      }
      setIsModalOpen(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      alert("Error saving order: " + (err.response?.data?.msg || err.message));
    } finally {
      setFormLoading(false);
    }
  };


  const handleRecordPayment = async () => {
    try {
      const outstanding = selectedOrder.totalAmount - selectedOrder.amountPaid;
      if (Number(paymentAmount) > outstanding) {
        alert(`Error: Amount (₹${paymentAmount}) exceeds the outstanding balance (₹${outstanding}).`);
        return;
      }
      setFormLoading(true);
      await paymentApi.addOrderPayment(selectedOrder._id, {
        amount: Number(paymentAmount),
        date: paymentDate,
        description: paymentNote
      });
      setIsPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentPercent("");
      setPaymentNote("");
      fetchOrders();
    } catch (err) {
      alert("Payment failed: " + (err.response?.data?.msg || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const fetchPaymentHistory = async (orderId) => {
    try {
      setFormLoading(true);
      const res = await paymentApi.getHistory("order", orderId);
      const order = orders.find(o => o._id === orderId);

      if (!order) {
        alert("Order details not found in cache.");
        return;
      }

      // Build Unified Journey Timeline
      const events = [
        // 1. Birth: Order Placed
        {
          _id: "birth",
          date: order.createdAt,
          type: 'milestone',
          amount: order.totalAmount,
          description: "Order Placed - Commercial Journey Initialized"
        },
        // 2. Pulse: Payments
        ...(Array.isArray(res.data) ? res.data.map(p => ({ ...p, type: 'payment' })) : [])
      ];

      // 3. Seal: Fulfillment (if complete)
      if (order.status === 'completed') {
        events.push({
          _id: "completion",
          date: order.updatedAt,
          type: 'milestone',
          amount: 0,
          description: "Full Fulfillment - Logistics Closed"
        });
      }

      // Sort Chronologically
      events.sort((a, b) => new Date(a.date) - new Date(b.date));

      setPaymentHistory(events);
      setIsHistoryModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch transaction timeline");
    } finally {
      setFormLoading(false);
    }
  };

  const handlePercentChange = (percent) => {
    setPaymentPercent(percent);
    if (selectedOrder && percent) {
      const outstanding = selectedOrder.totalAmount - (selectedOrder.amountPaid || 0);
      const amount = (outstanding * (Number(percent) / 100)).toFixed(2);
      setPaymentAmount(amount);
    }
  };

  const { user } = useAuth();

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await orderApi.updateStatus(id, newStatus);

      // Miracle-Level Integration: Auto-generate Draft Invoice when status is "invoiced"
      if (newStatus === 'invoiced') {
        try {
          await invoiceApi.create({ orderId: id });
          alert("Draft Invoice generated in Billing Hub!");
        } catch (invErr) {
          console.error("Invoice generation failed", invErr);
          alert("Order status updated, but Invoice generation failed: " + (invErr.response?.data?.error || invErr.message));
        }
      }

      fetchOrders();
    } catch (err) {
      alert("Status update failed: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm("CRITICAL: Delete this order permanently? This will restore product stock if the order was active.")) {
      try {
        await orderApi.delete(id);
        fetchOrders();
      } catch (err) {
        alert("Deletion Blocked: " + (err.response?.data?.msg || err.message));
      }
    }
  };

  const handleOpenPreview = async (order) => {
    try {
      const res = await invoiceApi.getAll();
      const invoice = res.data.find(inv => inv.order?.toString() === order._id.toString());

      if (!invoice) {
        alert("Invoice not found. Please mark the order as 'Invoiced' first.");
        return;
      }

      const pdfRes = await invoiceApi.downloadPdf(invoice._id);
      const url = window.URL.createObjectURL(new Blob([pdfRes.data], { type: 'application/pdf' }));
      setPreviewUrl(url);
      setActiveInvoiceForPreview(invoice);
      setIsPreviewOpen(true);
    } catch (err) {
      alert("PDF Preview failed: " + err.message);
    }
  };

  const handleDownloadPdf = () => {
    if (!previewUrl || !activeInvoiceForPreview) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.setAttribute('download', `Invoice_${activeInvoiceForPreview.invoiceNumber || activeInvoiceForPreview._id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleExportCSV = () => {
    if (!filteredOrders.length) return;
    const headers = ["Order ID", "Customer", "Product", "Quantity", "Total Amount", "Paid", "Status", "Date"];
    const rows = filteredOrders.map(o => [
      `"${o._id}"`,
      `"${o.customer?.name || 'Unassigned'}"`,
      `"${o.product?.name || 'N/A'}"`,
      o.quantity,
      o.totalAmount,
      o.amountPaid,
      `"${o.status}"`,
      `"${new Date(o.createdAt).toLocaleDateString()}"`
    ].join(","));
    const csvString = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Order_Ledger_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeOptions = (status) => {
    switch (status) {
      case "pending":
        return { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "Pending Approval", icon: <Clock className="w-3 h-3 mr-1" /> };
      case "in_progress":
        return { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Operations Active", icon: <Activity className="w-3 h-3 mr-1" /> };
      case "invoiced":
        return { color: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Legally Invoiced", icon: <ShieldCheck className="w-3 h-3 mr-1" /> };
      case "shipped":
        return { color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", label: "In Transit", icon: <TrendingUp className="w-3 h-3 mr-1" /> };
      case "completed":
        return { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Lifecycle Closed", icon: <CheckCircle className="w-3 h-3 mr-1" /> };
      case "cancelled":
        return { color: "bg-rose-500/10 text-rose-600 border-rose-500/20", label: "Cancelled", icon: null };
      default:
        return { color: "bg-slate-100 text-slate-400 border-slate-200", label: "Unknown", icon: null };
    }
  };

  return (
    <AppLayout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Superior Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center group hover:rotate-6 transition-transform duration-500">
                 <ShoppingCart className="w-10 h-10 text-primary" />
              </div>
              <div>
                 <h2 className="text-5xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Commercial <span className="text-primary not-italic">Pipeline</span></h2>
                 <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">U{i}</div>)}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Sales Control Matrix</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setEditingOrder(null);
                  setIsModalOpen(true);
                }}
                className="erp-button-primary"
              >
                <Plus className="w-4 h-4" />
                New Yield Order
              </button>
              <button
                onClick={() => {
                  setEditingOrder({ saleType: 'scrap' }); 
                  setIsModalOpen(true);
                }}
                className="erp-button-secondary !border-rose-100 hover:!border-rose-300 !text-rose-600 hover:!bg-rose-50"
              >
                <Hammer className="w-4 h-4" />
                Initialize Salvage Dispatch Manifest
              </button>
           </div>
        </div>

        {/* Operational Grid */}
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden mb-20">
           <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative group w-full max-w-md">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                 <input 
                    type="text"
                    placeholder="Identify Order Ref or Customer Agency..."
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-sans"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center gap-8">
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Fleet</span>
                    <span className="text-xl font-black text-slate-900 tracking-tighter tabular-nums">{filteredOrders.length} Entities</span>
                 </div>
                 <div className="h-10 w-px bg-slate-100"></div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-4 rounded-2xl transition-all active:scale-95 ${showFilters ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                       <Filter className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleExportCSV}
                      className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
                    >
                       <ArrowDownToLine className="w-5 h-5" />
                    </button>
                  </div>
              </div>

            {/* Advanced Filter Manifold */}
            {showFilters && (
               <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-50 flex flex-wrap gap-10 animate-in slide-in-from-top-2 duration-500">
                  <div className="space-y-4">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Transactional Status</p>
                     <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map(status => (
                           <button 
                              key={status}
                              onClick={() => setFilterStatus(status)}
                              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filterStatus === status ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                           >
                              {status.replace('_', ' ')}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-4 border-l border-slate-100 pl-10">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Inventory Flow</p>
                     <div className="flex gap-2">
                        {['all', 'yield', 'scrap'].map(type => (
                           <button 
                              key={type}
                              onClick={() => setFilterType(type)}
                              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filterType === type ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                           >
                              {type}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex-1 flex justify-end items-end pb-1">
                     <button 
                        onClick={() => { setFilterStatus("all"); setFilterType("all"); setSearchTerm(""); }}
                        className="text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                     >
                        <Trash2 className="w-3.5 h-3.5" /> Force Reset
                     </button>
                  </div>
               </div>
            )}
           </div>

           <div className="overflow-x-auto">
              {loading ? (
                <div className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.3em] animate-pulse text-xs">Synchronizing Commercial Ledger...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-40 flex flex-col items-center justify-center text-slate-200">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-10 border border-slate-100">
                      <Box className="w-10 h-10 text-slate-300" />
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tightest uppercase italic">The Pipeline is Silent</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">No active commercial activities detected</p>
                </div>
              ) : (
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
                         <th className="px-10 py-6">Transaction ID</th>
                         <th className="px-10 py-6">Commercial Party</th>
                         <th className="px-10 py-6">Inventory Specs</th>
                         <th className="px-10 py-6">Fiscal State</th>
                         <th className="px-10 py-6">Operational Stage</th>
                         <th className="px-10 py-6 text-right pr-16">Lifecycle Control</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredOrders.map((o) => {
                        const statusOpts = getStatusBadgeOptions(o.status);
                        return (
                          <tr key={o._id} className="group/row hover:bg-slate-50/80 transition-all duration-500">
                             <td className="px-10 py-10">
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 w-fit mb-2 tracking-widest shadow-sm">#{o._id.substring(o._id.length - 6).toUpperCase()}</span>
                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">{new Date(o.createdAt).toLocaleDateString()}</span>
                                </div>
                             </td>
                             <td className="px-10 py-10">
                                <div className="flex flex-col">
                                   <span className="text-base font-black text-slate-900 tracking-tightest group-hover/row:text-primary transition-colors">{o.customer?.name || "Unassigned"}</span>
                                   <div className="flex items-center gap-2 mt-1">
                                      <div className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center">
                                         <DollarSign className="w-2.5 h-2.5 text-slate-400" />
                                      </div>
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{o.customer?.company || "Standard Agency"}</span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-10 py-10">
                                <div className="flex items-center gap-4">
                                   <div className={`p-3 rounded-2xl ${o.saleType === 'scrap' ? 'bg-rose-50 text-rose-500' : 'bg-primary/5 text-primary'}`}>
                                      {o.saleType === 'scrap' ? <Hammer className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-sm font-black text-slate-900 tracking-tightest">{o.product?.name}</span>
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Load: {o.quantity} {o.unit}</span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-10 py-10">
                                <div className="flex flex-col gap-3">
                                   <span className="text-xl font-black text-slate-900 tracking-tightest tabular-nums">₹{o.totalAmount?.toLocaleString('en-IN')}</span>
                                   <div className="flex flex-col gap-1.5 w-32">
                                      <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                                         <span>Receipt Progress</span>
                                         <span>{Math.round((o.amountPaid / o.totalAmount) * 100)}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                         <div className="h-full bg-primary transition-all duration-700 shadow-sm" style={{ width: `${(o.amountPaid / o.totalAmount) * 100}%` }}></div>
                                      </div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-10 py-10">
                                <div className="flex flex-col gap-2">
                                   <div className={`status-badge w-fit ${statusOpts.color}`}>
                                      {statusOpts.icon && <span className="mr-1">{statusOpts.icon}</span>}
                                      {statusOpts.label}
                                   </div>
                                </div>
                             </td>
                             <td className="px-10 py-10 text-right pr-16">
                                <div className="flex items-center justify-end gap-2 text-slate-400">
                                   {o.paymentStatus !== 'paid' && !['cancelled'].includes(o.status) && (
                                     <button onClick={() => { setSelectedOrder(o); setIsPaymentModalOpen(true); }} className="p-3 hover:bg-primary/10 hover:text-primary rounded-xl transition-all active:scale-90" title="Deposit Receipt">
                                        <Wallet className="w-5 h-5" />
                                     </button>
                                   )}
                                   <button onClick={() => fetchPaymentHistory(o._id)} className="p-3 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all active:scale-90" title="Audit History">
                                      <History className="w-5 h-5" />
                                   </button>
                                   <div className="h-6 w-px bg-slate-100 mx-1"></div>
                                   
                                   {o.status === 'pending' && (
                                     <button onClick={() => handleStatusUpdate(o._id, 'in_progress')} className="p-3 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all active:scale-90" title="Launch Operations">
                                        <PackageSearch className="w-5 h-5" />
                                     </button>
                                   )}
                                   {(o.status === 'pending' || o.status === 'in_progress') && (
                                     <button onClick={() => handleStatusUpdate(o._id, 'invoiced')} className="p-3 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-all active:scale-90" title="Finalize Billing">
                                        <FileText className="w-5 h-5" />
                                     </button>
                                   )}
                                   
                                   {['invoiced', 'shipped', 'completed'].includes(o.status?.toLowerCase()) && (
                                     <button onClick={() => handleOpenPreview(o)} className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-110 transition-all active:scale-90">
                                        <Eye className="w-5 h-5" />
                                     </button>
                                   )}

                                   <div className="h-6 w-px bg-slate-100 mx-1"></div>
                                   <button onClick={() => handleDeleteOrder(o._id)} className="p-3 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all active:scale-90" title="Permanent Purge">
                                      <Trash2 className="w-5 h-5" />
                                   </button>
                                </div>
                             </td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>
              )}
           </div>
        </div>

      </div>

      {/* Legacy Modals with Premium Wrapping */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
           setIsModalOpen(false);
           setEditingOrder(null);
        }}
        title={
          editingOrder?._id 
            ? (editingOrder.saleType === 'scrap' ? "Salvage Manifest: Sequence Modification" : "Fulfillment Authorization: Sequence Modification")
            : (editingOrder?.saleType === 'scrap' ? "Initialize Salvage Dispatch Manifest" : "Initialize Fulfillment Authorization")
        }
      >
        <div className="p-4">
          <OrderForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingOrder(null);
            }}
            initialData={editingOrder}
            loading={formLoading}
          />
        </div>
      </Modal>

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Fiscal Receipt Recording"
      >
        <div className="p-10 space-y-10">
          {selectedOrder && (
            <>
              <div className="p-10 bg-slate-900 rounded-[3rem] shadow-2xl shadow-slate-900/40 text-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-5">
                    <DollarSign className="w-24 h-24 text-white" />
                 </div>
                 <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Awaiting Fulfillment</p>
                 <h3 className="text-5xl font-black text-white tracking-tightest tabular-nums italic">₹{(selectedOrder.totalAmount - selectedOrder.amountPaid).toLocaleString()}</h3>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-4">Remaining Balance Lifecycle</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Receipt Amplitude (₹)</label>
                    <input
                      type="number"
                      className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-2xl font-black text-slate-900 focus:ring-4 focus:ring-primary/5 outline-none font-mono"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Percentage Monitor (%)</label>
                    <input
                      type="number"
                      className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-2xl font-black text-slate-900 focus:ring-4 focus:ring-primary/5 outline-none font-mono"
                      value={paymentPercent}
                      onChange={(e) => handlePercentChange(e.target.value)}
                    />
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Reference Journal</label>
                 <textarea
                   className="w-full px-8 py-5 bg-slate-50 border-none rounded-[2rem] text-xs font-bold text-slate-900 h-32 resize-none focus:ring-4 focus:ring-primary/5 outline-none"
                   placeholder="Journal notes for ledger audit..."
                   value={paymentNote}
                   onChange={(e) => setPaymentNote(e.target.value)}
                 />
              </div>

              <div className="flex gap-4 pt-4">
                 <button onClick={() => setIsPaymentModalOpen(false)} className="erp-button-secondary flex-1">Abort</button>
                 <button 
                   onClick={handleRecordPayment}
                   disabled={formLoading || !paymentAmount}
                   className="erp-button-primary flex-[2] !py-6"
                 >
                    {formLoading ? "Synchronizing..." : `Seal Receipt: ₹${Number(paymentAmount).toLocaleString()}`}
                 </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Commercial Lifecycle Timeline"
      >
        <div className="p-12">
          {paymentHistory.length === 0 ? (
            <div className="p-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 text-center">
               <Layers className="w-12 h-12 text-slate-200 mx-auto mb-6" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Archive records empty</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-100 ml-8 space-y-12 py-4">
               {paymentHistory.map((item, idx) => {
                 const isMilestone = item.type === 'milestone';
                 return (
                   <div key={item._id} className="relative pl-12 group">
                      <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-md transition-transform group-hover:scale-150 ${isMilestone ? "bg-primary" : "bg-emerald-500"}`}></div>
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                         {isMilestone ? (
                           <h4 className="text-xl font-black text-slate-900 tracking-tightest uppercase italic">{item.description}</h4>
                         ) : (
                           <div className="flex items-end gap-3">
                              <h4 className="text-3xl font-black text-slate-900 tracking-tightest tabular-nums">₹{item.amount.toLocaleString()}</h4>
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Receipt Recorded</span>
                           </div>
                         )}
                         {item.description && !isMilestone && <p className="text-xs font-bold text-slate-400 mt-2 italic leading-relaxed">"{item.description}"</p>}
                      </div>
                   </div>
                 );
               })}
            </div>
          )}
          <button onClick={() => setIsHistoryModalOpen(false)} className="erp-button-secondary w-full mt-16">Return to Command Center</button>
        </div>
      </Modal>

      <Modal 
        isOpen={isPreviewOpen} 
        onClose={handleClosePreview} 
        title={`Compliance Monitor: ${activeInvoiceForPreview?.invoiceNumber || activeInvoiceForPreview?._id}`}
      >
        <div className="flex flex-col gap-8 p-4">
          <div className="w-full h-[650px] border border-slate-100 rounded-[2.5rem] overflow-hidden bg-slate-50 shadow-inner">
            {previewUrl ? (
              <iframe src={previewUrl} className="w-full h-full border-none" title="Invoice Preview" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 animate-pulse font-black uppercase text-[10px] tracking-[0.4em]">Rendering Audit Data Assets...</div>
            )}
          </div>
          <div className="flex gap-4">
             <button onClick={handleDownloadPdf} className="erp-button-primary flex-1 !py-5">
                <ArrowDownToLine className="w-5 h-5" />
                Initialize Final PDF Signature
             </button>
             <button onClick={handleClosePreview} className="erp-button-secondary px-10">Close Audit</button>
          </div>
        </div>
      </Modal>

    </AppLayout>
  );
};

export default Orders;
