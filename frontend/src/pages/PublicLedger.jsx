import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { publicApi } from "../api/erpApi";
import { 
  ShieldCheck, Wallet, Download, ChevronRight, TrendingUp, 
  CreditCard, Building, Clock, ArrowUpRight, ArrowDownRight,
  Zap, Activity, Database, Lock, Globe, Share2, Printer
} from "lucide-react";

/**
 * PublicLedger: The Secure External Transparency Portal
 * Designed for elite stakeholder trust and seamless guest-access reconciliation.
 */
const PublicLedger = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        setLoading(true);
        const res = await publicApi.getPublicLedger(token);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Portal access denied or link expired.");
      } finally {
        setLoading(false);
      }
    };
    fetchPortal();
  }, [token]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 animate-pulse">
       <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl">
          <Globe className="w-10 h-10 text-white animate-spin-slow" />
       </div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Accessing Transparency Hub...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-12 text-center">
       <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mb-8 border border-rose-100 shadow-xl shadow-rose-500/10">
          <Lock className="w-10 h-10" />
       </div>
       <h1 className="text-4xl font-black text-slate-900 tracking-tightest leading-none mb-4 italic">Security <span className="text-rose-500 border-b-4 border-rose-500">Lock</span></h1>
       <p className="text-sm font-black text-slate-400 max-w-xs mx-auto uppercase tracking-widest leading-loose">{error}</p>
       <div className="mt-12 flex items-center gap-3 text-slate-200">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Encryption Protocol Active</span>
       </div>
    </div>
  );
 
  const { party, type, timeline, totalOutstanding, totalDebit, totalCredit, companyInfo } = data;

  // UPI Deep Link Generation
  const upiLink = `upi://pay?pa=nexus-ops@okaxis&pn=${companyInfo?.name}&am=${Math.abs(totalOutstanding)}&cu=INR&tn=Ref_Ledger_${party.company?.slice(0, 5)}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 pb-24">
      {/* Dynamic Portal Header */}
      <nav className="bg-white/80 backdrop-blur-3xl border-b border-slate-100 px-10 py-6 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
               <Share2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-600 leading-none mb-1">{companyInfo?.name || "Corporate Integrity Hub"}</span>
               <span className="text-sm font-black text-slate-900 tracking-tightest uppercase italic">Secure Guest Reconciliation</span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm shadow-emerald-500/5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Real-time Verified</span>
            </div>
            <button onClick={() => window.print()} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-inner active:scale-90">
               <Printer className="w-5 h-5" />
            </button>
         </div>
      </nav>

      <div className="max-w-2xl mx-auto px-10 py-16 space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-1000">
         
         {/* Identity Hub */}
         <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-white text-slate-900 rounded-[3rem] border border-slate-100 flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <Building className="w-10 h-10 relative z-10" />
            </div>
            <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tightest uppercase italic mb-2 leading-none">
                  {companyInfo?.name || 'Corporate Terminal'}
               </h1>
               <div className="flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed max-w-sm">
                     Exclusive Financial Statement Organized for:
                  </p>
                  <div className="mt-4 px-8 py-3 bg-white border border-slate-100 rounded-[2rem] shadow-sm transform hover:scale-105 transition-transform">
                     <span className="text-xl font-black text-slate-900 tracking-tightest uppercase italic border-b-2 border-indigo-500">{party.company || party.name}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Outstanding Master Card */}
         <div className="bg-slate-900 p-12 rounded-[4rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden group hover:scale-[1.02] transition-all duration-700">
            <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:opacity-[0.15] transition-all duration-1000">
               <TrendingUp className="w-32 h-32 rotate-12" />
            </div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-indigo-500 rounded-full opacity-[0.02] filter blur-3xl"></div>
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 pl-1 border-l-4 border-indigo-500">Current Net Obligation</p>
            <div className="flex flex-col md:flex-row md:items-end gap-4 mb-2">
               <span className="text-7xl font-black tracking-tightest text-white italic tabular-nums leading-none">
                  ₹{Math.abs(totalOutstanding).toLocaleString()}
               </span>
               <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest italic border mb-1 w-fit ${totalOutstanding > 0 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                  {totalOutstanding > 0 ? "Debit Required" : "Operational Credit"}
               </div>
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4 opacity-60">Verified reconciliation balance as per operational ledger</p>
            
            <div className="mt-12 pt-10 border-t border-slate-800 flex flex-col md:flex-row gap-6">
               {type === 'customer' && (
                  <a href={upiLink} className="flex-1 bg-white text-slate-900 py-6 px-10 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition-all group active:scale-95 leading-none">
                     <CreditCard className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
                     Synchronized UPI Payment
                  </a>
               )}
               <button onClick={() => window.print()} className="flex-1 bg-slate-800 text-slate-400 py-6 px-10 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-700 hover:text-white transition-all active:scale-95 leading-none">
                  <Download className="w-5 h-5" /> Export Data Set
               </button>
            </div>
         </div>

         {/* Multi-Dimensional Insights */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
               <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
               <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><ArrowDownRight className="w-6 h-6" /></div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Billed Yield</p>
                     <p className="text-2xl font-black text-slate-900 tracking-tightest italic tabular-nums leading-none">₹{Number(totalDebit || 0).toLocaleString()}</p>
                  </div>
               </div>
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mt-6 italic">Aggregate Debit Fluctuations</p>
            </div>
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
               <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
               <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><ArrowUpRight className="w-6 h-6" /></div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Settled Liquidity</p>
                     <p className="text-2xl font-black text-slate-900 tracking-tightest italic tabular-nums leading-none">₹{Number(totalCredit || 0).toLocaleString()}</p>
                  </div>
               </div>
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mt-6 italic">Aggregate Credit Flow</p>
            </div>
         </div>

         {/* Transaction Analytics Timeline */}
         <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                <h3 className="text-[11px] font-black uppercase text-slate-900 tracking-[0.3em] italic">Historical Transaction Log</h3>
            </div>
            
            <div className="space-y-5">
               {timeline.slice().reverse().map((item, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500">
                       <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${item.type === 'payment' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-500/10' : 'bg-indigo-50 text-indigo-600 shadow-indigo-500/10'}`}>
                             <Activity className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2 italic">Ref_Node: {new Date(item.date).toLocaleDateString()}</span>
                             <span className="text-sm font-black text-slate-900 uppercase tracking-tightest leading-tight line-clamp-1">{item.description}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-xl font-black italic tracking-tightest tabular-nums leading-none mb-2 ${item.type === 'payment' ? 'text-emerald-600' : 'text-rose-600'}`}>
                             ₹{(item.debit || item.credit).toLocaleString()}
                          </p>
                          <div className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic ${item.type === 'payment' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                             {item.type === 'payment' ? (type === 'customer' ? 'REC' : 'STL') : (type === 'customer' ? 'INV' : 'BIL')}
                          </div>
                       </div>
                    </div>
               ))}
            </div>
         </div>

         {/* Corporate Encryption Footer */}
         <div className="pt-20 flex flex-col items-center gap-8 border-t border-slate-100">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-slate-300">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em]">End-to-End Encrypted</span>
               </div>
               <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
               <div className="flex items-center gap-2 text-slate-300">
                  <Database className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em]">Operational Node: V2.5.0</span>
               </div>
            </div>
            
            <div className="text-center font-black uppercase tracking-[0.3em] text-[10px] text-slate-300 leading-[2.5] italic opacity-60">
               Confidential Audit Statement for {party.company || party.name}.<br/>
               Origin Node: {companyInfo?.name} — {companyInfo?.address}<br/>
               &copy; {new Date().getFullYear()} GLOBAL INTELLIGENCE NETWORK
            </div>
         </div>
      </div>
    </div>
  );
};

export default PublicLedger;
