import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { reportsApi, api, customerApi, supplierApi } from "../../api/erpApi";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import HammerLoader from "../../components/common/HammerLoader";
import { motion } from "framer-motion";
import { 
  Users, ShieldCheck, Search, User, Building2, 
  ChevronRight, ArrowLeft, Printer, Download, 
  ArrowDownRight, ArrowUpRight, History, Wallet, 
  Share2, CheckCircle2, Zap, AlertCircle 
} from "lucide-react";


const PartyLedger = () => {
   const { id } = useParams();
   const [searchParams] = useSearchParams();
   const navigate = useNavigate();
   const typeParam = searchParams.get("type") || "customer";

   const [statement, setStatement] = useState(null);
   const [party, setParty] = useState(null);
   const [parties, setParties] = useState([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [copied, setCopied] = useState(false);
   const [isGeneratingToken, setIsGeneratingToken] = useState(false);

   const [isReconcileOpen, setIsReconcileOpen] = useState(false);
   const [reconcileAmount, setReconcileAmount] = useState(0);
   const [reconcileNotes, setReconcileNotes] = useState("");
   const [isSubmittingReconcile, setIsSubmittingReconcile] = useState(false);

   useEffect(() => {
      if (id === ":id") {
        navigate("/statements", { replace: true });
        return;
      }
      if (id) {
         fetchStatement();
      } else {
         fetchParties();
      }
   }, [id, typeParam, navigate]);

   const fetchParties = async () => {
      try {
         setLoading(true);
         const [cus, sup] = await Promise.all([
            api.get("/customers"),
            api.get("/suppliers")
         ]);
         const combined = [
            ...cus.data.map(c => ({ ...c, type: 'customer' })),
            ...sup.data.map(s => ({ ...s, type: 'supplier' }))
         ];
         setParties(combined);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const fetchStatement = async () => {
      try {
         setLoading(true);
         const [statementRes, partyRes] = await Promise.all([
            reportsApi.getPartyStatement(id, typeParam),
            api.get(`/${typeParam}s/${id}`)
         ]);
         setStatement(statementRes.data);
         setParty(partyRes.data);
         setReconcileAmount(Math.abs(statementRes.data.totalOutstanding || 0));
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const handleShare = async () => {
      try {
         setIsGeneratingToken(true);
         let token = party?.shareToken;
         if (!token) {
            const apiObj = typeParam === 'customer' ? customerApi : supplierApi;
            const res = await apiObj.generateShareToken(id);
            token = res.data.shareToken;
            setParty(res.data);
         }
         const shareUrl = `${window.location.origin}/public/ledger/${token}`;
         await navigator.clipboard.writeText(shareUrl);
         setCopied(true);
         setTimeout(() => setCopied(false), 2000);
      } catch (err) {
         alert("Could not generate share link.");
      } finally {
         setIsGeneratingToken(false);
      }
   };

   const handleReconcileSubmit = async (e) => {
      e.preventDefault();
      try {
         setIsSubmittingReconcile(true);
         const payload = {
            type: typeParam === 'customer' ? 'income' : 'expense',
            category: 'Settlement',
            amount: Number(reconcileAmount),
            description: reconcileNotes || `Settlement: ${party.company || party.name}`,
            date: new Date(),
            [typeParam]: id
         };
         await api.post("/ledger", payload);
         await fetchStatement();
         setIsReconcileOpen(false);
      } catch (err) {
         alert("Settlement protocol failed.");
      } finally {
         setIsSubmittingReconcile(false);
      }
   };

   const handleExport = () => {
      if (!statement?.timeline) return;
      const headers = ["Date", "Description", "Ref", "Amount", "Balance"];
      const rows = statement.timeline.map(item => [
         `"${new Date(item.date).toLocaleDateString()}"`,
         `"${item.description.replace(/"/g, '""')}"`,
         `"${String(item.ref).slice(-8).toUpperCase()}"`,
         (item.debit || item.credit || 0),
         item.balance
      ].join(","));
      const csvString = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Party_Ledger_${party?.name || "Ref"}.csv`);
      link.click();
   };

   if (loading) return (
      <AppLayout>
         <div className="flex flex-col items-center justify-center h-[70vh]">
            <HammerLoader />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-4 animate-pulse">Retrieving Account Archive...</p>
         </div>
      </AppLayout>
   );

   if (!id) {
      const filteredParties = parties.filter(p => 
         (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.company?.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return (
         <AppLayout>
            <div className="space-y-3 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
               <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-4">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-slate-900 rounded-md flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-xl border border-slate-800">
                        <Users className="w-7 h-7 text-white" />
                     </div>
                     <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tightest leading-none mb-2 ">Party <span className="text-primary not-">Ledger Hub</span></h2>
                        <div className="flex items-center gap-3">
                           <ShieldCheck className="w-4 h-4 text-emerald-500" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Aggregated Account Settlement & Payment Archive</span>
                        </div>
                     </div>
                  </div>
                  <div className="relative group w-full lg:w-96">
                     <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                     <input 
                        type="text"
                        placeholder="Locate Account Identity..."
                        className="w-full pl-14 pr-4 py-3 bg-white border border-slate-100 rounded-md text-[11px] font-bold outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredParties.map(p => (
                     <Link key={p._id} to={`/statements/${p._id}?type=${p.type}`} className="group bg-white rounded-md border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-900/10 hover:border-slate-300 transition-all duration-500 overflow-hidden">
                        <div className="p-4 space-y-4">
                           <div className={`w-16 h-16 rounded-md flex items-center justify-center transition-transform group-hover:rotate-12 group-hover:scale-110 shadow-lg ${p.type === 'customer' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-900 text-white shadow-slate-200'}`}>
                              {p.type === 'customer' ? <User className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 w-fit pb-1">{p.type} Identifier</p>
                              <h4 className="text-2xl font-black text-slate-900 tracking-tightest uppercase  group-hover:text-primary transition-colors leading-tight">{p.company || p.name}</h4>
                           </div>
                           <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                              <span className="text-[10px] font-black text-slate-400 uppercase  tracking-widest">Access Protocol</span>
                              <ChevronRight className="w-6 h-6 text-slate-300 group-hover:translate-x-2 group-hover:text-primary transition-all" />
                           </div>
                        </div>
                     </Link>
                  ))}
               </div>
            </div>
         </AppLayout>
      );
   }

   return (
      <AppLayout>
         <style>{`
            @media print {
               @page { size: A4; margin: 0.5cm; }
               .main-app-content, aside, header { display: none !important; }
               .printable-document { display: block !important; width: 100% !important; background: white !important; }
            }
            .printable-document { display: none; }
         `}</style>

         <div className="main-app-content space-y-3 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 pt-4">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
               <div className="flex items-center gap-4">
                  <Link to="/statements" className="w-16 h-16 bg-white border border-slate-100 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm hover:shadow-xl transition-all group hover:-translate-x-1 duration-300">
                    <ArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </Link>
                  <div>
                     <h2 className="text-4xl font-black text-slate-900 tracking-tightest leading-none mb-2 ">Party <span className="text-primary not-">Ledger</span></h2>
                     <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50"></span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Full Account History for {party?.company || party?.name}</span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <button onClick={() => window.print()} className="erp-button-secondary !py-3 !px-4 border-slate-200 !rounded-md font-black uppercase tracking-widest text-[10px] shadow-sm hover:shadow-md transition-all">
                    <Printer className="w-5 h-5" />
                    Print Statement
                  </button>
                  <button onClick={handleExport} className="erp-button-primary !py-3 !px-4 !bg-slate-900 !rounded-md hover:!bg-black shadow-xl shadow-slate-900/10 font-black uppercase tracking-widest text-[10px]">
                    <Download className="w-5 h-5" />
                    Export CSV
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
               <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-4 bg-white rounded-md border border-slate-100 shadow-sm group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700"><ArrowDownRight className="w-20 h-20 text-indigo-600" /></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cumulative Outflow</p>
                        <h3 className="text-3xl font-black text-indigo-600 tracking-tightest tabular-nums  leading-none">₹{Number(statement?.totalDebit || 0).toLocaleString()}</h3>
                     </div>
                     <div className="p-4 bg-white rounded-md border border-slate-100 shadow-sm group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700"><ArrowUpRight className="w-20 h-20 text-emerald-600" /></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cumulative Inflow</p>
                        <h3 className="text-3xl font-black text-emerald-600 tracking-tightest tabular-nums  leading-none">₹{Number(statement?.totalCredit || 0).toLocaleString()}</h3>
                     </div>
                  </div>

                  <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                     <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center text-white shadow-lg"><History className="w-6 h-6" /></div>
                           <div>
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 leading-none mb-1">Transaction Registry</h4>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Synchronized Performance Log</p>
                           </div>
                        </div>
                        <div className="flex -space-x-3">
                           {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-4 border-white bg-slate-200 text-[10px] font-black flex items-center justify-center text-slate-500  shadow-sm">TX</div>)}
                        </div>
                     </div>
                     <div className="overflow-x-auto flex-1">
                        <table className="erp-table">
                           <thead>
                              <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
                                 <th className="px-10 py-3">Timestamp</th>
                                 <th className="px-10 py-3">Account Narrative</th>
                                 <th className="px-10 py-3 text-right">MAGNITUDE (₹)</th>
                                 <th className="px-10 py-3 text-right pr-20">FISCAL CLOSURE</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {statement?.timeline?.map((item, idx) => (
                                 <motion.tr 
                                   key={idx} 
                                   initial={{ opacity: 0, x: -10 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ duration: 0.3, delay: idx * 0.03 }}
                                   className="group erp-row-hover transition-all duration-500"
                                 >
                                    <td className="px-10 py-3">
                                       <span className="text-[11px] font-black text-slate-900 tracking-tightest  bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">{item.date ? new Date(item.date).toLocaleDateString() : "MISSING_STAMP"}</span>
                                    </td>
                                    <td className="px-10 py-3">
                                       <div className="flex flex-col">
                                          <span className="text-base font-black text-slate-900 tracking-tightest group-hover:text-primary transition-colors uppercase  leading-none">{item.description}</span>
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 opacity-60">REF: {item.ref ? item.ref.slice(-8).toUpperCase() : "N/A_REF"}</span>
                                       </div>
                                    </td>
                                    <td className="px-10 py-3 text-right tabular-nums">
                                       <span className="text-sm font-black  tracking-tighter text-slate-900 bg-white shadow-sm px-4 py-2 rounded-md border border-slate-100">₹{(item.debit || item.credit || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-10 py-3 text-right pr-20">
                                       <span className={`text-lg font-black tabular-nums  ${item.balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                          ₹{Math.abs(item.balance).toLocaleString()}
                                          <span className="text-[10px] ml-1.5 uppercase opacity-40 font-black not- tracking-widest">{item.balance > 0 ? "Dr" : "Cr"}</span>
                                       </span>
                                    </td>
                                 </motion.tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className={`p-3 rounded-md shadow-2xl relative overflow-hidden transition-all duration-700 ${statement?.totalOutstanding > 0 ? "bg-rose-900 shadow-rose-900/20 text-white" : "bg-emerald-900 shadow-emerald-900/20 text-white"}`}
                  >
                     <div className="absolute top-0 right-0 p-3 opacity-10"><Wallet className="w-20 h-20 text-white rotate-12" /></div>
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-4">Account Reconciliation</p>
                     <h2 className="text-5xl font-black  tracking-tightest leading-none mb-10">₹{Math.abs(statement?.totalOutstanding || 0).toLocaleString()}</h2>
                     <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-md w-fit border border-white/10 shadow-inner">
                        <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{statement?.totalOutstanding > 0 ? "RECEIVABLE EXPOSURE" : "PAYABLE OBLIGATION"}</span>
                     </div>
                  </motion.div>

                  <div className="p-4 bg-white rounded-md border border-slate-100 shadow-sm space-y-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Governance Actions</h4>
                     <button onClick={handleShare} disabled={isGeneratingToken} className="w-full p-4 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-md flex items-center justify-between group transition-all duration-500 shadow-inner">
                        <div className="flex items-center gap-3">
                           {isGeneratingToken ? <div className="w-6 h-6 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div> : <Share2 className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition-all" />}
                           <span className="text-[10px] font-black uppercase tracking-widest  group-hover:translate-x-1 transition-transform">Client Portal Share</span>
                        </div>
                        {copied && <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-in zoom-in" />}
                     </button>
                     <button onClick={() => setIsReconcileOpen(true)} className="w-full p-4 bg-slate-900 text-white rounded-md flex items-center justify-between hover:bg-black transition-all duration-500 group shadow-xl shadow-slate-900/10">
                        <div className="flex items-center gap-3">
                           <Zap className="w-6 h-6 text-emerald-400 group-hover:animate-pulse group-hover:scale-110 transition-all" />
                           <span className="text-[10px] font-black uppercase tracking-widest  group-hover:translate-x-1 transition-transform">Execute Settlement</span>
                        </div>
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* Advanced Settlement Modal */}
         <Modal isOpen={isReconcileOpen} onClose={() => setIsReconcileOpen(false)} title={<div className="flex items-center gap-4"><Zap className="w-6 h-6 text-slate-900" /><span className="text-xl font-black  tracking-tightest uppercase">Treasury Settlement</span></div>}>
            <form onSubmit={handleReconcileSubmit} className="p-4 space-y-3">
               <div className="p-4 bg-emerald-50 rounded-md border border-emerald-100 flex gap-4 items-center shadow-inner">
                  <AlertCircle className="w-12 h-12 text-emerald-500 shrink-0" />
                  <p className="text-[11px] text-emerald-900 font-black leading-relaxed uppercase  tracking-widest">Recording a settlement will instantly update the fiscal node for {party?.company || party?.name}.</p>
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-4 px-1 ">Settlement Magnitude (₹)</label>
                  <input type="number" required value={reconcileAmount} onChange={e => setReconcileAmount(e.target.value)} className="erp-input !py-4 !text-4xl font-black !text-slate-900 tabular-nums rounded-md shadow-sm" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-4 px-1 ">Internal Reference Narrative</label>
                  <textarea value={reconcileNotes} onChange={e => setReconcileNotes(e.target.value)} placeholder="UTR / Reference details..." className="erp-input !py-4 resize-none h-32 rounded-md shadow-sm" />
               </div>
               <button type="submit" disabled={isSubmittingReconcile} className="erp-button-primary w-full !py-4 !bg-slate-900 hover:!bg-black !text-white group !rounded-md shadow-2xl shadow-slate-900/20">
                  <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-[12px] font-black uppercase tracking-[0.2em]">{isSubmittingReconcile ? "Synchronizing Treasury..." : "Commit Settlement Protocol"}</span>
               </button>
            </form>
         </Modal>
         
         {/* PRINT VERSION (A4 Optimized) */}
         <div className="printable-document font-sans">
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10 mb-10">
               <div>
                  <h1 className="text-3xl font-black uppercase tracking-tightest mb-4 ">{statement?.companyInfo?.name}</h1>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 max-w-xs leading-relaxed">{statement?.companyInfo?.address}</p>
                  <div className="flex items-center gap-4 mt-4">
                     <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1 rounded-md">GSTIN</span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{statement?.companyInfo?.gstin}</span>
                  </div>
               </div>
               <div className="text-right">
                  <div className="bg-slate-900 text-white px-4 py-3 rounded-md text-[10px] font-black uppercase tracking-[0.3em] mb-4 inline-block">Account Statement</div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Statement for</p>
                  <h2 className="text-2xl font-black  uppercase tracking-tighter text-slate-900">{party?.company || party?.name}</h2>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-16">
               <div className="col-span-2 grid grid-cols-2 gap-3">
                  <div className="border-l-8 border-indigo-600 pl-4 py-2">
                     <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Total Debits</p>
                     <p className="text-2xl font-black  tracking-tighter text-slate-900">₹{Number(statement?.totalDebit || 0).toLocaleString()}</p>
                  </div>
                  <div className="border-l-8 border-emerald-600 pl-4 py-2">
                     <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Total Credits</p>
                     <p className="text-2xl font-black  tracking-tighter text-slate-900">₹{Number(statement?.totalCredit || 0).toLocaleString()}</p>
                  </div>
               </div>
               <div className={`p-4 rounded-md border-2 shadow-sm ${statement?.totalOutstanding > 0 ? "border-rose-900 bg-rose-50" : "border-emerald-900 bg-emerald-50"}`}>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Closing Balance</p>
                  <h2 className="text-3xl font-black  tracking-tightest text-slate-900 leading-none">₹{Math.abs(statement?.totalOutstanding || 0).toLocaleString()} <span className="text-[10px] uppercase font-black not- tracking-widest">{statement?.totalOutstanding > 0 ? "Dr" : "Cr"}</span></h2>
               </div>
            </div>

            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-900 text-white border-y-2 border-slate-900">
                     <th className="p-3 text-[10px] font-black uppercase tracking-[0.2em]">Timestamp</th>
                     <th className="p-3 text-[10px] font-black uppercase tracking-[0.2em]">Transaction Narrative</th>
                     <th className="p-3 text-[10px] font-black uppercase tracking-[0.2em] text-right">Debit</th>
                     <th className="p-3 text-[10px] font-black uppercase tracking-[0.2em] text-right">Credit</th>
                     <th className="p-3 text-[10px] font-black uppercase tracking-[0.2em] text-right">Balance</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {statement?.timeline?.map((item, idx) => (
                     <tr key={idx} className="page-break-inside-avoid">
                        <td className="p-3 text-[11px] font-black  text-slate-900">{item.date ? new Date(item.date).toLocaleDateString() : "N/A"}</td>
                        <td className="p-3">
                           <p className="text-xs font-black uppercase  tracking-tighter text-slate-900 leading-tight mb-1">{item.description}</p>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">REF ID: {item.ref ? item.ref.slice(-12).toUpperCase() : "N/A"}</p>
                        </td>
                        <td className="p-3 text-right text-xs font-black tracking-tight">{item.debit > 0 ? `₹${item.debit.toLocaleString()}` : "-"}</td>
                        <td className="p-3 text-right text-xs font-black tracking-tight">{item.credit > 0 ? `₹${item.credit.toLocaleString()}` : "-"}</td>
                        <td className="p-3 text-right text-sm font-black  text-slate-900">₹{Math.abs(item.balance).toLocaleString()} <span className="text-[8px] uppercase font-black not- opacity-40">{item.balance > 0 ? "Dr" : "Cr"}</span></td>
                     </tr>
                  ))}
               </tbody>
            </table>

            <div className="mt-24 flex justify-between items-end border-t-2 border-slate-100 pt-10">
               <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ">Generated via Miracle ERP Intelligence • {new Date().toLocaleString()}</div>
               <div className="text-center w-80 border-t-4 border-slate-900 pt-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 leading-none mb-1">Authorized Signatory</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Digital Encryption Protocol Validated</p>
               </div>
            </div>
         </div>

      </AppLayout>
   );
};

export default PartyLedger;
