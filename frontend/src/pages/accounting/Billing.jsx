import { useState, useEffect } from "react";
import { invoiceApi, orderApi } from "../../api/erpApi";
import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import HammerLoader from "../../components/common/HammerLoader";
import BillingForm from "../../components/forms/BillingForm";
import EInvoiceDataModal from "../../components/modals/EInvoiceDataModal";
import EWayBillDataModal from "../../components/modals/EWayBillDataModal";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "../../utils/dateUtils";
import {
  FileText, Search, Trash2, TrendingUp,
  Activity, Calendar, Eye, Truck,
  FileJson, Download, Plus, AlertCircle,
  CheckCircle2, Clock, MoreVertical, Package, Box
} from "lucide-react";


const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isOrderBillModalOpen, setIsOrderBillModalOpen] = useState(false);
  const [isEInvoiceModalOpen, setIsEInvoiceModalOpen] = useState(false);
  const [isEWayBillModalOpen, setIsEWayBillModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [billQty, setBillQty] = useState("");
  const [isOrderIgst, setIsOrderIgst] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceApi.getAll();
      setInvoices(res.data);
    } catch (err) {
      console.error("Billing fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreateInvoice = async (data) => {
    try {
      setFormLoading(true);
      await invoiceApi.create(data);
      setIsBillingModalOpen(false);
      fetchInvoices();
    } catch (err) {
      alert("Invoice creation failed: " + (err.response?.data?.msg || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenOrderBillModal = async () => {
    setIsOrderBillModalOpen(true);
    setSelectedOrder(null);
    setBillQty("");
    try {
      const res = await orderApi.getAll();
      const billable = res.data.filter(o =>
        !['pending', 'cancelled'].includes(o.status) &&
        (o.invoicedQty || 0) < (o.orderedQty || o.quantity || 0)
      );
      setOrders(billable);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrderBill = async () => {
    if (!selectedOrder || !billQty || Number(billQty) <= 0) {
      alert("Invalid quantity.");
      return;
    }
    const unbilled = (selectedOrder.orderedQty || selectedOrder.quantity || 0) - (selectedOrder.invoicedQty || 0);
    if (Number(billQty) > unbilled) {
      alert(`Cannot bill more than unbilled quantity (${unbilled}).`);
      return;
    }

    try {
      setFormLoading(true);
      await invoiceApi.create({
        orderId: selectedOrder._id,
        billQty: Number(billQty),
        isIgst: isOrderIgst
      });
      setIsOrderBillModalOpen(false);
      setSelectedOrder(null);
      setBillQty("");
      fetchInvoices();
    } catch (err) {
      alert("Billing failed: " + (err.response?.data?.msg || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleFinalizeInvoice = async (id) => {
    if (!window.confirm("Are you sure you want to finalize this invoice? This will commit the transaction to the ledger and cannot be undone.")) return;
    try {
      await invoiceApi.finalize(id);
      fetchInvoices();
    } catch (err) {
      alert("Failed to finalize invoice: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this draft invoice?")) return;
    try {
      await invoiceApi.delete(id);
      fetchInvoices();
    } catch (err) {
      alert("Failed to delete invoice: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleOpenPreview = async (invoice) => {
    try {
      const res = await invoiceApi.downloadPdf(invoice._id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPreviewUrl(url);
      setActiveInvoice(invoice);
      setIsPreviewOpen(true);
    } catch (err) {
      alert("PDF Preview failed: " + err.message);
    }
  };

  const handleDownloadPdf = () => {
    if (!previewUrl || !activeInvoice) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.setAttribute('download', `Invoice_${activeInvoice.invoiceNumber || activeInvoice._id}.pdf`);
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

  const handleDownloadJSON = async (id, type) => {
    try {
      const apiMethod = type === 'einvoice' ? invoiceApi.downloadEinvoiceJson : invoiceApi.downloadEwayBillJson;
      const res = await apiMethod(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type.toUpperCase()}_${id}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("JSON Download failed: " + err.message);
    }
  };

  const handleUpdateEinvoice = async (id, data) => {
    try {
      const res = await invoiceApi.updateEinvoiceDetails(id, data);
      await fetchInvoices();
      if (activeInvoice?._id === id) {
        setActiveInvoice(res.data);
      }
    } catch (err) {
      alert("Failed to update E-Invoice: " + err.message);
    }
  };

  const handleUpdateEwayBill = async (id, data) => {
    try {
      const res = await invoiceApi.updateEwayBillDetails(id, data);
      await fetchInvoices();
      if (activeInvoice?._id === id) {
        setActiveInvoice(res.data);
      }
    } catch (err) {
      alert("Failed to update E-Way Bill: " + err.message);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = (inv.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customer?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalRevenue: filteredInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0),
    totalTax: filteredInvoices.reduce((acc, inv) => acc + (inv.gstAmount || 0), 0),
    pendingCount: filteredInvoices.filter(inv => inv.status === 'draft').length,
    finalizedCount: filteredInvoices.filter(inv => inv.status === 'finalized' || inv.status === 'paid').length
  };

  return (
    <AppLayout fullWidth>
      <div className="max-w-full mx-auto px-2 md:px-4 space-y-4 pb-12 animate-in fade-in duration-700">

        {/* Professional Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight uppercase mb-1">
              Sales <span className="text-indigo-600">Bills</span>
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5" />
              Manage your sales and government tax bills here
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
              <input
                className="pl-9 pr-4 py-2.5 bg-card border border-border rounded-md text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 w-64 transition-all shadow-sm"
                placeholder="Search invoices or clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={handleOpenOrderBillModal}
              className="px-4 py-2.5 bg-card border border-border text-slate-700 rounded-md text-xs font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all flex items-center gap-2 shadow-sm"
            >
              <Package className="w-4 h-4 text-indigo-600" /> Bill from Order
            </button>
            <button
              onClick={() => setIsBillingModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-md text-xs font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" /> Create New Bill
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Sales", value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Total Tax Collected", value: `₹${stats.totalTax.toLocaleString('en-IN')}`, icon: FileText, color: "text-indigo-500", bg: "bg-indigo-500/10" },
            { label: "Pending Bills", value: stats.pendingCount, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Final Bills Issued", value: stats.finalizedCount, icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10" },
          ].map((card, i) => (
            <div key={i} className="bg-card p-4 rounded-md border border-border shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-md ${card.bg}`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <MoreVertical className="w-4 h-4 text-muted-foreground/50" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{card.label}</p>
              <h3 className="text-xl font-black text-foreground tracking-tightest tabular-nums">{card.value}</h3>
            </div>
          ))}
        </div>

        {/* Invoice Management Table */}
        <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {['all', 'draft', 'finalized', 'paid'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Total Records: {filteredInvoices.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <HammerLoader />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-4">Updating Bills...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-300 gap-4">
                <AlertCircle className="w-12 h-12 opacity-20" />
                <p className="font-black uppercase tracking-widest text-[11px]">No financial records found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    <th className="px-4 py-4 text-left">Invoice Detail</th>
                    <th className="px-4 py-4 text-left">Client Information</th>
                    <th className="px-4 py-4 text-center">Quantity</th>
                    <th className="px-4 py-4 text-center">Status</th>
                    <th className="px-4 py-4 text-right">Total Value</th>
                    <th className="px-4 py-4 text-center">Compliance</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                    {filteredInvoices.map((inv, idx) => (
                      <motion.tr
                        key={inv._id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group hover:bg-muted/80 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center text-foreground font-black text-[10px] border border-border">
                              INV
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-foreground tracking-tight">{inv.invoiceNumber}</span>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{formatDate(inv.createdAt)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">{inv.customer?.name || "Private Client"}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{inv.customer?.company || "Retail Branch"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-foreground tabular-nums">
                              {inv.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              {inv.items?.[0]?.unit || "Units"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                inv.status === 'finalized' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                              {inv.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-base font-black text-foreground tabular-nums">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</span>
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Tax Paid</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => { setActiveInvoice(inv); setIsEInvoiceModalOpen(true); }}
                              className={`p-2 rounded-md border transition-all ${inv.einvoice?.irn ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' : 'bg-card border-border text-muted-foreground hover:text-indigo-600 hover:border-indigo-100'}`}
                              title="E-Invoice"
                            >
                              <FileJson className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setActiveInvoice(inv); setIsEWayBillModalOpen(true); }}
                              className={`p-2 rounded-md border transition-all ${inv.ewayBill?.number ? 'bg-emerald-600 border-emerald-700 text-white shadow-md' : 'bg-card border-border text-muted-foreground hover:text-emerald-600 hover:border-emerald-100'}`}
                              title="E-Way Bill"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenPreview(inv)}
                              className="p-2.5 bg-card border border-border rounded-md text-slate-500 hover:text-foreground hover:border-slate-300 transition-all shadow-sm"
                              title="Preview Document"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(inv)}
                              className="p-2.5 bg-slate-900 text-white rounded-md hover:bg-black transition-all shadow-md active:scale-95"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {inv.status === 'draft' && (
                              <>
                                <button
                                  onClick={() => handleFinalizeInvoice(inv._id)}
                                  className="p-2.5 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                                  title="Finalize Invoice"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteInvoice(inv._id)}
                                  className="p-2.5 bg-rose-50 border border-rose-200 text-rose-500 rounded-md hover:bg-rose-100 transition-all shadow-sm active:scale-95"
                                  title="Delete Draft"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
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

      {/* Invoice Generation Modal */}
      <Modal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        title="Generate New Fiscal Invoice"
        size="7xl"
      >
        <div className="p-2 overflow-y-auto max-h-[90vh]">
          {isBillingModalOpen && (
            <BillingForm
              onSubmit={handleCreateInvoice}
              onCancel={() => setIsBillingModalOpen(false)}
              loading={formLoading}
            />
          )}
        </div>
      </Modal>

      {/* Bill from Order Modal */}
      <Modal
        isOpen={isOrderBillModalOpen}
        onClose={() => { setIsOrderBillModalOpen(false); setSelectedOrder(null); setBillQty(""); }}
        title="Issue Tax Bill From Order"
      >
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Order</label>
            <select
              className="erp-input w-full"
              value={selectedOrder?._id || ""}
              onChange={(e) => {
                const order = orders.find(o => o._id === e.target.value);
                setSelectedOrder(order || null);
                if (order) {
                  const unbilled = (order.orderedQty || order.quantity || 0) - (order.invoicedQty || 0);
                  setBillQty(unbilled > 0 ? unbilled : 0);
                } else {
                  setBillQty("");
                }
              }}
            >
              {orders.length === 0 ? (
                <option value="">-- No Active Orders Available --</option>
              ) : (
                <>
                  <option value="">-- Select Active Order --</option>
                  {orders.map(o => {
                    const unbilled = (o.orderedQty || o.quantity || 0) - (o.invoicedQty || 0);
                    return (
                      <option key={o._id} value={o._id}>
                        #{o._id.substring(o._id.length - 6).toUpperCase()} - {o.customer?.name} ({unbilled} {o.unit} remaining)
                      </option>
                    );
                  })}
                </>
              )}
            </select>
          </div>

          {selectedOrder && (
            <>
              <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-widest bg-muted/20 p-4 rounded border border-border">
                <div>
                  <p className="text-muted-foreground mb-1">Target</p>
                  <p className="text-foreground">{selectedOrder.billToCustomer?.company || selectedOrder.customer?.company || selectedOrder.customer?.name || "Retail"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">PO Link</p>
                  <p className="text-indigo-600">{selectedOrder.poNumber || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Box className="w-3.5 h-3.5" /> Billing Quantity ({selectedOrder.unit || "kg"})
                </label>
                <input
                  type="number"
                  className="erp-input text-lg font-black"
                  value={billQty}
                  onChange={(e) => setBillQty(e.target.value)}
                  max={(selectedOrder.orderedQty || selectedOrder.quantity || 0) - (selectedOrder.invoicedQty || 0)}
                  min="0.1"
                  step="0.1"
                />
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1 px-1">
                  <span>Unbilled: {(selectedOrder.orderedQty || selectedOrder.quantity || 0) - (selectedOrder.invoicedQty || 0)}</span>
                  <span>Total: {selectedOrder.orderedQty || selectedOrder.quantity || 0}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <label className="flex items-center gap-2 cursor-pointer group w-fit">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isOrderIgst ? 'bg-indigo-600 border-indigo-600' : 'bg-card border-slate-300 group-hover:border-indigo-400'}`}>
                    {isOrderIgst && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isOrderIgst}
                    onChange={(e) => setIsOrderIgst(e.target.checked)}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Inter-State Sale (Apply IGST)</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border">
                <button onClick={() => setIsOrderBillModalOpen(false)} className="erp-button-secondary flex-1">Cancel</button>
                <button
                  onClick={handleCreateOrderBill}
                  disabled={formLoading || !billQty || Number(billQty) <= 0}
                  className="erp-button-primary flex-[2]"
                >
                  {formLoading ? "Generating..." : "Issue Bill"}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* PDF Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        title={<div className="flex items-center gap-4"><FileText className="w-6 h-6 text-foreground" /><span className="text-xl font-black uppercase tracking-tightest leading-none ">Document <span className="text-indigo-600">Preview</span></span></div>}
        size="7xl"
      >
        <div className="flex flex-col h-[85vh]">
          <div className="p-4 bg-slate-50 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center text-white shadow-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-black text-foreground tracking-tight  uppercase">{activeInvoice?.invoiceNumber}</h4>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Internal Audit Master Record</p>
              </div>
            </div>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-lg shadow-indigo-100"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>

          <div className="flex-1 bg-slate-200 p-4 overflow-hidden flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:30px_30px]"></div>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-md border border-slate-300 shadow-2xl bg-card relative z-10"
                title="Invoice Preview"
              />
            ) : (
              <div className="text-center space-y-4 relative z-10">
                <HammerLoader />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Assembling Document Layers...</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* E-Invoice & E-Way Bill Modals */}
      <EInvoiceDataModal
        isOpen={isEInvoiceModalOpen}
        onClose={() => setIsEInvoiceModalOpen(false)}
        invoice={activeInvoice}
        onSubmit={handleUpdateEinvoice}
        onDownloadJSON={(id) => handleDownloadJSON(id, 'einvoice')}
      />

      <EWayBillDataModal
        isOpen={isEWayBillModalOpen}
        onClose={() => setIsEWayBillModalOpen(false)}
        invoice={activeInvoice}
        onSubmit={handleUpdateEwayBill}
        onDownloadJSON={(id) => handleDownloadJSON(id, 'ewaybill')}
      />

    </AppLayout>
  );
};

export default Billing;
