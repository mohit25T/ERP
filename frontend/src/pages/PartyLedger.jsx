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
  Building2, 
  ArrowUpRight, 
  ArrowDownRight,
  Printer
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

  useEffect(() => {
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

  const handleExport = () => {
    if (!statement?.timeline) return;
    
    const headers = "Date,Type,Description,Debit,Credit,Balance";
    const rows = statement.timeline.map(item => [
      new Date(item.date).toLocaleDateString(),
      item.type.toUpperCase(),
      item.description,
      item.debit,
      item.credit,
      item.balance
    ].join(","));
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Statement_${party?.company || party?.name}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-96">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    </AppLayout>
  );

  // SELECTION HUB (When no party is selected)
  if (!id) {
    const filtered = parties.filter(p => 
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.company || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.gstin || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <AppLayout>
        <div className="space-y-8 print:hidden">
           <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight italic">Party Ledger Hub</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Professional Account Statements & Outstanding Tracking</p>
           </div>

           <div className="relative max-w-xl group">
              <input 
                type="text" 
                placeholder="Search Customer or Supplier by name or GSTIN..." 
                className="w-full px-8 py-5 bg-white border border-gray-100 rounded-3xl shadow-sm text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(p => (
                 <Link 
                   key={p._id}
                   to={`/reports/party/${p._id}?type=${p.type}`}
                   className="p-6 bg-white rounded-[2.5rem] border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                       {p.type === 'customer' ? <User className="w-16 h-16" /> : <Building2 className="w-16 h-16" />}
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${p.type === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                       {p.type.toUpperCase()}
                    </span>
                    <h3 className="text-lg font-black text-gray-900 mt-2 mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">{p.company || p.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.gstin || "B2C / UNREGISTERED"}</p>
                    
                    <div className="mt-6 flex items-center justify-between">
                       <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Open Full Ledger</span>
                       <ArrowUpRight className="w-5 h-5 text-gray-200 group-hover:text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
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
          @page { margin: 1.5cm; }
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          .print-header { display: block !important; }
          .print-border { border: 1px solid #e5e7eb !important; border-radius: 0 !important; box-shadow: none !important; }
          .print-table th { background-color: #f9fafb !important; color: black !important; border-bottom: 2px solid #374151 !important; }
          .print-table td { border-bottom: 1px solid #f3f4f6 !important; color: black !important; }
          .print-card { border: 2px solid #111827 !important; border-radius: 1rem !important; }
        }
        .print-header { display: none; }
      `}</style>

      {/* Professional Print Header */}
      <div className="print-header space-y-6 mb-10 pb-8 border-b-2 border-gray-900">
         <div className="flex justify-between items-start">
            <div>
               <h1 className="text-3xl font-black italic tracking-tighter text-blue-600">Nexus ERP</h1>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Intelligent Enterprise Management</p>
            </div>
            <div className="text-right">
               <h2 className="text-xl font-black uppercase tracking-tighter italic">Statement of Account</h2>
               <p className="text-[10px] font-bold text-gray-500 uppercase">Report Date: {new Date().toLocaleDateString()}</p>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-12 pt-4">
            <div>
               <p className="text-[9px] font-black text-gray-400 underline uppercase tracking-widest mb-2">Subject / Recipient</p>
               <h3 className="text-lg font-black uppercase">{party?.company || party?.name}</h3>
               <p className="text-xs font-bold text-gray-600 mt-1">GSTIN: {party?.gstin || "N/A"}</p>
               <p className="text-xs text-gray-500 mt-2">{party?.address || ""}</p>
            </div>
            <div className="text-right">
               <p className="text-[9px] font-black text-gray-400 underline uppercase tracking-widest mb-2">Outstanding Summary</p>
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 inline-block text-left min-w-[200px]">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Final Balance (As of Today)</p>
                  <p className={`text-2xl font-black italic ${statement?.totalOutstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                     ₹{Math.abs(statement?.totalOutstanding || 0).toLocaleString()}
                     <span className="text-[10px] ml-1 uppercase">{statement?.totalOutstanding > 0 ? "Dr" : "Cr"}</span>
                  </p>
               </div>
            </div>
         </div>
      </div>

      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header (Hidden on Print) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
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

        {/* Balance Cards (Hidden on Print if using Header) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Current Outstanding</p>
              <h3 className={`text-4xl font-black italic tracking-tighter ${statement?.totalOutstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                 ₹{Math.abs(statement?.totalOutstanding || 0).toLocaleString()}
                 <span className="text-xs ml-2 font-black uppercase italic">{statement?.totalOutstanding > 0 ? "Dr" : "Cr"}</span>
              </h3>
           </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden print-border print:border-none">
           <div className="overflow-x-auto">
              <table className="w-full text-left print-table">
                 <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                       <th className="px-8 py-5">Date</th>
                       <th className="px-8 py-5">Transaction Details</th>
                       <th className="px-8 py-5 text-right">Debit (Dr)</th>
                       <th className="px-8 py-5 text-right">Credit (Cr)</th>
                       <th className="px-8 py-5 text-right pr-12">Balance</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 uppercase tracking-tight">
                    {statement?.timeline.length === 0 ? (
                       <tr>
                          <td colSpan="5" className="px-8 py-20 text-center text-gray-400 font-bold italic">No transactions found for this party.</td>
                       </tr>
                    ) : (
                       statement?.timeline.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                             <td className="px-8 py-6">
                                <span className="text-xs font-black text-gray-900 italic tracking-tight">{new Date(item.date).toLocaleDateString()}</span>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex flex-col">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 underline underline-offset-4 mb-1 print:no-underline print:text-black">
                                      ID: {item.ref.slice(-10)}
                                   </span>
                                   <span className="text-xs font-bold text-gray-700">{item.description}</span>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                {item.debit > 0 ? (
                                   <span className="text-xs font-black text-red-600 tabular-nums">₹{item.debit.toLocaleString()}</span>
                                ) : <span className="text-[10px] text-gray-200">--</span>}
                             </td>
                             <td className="px-8 py-6 text-right">
                                {item.credit > 0 ? (
                                   <span className="text-xs font-black text-green-600 tabular-nums">₹{item.credit.toLocaleString()}</span>
                                ) : <span className="text-[10px] text-gray-200">--</span>}
                             </td>
                             <td className="px-8 py-6 text-right pr-12">
                                <span className="text-sm font-black text-gray-900 tabular-nums italic">
                                   ₹{Math.abs(item.balance).toLocaleString()}
                                   <span className="text-[10px] ml-1 uppercase">{item.balance > 0 ? "Dr" : item.balance < 0 ? "Cr" : ""}</span>
                                </span>
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PartyLedger;
