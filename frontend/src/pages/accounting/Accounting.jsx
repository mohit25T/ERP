import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { paymentApi, api, ledgerApi, customerApi, supplierApi } from "../../api/erpApi";
import AppLayout from "../../components/layout/AppLayout";
import HammerLoader from "../../components/common/HammerLoader";
import {
   ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, BookOpen,
   ShieldCheck, Wallet, Zap, Activity, Search,
   Database, Clock, Building2, Users, Receipt, FileText,
   Plus, X, Save, AlertCircle
} from "lucide-react";

const TransactionModal = ({ isOpen, onClose, onRefresh, parties }) => {
   const [formData, setFormData] = useState({
      type: "income",
      category: "Direct Sales",
      amount: "",
      description: "",
      partyId: "",
      date: new Date().toISOString().split('T')[0]
   });
   const [loading, setLoading] = useState(false);

   if (!isOpen) return null;

   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
         const payload = {
            ...formData,
            amount: Number(formData.amount),
            customer: formData.type === "income" ? formData.partyId : undefined,
            supplier: formData.type === "expense" ? formData.partyId : undefined
         };
         await ledgerApi.create(payload);
         onRefresh();
         onClose();
      } catch (err) {
         alert(err.response?.data?.error || "Transaction Initialization Failed");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
         <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-xl rounded-md shadow-3xl shadow-slate-900/20 overflow-hidden border border-slate-100 flex flex-col"
         >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 rounded-md shadow-lg">
                     <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-1">Initialize Protocol</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Global Fiscal Adjustment Terminal</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white border border-transparent hover:border-slate-100 rounded-md transition-all active:scale-90">
                  <X className="w-5 h-5 text-slate-400" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Flow Direction</label>
                     <select 
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-md text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 transition-all cursor-pointer"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value, partyId: ""})}
                     >
                        <option value="income">Inward Flow (Receipt)</option>
                        <option value="expense">Outward Flow (Payment)</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Statutory Category</label>
                     <select 
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-md text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 transition-all cursor-pointer"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                     >
                        <option value="Direct Sales">Direct Sales</option>
                        <option value="Stock Purchase">Stock Purchase</option>
                        <option value="Credit Note">Credit Note (Sales Return)</option>
                        <option value="Debit Note">Debit Note (Pur Return)</option>
                        <option value="Salary">Salary Disbursement</option>
                        <option value="Adjustment">Manual Adjustment</option>
                        <option value="Other">Miscellaneous</option>
                     </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entity Selection (Required)</label>
                  <select 
                     required
                     className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-md text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 transition-all cursor-pointer"
                     value={formData.partyId}
                     onChange={(e) => setFormData({...formData, partyId: e.target.value})}
                  >
                     <option value="">Select Target Entity...</option>
                     {formData.type === "income" ? (
                        parties.customers.map(c => <option key={c._id} value={c._id}>{c.name} — {c.company || 'N/A'}</option>)
                     ) : (
                        parties.suppliers.map(s => <option key={s._id} value={s._id}>{s.company || s.name}</option>)
                     )}
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Magnitude (₹)</label>
                     <input 
                        required
                        type="number"
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-md text-xs font-black italic outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Execution Timestamp</label>
                     <input 
                        type="date"
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-md text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Narration Summary</label>
                  <textarea 
                     className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-md text-xs font-bold outline-none focus:ring-4 focus:ring-slate-900/5 transition-all min-h-[100px]"
                     placeholder="Technical description of fiscal movement..."
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
               </div>

               <div className="flex gap-4 pt-6 border-t border-slate-50">
                  <button 
                     type="submit"
                     disabled={loading}
                     className="flex-1 py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-md shadow-xl shadow-slate-900/20 hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2 group"
                  >
                     <Save className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                     {loading ? "Recording Protocol..." : "Commit Transaction"}
                  </button>
                  <button 
                     type="button"
                     onClick={onClose}
                     className="px-8 py-5 bg-white text-slate-400 font-black text-xs uppercase tracking-widest rounded-md border border-slate-100 hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none shadow-sm active:scale-95"
                  >
                     Abort
                  </button>
               </div>
            </form>
         </motion.div>
      </div>
   );
};

