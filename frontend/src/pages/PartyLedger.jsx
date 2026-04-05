import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
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
   const typeParam = searchParams.get("type") || "customer"; // 'customer' or 'supplier'

   const [statement, setStatement] = useState(null);
   const [party, setParty] = useState(null);
   const [parties, setParties] = useState([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [copied, setCopied] = useState(false);
   const [viewMode, setViewMode] = useState("full"); // 'full' or 'payments'

   useEffect(() => {
   // ... existing useEffect logic

      if (id) {
         fetchStatement();
      } else {
         fetchParties();
      }
   }, [id, typeParam]);

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

      // CSV Header row
      const headers = ["Date", "Type", "Description", "Debit", "Credit", "Balance"];

      // Format rows with double quotes to escape commas correctly
      const rows = statement.timeline.map(item => [
         `"${new Date(item.date).toLocaleDateString()}"`,
         `"${item.type.toUpperCase()}"`,
         `"${item.description.replace(/"/g, '""')}"`, // Escape double quotes
         `"${item.debit || 0}"`,
         `"${item.credit || 0}"`,
         `"${item.balance || 0}"`
      ].join(","));

      const csvString = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      // Sanitize filename to remove illegal '/' characters from dates
      const safeDate = new Date().toLocaleDateString().replace(/\//g, "-");
      const fileName = `Statement_${party?.company || party?.name || "Party"}_${safeDate}.csv`;

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
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                     <h2 className="text-4xl font-black text-gray-900 tracking-tight italic flex items-center gap-3">
                        <span className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
                           <FileText className="w-8 h-8" />
                        </span>
                        Account Statement Hub
                     </h2>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 ml-14">Universal Selection for Financial Reconciliation</p>
                  </div>
                  <div className="relative w-full md:w-96 group">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                     <input 
                        type="text" 
                        placeholder="Search Name, Company or GSTIN..."
                        className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
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
                        className="p-6 bg-white border border-gray-100 rounded-[2.5rem] hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden"
                     >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                           {p.type === 'customer' ? <Users className="w-12 h-12" /> : <Building2 className="w-12 h-12" />}
                        </div>
                        <div className="flex flex-col relative z-10 h-full">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${p.type === 'customer' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                              {p.type === 'customer' ? <Users className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                           </div>
                           <h4 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tighter mb-1 truncate">
                              {p.company || p.name}
                           </h4>
                           <div className="flex flex-col mt-auto">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{p.name || p.company}</span>
                              <span className="text-[9px] font-bold text-blue-500 mt-1">{p.gstin || "B2C VENDOR"}</span>
                           </div>
                        </div>
                     </Link>
                  ))}
               </div>
            </div>
         </AppLayout>
      );
   }

   // STATEMENT VIEW (When party is selected)
   // Calculate Totals for Summary Box
   const totalInvoiced = statement?.timeline
      .filter(item => item.type === 'invoice' || item.type === 'purchase')
      .reduce((sum, item) => sum + (item.debit || item.credit || 0), 0) || 0;

   const totalPaid = statement?.timeline
      .filter(item => item.type === 'payment')
      .reduce((sum, item) => sum + (item.debit || item.credit || 0), 0) || 0;

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
                  <p className="text-[10px] font-bold uppercase">Statement of Account</p>
               </div>
               <div className="text-right">
                  <p className="text-xs font-bold uppercase">Date: {new Date().toLocaleDateString()}</p>
               </div>
            </div>

            {/* Party Details & Summary Box */}
            <div className="flex justify-between items-start mb-8">
               <div className="w-1/2">
                  <p className="text-[10px] font-bold underline mb-1 uppercase">Party Details</p>
                  <h2 className="text-lg font-bold uppercase">{party?.company || party?.name}</h2>
                  <p className="text-xs">GSTIN: {party?.gstin || "N/A"}</p>
                  <p className="text-xs mt-1 w-2/3">{party?.address || "No address provided"}</p>
               </div>
               <div className="w-1/3 border border-black p-4 bg-gray-50/50">
                  <p className="text-[10px] font-bold underline mb-2 uppercase text-center">Reconciliation Summary</p>
                  <div className="space-y-1 text-sm tabular-nums">
                     <div className="flex justify-between border-b border-dashed border-gray-400 pb-1">
                        <span>Total Invoiced</span>
                        <span>₹{totalInvoiced.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between border-b border-dashed border-gray-400 pb-1">
                        <span>Total Paid</span>
                        <span>₹{totalPaid.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between font-bold pt-1">
                        <span>Net Outstanding</span>
                        <span className={statement?.totalOutstanding > 0 ? "text-red-700" : "text-green-700"}>
                           ₹{Math.abs(statement?.totalOutstanding || 0).toLocaleString()}
                           <span className="text-[8px] ml-1 uppercase">{statement?.totalOutstanding > 0 ? "Dr" : "Cr"}</span>
                        </span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Detailed Ledger Table */}
            <table className="mb-10 w-full border-collapse">
               <thead>
                  <tr className="bg-gray-100 uppercase text-[9px] font-bold">
                     <th className="border border-black p-2 text-left">Date</th>
                     <th className="border border-black p-2 text-left">Transaction Details</th>
                     <th className="border border-black p-2 text-right">Debit (₹)</th>
                     <th className="border border-black p-2 text-right">Credit (₹)</th>
                     <th className="border border-black p-2 text-right">Balance (₹)</th>
                  </tr>
               </thead>
               <tbody>
                  {statement?.timeline?.filter(item => viewMode === 'full' || item.type === 'payment').map((item, idx) => (
                     <tr key={idx} className="text-[10px]">
                        <td className="border border-black p-2">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="border border-black p-2">
                           <div className="font-bold uppercase">{item.description}</div>
                           <div className="text-[8px] text-gray-500">REF: {item.ref.slice(-8).toUpperCase()}</div>
                        </td>
                        <td className="border border-black p-2 text-right">
                           {item.debit > 0 ? Number(item.debit).toLocaleString('en-IN') : "-"}
                        </td>
                        <td className="border border-black p-2 text-right">
                           {item.credit > 0 ? Number(item.credit).toLocaleString('en-IN') : "-"}
                        </td>
                        <td className="border border-black p-2 text-right font-bold">
                           {Math.abs(item.balance).toLocaleString('en-IN')} {item.balance > 0 ? "Dr" : item.balance < 0 ? "Cr" : ""}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>

            {/* Print Footer */}
            <div className="mt-20 flex justify-between items-end border-t border-black pt-8">
               <div className="text-[9px] text-gray-400 uppercase italic">
                  This is a computer-generated statement and does not require a physical signature.<br />
                  Powered by Nexus ERP Solutions.
               </div>
               <div className="text-center">
                  <div className="w-48 border-b border-black mb-1"></div>
                  <p className="text-[10px] font-bold uppercase">Authorized Signatory</p>
               </div>
            </div>
         </div>

         {/* INTERACTIVE WEB INTERFACE (Hidden on print) */}
         <div className="main-app-content space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="flex items-center gap-4">
                  <button
                     onClick={() => window.history.back()}
                     className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm"
                  >
                     <ArrowLeft className="w-5 h-5 text-gray-400" />
                  </button>
                  <div>
                     <h2 className="text-3xl font-black text-gray-900 tracking-tight italic flex items-center gap-2">
                        Statement: <span className="text-blue-600 underline underline-offset-8 decoration-4">{party?.company || party?.name}</span>
                     </h2>
                     <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                           <User className="w-3 h-3" /> {typeParam.toUpperCase()}
                        </span>
                        <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
                        <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-1">
                           <Building2 className="w-3 h-3" /> {party?.gstin || "UNREGISTERED"}
                        </span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <button
                     onClick={handleShare}
                     className={`px-6 py-3 border rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all shadow-sm ${copied ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-100 text-blue-600 hover:bg-blue-50'}`}
                  >
                     {copied ? "Link Copied!" : <><Zap className="w-4 h-4 fill-current" /> Share Live Portal</>}
                  </button>
                  <button
                     onClick={() => window.print()}
                     className="px-6 py-3 bg-white border border-gray-100 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm"
                  >
                     <Printer className="w-4 h-4" /> Print Statement
                  </button>
                  <button
                     onClick={handleExport}
                     className="px-6 py-3 bg-gray-900 text-white rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-200"
                  >
                     <Download className="w-4 h-4" /> Export CSV
                  </button>
               </div>
            </div>

            {/* Web Balance Cards & View Mode Toggle */}
            <div className="flex flex-col lg:flex-row gap-6 items-end">
               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                        <Wallet className="w-16 h-16" />
                     </div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Invoiced / Sales</p>
                     <h3 className="text-3xl font-black italic tracking-tighter text-gray-900">
                        ₹{totalInvoiced.toLocaleString()}
                     </h3>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                        <Wallet className="w-16 h-16" />
                     </div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Amount Settled / Paid</p>
                     <h3 className="text-3xl font-black italic tracking-tighter text-green-600">
                        ₹{totalPaid.toLocaleString()}
                     </h3>
                  </div>
               </div>

               <div className="bg-gray-100 p-1.5 rounded-[1.5rem] flex items-center gap-1 shadow-inner min-w-[300px]">
                  <button 
                     onClick={() => setViewMode('full')}
                     className={`flex-1 px-4 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'full' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                     Full Statement
                  </button>
                  <button 
                     onClick={() => setViewMode('payments')}
                     className={`flex-1 px-4 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'payments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                     Payments Only
                  </button>
               </div>
            </div>

            <div className={`p-8 rounded-[2.5rem] border shadow-sm ${statement?.totalOutstanding > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
                <div className="flex justify-between items-center">
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${statement?.totalOutstanding > 0 ? "text-red-400" : "text-green-400"}`}>Net Account Balance</p>
                        <h3 className={`text-4xl font-black italic tracking-tighter ${statement?.totalOutstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                           ₹{Math.abs(statement?.totalOutstanding || 0).toLocaleString()}
                           <span className="text-xs ml-2 font-black uppercase italic">{statement?.totalOutstanding > 0 ? "Dr" : "Cr"}</span>
                        </h3>
                    </div>
                </div>
            </div>

            {/* Ledger Table (Web Style) */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                           <th className="px-8 py-5">Date</th>
                           <th className="px-8 py-5">Transaction Summary</th>
                           {viewMode === 'full' && (
                              <>
                                 <th className="px-8 py-5 text-right">Debit (₹)</th>
                                 <th className="px-8 py-5 text-right">Credit (₹)</th>
                              </>
                           )}
                           {viewMode === 'payments' && <th className="px-8 py-5 text-right font-black text-blue-600 italic">Settled (₹)</th>}
                           <th className="px-8 py-5 text-right pr-12">Running Balance</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50 uppercase tracking-tight">
                        {(() => {
                           const filteredTimeline = statement?.timeline?.filter(item => viewMode === 'full' || item.type === 'payment') || [];

                           if (filteredTimeline.length === 0) {
                              return (
                                 <tr>
                                    <td colSpan={viewMode === 'full' ? 5 : 4} className="px-8 py-20 text-center text-gray-400 font-bold italic lowercase">no matching transactions found.</td>
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
                                 {viewMode === 'full' ? (
                                    <>
                                       <td className="px-8 py-6 text-right tabular-nums text-red-600 font-bold">
                                          {item.debit > 0 ? `₹${item.debit.toLocaleString()}` : "-"}
                                       </td>
                                       <td className="px-8 py-6 text-right tabular-nums text-green-600 font-bold">
                                          {item.credit > 0 ? `₹${item.credit.toLocaleString()}` : "-"}
                                       </td>
                                    </>
                                 ) : (
                                    <td className="px-8 py-6 text-right">
                                       <span className="text-xs font-black tabular-nums text-green-600 italic">
                                          ₹{(item.debit || item.credit || 0).toLocaleString()}
                                       </span>
                                    </td>
                                 )}
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
      </AppLayout>
   );
};

export default PartyLedger;
