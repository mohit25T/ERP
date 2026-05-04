import { useState, useEffect } from "react";
import { invoiceApi } from "../../api/erpApi";
import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import HammerLoader from "../../components/common/HammerLoader";
import EInvoiceDataModal from "../../components/modals/EInvoiceDataModal";
import EWayBillDataModal from "../../components/modals/EWayBillDataModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark, ShieldCheck, Search, Filter, TrendingUp,
  Activity, Zap, Calendar, FileText, Eye, Truck,
  FileJson, ArrowDownToLine, Download
} from "lucide-react";


const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  const [isEInvoiceModalOpen, setIsEInvoiceModalOpen] = useState(false);
  const [isEWayBillModalOpen, setIsEWayBillModalOpen] = useState(false);

  const { user } = useAuth();

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
      // Update active invoice if it's the one currently being viewed
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

  const filteredInvoices = invoices.filter(inv =>
    (inv.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.customer?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBilled = filteredInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const totalTax = filteredInvoices.reduce((acc, inv) => acc + (inv.gstAmount || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">

        {/* Corporate Header Node */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-slate-900 rounded-md flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-xl border border-slate-800">
              <Landmark className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">
                Fiscal <span className="text-primary not-italic">Terminal</span>
              </h2>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Commercial Settlement Hub & Compliance Orchestration</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
              <input
                className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-md text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 w-80 transition-all shadow-sm"
                placeholder="Universal Document Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-4 bg-white border border-slate-100 rounded-md shadow-sm hover:border-slate-300 transition-all active:scale-95 group">
              <Filter className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
            </button>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative group p-6 bg-white border border-slate-100 rounded-md shadow-sm hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-700 hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity group-hover:scale-125 duration-700">
              <TrendingUp className="w-32 h-32 rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-md flex items-center justify-center mb-8 shadow-inner">
                <TrendingUp className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gross Billings</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tightest italic leading-none">₹{totalBilled.toLocaleString('en-IN')}</h3>
              <div className="mt-8 flex items-center gap-2 bg-emerald-50 w-fit px-3 py-1 rounded-md">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active Revenue Stream</span>
              </div>
            </div>
          </div>

          <div className="relative group p-6 bg-white border border-slate-100 rounded-md shadow-sm hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-700 hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity group-hover:scale-125 duration-700">
              <Activity className="w-32 h-32 -rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-md flex items-center justify-center mb-8 shadow-inner">
                <Zap className="w-7 h-7 text-indigo-600" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tax Liability</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tightest italic leading-none">₹{totalTax.toLocaleString('en-IN')}</h3>
              <p className="mt-8 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 w-fit px-3 py-1 rounded-md">Calculated from {filteredInvoices.length} entries</p>
            </div>
          </div>

          <div className="relative group p-6 bg-slate-900 rounded-md shadow-2xl shadow-slate-900/20 text-white overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Calendar className="w-32 h-32" />
            </div>
            <div className="relative z-10">
               <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-md flex items-center justify-center mb-8 border border-white/10 shadow-inner">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">E-Way Threshold Monitor</p>
              <h3 className="text-3xl font-black text-white tracking-tightest italic leading-none">₹50,000 / Per Con.</h3>
              <button className="mt-8 w-full py-4 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg hover:bg-primary hover:text-white transition-all duration-500">
                Verify Legal Protocol
              </button>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden mb-12">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center text-white shadow-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tightest leading-none mb-1.5 uppercase italic">Generated Tax Ledgers</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Synchronized Document Stream</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Network Secure</span>
              </div>
              <div className="h-10 w-px bg-slate-100"></div>
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-white px-5 py-2.5 rounded-md border border-slate-100 shadow-sm">Registry Volume: {filteredInvoices.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-20">
                <HammerLoader />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-8 animate-pulse">Retrieving Fiscal Records...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-40 text-center opacity-20 gap-6">
                <FileText className="w-16 h-16" />
                <p className="font-black text-slate-900 tracking-[0.4em] uppercase italic text-[11px]">Archive Empty. Initialize Fulfillment.</p>
              </div>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                    <th className="px-6 py-4 italic">Doc Registry</th>
                    <th className="px-6 py-4 italic">Counterparty Node</th>
                    <th className="px-6 py-4 text-center italic">Protocol Date</th>
                    <th className="px-6 py-4 text-right italic">Settlement Value</th>
                    <th className="px-6 py-4 text-center italic">Compliance</th>
                    <th className="px-6 py-4 text-right pr-12 italic">Command</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                    {filteredInvoices.map((inv, index) => (
                      <motion.tr
                        key={inv._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className="group erp-row-hover transition-all duration-500"
                      >
                        <td className="px-6 py-4">
                           <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center text-slate-900 font-black text-xs italic shadow-lg border border-slate-100 group-hover:scale-110 transition-transform mb-1">
                             {inv.invoiceNumber?.charAt(0) || "I"}
                           </div>
                           <div className="flex flex-col">
                            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1 opacity-60">Tax Ledger</span>
                            <span className="text-sm font-black text-slate-900 tracking-tightest italic leading-none">{inv.invoiceNumber || inv._id.slice(-8).toUpperCase()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 leading-none mb-1.5 tracking-tightest uppercase italic group-hover:text-primary transition-colors">{inv.customer?.name || inv.customerName || "External Node"}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic leading-none bg-slate-50 w-fit px-2 py-0.5 rounded-md border border-slate-100">{inv.customer?.gstin || "Non-GST Protocol"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-black text-slate-900 tracking-tightest italic bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 tabular-nums uppercase">{new Date(inv.date || inv.createdAt).toLocaleDateString('en-GB')}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-xl font-black text-slate-900 tracking-tightest italic tabular-nums leading-none mb-1">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</span>
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest italic leading-none bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Verified Magnitude</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => { setActiveInvoice(inv); setIsEInvoiceModalOpen(true); }}
                              className={`p-2 rounded-md border transition-all duration-300 shadow-sm ${inv.einvoice?.irn ? 'bg-indigo-600 border-indigo-700 text-white shadow-indigo-200' : 'bg-white border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg'}`}
                              title={inv.einvoice?.irn ? "E-Invoice Protocol Active" : "Add E-Invoice Data"}
                            >
                              <FileJson className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setActiveInvoice(inv); setIsEWayBillModalOpen(true); }}
                              className={`p-2 rounded-md border transition-all duration-300 shadow-sm ${inv.ewayBill?.number ? 'bg-emerald-600 border-emerald-700 text-white shadow-emerald-200' : 'bg-white border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-lg'}`}
                              title={inv.ewayBill?.number ? "E-Way Bill Logged" : "Add E-Way Bill Data"}
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right pr-12">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenPreview(inv)}
                              className="p-3 bg-white border border-slate-100 rounded-md text-slate-400 hover:text-slate-900 hover:shadow-xl transition-all active:scale-90 group/btn"
                            >
                              <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(inv)}
                              className="p-3 bg-slate-900 text-white rounded-md hover:bg-black shadow-xl shadow-slate-900/10 transition-all active:scale-90 group/btn"
                            >
                              <ArrowDownToLine className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            </button>
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

      {/* PDF Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        title={<div className="flex items-center gap-4"><FileText className="w-6 h-6 text-slate-900" /><span className="text-xl font-black italic tracking-tightest uppercase leading-none">Fiscal Document Preview</span></div>}
        size="max-w-6xl"
      >
        <div className="flex flex-col h-[85vh]">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-slate-900 rounded-md flex items-center justify-center text-white shadow-xl">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tightest italic leading-none mb-1.5 uppercase">Invoice Node: <span className="text-primary not-italic">{activeInvoice?.invoiceNumber}</span></h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Enterprise Fulfillment Protocol Analysis</p>
              </div>
            </div>
            <button
              onClick={handleDownloadPdf}
              className="px-6 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-md hover:bg-black transition-all flex items-center gap-3 shadow-2xl shadow-slate-900/20 group"
            >
              <Download className="w-5 h-5 group-hover:scale-110 transition-transform" /> Commit Download
            </button>
          </div>

          <div className="flex-1 bg-slate-200/50 p-6 overflow-hidden flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]"></div>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-md border border-slate-300 shadow-[0_0_80px_rgba(0,0,0,0.15)] bg-white relative z-10"
                title="Invoice Preview"
              />
            ) : (
              <div className="text-center space-y-6 relative z-10">
                <HammerLoader />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Assembling Document Layers...</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* E-Invoice Metadata Modal */}
      <EInvoiceDataModal
        isOpen={isEInvoiceModalOpen}
        onClose={() => setIsEInvoiceModalOpen(false)}
        invoice={activeInvoice}
        onSubmit={handleUpdateEinvoice}
        onDownloadJSON={(id) => handleDownloadJSON(id, 'einvoice')}
      />

      {/* E-Way Bill Metadata Modal */}
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