const Accounting = () => {
   const [summary, setSummary] = useState(null);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState("receivables");
   const [details, setDetails] = useState([]);

   const [searchTerm, setSearchTerm] = useState("");
   const [filterMonth, setFilterMonth] = useState("all");
   const [filterParty, setFilterParty] = useState("all");

   const [isModalOpen, setIsModalOpen] = useState(false);
   const [parties, setParties] = useState({ customers: [], suppliers: [] });

   useEffect(() => {
      setSearchTerm("");
      setFilterMonth("all");
      setFilterParty("all");
      fetchParties();
   }, [activeTab]);

   const fetchParties = async () => {
      try {
         const [custRes, suppRes] = await Promise.all([
            customerApi.getAll(),
            supplierApi.getAll()
         ]);
         setParties({
            customers: Array.isArray(custRes.data) ? custRes.data : [],
            suppliers: Array.isArray(suppRes.data) ? suppRes.data : []
         });
      } catch (err) {
         console.error("Party fetch failed", err);
      }
   };

   const fetchData = async () => {
      try {
         setLoading(true);
         const summaryRes = await paymentApi.getSummary();
         setSummary(summaryRes.data);

         if (activeTab === "receivables") {
            const res = await api.get("/orders");
            const data = Array.isArray(res.data) ? res.data : [];
            setDetails(data.filter(o => o.paymentStatus !== "paid" && !["cancelled", "refunded"].includes(o.status)));
         } else if (activeTab === "payables") {
            const res = await api.get("/purchases");
            const data = Array.isArray(res.data) ? res.data : [];
            setDetails(data.filter(p => p.paymentStatus !== "paid" && p.status !== "cancelled"));
         } else if (activeTab === "creditnotes") {
            // Note: In this system, Credit Notes are often mapped to specific 'income' ledger entries with 'Adjustment' or 'Return' category
            const res = await ledgerApi.getAll();
            const data = Array.isArray(res.data) ? res.data : [];
            setDetails(data.filter(l => l.category === 'Credit Note' || l.description?.toLowerCase().includes('credit note')));
         } else if (activeTab === "debitnotes") {
            const res = await ledgerApi.getAll();
            const data = Array.isArray(res.data) ? res.data : [];
            setDetails(data.filter(l => l.category === 'Debit Note' || l.description?.toLowerCase().includes('debit note')));
         } else {
            const res = await ledgerApi.getAll();
            const data = Array.isArray(res.data) ? res.data : [];
            setDetails(data);
         }
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, [activeTab]);

   const getPartyName = (item) => {
      if (item.customer?.name) return item.customer.name;
      if (item.supplier?.company) return item.supplier.company;
      if (item.supplier?.name) return item.supplier.name;
      return "Private Transaction";
   };

   const getMonthStr = (item) => {
      const d = new Date(item.date || item.createdAt);
      if (isNaN(d.valueOf())) return "Invalid";
      return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
   };

   const getVirtualEntries = (item) => {
      if (item.entries && item.entries.length > 0) return item.entries;
      const party = getPartyName(item);
      const amount = item.amount || item.totalAmount || 0;

      if (item.type === "income") {
         return [
            { account: "Cash/Bank Account", debit: amount, credit: 0 },
            { account: party, debit: 0, credit: amount }
         ];
      } else {
         return [
            { account: party, debit: amount, credit: 0 },
            { account: "Cash/Bank Account", debit: 0, credit: amount }
         ];
      }
   };

   const uniqueMonths = [...new Set(details.map(getMonthStr))].filter(m => m !== "Invalid");
   const uniqueParties = [...new Set(details.map(getPartyName))];

   const filteredDetails = details.filter(item => {
      const s = searchTerm.toLowerCase();
      const matchSearch = s === "" ||
         getPartyName(item).toLowerCase().includes(s) ||
         (item.description && item.description.toLowerCase().includes(s)) ||
         (item._id?.toString() || "").toLowerCase().includes(s);
      const matchMonth = filterMonth === "all" || getMonthStr(item) === filterMonth;
      const matchParty = filterParty === "all" || getPartyName(item) === filterParty;
      return matchSearch && matchMonth && matchParty;
   });

   return (
      <AppLayout>
         <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">

            {/* Elite Treasury Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-slate-900 rounded-md flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-xl border border-slate-800">
                     <Wallet className="w-7 h-7 text-white" />
                  </div>
                  <div>
                     <h2 className="text-3xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Treasury <span className="text-primary not-italic">Intelligence</span></h2>
                     <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Cash Flow Orchestration & Balance Settlement</span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <button 
                     onClick={() => setIsModalOpen(true)}
                     className="erp-button-primary !py-5 !bg-slate-900 !rounded-md hover:!bg-black group shadow-xl shadow-slate-900/20"
                  >
                     <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                     Initialize Protocol
                  </button>
                  <div className="px-6 py-4 bg-white rounded-md border border-slate-100 shadow-sm flex items-center gap-3">
                     <Clock className="w-4 h-4 text-slate-300" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Flux Monitoring</span>
                  </div>
               </div>
            </div>

            {/* Global KPI Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
               {[
                  { id: 'receivables', label: 'Receivables', val: summary?.totalReceivable, icon: ArrowUpCircle },
                  { id: 'payables', label: 'Payables', val: summary?.totalPayable, icon: ArrowDownCircle },
                  { id: 'creditnotes', label: 'Credit Notes', val: 'Returns', icon: Receipt },
                  { id: 'debitnotes', label: 'Debit Notes', val: 'Claims', icon: FileText },
                  { id: 'journal', label: 'Journal', val: 'Active Log', icon: BookOpen },
                  { id: 'ledger', label: 'Cash Dynamics', val: 'Archive', icon: ArrowRightLeft },
               ].map((tab) => (
                  <div
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`p-6 rounded-md border transition-all duration-500 cursor-pointer relative overflow-hidden group ${activeTab === tab.id ? 'bg-slate-900 border-slate-900 shadow-2xl shadow-slate-900/20 text-white scale-105 z-10' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}
                  >
                     <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <tab.icon className="w-5 h-5" />
                     </div>
                     <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${activeTab === tab.id ? 'text-white/40' : 'text-slate-400'}`}>{tab.label}</p>
                     <h3 className={`text-lg font-black italic tracking-tightest tabular-nums ${activeTab === tab.id ? 'text-white' : 'text-slate-900'}`}>
                        {typeof tab.val === 'number' ? `₹${tab.val.toLocaleString()}` : tab.val}
                     </h3>
                     {activeTab === tab.id && <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="w-10 h-10 text-white" /></div>}
                  </div>
               ))}
            </div>

            {/* Unified Ledger Workspace */}
            <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden mb-12">
               <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center text-white shadow-lg"><Activity className="w-6 h-6" /></div>
                     <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Detailed Analysis</h4>
                        <p className="text-xl font-black text-slate-900 uppercase italic tracking-tightest">
                           {activeTab === 'receivables' ? 'Outstanding Inflow' : 
                            activeTab === 'payables' ? 'Pending Obligations' : 
                            activeTab === 'creditnotes' ? 'Sales Returns & Credit Registry' :
                            activeTab === 'debitnotes' ? 'Purchase Returns & Debit Registry' :
                            activeTab === 'journal' ? 'Double-Entry Journal' : 'Bookkeeping Flux'}
                        </p>
                     </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                     <div className="relative group w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Dataset Lookup..." className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-md text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all w-full shadow-sm" />
                     </div>
                     <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-6 pr-10 py-4 bg-white border border-slate-100 rounded-md text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-sm">
                        <option value="all">Global Temporal</option>
                        {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                     <select value={filterParty} onChange={(e) => setFilterParty(e.target.value)} className="px-6 pr-10 py-4 bg-white border border-slate-100 rounded-md text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-sm max-w-[200px]">
                        <option value="all">Global Entities</option>
                        {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                     </select>
                  </div>
               </div>

               <div className="overflow-x-auto min-h-[400px] flex flex-col">
                  {loading ? (
                     <div className="flex-1 flex flex-col items-center justify-center">
                        <HammerLoader />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-8 animate-pulse">Syncing Treasury Data...</p>
                     </div>
                  ) : filteredDetails.length === 0 ? (
                     <div className="flex-1 flex flex-col items-center justify-center p-32 text-center opacity-20 gap-4">
                        <Database className="w-12 h-12" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Zero Records Detected in current Scope.</p>
                     </div>
                  ) : (
                     <table className="erp-table">
                        <thead>
                           <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
                              {activeTab === "journal" ? (
                                 <>
                                    <th className="px-6 py-4 italic">Timestamp</th>
                                    <th className="px-6 py-4 italic">Narration</th>
                                    <th className="px-6 py-4 italic">Account Matrix</th>
                                    <th className="px-6 py-4 text-right italic">Debit</th>
                                    <th className="px-6 py-4 text-right pr-20 italic">Credit</th>
                                 </>
                              ) : activeTab === "ledger" || activeTab === "creditnotes" || activeTab === "debitnotes" ? (
                                 <>
                                    <th className="px-6 py-4 italic">Timestamp</th>
                                    <th className="px-6 py-4 italic">Protocol/Category</th>
                                    <th className="px-6 py-4 italic">Narration Summary</th>
                                    <th className="px-6 py-4 italic">Linked Node</th>
                                    <th className="px-6 py-4 text-right pr-20 italic">Magnitude</th>
                                 </>
                              ) : (
                                 <>
                                    <th className="px-6 py-4 italic">Reference</th>
                                    <th className="px-6 py-4 italic">Entity Analysis</th>
                                    <th className="px-6 py-4 text-right italic">Invoice Yield</th>
                                    <th className="px-6 py-4 text-right italic">Settled Amount</th>
                                    <th className="px-6 py-4 text-right pr-20 italic">Remaining Drift</th>
                                 </>
                              )}
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           <AnimatePresence mode="popLayout">
                             {filteredDetails.map((item, index) => (
                                <motion.tr 
                                  key={item._id} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.03 }}
                                  className="group erp-row-hover transition-all duration-500"
                                >
                                 {activeTab === "journal" ? (
                                    <>
                                       <td className="px-6 py-4">
                                          <div className="flex flex-col">
                                             <span className="text-[11px] font-black text-slate-900 tracking-tightest italic">{new Date(item.date).toLocaleDateString()}</span>
                                             <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1.5 bg-indigo-50 px-2 py-0.5 rounded-md w-fit">JV-{item._id.slice(-4).toUpperCase()}</span>
                                          </div>
                                       </td>
                                       <td className="px-6 py-4">
                                          <div className="flex flex-col">
                                             <span className="text-sm font-black text-slate-900 tracking-tightest uppercase italic">{item.description}</span>
                                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                                <Database className="w-3.5 h-3.5" />
                                                Ref: {(item.referenceId || item.order?._id || item.purchase?._id || item._id).slice(-6).toUpperCase()}
                                             </span>
                                          </div>
                                       </td>
                                       <td className="px-6 py-4" colSpan={3}>
                                          <div className="space-y-3 py-2">
                                             {getVirtualEntries(item).map((entry, idx) => (
                                                <div key={idx} className="grid grid-cols-12 gap-6 items-center border-b border-slate-50 last:border-0 pb-3">
                                                   <div className="col-span-6 flex items-center gap-3">
                                                      <div className={`w-2 h-2 rounded-full ${entry.debit > 0 ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse' : 'bg-rose-500 shadow-sm shadow-rose-500/50'}`}></div>
                                                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{entry.account}</span>
                                                   </div>
                                                   <div className="col-span-3 text-right tabular-nums text-sm font-black italic tracking-tighter text-slate-900">
                                                      {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '---'}
                                                   </div>
                                                   <div className="col-span-3 text-right tabular-nums text-sm font-black italic tracking-tighter text-slate-900 pr-8">
                                                      {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '---'}
                                                   </div>
                                                </div>
                                             ))}
                                          </div>
                                       </td>
                                    </>
                                 ) : activeTab === "ledger" || activeTab === "creditnotes" || activeTab === "debitnotes" ? (
                                    <>
                                       <td className="px-6 py-4">
                                          <span className="text-[11px] font-black text-slate-900 tracking-tightest italic">{new Date(item.date).toLocaleDateString()}</span>
                                       </td>
                                       <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                             <span className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5' : 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-500/5'}`}>
                                                {item.type}
                                             </span>
                                             <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-tighter">{item.category}</span>
                                          </div>
                                       </td>
                                       <td className="px-6 py-4 max-w-xs">
                                          <span className="text-sm font-black text-slate-900 tracking-tightest uppercase italic truncate block">{item.description || 'Global Narrative Offset'}</span>
                                       </td>
                                       <td className="px-6 py-4">
                                          {item.customer ? (
                                             <div className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-2 italic bg-indigo-50 px-4 py-2 rounded-md border border-indigo-100 w-fit"><Users className="w-3.5 h-3.5" /> {item.customer?.name}</div>
                                          ) : item.supplier ? (
                                             <div className="text-[10px] font-black text-rose-600 uppercase flex items-center gap-2 italic bg-rose-50 px-4 py-2 rounded-md border border-rose-100 w-fit"><Building2 className="w-3.5 h-3.5" /> {item.supplier?.company || item.supplier?.name}</div>
                                          ) : (
                                             <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic opacity-40">System Node</span>
                                          )}
                                       </td>
                                       <td className="px-6 py-4 text-right pr-20">
                                          <span className={`text-lg font-black italic tracking-tightest tabular-nums ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                             {item.type === 'income' ? '+' : '-'} ₹{item.amount?.toLocaleString()}
                                          </span>
                                       </td>
                                    </>
                                 ) : (
                                    <>
                                       <td className="px-6 py-4">
                                          <div className="flex flex-col">
                                             <span className="text-[11px] font-black text-slate-900 tracking-tightest italic mb-1.5">#{item._id.slice(-6).toUpperCase()}</span>
                                             <div className="px-3 py-1 bg-slate-50 text-slate-400 rounded-md text-[9px] font-black border border-slate-100 uppercase tracking-widest w-fit">Ref-Protocol</div>
                                          </div>
                                       </td>
                                       <td className="px-6 py-4">
                                          <div className="flex flex-col">
                                             <span className="text-sm font-black text-slate-900 tracking-tightest uppercase italic group-hover:text-slate-600 transition-colors">
                                                {activeTab === 'receivables' ? item.customer?.name : (item.supplier?.company || item.supplier?.name || 'Partner')}
                                             </span>
                                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 opacity-40 flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Duration: {getMonthStr(item)}</span>
                                          </div>
                                       </td>
                                       <td className="px-6 py-4 text-right tabular-nums">
                                          <span className="text-sm font-black italic tracking-tighter text-slate-900">₹{item.totalAmount?.toLocaleString()}</span>
                                       </td>
                                       <td className="px-6 py-4 text-right tabular-nums">
                                          <span className="text-sm font-black italic tracking-tighter text-emerald-600">₹{item.amountPaid?.toLocaleString()}</span>
                                       </td>
                                       <td className="px-6 py-4 text-right pr-20">
                                          <div className="flex flex-col items-end">
                                             <span className="text-lg font-black text-rose-600 tracking-tightest italic">₹{(item.totalAmount - (item.amountPaid || 0)).toLocaleString()}</span>
                                             <div className="w-32 h-2 bg-slate-100 rounded-md mt-4 overflow-hidden shadow-inner flex border border-slate-200">
                                                <div className={`h-full bg-gradient-to-r ${activeTab === 'receivables' ? 'from-indigo-600 to-indigo-400' : 'from-rose-600 to-rose-400'}`} style={{ width: `${((item.amountPaid || 0) / item.totalAmount) * 100}%` }}></div>
                                             </div>
                                          </div>
                                       </td>
                                    </>
                                 )}
                                </motion.tr>
                             ))}
                           </AnimatePresence>
                        </tbody>
                     </table>
                  )}
               </div>
            </div>

            <TransactionModal 
               isOpen={isModalOpen} 
               onClose={() => setIsModalOpen(false)} 
               onRefresh={fetchData}
               parties={parties}
            />
         </div>
      </AppLayout>
   );
};

export default Accounting;
