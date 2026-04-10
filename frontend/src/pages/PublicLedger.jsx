import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { publicApi } from "../api/erpApi";
import { 
  ShieldCheck, 
  Wallet, 
  Download, 
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building,
  Clock
} from "lucide-react";

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 scale-up-center">
       <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
       <p className="text-gray-500 font-bold tracking-widest uppercase text-[10px]">Loading Your Secure Portal...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 text-center">
       <title>Apex ERP</title>
       <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="w-10 h-10" />
       </div>
       <h1 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h1>
       <p className="text-gray-500 max-w-xs mx-auto italic">{error}</p>
       <p className="mt-8 text-[10px] font-black uppercase text-gray-300 tracking-[0.3em] uppercase">Security Protocols Active</p>
    </div>
  );
 
  const { party, type, timeline, totalOutstanding, companyInfo } = data;

  // UPI Deep Link Generation
  const upiLink = `upi://pay?pa=nexus-ops@okaxis&pn=NexusERP&am=${Math.abs(totalOutstanding)}&cu=INR&tn=LedgerSettlement`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100 pb-20">
      {/* Portal Header */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
         <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 leading-none mb-1">{companyInfo?.name || "Client Portal"}</span>
            <span className="text-sm font-black text-gray-900 tracking-tighter uppercase italic">Secure Statement</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Live Statement</span>
         </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
         
         {/* Welcome & Branding */}
         <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-gray-200">
               <Building className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-blue-600 mb-1 uppercase italic">{companyInfo?.name || 'APEX ERP SYSTEMS'}</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
               {party.company}<br/>
               <span className="text-[9px] text-gray-300">Statement for your reference</span>
            </p>
         </div>

         {/* Outstanding Card */}
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
            <title>Account Ledger - Apex ERP</title>
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-all">
               <TrendingUp className="w-24 h-24 rotate-12" />
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Your Net Outstanding Balance</p>
            <div className="flex items-baseline gap-2">
               <span className="text-5xl font-black tracking-tighter text-gray-900 italic">
                  ₹{Math.abs(totalOutstanding).toLocaleString()}
               </span>
               <span className={`text-sm font-black uppercase italic ${totalOutstanding > 0 ? "text-red-500" : "text-green-500"}`}>
                  {totalOutstanding > 0 ? "Debit" : "Credit"}
               </span>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-50 flex gap-4">
               {type === 'customer' && (
                  <a 
                    href={upiLink}
                    className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
                  >
                     <CreditCard className="w-4 h-4" /> Pay via UPI
                  </a>
               )}
               <button 
                 onClick={() => window.print()}
                 className={`${type === 'customer' ? 'w-14' : 'flex-1'} h-14 bg-white border border-gray-100 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-50 transition-colors active:scale-90`}
               >
                  <Download className="w-5 h-5 mr-2" /> {type === 'supplier' && "Download Statement"}
               </button>
            </div>
         </div>

         {/* Quick Insights */}
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[2rem] border border-gray-100">
               <div className="p-2 bg-blue-50 text-blue-500 rounded-xl w-fit mb-4">
                  <Clock className="w-4 h-4" />
               </div>
               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
               <p className="text-xs font-black text-gray-800 uppercase tracking-tight">Up to Date</p>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border border-gray-100">
               <div className="p-2 bg-green-50 text-green-500 rounded-xl w-fit mb-4">
                  <TrendingUp className="w-4 h-4" />
               </div>
               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Recency</p>
               <p className="text-xs font-black text-gray-800 uppercase tracking-tight">Active Trade</p>
            </div>
         </div>

         {/* Timeline */}
         <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
               <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] italic">Transaction Timeline</h3>
            </div>
            
            <div className="space-y-3">
               {timeline.slice().reverse().map((item, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 flex justify-between items-center group hover:border-gray-200 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${item.type === 'payment' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                             <Wallet className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{new Date(item.date).toLocaleDateString()}</span>
                             <span className="text-xs font-black text-gray-800 uppercase tracking-tight line-clamp-1">{item.description}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-xs font-black italic tracking-tight ${item.type === 'payment' ? 'text-green-500' : 'text-red-500'}`}>
                             ₹{(item.debit || item.credit).toLocaleString()}
                          </p>
                          <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">
                             {item.type === 'payment' ? (type === 'customer' ? 'REC' : 'PAID') : (type === 'customer' ? 'INV' : 'BILL')}
                          </p>
                       </div>
                    </div>
               ))}
            </div>
         </div>

         {/* Security Notice */}
         <div className="pt-10 flex flex-col items-center gap-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-gray-400">
               <ShieldCheck className="w-3 h-3" />
               <span className="text-[8px] font-bold uppercase tracking-widest">Secured & Encrypted</span>
            </div>
            <p className="text-[8px] text-gray-300 font-bold uppercase text-center leading-loose">
               Confidential Statement for {party.company || party.name}.<br/>
               Issued by: {companyInfo?.name} — {companyInfo?.address}<br/>
               &copy; {new Date().getFullYear()} {companyInfo?.name}
            </p>
         </div>
      </div>
    </div>
  );
};

export default PublicLedger;
