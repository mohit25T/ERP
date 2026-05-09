import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { paymentApi, api, ledgerApi, customerApi, supplierApi } from "../../api/erpApi";
import { useSocket } from "../../context/SocketContext";
import AppLayout from "../../components/layout/AppLayout";
import HammerLoader from "../../components/common/HammerLoader";
import { formatDate } from "../../utils/dateUtils";
import {
   ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, BookOpen,
   ShieldCheck, Wallet, Zap, Activity, Search,
   Database, Clock, Building2, Users, Receipt, FileText,
   Plus, X, Save, AlertCircle
} from "lucide-react";

const TransactionModal = ({ isOpen, onClose, onRefresh, parties }) => {
   const [formData, setFormData] = useState({
      type: "income",
      category: "Credit Note",
      amount: "",
      description: "",
      partyId: "",
      date: new Date().toISOString().split('T')[0],
      stockLogic: "Without Stock"
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

   return createPortal(
      <AnimatePresence>
         {isOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
               <motion.div
                  initial={{ scale: 0.98, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.98, opacity: 0, y: 20 }}
                  className="bg-card w-full max-w-2xl shadow-3xl shadow-slate-900/10 overflow-hidden border border-border flex flex-col"
               >
                  <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-card relative">
                     <div className="flex items-center gap-4 relative z-10">
                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                        <div>
                           <h3 className="text-xl font-black text-foreground tracking-tighter uppercase  leading-none mb-1">Add Entry</h3>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Accounting Entry Form</p>
                        </div>
                     </div>
                     <button onClick={onClose} className="w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-all shadow-sm active:scale-90 z-10">
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-3 space-y-4">
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Payment Type</label>
                           <select
                              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-md text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all cursor-pointer"
                              value={formData.type}
                              onChange={(e) => setFormData({ ...formData, type: e.target.value, partyId: "" })}
                           >
                              <option value="income">Received (Income)</option>
                              <option value="expense">Paid (Expense)</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Note Type</label>
                           <select
                              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-md text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all cursor-pointer"
                              value={formData.category}
                              onChange={(e) => {
                                 const cat = e.target.value;
                                 setFormData({
                                    ...formData,
                                    category: cat,
                                    type: cat === "Credit Note" ? "income" : "expense"
                                 });
                              }}
                           >
                              <option value="Credit Note">Sales Return</option>
                              <option value="Debit Note">Purchase Return</option>
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Select Party</label>
                           <select
                              required
                              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-md text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all cursor-pointer"
                              value={formData.partyId}
                              onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                           >
                              <option value="">Select Customer/Supplier...</option>
                              {formData.category === "Credit Note" ? (
                                 parties.customers.map(c => <option key={c._id} value={c._id}>{c.name} — {c.company || 'N/A'}</option>)
                              ) : (
                                 parties.suppliers.map(s => <option key={s._id} value={s._id}>{s.company || s.name}</option>)
                              )}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Stock Update</label>
                           <select
                              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-md text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all cursor-pointer"
                              value={formData.stockLogic}
                              onChange={(e) => setFormData({ ...formData, stockLogic: e.target.value })}
                           >
                              <option value="With Stock">Update Stock</option>
                              <option value="Without Stock">Only Accounting (No Stock)</option>
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Amount</label>
                           <input
                              required
                              type="number"
                              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-md text-xs font-black  outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all"
                              placeholder="0.00"
                              value={formData.amount}
                              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Date</label>
                           <input
                              type="date"
                              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-md text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all"
                              value={formData.date}
                              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                           />
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Description</label>
                        <textarea
                           className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-md text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all min-h-[70px] resize-none"
                           placeholder="Enter details here..."
                           value={formData.description}
                           onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                     </div>

                     <div className="flex gap-3 pt-3">
                        <button
                           type="button"
                           onClick={onClose}
                           className="px-3 py-2.5 bg-muted text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-md hover:bg-slate-200 transition-all focus:outline-none active:scale-95"
                        >
                           Cancel
                        </button>
                        <button
                           type="submit"
                           disabled={loading}
                           className="flex-1 py-2.5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-md shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                           {loading ? "Saving..." : "Save Transaction"}
                        </button>
                     </div>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>,
      document.body
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
   const [logs] = useState([]);

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

         // 1. Determine tab-specific fetch
         const tabFetch = activeTab === "receivables" ? api.get("/orders") :
            activeTab === "payables" ? api.get("/purchases") :
               Promise.resolve({ data: [] });

         // 2. Execute all protocols in parallel for maximum performance
         const [summaryRes, ledgerRes, tabRes] = await Promise.all([
            paymentApi.getSummary(),
            ledgerApi.getAll(),
            tabFetch
         ]);

         const summaryData = summaryRes.data || {};
         const ledgerData = Array.isArray(ledgerRes.data) ? ledgerRes.data : [];

         // 3. Calculate Global Statistics
         const stats = {
            creditNotes: ledgerData.filter(l => l.category === 'Credit Note' || l.description?.toLowerCase().includes('credit note')).reduce((acc, curr) => acc + (curr.amount || 0), 0),
            debitNotes: ledgerData.filter(l => l.category === 'Debit Note' || l.description?.toLowerCase().includes('debit note')).reduce((acc, curr) => acc + (curr.amount || 0), 0),
            journal: ledgerData.reduce((acc, curr) => acc + (curr.amount || 0), 0)
         };

         // 4. Atomic State Synchronization (Prevents UI Flickering)
         setSummary(prev => ({ ...prev, ...summaryData, ...stats }));

         // 5. Configure Tab-Specific Dataset
         let finalDetails = [];
         if (activeTab === "receivables") {
            const data = Array.isArray(tabRes.data) ? tabRes.data : [];
            finalDetails = data.filter(o => o.paymentStatus !== "paid" && !["cancelled", "refunded"].includes(o.status));
         } else if (activeTab === "payables") {
            const data = Array.isArray(tabRes.data) ? tabRes.data : [];
            finalDetails = data.filter(p => p.paymentStatus !== "paid" && p.status !== "cancelled");
         } else if (activeTab === "creditnotes") {
            finalDetails = ledgerData.filter(l => l.category === 'Credit Note' || l.description?.toLowerCase().includes('credit note'));
         } else if (activeTab === "debitnotes") {
            finalDetails = ledgerData.filter(l => l.category === 'Debit Note' || l.description?.toLowerCase().includes('debit note'));
         } else {
            finalDetails = ledgerData;
         }
         setDetails(finalDetails);
      } catch (err) {
         console.error("Treasury Sync Error:", err);
      } finally {
         setLoading(false);
      }
   };

   const socket = useSocket();

   useEffect(() => {
      fetchData();
   }, [activeTab]);

   useEffect(() => {
      if (!socket) return;

      socket.on("ORDER_UPDATED", () => {
         console.log("[REALTIME] Financial change detected (Order)");
         fetchData();
      });

      socket.on("LEDGER_UPDATED", () => {
         console.log("[REALTIME] Financial change detected (Ledger)");
         fetchData();
      });

      return () => {
         socket.off("ORDER_UPDATED");
         socket.off("LEDGER_UPDATED");
      };
   }, [socket, activeTab]);

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
      <AppLayout fullWidth>
         <div className="space-y-4 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">

            {/* Header Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-6">
               {/* Left: Actions Card */}
               <div className="p-4 bg-card rounded-md border border-border shadow-sm relative overflow-hidden group w-full lg:w-fit">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Actions</p>
                  <h3 className="text-2xl font-black text-foreground tracking-tightest tabular-nums uppercase">{logs.length} Actions</h3>
                  <div className="flex items-center gap-2 mt-4 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                     <Activity className="w-3.5 h-3.5" />
                     <span>System Status: 100%</span>
                  </div>
               </div>

               {/* Center: Title Area */}
               <div className="flex items-center justify-center gap-4">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-md flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-sm border border-indigo-500/10 shrink-0">
                     <Wallet className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div className="text-center lg:text-left">
                     <h2 className="text-3xl font-black text-foreground tracking-tightest leading-none mb-2 uppercase">Accounts <span className="text-indigo-600">History</span></h2>
                     <div className="flex items-center justify-center lg:justify-start gap-3">
                        <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">See your money details and bills</span>
                     </div>
                  </div>
               </div>

               {/* Right: Buttons Area */}
               <div className="flex items-center justify-center lg:justify-end gap-4">
                  {(activeTab === 'creditnotes' || activeTab === 'debitnotes') && (
                     <button
                        onClick={() => setIsModalOpen(true)}
                        className="erp-button-primary !py-3 !bg-indigo-600 !rounded-md hover:!bg-indigo-700 group shadow-xl shadow-indigo-900/20"
                     >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                        Add Entry
                     </button>
                  )}
                  <div className="px-4 py-4 bg-card rounded-md border border-border shadow-sm flex items-center gap-3 shrink-0">
                     <Clock className="w-4 h-4 text-indigo-500" />
                     <span className="text-[10px] font-black text-foreground uppercase tracking-widest whitespace-nowrap">Live Balance Tracking</span>
                  </div>
               </div>
            </div>

            {/* Global KPI Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
               {[
                  { id: 'receivables', label: 'Money to Collect', val: summary?.totalReceivable || 0, icon: ArrowUpCircle },
                  { id: 'payables', label: 'Money to Pay', val: summary?.totalPayable || 0, icon: ArrowDownCircle },
                  { id: 'creditnotes', label: 'Customer Returns', val: summary?.creditNotes || 0, icon: Receipt },
                  { id: 'debitnotes', label: 'Supplier Returns', val: summary?.debitNotes || 0, icon: FileText },
                  { id: 'journal', label: 'Daily Book', val: summary?.journal || 0, icon: BookOpen },
                  { id: 'ledger', label: 'Old Records', val: 'Archive', icon: ArrowRightLeft },
               ].map((tab) => (
                  <div
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`p-4 rounded-md border transition-all duration-500 cursor-pointer relative overflow-hidden group ${activeTab === tab.id ? 'bg-indigo-600 border-indigo-600 shadow-2xl shadow-indigo-600/20 text-white scale-105 z-10' : 'bg-card border-border hover:border-indigo-200 shadow-sm'}`}
                  >
                     <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'bg-card/10 text-white' : 'bg-indigo-50 text-indigo-500'}`}>
                        <tab.icon className="w-5 h-5" />
                     </div>
                     <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${activeTab === tab.id ? 'text-white/40' : 'text-muted-foreground'}`}>{tab.label}</p>
                     <h3 className={`text-lg font-black  tracking-tightest tabular-nums ${activeTab === tab.id ? 'text-white' : 'text-foreground'}`}>
                        {typeof tab.val === 'number' ? `₹${tab.val.toLocaleString()}` : tab.val}
                     </h3>
                     {activeTab === tab.id && <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="w-10 h-10 text-white" /></div>}
                  </div>
               ))}
            </div>

            {/* Unified Ledger Workspace */}
            <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden mb-12">
               <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/30">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-600 rounded-md flex items-center justify-center text-white shadow-lg"><Activity className="w-6 h-6" /></div>
                     <div>
                        <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Transaction History</h4>
                        <p className="text-xl font-black text-foreground uppercase  tracking-tightest">
                           {activeTab === 'receivables' ? 'Due from Customers' :
                              activeTab === 'payables' ? 'Due to Suppliers' :
                                 activeTab === 'creditnotes' ? 'Sales Returns' :
                                    activeTab === 'debitnotes' ? 'Purchase Returns' :
                                       activeTab === 'journal' ? 'Double-Entry Journal' : 'Transaction List'}
                        </p>
                     </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                     <div className="relative group w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search here..." className="pl-12 pr-4 py-4 bg-card border border-border rounded-md text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all w-full shadow-sm" />
                     </div>
                     <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-4 pr-10 py-4 bg-card border border-border rounded-md text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer shadow-sm">
                        <option value="all">All Months</option>
                        {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                     <select value={filterParty} onChange={(e) => setFilterParty(e.target.value)} className="px-4 pr-10 py-4 bg-card border border-border rounded-md text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer shadow-sm max-w-[200px]">
                        <option value="all">All Parties</option>
                        {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                     </select>
                  </div>
               </div>

               <div className="overflow-x-auto min-h-[400px] flex flex-col">
                  {loading ? (
                     <div className="flex-1 flex flex-col items-center justify-center">
                        <HammerLoader />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-4 animate-pulse">Updating account details...</p>
                     </div>
                  ) : filteredDetails.length === 0 ? (
                     <div className="flex-1 flex flex-col items-center justify-center p-32 text-center opacity-20 gap-4">
                        <Database className="w-12 h-12" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] ">Zero Records Detected in current Scope.</p>
                     </div>
                  ) : (
                     <table className="erp-table">
                        <thead>
                           <tr className="bg-muted/25 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] border-b border-slate-50">
                              {activeTab === 'journal' ? (
                                 <>
                                    <th className="px-4 py-4 ">Date</th>
                                    <th className="px-4 py-4 ">Narrative & Entry Details</th>
                                    <th className="px-4 py-4 text-right pr-20 " colSpan={3}>Account Matrix (Debit / Credit)</th>
                                 </>
                              ) : (activeTab === 'ledger' || activeTab === 'creditnotes' || activeTab === 'debitnotes') ? (
                                 <>
                                    <th className="px-4 py-4 ">Date</th>
                                    <th className="px-4 py-4 ">Type</th>
                                    <th className="px-4 py-4 ">Description</th>
                                    <th className="px-4 py-4 ">Party</th>
                                    <th className="px-4 py-4 text-right pr-20 ">Amount</th>
                                 </>
                              ) : (
                                 <>
                                    <th className="px-4 py-4 ">Reference</th>
                                    <th className="px-4 py-4 ">Party Name</th>
                                    <th className="px-4 py-4 text-right ">Bill Amount</th>
                                    <th className="px-4 py-4 text-right ">Paid Amount</th>
                                    <th className="px-4 py-4 text-right pr-20 ">Pending Balance</th>
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
                                          <td className="px-4 py-4">
                                             <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-foreground tracking-tightest ">{formatDate(item.date)}</span>
                                                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1.5 bg-indigo-50 px-2 py-0.5 rounded-md w-fit">JV-{item._id.slice(-4).toUpperCase()}</span>
                                             </div>
                                          </td>
                                          <td className="px-4 py-4">
                                             <div className="flex flex-col">
                                                <span className="text-sm font-black text-foreground tracking-tightest uppercase ">{item.description}</span>
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
                                                   <Database className="w-3.5 h-3.5" />
                                                   Ref: {(item.referenceId || item.order?._id || item.purchase?._id || item._id).slice(-6).toUpperCase()}
                                                </span>
                                             </div>
                                          </td>
                                          <td className="px-4 py-4" colSpan={3}>
                                             <div className="space-y-3 py-2">
                                                {getVirtualEntries(item).map((entry, idx) => (
                                                   <div key={idx} className="grid grid-cols-12 gap-4 items-center border-b border-slate-50 last:border-0 pb-3">
                                                      <div className="col-span-6 flex items-center gap-3">
                                                         <div className={`w-2 h-2 rounded-full ${entry.debit > 0 ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse' : 'bg-rose-500 shadow-sm shadow-rose-500/50'}`}></div>
                                                         <span className="text-[11px] font-black text-foreground uppercase tracking-tight">{entry.account}</span>
                                                      </div>
                                                      <div className="col-span-3 text-right tabular-nums text-sm font-black  tracking-tighter text-foreground">
                                                         {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '---'}
                                                      </div>
                                                      <div className="col-span-3 text-right tabular-nums text-sm font-black  tracking-tighter text-foreground pr-4">
                                                         {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '---'}
                                                      </div>
                                                   </div>
                                                ))}
                                             </div>
                                          </td>
                                       </>
                                    ) : activeTab === "ledger" || activeTab === "creditnotes" || activeTab === "debitnotes" ? (
                                       <>
                                          <td className="px-4 py-4">
                                             <span className="text-[11px] font-black text-foreground tracking-tightest ">{formatDate(item.date)}</span>
                                          </td>
                                          <td className="px-4 py-4">
                                             <div className="flex items-center gap-3">
                                                <span className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5' : 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-500/5'}`}>
                                                   {item.type}
                                                </span>
                                                <span className="text-[10px] font-black text-foreground uppercase  tracking-tighter">{item.category}</span>
                                             </div>
                                          </td>
                                          <td className="px-4 py-4 max-w-xs">
                                             <span className="text-sm font-black text-foreground tracking-tightest uppercase  truncate block">{item.description || 'Global Narrative Offset'}</span>
                                          </td>
                                          <td className="px-4 py-4">
                                             {item.customer ? (
                                                <div className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-2  bg-indigo-50 px-4 py-2 rounded-md border border-indigo-100 w-fit"><Users className="w-3.5 h-3.5" /> {item.customer?.name}</div>
                                             ) : item.supplier ? (
                                                <div className="text-[10px] font-black text-rose-600 uppercase flex items-center gap-2  bg-rose-50 px-4 py-2 rounded-md border border-rose-100 w-fit"><Building2 className="w-3.5 h-3.5" /> {item.supplier?.company || item.supplier?.name}</div>
                                             ) : (
                                                <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest  opacity-40">System Node</span>
                                             )}
                                          </td>
                                          <td className="px-4 py-4 text-right pr-20">
                                             <span className={`text-lg font-black  tracking-tightest tabular-nums ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {item.type === 'income' ? '+' : '-'} ₹{item.amount?.toLocaleString()}
                                             </span>
                                          </td>
                                       </>
                                    ) : (
                                       <>
                                          <td className="px-4 py-4">
                                             <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-foreground tracking-tightest  mb-1.5">#{item._id.slice(-6).toUpperCase()}</span>
                                                <div className="px-3 py-1 bg-muted/50 text-muted-foreground rounded-md text-[9px] font-black border border-border uppercase tracking-widest w-fit">Ref-Protocol</div>
                                             </div>
                                          </td>
                                          <td className="px-4 py-4">
                                             <div className="flex flex-col">
                                                <span className="text-sm font-black text-foreground tracking-tightest uppercase  group-hover:text-slate-600 transition-colors">
                                                   {activeTab === 'receivables' ? item.customer?.name : (item.supplier?.company || item.supplier?.name || 'Partner')}
                                                </span>
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-2 opacity-40 flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Duration: {getMonthStr(item)}</span>
                                             </div>
                                          </td>
                                          <td className="px-4 py-4 text-right tabular-nums">
                                             <span className="text-sm font-black  tracking-tighter text-foreground">₹{item.totalAmount?.toLocaleString()}</span>
                                          </td>
                                          <td className="px-4 py-4 text-right tabular-nums">
                                             <span className="text-sm font-black  tracking-tighter text-emerald-600">₹{item.amountPaid?.toLocaleString()}</span>
                                          </td>
                                          <td className="px-4 py-4 text-right pr-20">
                                             <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-rose-600 tracking-tightest ">₹{(item.totalAmount - (item.amountPaid || 0)).toLocaleString()}</span>
                                                <div className="w-32 h-1.5 bg-muted rounded-full mt-4 overflow-hidden shadow-inner flex border border-border">
                                                   <div className={`h-full bg-gradient-to-r ${activeTab === 'receivables' ? 'from-indigo-600 to-indigo-400' : 'from-rose-600 to-rose-400'}`} style={{ width: `${item.totalAmount > 0 ? ((item.amountPaid || 0) / item.totalAmount) * 100 : 0}%` }}></div>
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

         </div>
         <TransactionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onRefresh={fetchData}
            parties={parties}
         />
      </AppLayout>
   );
};

export default Accounting;
