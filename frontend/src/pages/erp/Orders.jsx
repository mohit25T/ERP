import { useState, useEffect } from "react";
import { orderApi, paymentApi, invoiceApi } from "../../api/erpApi";
import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import OrderForm from "../../components/forms/OrderForm";
import { 
  LayoutGrid, Package, Search, Filter, ArrowDownToLine, 
  Trash2, Box, TrendingUp, Plus, Truck, FileText, 
  Eye, History, CreditCard, ChevronRight, ArrowLeft,
  ArrowRightLeft, ShoppingCart, CheckCircle, Hammer,
  Clock, DollarSign, Layers, PackageSearch, Wallet,
  ShieldCheck, Activity
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
  const [invoices, setInvoices] = useState([]);
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
      const [orderRes, invoiceRes] = await Promise.all([
        orderApi.getAll(),
        invoiceApi.getAll()
      ]);
      setOrders(Array.isArray(orderRes.data) ? orderRes.data : []);
      setInvoices(Array.isArray(invoiceRes.data) ? invoiceRes.data : []);
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
        const alreadyInvoiced = invoices.find(inv => inv.order?._id === id || inv.order === id);
        if (alreadyInvoiced) {
          alert("Invoice already exists for this order. Redirecting to Billing Hub context.");
        } else {
          try {
            await invoiceApi.create({ orderId: id });
            alert("Draft Invoice generated in Billing Hub!");
          } catch (invErr) {
            console.error("Invoice generation failed", invErr);
            alert("Order status updated, but Invoice generation failed: " + (invErr.response?.data?.error || invErr.message));
          }
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
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-indigo-600" /> Orders
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage sales orders, salvage dispatch, and billing pipeline.</p>
          </div>
          <div className="flex items-center gap-3">
             <button
               onClick={() => {
                 setEditingOrder({ saleType: 'scrap' }); 
                 setIsModalOpen(true);
               }}
               className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center"
             >
               <Hammer className="w-4 h-4 mr-2" />
               New Salvage Order
             </button>
             <button
               onClick={() => {
                 setEditingOrder(null);
                 setIsModalOpen(true);
               }}
               className="erp-button-primary"
             >
               <Plus className="w-4 h-4 mr-2" />
               New Yield Order
             </button>
          </div>
        </div>

        {/* Unified Command Container */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-8">
           <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative group w-full md:w-80">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    type="text"
                    placeholder="Search by Order ID or Customer..."
                    className="erp-input w-full pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <div className="flex flex-col items-end mr-2 hidden sm:flex">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Orders</span>
                    <span className="text-lg font-bold text-slate-900 tracking-tight">{filteredOrders.length}</span>
                 </div>
                 <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className="p-2 border border-slate-200 bg-white rounded-lg text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
                    >
                       <Filter className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleExportCSV}
                      className="p-2 border border-slate-200 bg-white rounded-lg text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
                    >
                       <ArrowDownToLine className="w-4 h-4" />
                    </button>
                  </div>
              </div>
           </div>

            {/* Advanced Filter Manifold */}
            {showFilters && (
               <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                     <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</p>
                     <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map(status => (
                           <button 
                              key={status}
                              onClick={() => setFilterStatus(status)}
                              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${filterStatus === status ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                           >
                              {status.replace('_', ' ')}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-2 sm:border-l sm:border-slate-200 sm:pl-6">
                     <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</p>
                     <div className="flex gap-2">
                        {['all', 'yield', 'scrap'].map(type => (
                           <button 
                              key={type}
                              onClick={() => setFilterType(type)}
                              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${filterType === type ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                           >
                              {type}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex-1 flex justify-end items-end pb-0.5">
                     <button 
                        onClick={() => { setFilterStatus("all"); setFilterType("all"); setSearchTerm(""); }}
                        className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1.5"
                     >
                        <Trash2 className="w-3.5 h-3.5" /> Reset Filters
                     </button>
                  </div>
               </div>
            )}

           <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-slate-500 text-sm font-semibold animate-pulse">Loading Orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                   <Box className="w-12 h-12 mb-4 text-slate-300" />
                   <h3 className="text-lg font-semibold text-slate-700">No Orders Found</h3>
                   <p className="text-sm mt-1">There are no orders matching your current filters.</p>
                </div>
              ) : (
                <table className="erp-table">
                   <thead>
                      <tr>
                         <th>Order ID</th>
                         <th>Customer</th>
                         <th>Product / Qty</th>
                         <th>Amount</th>
                         <th>Status</th>
                         <th className="text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((o) => {
                        const statusOpts = getStatusBadgeOptions(o.status);
                        return (
                           <tr key={o._id} className="erp-row-hover transition-colors">
                              <td>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-slate-900">#{o._id.substring(o._id.length - 6).toUpperCase()}</span>
                                    <span className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</span>
                                 </div>
                              </td>
                              <td>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-slate-900">{o.customer?.name || "Unknown Customer"}</span>
                                    {o.customer?.company && (
                                       <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                          <ShieldCheck className="w-3 h-3" /> {o.customer.company}
                                       </span>
                                    )}
                                 </div>
                              </td>
                              <td>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                                      {o.saleType === 'scrap' ? <Hammer className="w-3.5 h-3.5 text-rose-500" /> : <Box className="w-3.5 h-3.5 text-indigo-500" />} 
                                      {o.product?.name}
                                    </span>
                                    <span className="text-xs text-slate-500 mt-0.5">{o.quantity} {o.unit}</span>
                                 </div>
                              </td>
                              <td>
                                 <div className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-slate-900">₹{o.totalAmount?.toLocaleString('en-IN')}</span>
                                    <div className="flex items-center gap-2">
                                       <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(o.amountPaid / o.totalAmount) * 100}%` }}></div>
                                       </div>
                                       <span className="text-xs text-slate-500 font-medium">{Math.round((o.amountPaid / o.totalAmount) * 100)}%</span>
                                    </div>
                                 </div>
                              </td>
                              <td>
                                 <div className={`status-badge w-fit ${statusOpts.color}`}>
                                    {statusOpts.icon}
                                    {statusOpts.label}
                                 </div>
                              </td>
                              <td className="text-right">
                                 <div className="flex items-center justify-end gap-1.5">
                                    {o.paymentStatus !== 'paid' && !['cancelled'].includes(o.status) && (
                                      <button onClick={() => { setSelectedOrder(o); setIsPaymentModalOpen(true); }} className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-emerald-600 rounded-lg transition-colors" title="Record Payment">
                                         <Wallet className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button onClick={() => fetchPaymentHistory(o._id)} className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-colors" title="Payment History">
                                       <History className="w-4 h-4" />
                                    </button>
                                    
                                    {(() => {
                                       const existingInvoice = invoices.find(inv => inv.order?._id === o._id || inv.order === o._id);
                                       return (
                                         <>
                                            {['pending', 'invoiced'].includes(o.status) && (
                                              <button onClick={() => handleStatusUpdate(o._id, 'in_progress')} className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-blue-600 rounded-lg transition-colors" title="Start Order">
                                                 <PackageSearch className="w-4 h-4" />
                                              </button>
                                            )}
                                            {(o.status === 'pending' || o.status === 'in_progress') && !existingInvoice && (
                                              <button onClick={() => handleStatusUpdate(o._id, 'invoiced')} className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-purple-600 rounded-lg transition-colors" title="Invoice Order">
                                                 <FileText className="w-4 h-4" />
                                              </button>
                                            )}
                                            
                                            {(existingInvoice || ['invoiced', 'shipped', 'completed'].includes(o.status?.toLowerCase())) && (
                                              <button onClick={() => handleOpenPreview(o)} className="p-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors" title="Preview Invoice">
                                                 <Eye className="w-4 h-4" />
                                              </button>
                                            )}
                                         </>
                                       );
                                    })()}

                                    <button onClick={() => handleDeleteOrder(o._id)} className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-rose-500 rounded-lg transition-colors" title="Delete">
                                       <Trash2 className="w-4 h-4" />
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

      {/* Legacy Modals with Clean Layout */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
           setIsModalOpen(false);
           setEditingOrder(null);
        }}
        size="4xl"
        title={
          editingOrder?._id 
            ? (editingOrder.saleType === 'scrap' ? "Edit Salvage Order" : "Edit Customer Order")
            : (editingOrder?.saleType === 'scrap' ? "New Salvage Order" : "New Customer Order")
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
        title="Record Payment Receipt"
      >
        <div className="p-4 space-y-6">
          {selectedOrder && (
            <>
              <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                 <div>
                    <p className="text-xs text-indigo-600 font-semibold mb-1 uppercase tracking-wider">Outstanding Balance</p>
                    <h3 className="text-2xl font-bold text-indigo-900">₹{(selectedOrder.totalAmount - selectedOrder.amountPaid).toLocaleString()}</h3>
                 </div>
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-500">
                    <DollarSign className="w-6 h-6" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">Receipt Amount (₹)</label>
                    <input
                      type="number"
                      className="erp-input w-full font-bold text-lg"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                 </div>
                 <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">Percentage (%)</label>
                    <input
                      type="number"
                      className="erp-input w-full font-bold text-lg"
                      placeholder="0%"
                      value={paymentPercent}
                      onChange={(e) => handlePercentChange(e.target.value)}
                    />
                 </div>
              </div>

              <div>
                 <label className="text-sm font-semibold text-slate-700 block mb-1">Payment Notes</label>
                 <textarea
                   className="erp-input w-full h-24 resize-none"
                   placeholder="Journal notes for ledger audit..."
                   value={paymentNote}
                   onChange={(e) => setPaymentNote(e.target.value)}
                 />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                 <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                 <button 
                   onClick={handleRecordPayment}
                   disabled={formLoading || !paymentAmount}
                   className="erp-button-primary flex-1"
                 >
                    {formLoading ? "Recording..." : `Confirm Payment: ₹${Number(paymentAmount).toLocaleString()}`}
                 </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Payment Timeline"
      >
        <div className="p-6">
          {paymentHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
               <Layers className="w-8 h-8 text-slate-300 mx-auto mb-3" />
               <p className="text-sm font-semibold">No payment history found.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
               {paymentHistory.map((item, idx) => {
                 const isMilestone = item.type === 'milestone';
                 return (
                   <div key={item._id} className="relative pl-8">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${isMilestone ? "bg-indigo-500" : "bg-emerald-500"}`}></div>
                      <div className="flex flex-col">
                         <span className="text-xs font-semibold text-slate-500 mb-1">{new Date(item.date).toLocaleDateString()}</span>
                         {isMilestone ? (
                           <h4 className="text-sm font-bold text-slate-900">{item.description}</h4>
                         ) : (
                           <div className="flex items-center gap-2">
                              <h4 className="text-lg font-bold text-slate-900">₹{item.amount.toLocaleString()}</h4>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-xs font-semibold">Paid</span>
                           </div>
                         )}
                         {item.description && !isMilestone && <p className="text-sm text-slate-600 mt-1">{item.description}</p>}
                      </div>
                   </div>
                 );
               })}
            </div>
          )}
          <div className="flex justify-end mt-8">
             <button onClick={() => setIsHistoryModalOpen(false)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors">Close Timeline</button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isPreviewOpen} 
        onClose={handleClosePreview} 
        title={`Invoice Preview: ${activeInvoiceForPreview?.invoiceNumber || activeInvoiceForPreview?._id}`}
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="w-full h-[600px] border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {previewUrl ? (
              <iframe src={previewUrl} className="w-full h-full border-none" title="Invoice Preview" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm font-semibold animate-pulse">Generating PDF preview...</div>
            )}
          </div>
          <div className="flex gap-4 justify-end">
             <button onClick={handleClosePreview} className="px-6 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Close</button>
             <button onClick={handleDownloadPdf} className="erp-button-primary">
                <ArrowDownToLine className="w-4 h-4 mr-2" /> Download PDF
             </button>
          </div>
        </div>
      </Modal>

    </AppLayout>
  );
};

export default Orders;
