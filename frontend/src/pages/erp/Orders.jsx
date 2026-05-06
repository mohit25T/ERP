import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { orderApi, paymentApi, invoiceApi } from "../../api/erpApi";
import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import HammerLoader from "../../components/common/HammerLoader";
import OrderForm from "../../components/forms/OrderForm";
import {
  LayoutGrid, Package, Search, Filter, ArrowDownToLine,
  Trash2, Box, TrendingUp, Plus, Truck, FileText,
  Eye, History, CreditCard, ChevronRight, ArrowLeft,
  ArrowRightLeft, ShoppingCart, CheckCircle, Hammer,
  Clock, DollarSign, Layers, PackageSearch, Wallet,
  ShieldCheck, Activity
} from "lucide-react";


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
        {
          _id: "birth",
          date: order.createdAt,
          type: 'milestone',
          amount: order.totalAmount,
          description: "Order Placed - Initialized"
        },
        ...(Array.isArray(res.data) ? res.data.map(p => ({ ...p, type: 'payment' })) : [])
      ];

      if (order.status === 'completed') {
        events.push({
          _id: "completion",
          date: order.updatedAt,
          type: 'milestone',
          amount: 0,
          description: "Full Fulfillment - Logistics Closed"
        });
      }

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

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await orderApi.updateStatus(id, newStatus);
      if (newStatus === 'invoiced') {
        const alreadyInvoiced = invoices.find(inv => inv.order?._id === id || inv.order === id);
        if (!alreadyInvoiced) {
          try {
            await invoiceApi.create({ orderId: id });
          } catch (invErr) {
            console.error("Invoice generation failed", invErr);
          }
        }
      }
      fetchOrders();
    } catch (err) {
      alert("Status update failed: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm("CRITICAL: Delete this order permanently?")) {
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
        return { color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", label: "Pending", icon: <Clock className="w-3 h-3 mr-1" /> };
      case "in_progress":
        return { color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", label: "Operational", icon: <Activity className="w-3 h-3 mr-1" /> };
      case "invoiced":
        return { color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", label: "Invoiced", icon: <ShieldCheck className="w-3 h-3 mr-1" /> };
      case "shipped":
        return { color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20", label: "In Transit", icon: <Truck className="w-3 h-3 mr-1" /> };
      case "completed":
        return { color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", label: "Lifecycle Closed", icon: <CheckCircle className="w-3 h-3 mr-1" /> };
      case "cancelled":
        return { color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", label: "Cancelled", icon: null };
      default:
        return { color: "bg-muted text-muted-foreground border-border", label: "Unknown", icon: null };
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-card rounded-md flex items-center justify-center shadow-sm border border-border">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">Order Management</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Commercial Flux & Distribution Pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingOrder({ saleType: 'scrap' });
                setIsModalOpen(true);
              }}
              className="erp-button-secondary border-destructive/20 text-destructive hover:bg-destructive/5"
            >
              <Hammer className="w-3.5 h-3.5 mr-2" />
              New Salvage
            </button>
            <button
              onClick={() => {
                setEditingOrder(null);
                setIsModalOpen(true);
              }}
              className="erp-button-primary"
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              New Order
            </button>
          </div>
        </div>

        {/* Unified Command Container */}
        <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/5">
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Orders..."
                className="erp-input w-full pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total Registry</span>
                <span className="text-sm font-black text-foreground">{filteredOrders.length}</span>
              </div>
              <div className="h-6 w-px bg-border hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 border rounded-md transition-all ${showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
                >
                  <Filter className="w-4 h-4" />
                </button>
                <button
                  onClick={handleExportCSV}
                  className="p-2 border border-border bg-card rounded-md text-muted-foreground hover:text-foreground transition-all shadow-sm"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filter Manifold */}
          {showFilters && (
            <div className="p-4 bg-muted/10 border-b border-border flex flex-col sm:flex-row gap-6 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Lifecycle Status</p>
                <div className="flex flex-wrap gap-2">
                  {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all border ${filterStatus === status ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'}`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 sm:border-l sm:border-border sm:pl-6">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Order Category</p>
                <div className="flex gap-2">
                  {['all', 'yield', 'scrap'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all border ${filterType === type ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex justify-end items-end pb-0.5">
                <button
                  onClick={() => { setFilterStatus("all"); setFilterType("all"); setSearchTerm(""); }}
                  className="text-[9px] font-bold text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 uppercase tracking-widest"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Reset Filters
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {loading ? (
              <HammerLoader />
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
                <Box className="w-12 h-12 mb-4 text-muted-foreground/30" />
                <h3 className="text-sm font-bold uppercase tracking-widest">No Operational Data</h3>
              </div>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Asset / Qty</th>
                    <th>Fiscal Amount</th>
                    <th>Status</th>
                    <th className="text-right">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <AnimatePresence mode="popLayout">
                    {filteredOrders.map((o, index) => {
                      const statusOpts = getStatusBadgeOptions(o.status);
                      return (
                        <motion.tr
                          key={o._id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                          className="erp-row-hover"
                        >
                          <td>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-foreground">#{o._id.substring(o._id.length - 6).toUpperCase()}</span>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{new Date(o.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground">{o.customer?.name || "Unknown"}</span>
                              {o.customer?.company && (
                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight flex items-center gap-1 mt-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5" /> {o.customer.company}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                {o.saleType === 'scrap' ? <Hammer className="w-3.5 h-3.5 text-rose-500" /> : <Box className="w-3.5 h-3.5 text-primary" />}
                                {o.product?.name}
                              </span>
                              <span className="text-[9px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest">{o.quantity} {o.unit}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-xs font-black text-foreground">₹{o.totalAmount?.toLocaleString('en-IN')}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(o.amountPaid / o.totalAmount) * 100}%` }}></div>
                                </div>
                                <span className="text-[8px] text-muted-foreground font-bold">{Math.round((o.amountPaid / o.totalAmount) * 100)}%</span>
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
                            <div className="flex items-center justify-end gap-1">
                              {o.paymentStatus !== 'paid' && !['cancelled'].includes(o.status) && (
                                <button onClick={() => { setSelectedOrder(o); setIsPaymentModalOpen(true); }} className="p-1.5 border border-border bg-card hover:bg-muted text-emerald-600 rounded transition-colors" title="Record Payment">
                                  <Wallet className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => fetchPaymentHistory(o._id)} className="p-1.5 border border-border bg-card hover:bg-muted text-muted-foreground rounded transition-colors" title="Payment History">
                                <History className="w-3.5 h-3.5" />
                              </button>

                              {(() => {
                                const existingInvoice = invoices.find(inv => inv.order?._id === o._id || inv.order === o._id);
                                return (
                                  <>
                                    {['pending', 'invoiced'].includes(o.status) ? (
                                      <button onClick={() => handleStatusUpdate(o._id, 'in_progress')} className="p-1.5 border border-border bg-card hover:bg-muted text-blue-600 rounded transition-colors" title="Start Order">
                                        <PackageSearch className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (o.status === 'in_progress' || o.status === 'shipped') && (
                                      <button onClick={() => handleStatusUpdate(o._id, 'completed')} className="p-1.5 border border-border bg-card hover:bg-muted text-emerald-600 rounded transition-colors" title="Complete Order">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {(o.status === 'pending' || o.status === 'in_progress') && !existingInvoice && (
                                      <button onClick={() => handleStatusUpdate(o._id, 'invoiced')} className="p-1.5 border border-border bg-card hover:bg-muted text-purple-600 rounded transition-colors" title="Invoice Order">
                                        <FileText className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {(o.status === 'invoiced' || (o.status === 'in_progress' && existingInvoice)) && (
                                      <button onClick={() => handleStatusUpdate(o._id, 'shipped')} className="p-1.5 border border-border bg-card hover:bg-muted text-indigo-600 rounded transition-colors" title="Mark as Shipped">
                                        <Truck className="w-3.5 h-3.5" />
                                      </button>
                                    )}


                                    {(existingInvoice || ['invoiced', 'shipped', 'completed'].includes(o.status?.toLowerCase())) && (
                                      <button onClick={() => handleOpenPreview(o)} className="p-1.5 border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary rounded transition-colors" title="Preview Invoice">
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </>
                                );
                              })()}

                              <button onClick={() => handleDeleteOrder(o._id)} className="p-1.5 border border-border bg-card hover:bg-muted text-destructive rounded transition-colors" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Legacy Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOrder(null);
        }}
        size="4xl"
        title={editingOrder?._id ? "Edit Transaction Protocol" : "Initialize New Transaction"}
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
        title="Record Receipt"
      >
        <div className="p-4 space-y-6">
          {selectedOrder && (
            <>
              <div className="p-5 bg-primary/5 border border-primary/10 rounded flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-primary font-bold mb-1 uppercase tracking-widest">Outstanding</p>
                  <h3 className="text-2xl font-black text-foreground tracking-tighter">₹{(selectedOrder.totalAmount - selectedOrder.amountPaid).toLocaleString()}</h3>
                </div>
                <div className="w-10 h-10 bg-card rounded flex items-center justify-center shadow-sm text-primary border border-border">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">Amount (₹)</label>
                  <input
                    type="number"
                    className="erp-input font-black text-lg"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">Percent (%)</label>
                  <input
                    type="number"
                    className="erp-input font-black text-lg"
                    placeholder="0%"
                    value={paymentPercent}
                    onChange={(e) => handlePercentChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">Audit Notes</label>
                <textarea
                  className="erp-input h-24 resize-none"
                  placeholder="Notes..."
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-border">
                <button onClick={() => setIsPaymentModalOpen(false)} className="erp-button-secondary flex-1">Cancel</button>
                <button
                  onClick={handleRecordPayment}
                  disabled={formLoading || !paymentAmount}
                  className="erp-button-primary flex-[2]"
                >
                  {formLoading ? "Commiting..." : `Commit: ₹${Number(paymentAmount).toLocaleString()}`}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Transaction History"
      >
        <div className="p-6">
          {paymentHistory.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground bg-muted/10 rounded border border-dashed border-border">
              <Layers className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No history recorded</p>
            </div>
          ) : (
            <div className="relative border-l border-border ml-4 space-y-6 py-2">
              {paymentHistory.map((item, idx) => {
                const isMilestone = item.type === 'milestone';
                return (
                  <div key={item._id} className="relative pl-6">
                    <div className={`absolute -left-[4.5px] top-1 w-2 h-2 rounded-full shadow-sm ${isMilestone ? "bg-primary" : "bg-emerald-500"}`}></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{new Date(item.date).toLocaleDateString()}</span>
                      {isMilestone ? (
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-tight">{item.description}</h4>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-foreground">₹{item.amount.toLocaleString()}</h4>
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[9px] font-bold uppercase tracking-widest">Settled</span>
                        </div>
                      )}
                      {item.description && !isMilestone && <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-end mt-8 pt-4 border-t border-border">
            <button onClick={() => setIsHistoryModalOpen(false)} className="erp-button-secondary">Close Protocol</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        title={`Invoice: ${activeInvoiceForPreview?.invoiceNumber || activeInvoiceForPreview?._id}`}
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="w-full h-[600px] border border-border rounded overflow-hidden bg-muted/20 shadow-inner">
            {previewUrl ? (
              <iframe src={previewUrl} className="w-full h-full border-none" title="Invoice Preview" />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">Generating Artifact...</div>
            )}
          </div>
          <div className="flex gap-4 justify-end pt-2 border-t border-border">
            <button onClick={handleClosePreview} className="erp-button-secondary">Close</button>
            <button onClick={handleDownloadPdf} className="erp-button-primary">
              <ArrowDownToLine className="w-4 h-4 mr-2" /> Download Artifact
            </button>
          </div>
        </div>
      </Modal>

    </AppLayout>
  );
};

export default Orders;
