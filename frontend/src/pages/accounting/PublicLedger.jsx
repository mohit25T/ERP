import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { publicApi } from "../../api/erpApi";
import { useSocket } from "../../context/SocketContext";
import { 
  Globe, Lock, ShieldCheck, Share2, Printer, 
  Building, TrendingUp, CreditCard, Download, 
  ArrowDownRight, ArrowUpRight, Activity, Database 
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

  useEffect(() => {
    fetchPortal();
  }, [token]);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("ORDER_UPDATED", () => {
      console.log("[REALTIME] External Portal Refresh (Order)");
      fetchPortal();
    });

    socket.on("LEDGER_UPDATED", () => {
      console.log("[REALTIME] External Portal Refresh (Ledger)");
      fetchPortal();
    });

    return () => {
      socket.off("ORDER_UPDATED");
      socket.off("LEDGER_UPDATED");
    };
  }, [socket, token]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background animate-pulse">
       <div className="w-14 h-14 bg-slate-900 rounded-md flex items-center justify-center mb-4 shadow-2xl">
          <Globe className="w-7 h-7 text-white animate-spin-slow" />
       </div>
       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] ">Accessing Transparency Hub...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-card p-6 text-center">
       <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-md flex items-center justify-center mb-4 border border-rose-100 shadow-xl shadow-rose-500/10">
          <Lock className="w-7 h-7" />
       </div>
       <h1 className="text-2xl font-black text-foreground tracking-tightest leading-none mb-4 ">Security <span className="text-rose-500 border-b-4 border-rose-500">Lock</span></h1>
       <p className="text-sm font-black text-muted-foreground max-w-xs mx-auto uppercase tracking-widest leading-loose">{error}</p>
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
    <div className="min-h-screen bg-background font-sans selection:bg-indigo-100 pb-24">
      {/* Dynamic Portal Header */}
      <nav className="bg-card/80 backdrop-blur-3xl border-b border-border px-10 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
         <div className="flex items-center gap-4">
            <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center shadow-lg">
               <Share2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-600 leading-none mb-1">{companyInfo?.name || "Corporate Integrity Hub"}</span>
               <span className="text-sm font-black text-foreground tracking-tightest uppercase ">Secure Guest Reconciliation</span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 rounded-md">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Real-time Verified</span>
            </div>
            <button onClick={() => window.print()} className="p-2.5 bg-background text-muted-foreground rounded-md hover:bg-slate-900 hover:text-white transition-all shadow-inner active:scale-90">
               <Printer className="w-5 h-5" />
            </button>
         </div>
      </nav>

      <div className="max-w-2xl mx-auto px-10 py-16 space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-1000">
         
         {/* Identity Hub */}
         <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-card text-foreground rounded-md border border-border flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <Building className="w-7 h-7 relative z-10" />
            </div>
            <div>
               <h1 className="text-2xl font-black text-foreground tracking-tightest uppercase  mb-2 leading-none">
                  {companyInfo?.name || 'Corporate Terminal'}
               </h1>
               <div className="flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-relaxed max-w-sm">
                     Exclusive Financial Statement Organized for:
                  </p>
                  <div className="mt-4 px-4 py-3 bg-card border border-border rounded-md shadow-sm transform hover:scale-105 transition-transform">
                     <span className="text-xl font-black text-foreground tracking-tightest uppercase  border-b-2 border-indigo-500">{party.company || party.name}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Outstanding Master Card */}
         <div className="bg-slate-900 p-6 rounded-md shadow-2xl shadow-slate-900/20 relative overflow-hidden group hover:scale-[1.02] transition-all duration-700">
            <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:opacity-[0.15] transition-all duration-1000">
               <TrendingUp className="w-32 h-32 rotate-12" />
            </div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-indigo-500 rounded-full opacity-[0.02] filter blur-3xl"></div>
            
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-4 pl-1 border-l-4 border-indigo-500">Current Net Obligation</p>
            <div className="flex flex-col md:flex-row md:items-end gap-4 mb-2">
               <span className="text-7xl font-black tracking-tightest text-white  tabular-nums leading-none">
                  ₹{Math.abs(totalOutstanding).toLocaleString()}
               </span>
               <div className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest  border mb-1 w-fit ${totalOutstanding > 0 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                  {totalOutstanding > 0 ? "Debit Required" : "Operational Credit"}
               </div>
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4 opacity-60">Verified reconciliation balance as per operational ledger</p>
            
            <div className="mt-12 pt-10 border-t border-slate-800 flex flex-col md:flex-row gap-4 print:hidden">
               {type === 'customer' && (
                  <a href={upiLink} className="flex-1 bg-card text-foreground py-4 px-10 rounded-md font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition-all group active:scale-95 leading-none">
                     <CreditCard className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
                     Synchronized UPI Payment
                  </a>
               )}
               <div className="flex gap-4">
                  <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-4 px-10 rounded-md font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 leading-none shadow-xl border border-white/10">
                     <Download className="w-5 h-5" /> Export Dataset
                  </button>
               </div>
            </div>
         </div>

         {/* Multi-Dimensional Insights */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card p-4 rounded-md border border-border shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
               <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
               <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600 shadow-sm"><ArrowDownRight className="w-6 h-6" /></div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 ">Total Billed Yield</p>
                     <p className="text-2xl font-black text-foreground tracking-tightest  tabular-nums leading-none">₹{Number(totalDebit || 0).toLocaleString()}</p>
                  </div>
               </div>
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mt-4 ">Aggregate Debit Fluctuations</p>
            </div>
            <div className="bg-card p-4 rounded-md border border-border shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
               <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
               <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 shadow-sm"><ArrowUpRight className="w-6 h-6" /></div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 ">Settled Liquidity</p>
                     <p className="text-2xl font-black text-foreground tracking-tightest  tabular-nums leading-none">₹{Number(totalCredit || 0).toLocaleString()}</p>
                  </div>
               </div>
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mt-4 ">Aggregate Credit Flow</p>
            </div>
         </div>

         {/* Transaction Analytics Timeline */}
         <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                <h3 className="text-[11px] font-black uppercase text-foreground tracking-[0.3em] ">Historical Transaction Log</h3>
            </div>
            
            <div className="space-y-3">
               {timeline.slice().reverse().map((item, idx) => (
                    <div key={idx} className="bg-card p-4 rounded-md border border-border flex justify-between items-center group hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500">
                       <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-md flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${item.type === 'payment' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-500/10' : 'bg-indigo-50 text-indigo-600 shadow-indigo-500/10'}`}>
                             <Activity className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-2 ">Ref_Node: {formatDate(item.date)}</span>
                             <span className="text-sm font-black text-foreground uppercase tracking-tightest leading-tight line-clamp-1">{item.description}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-xl font-black  tracking-tightest tabular-nums leading-none mb-2 ${item.type === 'payment' ? 'text-emerald-600' : 'text-rose-600'}`}>
                             ₹{(item.debit || item.credit).toLocaleString()}
                          </p>
                          <div className={`inline-flex px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest  ${item.type === 'payment' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-background text-muted-foreground border border-border'}`}>
                             {item.type === 'payment' ? (type === 'customer' ? 'REC' : 'STL') : (type === 'customer' ? 'INV' : 'BIL')}
                          </div>
                       </div>
                    </div>
               ))}
            </div>
         </div>

         {/* Corporate Encryption Footer */}
         <div className="pt-20 flex flex-col items-center gap-4 border-t border-border">
            <div className="flex items-center gap-4">
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
            
            <div className="text-center font-black uppercase tracking-[0.3em] text-[10px] text-slate-300 leading-[2.5]  opacity-60">
               Confidential Audit Statement for {party.company || party.name}.<br/>
               Origin Node: {companyInfo?.name} — {companyInfo?.address}<br/>
               &copy; {new Date().getFullYear()} GLOBAL INTELLIGENCE NETWORK
            </div>
         </div>
      </div>

      {/* Optimized Print Template */}
      <div className="printable-document hidden print:block bg-card p-6 min-h-screen">
         <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-10">
            <div>
               <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase ">{companyInfo?.name || "Corporate Integrity Node"}</h1>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">{companyInfo?.address}</p>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">GSTIN: {companyInfo?.gstin || "N/A"}</p>
            </div>
            <div className="text-right">
               <div className="inline-block bg-slate-900 text-white px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest  mb-4">Official Audit Statement</div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date: {formatDate(new Date())}</p>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-3 mb-12">
            <div className="bg-background p-4 rounded-md border border-border">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3 ">Authorized Party</p>
               <h2 className="text-xl font-black text-foreground uppercase tracking-tight ">{party.company || party.name}</h2>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">{party.address}</p>
            </div>
            <div className="bg-slate-900 p-4 rounded-md text-white">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3 ">Net Reconciliation Balance</p>
               <h2 className="text-3xl font-black  tabular-nums leading-none">₹{Math.abs(totalOutstanding).toLocaleString()}</h2>
               <p className="text-[10px] font-black uppercase tracking-widest mt-4 text-indigo-400 ">
                  {totalOutstanding > 0 ? "OUTSTANDING DEBIT" : "ADVANCE CREDIT"}
               </p>
            </div>
         </div>

         <table className="w-full mb-12">
            <thead>
               <tr className="border-b border-border">
                  <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Node TS</th>
                  <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operation Description</th>
                  <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Debit (₹)</th>
                  <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Credit (₹)</th>
               </tr>
            </thead>
            <tbody>
               {timeline.map((item, idx) => (
                  <tr key={idx} className="border-b border-border">
                     <td className="py-4 text-[11px] font-bold text-slate-600">{formatDate(item.date)}</td>
                     <td className="py-4 text-[11px] font-black text-foreground uppercase ">{item.description}</td>
                     <td className="py-4 text-right text-[11px] font-black tabular-nums">{item.debit > 0 ? item.debit.toLocaleString() : "-"}</td>
                     <td className="py-4 text-right text-[11px] font-black tabular-nums">{item.credit > 0 ? item.credit.toLocaleString() : "-"}</td>
                  </tr>
               ))}
            </tbody>
         </table>

         <div className="flex justify-between items-center bg-background p-4 rounded-md border border-border mt-20">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest  max-w-xs leading-loose">
               This is a cryptographically verified system-generated audit statement. No manual signature required for operational validation.
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-foreground uppercase tracking-widest  mb-2">Verified Reconciliation Node</p>
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">TS: {new Date().toISOString()}</p>
            </div>
         </div>
      </div>

      <style>{`
         @media print {
            @page { size: A4; margin: 0.5cm; }
            nav, .print\\:hidden, button, a { display: none !important; }
            body { background: white !important; }
            .min-h-screen { min-height: 0 !important; height: auto !important; }
            .bg-background { background: white !important; }
            .printable-document { display: block !important; position: absolute; top: 0; left: 0; width: 100% !important; z-index: 10000; }
         }
      `}</style>
    </div>
  );
};

export default PublicLedger;
