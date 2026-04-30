import { useState, useEffect } from "react";
import { invoiceApi } from "../../api/erpApi";
import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import EInvoiceDataModal from "../../components/modals/EInvoiceDataModal";
import EWayBillDataModal from "../../components/modals/EWayBillDataModal";
import { 
  Landmark, ShieldCheck, Search, Filter, TrendingUp, 
  Activity, Zap, Calendar, FileText, Eye, 
  FileJson, Truck, ArrowDownToLine 
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
      // Update active invoice
      if (activeInvoice?._id === id) {
        setActiveInvoice(res.data);
      }
    } catch (err) {
      alert("Failed to update E-Way Bill: " + err.message);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => 
    inv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalBilled = filteredInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalTax = filteredInvoices.reduce((acc, curr) => acc + curr.gstAmount, 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-900/30 flex items-center justify-center group hover:scale-105 transition-transform duration-500">
                <Landmark className="w-7 h-7 text-white group-hover:rotate-12 transition-transform" />
             </div>
             <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tightest leading-none mb-2">
                   Billing <span className="text-primary italic font-serif">Hub</span>
                </h2>
                <div className="flex items-center gap-2">
                   <div className="px-3 py-1 bg-primary/10 rounded-full flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-primary" />
                      <span className="text-[9px] font-black uppercase text-primary tracking-widest">Compliance Verifed</span>
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">GSTR-1 Lifecycle Monitor</span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  className="pl-14 pr-6 py-4 bg-white border border-slate-100 shadow-sm rounded-[1.5rem] text-xs font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 w-80 transition-all font-sans" 
                  placeholder="Universal Document Search..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm erp-row-hover transition-all active:scale-95 group">
                <Filter className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
             </button>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative group p-6 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <TrendingUp className="w-24 h-24 rotate-12" />
               </div>
               <div className="relative z-10">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                     <TrendingUp className="w-7 h-7 text-emerald-500" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Gross Billings</p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tightest">₹{totalBilled.toLocaleString('en-IN')}</h3>
                  <div className="mt-6 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Sales Funnel</span>
                  </div>
               </div>
            </div>

            <div className="relative group p-6 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <Activity className="w-24 h-24 -rotate-12" />
               </div>
               <div className="relative z-10">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                     <Zap className="w-7 h-7 text-blue-500" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tax Liability</p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tightest">₹{totalTax.toLocaleString('en-IN')}</h3>
                  <p className="mt-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Calculated from {filteredInvoices.length} entries</p>
               </div>
            </div>

            <div className="relative group p-6 bg-slate-900 rounded-[1.5rem] shadow-2xl shadow-slate-900/30 text-white overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Calendar className="w-24 h-24" />
               </div>
               <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                     <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">E-Way Threshold Monitor</p>
                  <h3 className="text-3xl font-black text-white tracking-tightest">₹50,000 / Per Con.</h3>
                  <button className="mt-6 w-full py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/30 hover:bg-white hover:text-slate-900 transition-all duration-300">
                     Check Legal Policy
                  </button>
               </div>
            </div>
        </div>

        {/* Invoice List */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-20 group">
           <div className="p-12 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-slate-50 rounded-2xl">
                    <FileText className="w-6 h-6 text-slate-900" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tightest">Generated Tax Ledgers</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Document Stream</p>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">API Online</span>
                 </div>
                 <div className="h-8 w-px bg-slate-100"></div>
                 <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">Total: {filteredInvoices.length}</span>
              </div>
           </div>

           <div className="overflow-x-auto">
              {loading ? (
                <div className="p-32 text-center uppercase tracking-[0.3em] font-black text-slate-300 animate-pulse text-xs">
                   Extracting Data Nodes...
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="p-32 flex flex-col items-center justify-center text-slate-200">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100">
                      <FileText className="w-7 h-7" />
                   </div>
                   <p className="text-2xl font-black text-slate-900 tracking-tightest uppercase italic">Archive Empty</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Initialize a commercial order first</p>
                </div>
              ) : (
                <table className="erp-table">
                   <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
                         <th className="px-12 py-6">Identity</th>
                         <th className="px-12 py-6">Entity Details</th>
                         <th className="px-12 py-6">Commercial Context</th>
                         <th className="px-12 py-6">Fiscal Status</th>
                         <th className="px-12 py-6 text-right pr-20">Control</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredInvoices.map((inv) => (
                        <tr key={inv._id} className="group/row erp-row-hover transition-all duration-500">
                           <td className="px-10 py-3">
                              <div className="flex flex-col">
                                 <span className="text-base font-black text-slate-900 tracking-tightest group-hover/row:text-primary transition-colors">{inv.invoiceNumber || `BT/${inv._id.substring(inv._id.length - 6).toUpperCase()}`}</span>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                           </td>
                           <td className="px-10 py-3">
                              <div className="flex flex-col">
                                 <span className="text-sm font-black text-slate-900 tracking-tightest uppercase italic mb-1">{inv.customer?.company || inv.customer?.name}</span>
                                 <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3 text-primary" />
                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{inv.customerGstin || "Unregistered"}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-3">
                              <div className="flex flex-col gap-1">
                                 <div className="flex justify-between items-center w-40">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Value</span>
                                    <span className="text-xs font-bold text-slate-600">₹{inv.taxableAmount.toLocaleString('en-IN')}</span>
                                 </div>
                                 <div className="flex justify-between items-center w-40">
                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">GST Accrued</span>
                                    <span className="text-xs font-black text-primary">₹{inv.gstAmount.toLocaleString('en-IN')}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-3">
                              <div className="flex flex-col gap-3">
                                 <span className="text-2xl font-black text-slate-900 tracking-tightest tabular-nums">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                                 <div className="flex items-center gap-2">
                                    <span className={`status-badge ${inv.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                                       {inv.paymentStatus === 'paid' ? 'Fully Settled' : 'Action Required'}
                                    </span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-3 text-right pr-20">
                              <button 
                                onClick={() => handleOpenPreview(inv)}
                                className="erp-button-primary"
                                title="Initialize Export"
                              >
                                 <Eye className="w-4 h-4" />
                                 Review & Export
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              )}
           </div>
        </div>

      </div>

      {/* PDF Preview Modal - Refined for Premium Look */}
      <Modal 
        isOpen={isPreviewOpen} 
        onClose={handleClosePreview} 
        title={`Audit Review: ${activeInvoice?.invoiceNumber || activeInvoice?._id}`}
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="w-full h-[650px] border border-slate-100 rounded-[2.5rem] overflow-hidden bg-slate-50 shadow-inner group">
            {previewUrl ? (
              <iframe 
                src={previewUrl} 
                className="w-full h-full border-none"
                title="Invoice Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 animate-pulse font-black uppercase text-[10px] tracking-[0.4em]">
                 Rasterizing Global Data Assets...
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-4 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">NIC Government Exports</h4>
                <div className="flex flex-col gap-3">
                   <button 
                     onClick={() => handleDownloadJSON(activeInvoice._id, 'einvoice')}
                     className="erp-button-secondary w-full"
                   >
                      <FileJson className="w-4 h-4 text-primary" />
                      Download E-Invoice JSON
                   </button>
                   <button 
                     onClick={() => setIsEInvoiceModalOpen(true)}
                     className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-dashed border-slate-200 rounded-2xl hover:bg-white hover:border-primary hover:text-primary transition-all active:scale-95"
                   >
                      Manual Sync: IRN Status
                   </button>
                </div>
             </div>

             <div className="space-y-4 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Logistics Compliance</h4>
                <div className="flex flex-col gap-3">
                   <button 
                     onClick={() => handleDownloadJSON(activeInvoice._id, 'ewaybill')}
                     className="erp-button-secondary w-full"
                   >
                      <Truck className="w-4 h-4 text-indigo-500" />
                      Download E-Way Bill JSON
                   </button>
                   <button 
                     onClick={() => setIsEWayBillModalOpen(true)}
                     className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-dashed border-slate-200 rounded-2xl hover:bg-white hover:border-indigo-400 hover:text-indigo-500 transition-all active:scale-95"
                   >
                      Manual Sync: EWB Status
                   </button>
                </div>
             </div>
          </div>

          <div className="flex gap-4 border-t border-slate-50 pt-8 mt-4">
             <button 
               onClick={handleDownloadPdf}
               className="erp-button-primary flex-1 !py-5"
             >
                <ArrowDownToLine className="w-5 h-5" />
                Initialize Final PDF Signature
             </button>
             <button 
               onClick={handleClosePreview}
               className="erp-button-secondary !border-transparent hover:!bg-slate-100 px-10"
             >Discard Preview</button>
          </div>
        </div>
      </Modal>

      <EInvoiceDataModal 
        key={`einvoice-${activeInvoice?._id}`}
        isOpen={isEInvoiceModalOpen}
        onClose={() => setIsEInvoiceModalOpen(false)}
        invoice={activeInvoice}
        onUpdate={handleUpdateEinvoice}
      />

      <EWayBillDataModal 
        key={`ewaybill-${activeInvoice?._id}`}
        isOpen={isEWayBillModalOpen}
        onClose={() => setIsEWayBillModalOpen(false)}
        invoice={activeInvoice}
        onUpdate={handleUpdateEwayBill}
      />

    </AppLayout>
  );
};

export default Billing;
