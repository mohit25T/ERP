import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { reportsApi, api, customerApi, supplierApi } from "../../api/erpApi";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import { 
  Users, ShieldCheck, Search, User, Building2, 
  ChevronRight, ArrowLeft, Printer, Download, 
  ArrowDownRight, ArrowUpRight, History, Wallet, 
  Loader2, Share2, CheckCircle2, Zap, AlertCircle 
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
         <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Retrieving Account Archive...</p>
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
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
               <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 bg-slate-100 rounded-[2.5rem] flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-sm border border-slate-200">
                        <Users className="w-7 h-7 text-slate-900" />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Party <span className="text-slate-400 not-italic">Ledger Hub</span></h2>
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
                        className="w-full pl-14 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-[11px] font-bold outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-sm shadow-slate-200/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredParties.map(p => (
                     <Link key={p._id} to={`/statements/${p._id}?type=${p.type}`} className="group bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:border-slate-900/10 transition-all duration-500 overflow-hidden">
                        <div className="p-6 space-y-6">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 ${p.type === 'customer' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>
                              {p.type === 'customer' ? <User className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{p.type}</p>
                              <h4 className="text-xl font-black text-slate-900 tracking-tightest uppercase italic group-hover:text-slate-600 transition-colors">{p.company || p.name}</h4>
                           </div>
                           <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                              <span className="text-[10px] font-black text-slate-300 uppercase italic">Access Ledger</span>
                              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-2 transition-transform" />
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

         <div className="main-app-content space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
               <div className="flex items-center gap-6">
                  <Link to="/statements" className="w-16 h-16 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm hover:shadow-xl transition-all"><ArrowLeft className="w-6 h-6" /></Link>
                  <div>
                     <h2 className="text-3xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Party <span className="text-slate-400 not-italic">Ledger</span></h2>
                     <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Full Account History for {party?.company || party?.name}</span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <button onClick={() => window.print()} className="erp-button-secondary !py-5 !px-8 border-slate-200"><Printer className="w-5 h-5" />Print Statement</button>
                  <button onClick={handleExport} className="erp-button-primary !py-5 !bg-slate-900 !rounded-[2rem] hover:!bg-black"><Download className="w-5 h-5" />Export CSV</button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-6 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><ArrowDownRight className="w-16 h-16 text-indigo-600" /></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cumulative Outflow</p>
                        <h3 className="text-2xl font-black text-indigo-600 tracking-tightest tabular-nums italic">₹{Number(statement?.totalDebit || 0).toLocaleString()}</h3>
                     </div>
                     <div className="p-6 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><ArrowUpRight className="w-16 h-16 text-emerald-600" /></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cumulative Inflow</p>
                        <h3 className="text-2xl font-black text-emerald-600 tracking-tightest tabular-nums italic">₹{Number(statement?.totalCredit || 0).toLocaleString()}</h3>
                     </div>
                  </div>

                  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                     <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><History className="w-6 h-6" /></div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Transaction Registry</h4>
                        </div>
                        <div className="flex -space-x-3">
                           {[1,2,3].map(i => <div key={i} className="w-7 h-7 rounded-full border-4 border-white bg-slate-100 text-[10px] font-black flex items-center justify-center text-slate-400 italic">TX</div>)}
                        </div>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="erp-table">
                           <thead>
                              <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
                                 <th className="px-10 py-3">Timestamp</th>
                                 <th className="px-10 py-3">Account Narrative</th>
                                 <th className="px-10 py-3 text-right">MAGNITUDE (₹)</th>
                                 <th className="px-10 py-3 text-right pr-20">FISCAL CLOSURE</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {statement?.timeline?.map((item, idx) => (
                                 <tr key={idx} className="group erp-row-hover transition-all duration-500">
                                    <td className="px-10 py-3">
                                       <span className="text-[11px] font-black text-slate-900 tracking-tightest italic">{item.date ? new Date(item.date).toLocaleDateString() : "MISSING_STAMP"}</span>
                                    </td>
                                    <td className="px-10 py-3">
                                       <div className="flex flex-col">
                                          <span className="text-sm font-black text-slate-900 tracking-tightest group-hover:text-indigo-600 transition-colors uppercase italic">{item.description}</span>
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-40">REF: {item.ref ? item.ref.slice(-8).toUpperCase() : "N/A_REF"}</span>
                                       </div>
                                    </td>
                                    <td className="px-10 py-3 text-right tabular-nums">
                                       <span className="text-sm font-black italic tracking-tighter text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">₹{(item.debit || item.credit || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-10 py-3 text-right pr-20">
                                       <span className={`text-base font-black tabular-nums italic ${item.balance > 0 ? "text-rose-900" : "text-emerald-900"}`}>
                                          ₹{Math.abs(item.balance).toLocaleString()}
                                          <span className="text-[10px] ml-1 uppercase opacity-40 font-bold not-italic">{item.balance > 0 ? "Dr" : "Cr"}</span>
                                       </span>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className={`p-6 rounded-[3.5rem] shadow-2xl relative overflow-hidden transition-all duration-700 ${statement?.totalOutstanding > 0 ? "bg-rose-900 shadow-rose-900/20 text-white" : "bg-emerald-900 shadow-emerald-900/20 text-white"}`}>
                     <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet className="w-16 h-16 text-white rotate-12" /></div>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Account Reconciliation</p>
                     <h2 className="text-3xl font-black italic tracking-tightest leading-none">₹{Math.abs(statement?.totalOutstanding || 0).toLocaleString()}</h2>
                     <p className="text-[11px] font-black uppercase tracking-widest mt-6 bg-white/10 px-4 py-2 rounded-2xl w-fit border border-white/10">
                        {statement?.totalOutstanding > 0 ? "RECEIVABLE EXPOSURE" : "PAYABLE OBLIGATION"}
                     </p>
                  </div>

                  <div className="p-6 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Governance Actions</h4>
                     <button onClick={handleShare} disabled={isGeneratingToken} className="w-full p-6 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-[2rem] flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-4">
                           {isGeneratingToken ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />}
                           <span className="text-[10px] font-black uppercase tracking-widest">Client Portal Share</span>
                        </div>
                        {copied && <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
                     </button>
                     <button onClick={() => setIsReconcileOpen(true)} className="w-full p-6 bg-slate-900 text-white rounded-[2rem] flex items-center justify-between hover:bg-black transition-all group">
                        <div className="flex items-center gap-4">
                           <Zap className="w-5 h-5 text-emerald-400 group-hover:animate-pulse" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Execute Settlement</span>
                        </div>
                        <ChevronRight className="w-5 h-5" />
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* Advanced Settlement Modal */}
         <Modal isOpen={isReconcileOpen} onClose={() => setIsReconcileOpen(false)} title="Treasury: Account Reconciliation">
            <form onSubmit={handleReconcileSubmit} className="p-6 space-y-8">
               <div className="p-6 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 flex gap-6 items-center">
                  <AlertCircle className="w-12 h-12 text-emerald-500 shrink-0" />
                  <p className="text-[11px] text-emerald-900 font-bold leading-relaxed uppercase italic">Recording a settlement will instantly update the fiscal node for {party?.company || party?.name}.</p>
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4 px-1">Settlement Magnitude (₹)</label>
                  <input type="number" required value={reconcileAmount} onChange={e => setReconcileAmount(e.target.value)} className="erp-input !py-3 !text-3xl font-black !text-slate-900 tabular-nums" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4 px-1">Internal Reference Narrative</label>
                  <textarea value={reconcileNotes} onChange={e => setReconcileNotes(e.target.value)} placeholder="UTR / Reference details..." className="erp-input !py-5 resize-none h-24" />
               </div>
               <button type="submit" disabled={isSubmittingReconcile} className="erp-button-primary w-full !py-7 !bg-slate-900 hover:!bg-black !text-white group">
                  <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  {isSubmittingReconcile ? "Synchronizing Treasury..." : "Commit Settlement Protocol"}
               </button>
            </form>
         </Modal>
         
         {/* PRINT VERSION (A4 Optimized) */}
         <div className="printable-document font-sans">
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
               <div>
                  <h1 className="text-2xl font-black uppercase tracking-tightest mb-2">{statement?.companyInfo?.name}</h1>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 max-w-xs leading-relaxed">{statement?.companyInfo?.address}</p>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-900 mt-2">GSTIN: {statement?.companyInfo?.gstin}</p>
               </div>
               <div className="text-right">
                  <div className="bg-slate-900 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block">Account Statement</div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Statement for</p>
                  <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{party?.company || party?.name}</h2>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-12">
               <div className="col-span-2 grid grid-cols-2 gap-6">
                  <div className="border-l-4 border-indigo-500 pl-4">
                     <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Debits</p>
                     <p className="text-lg font-black italic tracking-tighter">₹{Number(statement?.totalDebit || 0).toLocaleString()}</p>
                  </div>
                  <div className="border-l-4 border-emerald-500 pl-4">
                     <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Credits</p>
                     <p className="text-lg font-black italic tracking-tighter">₹{Number(statement?.totalCredit || 0).toLocaleString()}</p>
                  </div>
               </div>
               <div className={`p-6 rounded-3xl border-2 ${statement?.totalOutstanding > 0 ? "border-rose-900 bg-rose-50" : "border-emerald-900 bg-emerald-50"}`}>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Closing Balance</p>
                  <h2 className="text-2xl font-black italic tracking-tightest text-slate-900">₹{Math.abs(statement?.totalOutstanding || 0).toLocaleString()} <span className="text-[10px] uppercase font-bold not-italic">{statement?.totalOutstanding > 0 ? "Dr" : "Cr"}</span></h2>
               </div>
            </div>

            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-y-2 border-slate-900">
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest">Date</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest">Description</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Debit</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Credit</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Balance</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {statement?.timeline?.map((item, idx) => (
                     <tr key={idx} className="page-break-inside-avoid">
                        <td className="p-4 text-[11px] font-bold italic">{item.date ? new Date(item.date).toLocaleDateString() : "N/A"}</td>
                        <td className="p-4">
                           <p className="text-xs font-black uppercase italic tracking-tighter text-slate-900">{item.description}</p>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">REF: {item.ref ? item.ref.slice(-12).toUpperCase() : "N/A"}</p>
                        </td>
                        <td className="p-4 text-right text-xs font-bold">{item.debit > 0 ? `₹${item.debit.toLocaleString()}` : "-"}</td>
                        <td className="p-4 text-right text-xs font-bold">{item.credit > 0 ? `₹${item.credit.toLocaleString()}` : "-"}</td>
                        <td className="p-4 text-right text-xs font-black italic">₹{Math.abs(item.balance).toLocaleString()} {item.balance > 0 ? "Dr" : "Cr"}</td>
                     </tr>
                  ))}
               </tbody>
            </table>

            <div className="mt-20 flex justify-between items-end border-t border-slate-100 pt-8">
               <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Generated via Miracle ERP Core • {new Date().toLocaleString()}</div>
               <div className="text-center w-64 border-t-2 border-slate-900 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest">Authorized Signatory</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Digital Protocol Validated</p>
               </div>
            </div>
         </div>

      </AppLayout>
   );
};

export default PartyLedger;
