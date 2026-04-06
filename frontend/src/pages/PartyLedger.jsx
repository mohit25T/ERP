import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { reportsApi, api } from "../api/erpApi";
import {
   FileText,
   ArrowLeft,
   Download,
   Calendar,
   User,
   Users,
   Building2,
   ArrowUpRight,
   ArrowDownRight,
   Printer,
   Wallet,
   Share2,
   Zap,
   Search
} from "lucide-react";

const PartyLedger = () => {
   const { id } = useParams();
   const [searchParams] = useSearchParams();
   const navigate = useNavigate();
   const typeParam = searchParams.get("type") || "customer"; // 'customer' or 'supplier'

   const [statement, setStatement] = useState(null);
   const [party, setParty] = useState(null);
   const [parties, setParties] = useState([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [copied, setCopied] = useState(false);

   useEffect(() => {
      // Redirect if id is literally the placeholder ":id"
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
         console.error("Failed to fetch balance parties", err);
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
      } catch (err) {
         console.error("Failed to fetch party ledger", err);
      } finally {
         setLoading(false);
      }
   };

   const handleShare = () => {
      if (!party?.shareToken) return;
      const shareUrl = `${window.location.origin}/public/ledger/${party.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };

   const handleExport = () => {
      if (!statement?.timeline) return;
      
      const headers = ["Date", "Description", "Ref", "Amount", "Balance"];
      const rows = statement.timeline
         .filter(item => item.type === 'payment')
         .map(item => [
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

      const safeDate = new Date().toLocaleDateString().replace(/\//g, "-");
      const fileName = `Payment_Ledger_${party?.company || party?.name || "Party"}_${safeDate}.csv`;

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
   };

   if (loading) return (
      <AppLayout>
         <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
         </div>
      </AppLayout>
   );

   // SELECTION HUB (When no ID is provided)
   if (!id) {
      const filteredParties = parties.filter(p => 
         (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.company?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.gstin?.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return (
         <AppLayout>
            <div className="space-y-8 animate-in fade-in duration-700">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 pb-8">
                  <div>
                     <h2 className="text-4xl font-black text-gray-900 tracking-tight italic flex items-center gap-3">
                        <div className="p-3 bg-gray-900 text-white rounded-2xl shadow-xl shadow-gray-200">
                           <Users className="w-8 h-8" />
                        </div>
                        Party Ledger Hub
                     </h2>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 ml-16 flex items-center gap-2">
                         <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                         Select a customer or supplier to view payment history
                     </p>
                  </div>
                  <div className="relative w-full md:w-96 group">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                     <input 
                        type="text"
                        placeholder="Search by name, company or GSTIN..."
                        className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm group-hover:shadow-md font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredParties.map(p => (
                     <Link 
                        key={p._id}
                        to={`/statements/${p._id}?type=${p.type}`}
                        className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 relative overflow-hidden"
                     >
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] group-hover:scale-125 transition-all duration-700">
                           {p.type === 'customer' ? <User className="w-24 h-24" /> : <Building2 className="w-24 h-24" />}
                        </div>
                        
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${p.type === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                           {p.type === 'customer' ? <User className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                        </div>

                        <div className="space-y-1">
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-500 transition-colors">{p.type}</p>
                           <h4 className="text-xl font-black text-gray-900 group-hover:text-gray-800 transition-colors truncate">{p.company || p.name}</h4>
                        </div>
                        
                        <div className="mt-8 flex items-center justify-between">
                           <div className="text-[10px] font-black text-gray-400 group-hover:text-gray-600 uppercase tracking-tighter">
                              Click to view ledger
                           </div>
                           <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </div>
                     </Link>
                  ))}
               </div>
            </div>
         </AppLayout>
      );
   }

   // STATEMENT VIEW (When party is selected)
   return (
      <AppLayout>
         <style>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          .main-app-content, aside, header { display: none !important; }
          .printable-ledger-document { display: block !important; width: 100% !important; background: white !important; }
          body { background: white !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #000 !important; padding: 8px !important; color: black !important; font-size: 10pt !important; }
          th { background-color: #f3f4f6 !important; text-transform: uppercase !important; font-weight: bold !important; }
        }
        .printable-ledger-document { display: none; }
      `}</style>

         {/* DEDICATED PRINT FORMAT (Visible only on print) */}
         <div className="printable-ledger-document text-black font-serif">
            {/* Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
               <div>
                  <h1 className="text-2xl font-bold uppercase tracking-tight">Nexus ERP</h1>
                  <p className="text-[10px] font-bold uppercase">Payment Ledger Statement</p>
               </div>
               <div className="text-right">
                  <p className="text-xs font-bold uppercase">Date: {new Date().toLocaleDateString()}</p>
               </div>
            </div>

            {/* Party Header Info for Print */}
            <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
               <div className="space-y-4">
                  <div className="bg-gray-100 p-4 rounded border border-gray-200">
                     <p className="font-bold uppercase border-b border-gray-300 pb-1 mb-2 text-[10px]">Recipient Party Details</p>
                     <p className="text-lg font-bold">{party?.company || party?.name}</p>
                     <p className="font-medium text-gray-600 mt-1">{party?.address || "Address not specified"}</p>
                     <p className="font-bold mt-2">GSTIN: {party?.gstin || "N/A"}</p>
                  </div>
               </div>
               <div className="flex flex-col justify-end text-right space-y-2">
                  <div className="border-l-2 border-black pl-4">
                     <p className="text-[10px] font-bold uppercase text-gray-500">Statement Type</p>
                     <p className="text-sm font-bold uppercase">Consolidated Payment Ledger</p>
                  </div>
                  <div className="border-l-2 border-black pl-4">
                     <p className="text-[10px] font-bold uppercase text-gray-500">Generated Period</p>
                     <p className="text-sm font-bold capitalize">Full History to Date</p>
                  </div>
               </div>
            </div>

            {/* Transaction Table for Print */}
            <table className="w-full mb-8">
               <thead>
                  <tr className="bg-gray-100 uppercase font-black text-[10px]">
                     <th className="text-left w-24">Date</th>
                     <th className="text-left">Transaction Details</th>
                     <th className="text-right w-32">Amount (₹)</th>
                     <th className="text-right w-32">Balance (₹)</th>
                  </tr>
               </thead>
               <tbody>
                  {statement?.timeline?.filter(item => item.type === 'payment').map((item, idx) => (
                     <tr key={idx} className="border-b border-gray-100">
                        <td className="align-top py-2">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="align-top py-2">
                           <div className="font-bold text-[10px]">{item.description}</div>
                           <div className="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5">REF: {String(item.ref).slice(-8).toUpperCase()}</div>
                        </td>
                        <td className="align-top py-2 text-right font-bold">{(item.debit || item.credit || 0).toLocaleString()}</td>
                        <td className="align-top py-2 text-right font-bold">
                           {Math.abs(item.balance).toLocaleString()} {item.balance > 0 ? "Dr" : item.balance < 0 ? "Cr" : ""}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>

            {/* Print Footer Summary */}
            <div className="flex justify-end gap-12 border-t-2 border-black pt-4">
               <div>
                  <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Account Closing Balance</p>
                  <p className="text-2xl font-bold">₹{Math.abs(statement?.totalOutstanding || 0).toLocaleString()} {statement?.totalOutstanding > 0 ? "DR" : statement?.totalOutstanding < 0 ? "CR" : ""}</p>
               </div>
            </div>
         </div>

         {/* WEB INTERFACE (The main UI) */}
         <div className="main-app-content space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
               <div className="flex items-center gap-4">
                  <Link
                     to="/statements"
                     className="p-4 bg-white border border-gray-100 rounded-3xl text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all active:scale-95 shadow-sm group"
                  >
                     <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
                  </Link>
                  <div>
                     <h2 className="text-4xl font-black text-gray-900 tracking-tight italic flex items-center gap-3">
                        <div className="p-3 bg-gray-900 text-white rounded-2xl shadow-xl shadow-gray-200">
                           <FileText className="w-8 h-8" />
                        </div>
                        Party Payment Ledger
                     </h2>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 ml-16 flex items-center gap-2">
                         <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                         Account history for {party?.company || party?.name}
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <button
                     onClick={() => window.print()}
                     className="px-6 py-4 bg-white border border-gray-100 rounded-3xl flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                  >
                     <Printer className="w-4 h-4" /> Print Ledger
                  </button>
                  <button
                     onClick={handleExport}
                     className="px-6 py-4 bg-gray-900 text-white rounded-3xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 active:scale-95"
                  >
                     <Download className="w-4 h-4" /> Export CSV
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                  {/* Party Snapshot Bar */}
                  <div className="p-8 bg-white border border-gray-100 rounded-[3rem] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                           {typeParam === 'customer' ? <User className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
                        </div>
                        <div>
                           <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Connected account</h3>
                           <h2 className="text-2xl font-black text-gray-900 italic tracking-tight">{party?.company || party?.name}</h2>
                           <p className={`text-[10px] font-bold mt-1 inline-block px-3 py-1 rounded-full uppercase tracking-tighter ${party?.gstin ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                              GSTIN: {party?.gstin || "No GST Registered"}
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Transaction Table */}
                  <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                                 <th className="px-8 py-5">Date</th>
                                 <th className="px-8 py-5">Transaction Summary</th>
                                 <th className="px-8 py-5 text-right font-black text-blue-600 italic">Settled (₹)</th>
                                 <th className="px-8 py-5 text-right pr-12">Running Balance</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50 uppercase tracking-tight">
                              {(() => {
                                 const filteredTimeline = statement?.timeline?.filter(item => item.type === 'payment') || [];
                                 
                                 if (filteredTimeline.length === 0) {
                                    return (
                                       <tr>
                                          <td colSpan="4" className="px-8 py-20 text-center text-gray-400 font-bold italic lowercase">no matching payment records found.</td>
                                       </tr>
                                    );
                                 }

                                 return filteredTimeline.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                       <td className="px-8 py-6">
                                          <span className="text-xs font-black text-gray-900 italic tracking-tight">{new Date(item.date).toLocaleDateString()}</span>
                                       </td>
                                       <td className="px-8 py-6">
                                          <div className="flex flex-col">
                                             <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 underline underline-offset-4 mb-1">
                                                REF: {item.ref.slice(-8).toUpperCase()}
                                             </span>
                                             <span className="text-xs font-bold text-gray-700">{item.description}</span>
                                          </div>
                                       </td>
                                       <td className="px-8 py-6 text-right">
                                          <span className="text-xs font-black tabular-nums text-green-600 italic">
                                             ₹{(item.debit || item.credit || 0).toLocaleString()}
                                          </span>
                                       </td>
                                       <td className="px-8 py-6 text-right pr-12">
                                          <span className="text-sm font-black text-gray-900 tabular-nums italic">
                                             ₹{Math.abs(item.balance).toLocaleString()}
                                             <span className="text-[10px] ml-1 uppercase">{item.balance > 0 ? "Dr" : item.balance < 0 ? "Cr" : ""}</span>
                                          </span>
                                       </td>
                                    </tr>
                                 ));
                              })()}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>

               {/* Professional Balance Panel (Right Col) */}
               <div className="space-y-6">
                  <div className={`p-8 rounded-[3rem] border shadow-2xl transition-all duration-700 ${statement?.totalOutstanding > 0 ? "bg-red-600 border-red-500 shadow-red-500/10 text-white" : "bg-blue-600 border-blue-500 shadow-blue-500/10 text-white"}`}>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                        <Wallet className="w-4 h-4" /> Final Closing Balance
                     </p>
                     <h2 className="text-4xl font-black italic tracking-tighter mt-4 flex items-baseline gap-2">
                        ₹{Math.abs(statement?.totalOutstanding || 0).toLocaleString()}
                        <span className="text-sm italic opacity-60 uppercase tracking-widest">
                           {statement?.totalOutstanding > 0 ? "Receivable" : statement?.totalOutstanding < 0 ? "Payable" : "Clear"}
                        </span>
                     </h2>
                     <p className="text-[10px] font-bold mt-4 opacity-70">
                        {statement?.totalOutstanding > 0 ? "Funds are due from this party." : "Funds are owed to this party."}
                     </p>
                  </div>

                  <div className="bg-white border border-gray-100 p-8 rounded-[3rem] shadow-sm">
                     <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center justify-between">
                        Ledger Actions
                        <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                     </h3>
                     <div className="space-y-3">
                        <button
                           onClick={handleShare}
                           className="w-full px-6 py-4 bg-gray-50 hover:bg-blue-50 text-gray-900 rounded-2xl flex items-center justify-between group transition-all"
                        >
                           <div className="flex items-center gap-3">
                              <Share2 className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                              <span className="text-xs font-black uppercase tracking-widest">Share Portal Access</span>
                           </div>
                           {copied && <span className="text-[9px] font-black text-blue-500">COPIED</span>}
                        </button>
                        <button className="w-full px-6 py-4 bg-gray-50 hover:bg-blue-50 text-gray-900 rounded-2xl flex items-center justify-between group transition-all">
                           <div className="flex items-center gap-3">
                              <Zap className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                              <span className="text-xs font-black uppercase tracking-widest">Reconcile Now</span>
                           </div>
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </AppLayout>
   );
};

export default PartyLedger;
