import { useState, useEffect } from "react";
import { reportsApi } from "../../api/erpApi";
import AppLayout from "../../components/layout/AppLayout";
import HammerLoader from "../../components/common/HammerLoader";
import { 
  ArrowRightLeft, ShieldCheck, Printer, Download, 
  TrendingUp, ArrowUpRight, TrendingDown, ArrowDownLeft, 
  Wallet, Zap, Calendar, Search, Filter, Database 
} from "lucide-react";


const CompanyStatement = () => {
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchStatement();
  }, []);

  const fetchStatement = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.getCompanyStatement();
      setStatement(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!filteredTimeline.length) return;
    const headers = ["Date", "Description", "Debit", "Credit", "Balance"];
    const rows = filteredTimeline.map(item => [
      `"${new Date(item.date).toLocaleDateString()}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      item.debit || 0,
      item.credit || 0,
      item.balance || 0
    ].join(","));
    const csvString = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Master_Statement_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <HammerLoader />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-4 animate-pulse">Synchronizing Fiscal Ledger...</p>
      </div>
    </AppLayout>
  );

  const totalCredits = statement?.timeline?.reduce((sum, i) => sum + (i.credit || 0), 0) || 0;
  const totalDebits = statement?.timeline?.reduce((sum, i) => sum + (i.debit || 0), 0) || 0;

  const filteredTimeline = statement?.timeline?.filter(item => 
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.ref || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <AppLayout>
      <style>{`
        @media print {
          @page { size: A4; margin: 0.5cm; }
          .main-app-content, aside, header { display: none !important; }
          .printable-document { display: block !important; width: 100% !important; background: white !important; color: black !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #eee !important; padding: 10px !important; font-size: 9pt !important; }
          th { background: #f8fafc !important; text-transform: uppercase; font-weight: 900; }
        }
        .printable-document { display: none; }
      `}</style>

      {/* WEB VERSION */}
      <div className="main-app-content space-y-3 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Elite Financial Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-4">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-900 rounded-md flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-xl border border-slate-800">
                 <ArrowRightLeft className="w-7 h-7 text-white" />
              </div>
              <div>
                 <h2 className="text-4xl font-black text-slate-900 tracking-tightest leading-none mb-2 ">Capital <span className="text-primary not-">Terminal</span></h2>
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Master Financial Audit & Aggregated Fiscal Ledger</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <button onClick={() => window.print()} className="erp-button-secondary !py-3 !px-4 border-slate-200 rounded-md">
                 <Printer className="w-5 h-5" />
                 Print Audit
              </button>
              <button onClick={handleExport} className="erp-button-primary !py-3 !bg-slate-900 !rounded-md hover:!bg-black group">
                 <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                 Export Dataset
              </button>
           </div>
        </div>

        {/* Global Fiscal Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="p-4 bg-white rounded-md border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="w-16 h-16 text-emerald-600" /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Aggregated Inflow</p>
              <h3 className="text-3xl font-black text-emerald-600 tracking-tightest tabular-nums ">₹{totalCredits.toLocaleString()}</h3>
              <div className="flex items-center gap-2 mt-4 text-emerald-500 font-bold text-[10px] uppercase tracking-widest bg-emerald-50 w-fit px-3 py-1 rounded-md">
                 <ArrowUpRight className="w-3.5 h-3.5" />
                 <span>Primary Revenue Stream</span>
              </div>
           </div>
           <div className="p-4 bg-white rounded-md border border-slate-100 shadow-sm group hover:border-rose-200 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingDown className="w-16 h-16 text-rose-600" /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operational Outflow</p>
              <h3 className="text-3xl font-black text-rose-600 tracking-tightest tabular-nums ">₹{totalDebits.toLocaleString()}</h3>
              <div className="flex items-center gap-2 mt-4 text-rose-500 font-bold text-[10px] uppercase tracking-widest bg-rose-50 w-fit px-3 py-1 rounded-md">
                 <ArrowDownLeft className="w-3.5 h-3.5" />
                 <span>Strategic Expenditure Flux</span>
              </div>
           </div>
           <div className={`p-4 rounded-md shadow-2xl relative overflow-hidden group transition-all ${statement?.totalBalance >= 0 ? "bg-slate-900 shadow-slate-900/20" : "bg-rose-900 shadow-rose-900/20"}`}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Wallet className="w-16 h-16 text-white rotate-12" />
              </div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Net Fiscal Position</p>
              <h3 className="text-3xl font-black text-white tracking-tightest tabular-nums ">
                 ₹{Math.abs(statement?.totalBalance || 0).toLocaleString()} 
                 <span className="text-[10px] uppercase not- ml-2 opacity-40">{(statement?.totalBalance || 0) >= 0 ? "Credit Balance" : "Debit Exposure"}</span>
              </h3>
              <div className="flex items-center gap-2 mt-4 text-white/60 font-bold text-[10px] uppercase tracking-widest">
                 <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                 <span>System Health Synchronized</span>
              </div>
           </div>
        </div>

        {/* Unified Statement Container */}
        <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden mb-20">
           <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-white rounded-md border border-slate-100 shadow-sm">
                    <Calendar className="w-5 h-5 text-slate-400" />
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Period</h4>
                    <p className="text-sm font-black text-slate-900 uppercase  tracking-tighter">Lifetime Fiscal Duration</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchTerm ? 'text-slate-900' : 'text-slate-400'}`} />
                    <input 
                      placeholder="Transaction Lookup..." 
                      className="pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-md text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all w-72" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-4 rounded-md transition-all ${showFilters ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/40' : 'bg-white text-slate-400 border border-slate-100 hover:text-slate-900'}`}
                  >
                    <Filter className="w-5 h-5" />
                  </button>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="erp-table">
                 <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
                       <th className="px-10 py-3">Timestamp</th>
                       <th className="px-10 py-3">Transaction Identity</th>
                       <th className="px-10 py-3 text-right">Debit Magnitude</th>
                       <th className="px-10 py-3 text-right">Credit Magnitude</th>
                       <th className="px-10 py-3 text-right pr-20">Fiscal Velocity</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredTimeline.length > 0 ? (
                       filteredTimeline.map((item, idx) => (
                          <tr key={idx} className="group erp-row-hover transition-all duration-500">
                             <td className="px-10 py-3">
                                <div className="flex flex-col">
                                   <span className="text-[11px] font-black text-slate-900 tracking-tightest ">{new Date(item.date).toLocaleDateString()}</span>
                                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-40">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                             </td>
                             <td className="px-10 py-3 max-w-sm">
                                <div className="flex flex-col">
                                   <span className="text-sm font-black text-slate-900 tracking-tightest group-hover:text-slate-600 transition-colors uppercase ">{item.description}</span>
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                      <Database className="w-3.5 h-3.5" />
                                      REF: {String(item.ref || "").slice(-8).toUpperCase() || "N/A"}
                                   </span>
                                </div>
                             </td>
                             <td className="px-10 py-3 text-right tabular-nums">
                                <span className={`text-sm font-black  tracking-tighter ${item.debit > 0 ? "text-rose-500" : "text-slate-200"}`}>
                                   {item.debit > 0 ? `₹${item.debit.toLocaleString()}` : "---"}
                                </span>
                             </td>
                             <td className="px-10 py-3 text-right tabular-nums">
                                <span className={`text-sm font-black  tracking-tighter ${item.credit > 0 ? "text-emerald-500" : "text-slate-200"}`}>
                                   {item.credit > 0 ? `₹${item.credit.toLocaleString()}` : "---"}
                                </span>
                             </td>
                             <td className="px-10 py-3 text-right pr-20">
                                <div className="flex flex-col items-end">
                                   <span className={`text-base font-black tabular-nums  ${item.balance >= 0 ? "text-slate-900 text-glow" : "text-rose-900 underline decoration-rose-200 decoration-4"}`}>
                                      ₹{Math.abs(item.balance || 0).toLocaleString()}
                                      <span className="text-[10px] ml-1 uppercase opacity-40 font-bold not-">{(item.balance || 0) >= 0 ? "Cr" : "Dr"}</span>
                                   </span>
                                </div>
                             </td>
                          </tr>
                       ))
                    ) : (
                       <tr>
                          <td colSpan="5" className="px-10 py-20 text-center">
                             <div className="flex flex-col items-center gap-4 opacity-20">
                                <Database className="w-12 h-12" />
                                <p className="text-xs font-black uppercase tracking-widest">No Fiscal Transactions Located</p>
                             </div>
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

      </div>

      {/* PRINT VERSION (Simplified for Matrix Printers) */}
      <div className="printable-document font-sans">
        <div className="text-center border-b-4 border-black pb-4 mb-10">
           <h1 className="text-2xl font-black uppercase tracking-tightest mb-2">{statement?.companyName}</h1>
           <p className="text-xs font-black uppercase tracking-widest text-gray-500">{statement?.companyAddress}</p>
           <p className="text-xs font-black uppercase tracking-widest text-gray-500">GSTIN: {statement?.companyGstin}</p>
           <div className="mt-4 py-2 bg-black text-white inline-block px-4 rounded-full text-[10px] font-black uppercase tracking-widest">Master Financial Audit Report</div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-12">
           <div className="space-y-4">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                 <span className="text-[10px] font-black uppercase text-gray-400">Total Credits</span>
                 <span className="text-sm font-black">₹{(totalCredits || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                 <span className="text-[10px] font-black uppercase text-gray-400">Total Debits</span>
                 <span className="text-sm font-black">₹{(totalDebits || 0).toLocaleString()}</span>
              </div>
           </div>
           <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Net Closing Position</p>
              <h2 className="text-3xl font-black  tracking-tightest">₹{Math.abs(statement?.totalBalance || 0).toLocaleString()} <span className="text-xs uppercase font-bold not-">{(statement?.totalBalance || 0) >= 0 ? "Cr" : "Dr"}</span></h2>
           </div>
        </div>

        <table className="erp-table">
           <thead>
              <tr>
                 <th className="text-left">DATE</th>
                 <th className="text-left">NARRATION</th>
                 <th className="text-right">DEBIT</th>
                 <th className="text-right">CREDIT</th>
                 <th className="text-right">BALANCE</th>
              </tr>
           </thead>
           <tbody>
              {statement?.timeline?.map((item, idx) => (
                 <tr key={idx}>
                    <td className="font-bold">{new Date(item.date).toLocaleDateString()}</td>
                    <td>
                       <p className="font-black uppercase  tracking-tighter">{item.description}</p>
                       <p className="text-[8px] text-gray-400">REF: {String(item.ref || "").slice(-10).toUpperCase()}</p>
                    </td>
                    <td className="text-right font-bold">{item.debit > 0 ? item.debit.toLocaleString() : "-"}</td>
                    <td className="text-right font-bold">{item.credit > 0 ? item.credit.toLocaleString() : "-"}</td>
                    <td className="text-right font-black ">{(item.balance || 0).toLocaleString()}</td>
                 </tr>
              ))}
           </tbody>
        </table>
      </div>

    </AppLayout>
  );
};

export default CompanyStatement;
