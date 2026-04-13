import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import { paymentApi, api, ledgerApi } from "../api/erpApi";
import { 
  Wallet, ArrowUpCircle, ArrowDownCircle, Search, Filter, 
  Building2, Users, ChevronRight, TrendingUp, History, 
  Plus, ArrowRightLeft, BookOpen, ShieldCheck, Zap,
  Activity, Database, ArrowUpRight, ArrowDownLeft, Clock
} from "lucide-react";

const Accounting = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("receivables"); 
  const [details, setDetails] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterParty, setFilterParty] = useState("all");

  useEffect(() => {
    setSearchTerm("");
    setFilterMonth("all");
    setFilterParty("all");
  }, [activeTab]);

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
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Elite Treasury Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-xl border border-slate-800">
                 <Wallet className="w-10 h-10 text-white" />
              </div>
              <div>
                 <h2 className="text-5xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Treasury <span className="text-slate-400 not-italic">Intelligence</span></h2>
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Cash Flow Orchestration & Balance Settlement</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="px-6 py-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-3">
                 <Clock className="w-4 h-4 text-slate-300" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Flux Monitoring</span>
              </div>
           </div>
        </div>

        {/* Global KPI Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
              { id: 'receivables', label: 'Account Receivables', val: summary?.totalReceivable, icon: ArrowUpCircle, color: 'indigo' },
              { id: 'payables', label: 'Operational Payables', val: summary?.totalPayable, icon: ArrowDownCircle, color: 'rose' },
              { id: 'journal', label: 'Journal Protocol', val: 'Active Log', icon: BookOpen, color: 'slate' },
              { id: 'ledger', label: 'Cash Dynamics', val: 'Archive', icon: ArrowRightLeft, color: 'emerald' },
           ].map((tab) => (
             <div 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`p-8 rounded-[3rem] border transition-all duration-500 cursor-pointer relative overflow-hidden group ${activeTab === tab.id ? 'bg-slate-900 border-slate-900 shadow-2xl shadow-slate-900/20 text-white scale-105 z-10' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}
             >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}>
                   <tab.icon className="w-6 h-6" />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${activeTab === tab.id ? 'text-white/40' : 'text-slate-400'}`}>{tab.label}</p>
                <h3 className={`text-2xl font-black italic tracking-tightest tabular-nums ${activeTab === tab.id ? 'text-white' : 'text-slate-900'}`}>
                   {typeof tab.val === 'number' ? `₹${tab.val.toLocaleString()}` : tab.val}
                </h3>
                {activeTab === tab.id && <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="w-12 h-12 text-white" /></div>}
             </div>
           ))}
        </div>

        {/* Unified Ledger Workspace */}
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden mb-20">
           <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><Activity className="w-6 h-6" /></div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest pl-1">Detailed Analysis</h4>
                    <p className="text-xl font-black text-slate-900 uppercase italic tracking-tightest">
                       {activeTab === 'receivables' ? 'Outstanding Inflow' : activeTab === 'payables' ? 'Pending Obligations' : activeTab === 'journal' ? 'Double-Entry Journal' : 'Bookkeeping Flux'}
                    </p>
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                 <div className="relative group w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Dataset Lookup..." className="pl-10 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all w-full shadow-inner" />
                 </div>
                 <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-6 pr-10 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-inner">
                    <option value="all">Global Temporal</option>
                    {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
                 <select value={filterParty} onChange={(e) => setFilterParty(e.target.value)} className="px-6 pr-10 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-inner max-w-[180px]">
                    <option value="all">Global Entities</option>
                    {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
              </div>
           </div>

           <div className="overflow-x-auto">
              {loading ? (
                <div className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] animate-pulse text-[10px]">Accessing Repository...</div>
              ) : filteredDetails.length === 0 ? (
                <div className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.2em] italic text-[10px]">Zero Pending Fluctuations Found.</div>
              ) : (
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
                         {activeTab === "journal" ? (
                           <>
                             <th className="px-12 py-8">Timestamp</th>
                             <th className="px-12 py-8">Narration</th>
                             <th className="px-12 py-8">Account Matrix</th>
                             <th className="px-12 py-8 text-right">Debit</th>
                             <th className="px-12 py-8 text-right pr-20">Credit</th>
                           </>
                         ) : activeTab === "ledger" ? (
                           <>
                             <th className="px-12 py-8">Timestamp</th>
                             <th className="px-12 py-8">Protocol/Category</th>
                             <th className="px-12 py-8">Narration Summary</th>
                             <th className="px-12 py-8">Linked Node</th>
                             <th className="px-12 py-8 text-right pr-20">Magnitude</th>
                           </>
                         ) : (
                           <>
                             <th className="px-12 py-8">Reference</th>
                             <th className="px-12 py-8">Entity Analysis</th>
                             <th className="px-12 py-8 text-right">Invoice Yield</th>
                             <th className="px-12 py-8 text-right">Settled Amount</th>
                             <th className="px-12 py-8 text-right pr-20">Remaining Drift</th>
                           </>
                         )}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredDetails.map((item) => (
                        <tr key={item._id} className="group hover:bg-slate-50/80 transition-all duration-500">
                           {activeTab === "journal" ? (
                             <>
                               <td className="px-12 py-8">
                                  <div className="flex flex-col">
                                     <span className="text-[11px] font-black text-slate-900 tracking-tightest italic">{new Date(item.date).toLocaleDateString()}</span>
                                     <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1">JV-{item._id.slice(-4).toUpperCase()}</span>
                                  </div>
                               </td>
                               <td className="px-12 py-8">
                                  <div className="flex flex-col">
                                     <span className="text-sm font-black text-slate-900 tracking-tightest uppercase italic">{item.description}</span>
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                        <Database className="w-3 h-3" />
                                        Ref: {(item.referenceId || item.order?._id || item.purchase?._id || item._id).slice(-6).toUpperCase()}
                                     </span>
                                  </div>
                               </td>
                               <td className="px-12 py-8" colSpan={3}>
                                  <div className="space-y-2 py-4">
                                     {getVirtualEntries(item).map((entry, idx) => (
                                       <div key={idx} className="grid grid-cols-12 gap-6 items-center border-b border-slate-50 last:border-0 pb-2">
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
                           ) : activeTab === "ledger" ? (
                             <>
                               <td className="px-12 py-8">
                                  <span className="text-[11px] font-black text-slate-900 tracking-tightest italic">{new Date(item.date).toLocaleDateString()}</span>
                               </td>
                               <td className="px-12 py-8">
                                  <div className="flex items-center gap-3">
                                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5' : 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-500/5'}`}>
                                        {item.type}
                                     </span>
                                     <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-tighter">{item.category}</span>
                                  </div>
                               </td>
                               <td className="px-12 py-8 max-w-xs">
                                  <span className="text-sm font-black text-slate-900 tracking-tightest uppercase italic truncate block">{item.description || 'Global Narrative Offset'}</span>
                               </td>
                               <td className="px-12 py-8">
                                  {item.customer ? (
                                    <div className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-2 italic bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 w-fit"><Users className="w-3.5 h-3.5" /> {item.customer?.name}</div>
                                  ) : item.supplier ? (
                                    <div className="text-[10px] font-black text-rose-600 uppercase flex items-center gap-2 italic bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100 w-fit"><Building2 className="w-3.5 h-3.5" /> {item.supplier?.company || item.supplier?.name}</div>
                                  ) : (
                                    <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic opacity-40">System Node</span>
                                  )}
                               </td>
                               <td className="px-12 py-8 text-right pr-20">
                                  <span className={`text-xl font-black italic tracking-tightest tabular-nums ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                     {item.type === 'income' ? '+' : '-'} ₹{item.amount?.toLocaleString()}
                                  </span>
                               </td>
                             </>
                           ) : (
                             <>
                               <td className="px-12 py-8">
                                  <div className="flex flex-col">
                                     <span className="text-[11px] font-black text-slate-900 tracking-tightest italic mb-1">#{item._id.slice(-6).toUpperCase()}</span>
                                     <div className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black border border-slate-100 uppercase tracking-widest w-fit">Ref-Protocol</div>
                                  </div>
                               </td>
                               <td className="px-12 py-8">
                                  <div className="flex flex-col">
                                     <span className="text-sm font-black text-slate-900 tracking-tightest uppercase italic group-hover:text-slate-600 transition-colors">
                                        {activeTab === 'receivables' ? item.customer?.name : (item.supplier?.company || item.supplier?.name || 'Partner')}
                                     </span>
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-40 flex items-center gap-2"><Clock className="w-3 h-3" /> Duration: {getMonthStr(item)}</span>
                                  </div>
                               </td>
                               <td className="px-12 py-8 text-right tabular-nums">
                                  <span className="text-sm font-black italic tracking-tighter text-slate-900">₹{item.totalAmount?.toLocaleString()}</span>
                                </td>
                               <td className="px-12 py-8 text-right tabular-nums">
                                  <span className="text-sm font-black italic tracking-tighter text-emerald-600">₹{item.amountPaid?.toLocaleString()}</span>
                               </td>
                               <td className="px-12 py-8 text-right pr-20">
                                  <div className="flex flex-col items-end">
                                     <span className="text-xl font-black text-rose-600 tracking-tightest italic">₹{(item.totalAmount - (item.amountPaid || 0)).toLocaleString()}</span>
                                     <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden shadow-inner flex">
                                         <div className={`h-full bg-gradient-to-r ${activeTab === 'receivables' ? 'from-indigo-600 to-indigo-400' : 'from-rose-600 to-rose-400'}`} style={{ width: `${((item.amountPaid || 0) / item.totalAmount) * 100}%` }}></div>
                                     </div>
                                  </div>
                               </td>
                             </>
                           )}
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

export default Accounting;
