import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import { invoiceApi } from "../api/erpApi";
import { useAuth } from "../context/AuthContext";
import { 
  FileText, 
  Search, 
  Printer, 
  Download, 
  Filter, 
  Calendar, 
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Receipt,
  CheckCircle2,
  Lock,
  ArrowDownToLine
} from "lucide-react";

const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

  const handleFinalizeInvoice = async (id) => {
    if (window.confirm("Finalize this invoice? This will deduct inventory and create accounting entries. THIS ACTION CANNOT BE UNDONE.")) {
      try {
        await invoiceApi.finalize(id);
        alert("Invoice finalized successfully!");
        fetchInvoices();
      } catch (err) {
        alert("Finalization failed: " + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleDownloadPdf = async (invoice) => {
    try {
      const res = await invoiceApi.downloadPdf(invoice._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${invoice.invoiceNumber || invoice._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("PDF Download failed: " + err.message);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => 
    inv.party?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalBilled = filteredInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalTax = filteredInvoices.reduce((acc, curr) => acc + curr.gstAmount, 0);

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="p-4 bg-gray-900 rounded-[2rem] shadow-xl shadow-gray-200">
                <Receipt className="w-8 h-8 text-white" />
             </div>
             <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Billing Hub</h2>
                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                   <ShieldCheck className="w-3 h-3 text-blue-500" />
                   GST Compliance & Tax Invoice Management
                </p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  className="pl-12 pr-4 py-3 bg-white border border-gray-100 shadow-sm rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 w-64 transition-all" 
                  placeholder="Search Invoice # or Party..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors">
                <Filter className="w-5 h-5 text-gray-400" />
             </button>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                     <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Monthly sales</span>
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Billed Volume</p>
               <h3 className="text-3xl font-black text-gray-900 mt-1">₹{totalBilled.toLocaleString('en-IN')}</h3>
               <div className="mt-4 flex items-center gap-2 text-green-600 font-bold text-xs">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Gross Sales Record</span>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                     <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Tax Overview</span>
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total GST Liability</p>
               <h3 className="text-3xl font-black text-gray-900 mt-1">₹{totalTax.toLocaleString('en-IN')}</h3>
               <p className="mt-4 text-xs font-bold text-gray-500 italic uppercase tracking-tighter">Derived from {filteredInvoices.length} Invoices</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-500/20 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="p-3 bg-white/10 rounded-2xl w-fit mb-4 backdrop-blur-md">
                     <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest opacity-70">Next GSTR-1 Deadline</p>
                  <h3 className="text-3xl font-black mt-1 tracking-tighter">11th Next Month</h3>
                  <button className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">Download GSTR Data</button>
               </div>
               <FileText className="absolute bottom-[-20px] right-[-20px] w-40 h-40 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
            </div>
        </div>

        {/* Invoice List */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                 <FileText className="w-6 h-6 text-blue-600" />
                 Generated Tax Invoices
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                 <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                 Showing Last 50 Documents
              </div>
           </div>

           <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 text-center italic text-gray-400 animate-pulse uppercase tracking-widest font-black">Decrypting Billing Data...</div>
              ) : filteredInvoices.length === 0 ? (
                <div className="p-24 text-center">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-30">
                      <FileText className="w-10 h-10 text-gray-400" />
                   </div>
                   <p className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">No Documents Found</p>
                   <p className="text-gray-400 font-medium text-xs mt-1">Try creating a Sales Order first.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                         <th className="px-8 py-4">Invoice No</th>
                         <th className="px-8 py-4">Party Details</th>
                         <th className="px-8 py-4">Taxable Amt</th>
                         <th className="px-8 py-4">GST Amt</th>
                         <th className="px-8 py-4">Bill Amount</th>
                         <th className="px-8 py-4">Status</th>
                         <th className="px-8 py-4 text-right pr-12">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {filteredInvoices.map((inv) => (
                        <tr key={inv._id} className="group hover:bg-gray-50/80 transition-all duration-300">
                           <td className="px-8 py-6">
                              <div className="flex flex-col">
                                 <span className="text-xs font-black text-gray-900">BT/{inv._id.substring(inv._id.length - 6).toUpperCase()}</span>
                                 <span className="text-[10px] font-bold text-gray-400">{new Date(inv.createdAt).toLocaleDateString('en-GB')}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex flex-col">
                                 <span className="text-sm font-black text-gray-900 uppercase tracking-tighter italic">{inv.customer?.company || inv.customer?.name}</span>
                                 <span className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    {inv.customerGstin || "Unregistered"}
                                 </span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-sm font-bold text-gray-600 tracking-tight">₹{inv.taxableAmount.toLocaleString('en-IN')}</span>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-sm font-black text-blue-600 tracking-tight">₹{inv.gstAmount.toLocaleString('en-IN')}</span>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-lg font-black text-gray-900 tracking-tighter tabular-nums">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                           </td>
                           <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                 {inv.paymentStatus === 'paid' ? 'Settled' : 'Unpaid'}
                              </span>
                           </td>
                           <td className="px-8 py-6 text-right pr-12">
                              <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                   onClick={() => handlePrintInvoice(inv)}
                                   className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-colors shadow-lg shadow-gray-200 active:scale-95"
                                   title="Print Invoice"
                                 >
                                    <Printer className="w-4 h-4" />
                                 </button>
                                 <button className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm active:scale-95" title="Download JSON/Data">
                                    <Download className="w-4 h-4 text-gray-400" />
                                 </button>
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
    </AppLayout>
  );
};

export default Billing;
