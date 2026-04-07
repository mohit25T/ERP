import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import { reportsApi } from "../api/erpApi";
import { 
  FileText, 
  Download, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowRightLeft,
  Calendar
} from "lucide-react";

const CompanyStatement = () => {
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatement();
  }, []);

  const fetchStatement = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.getCompanyStatement();
      setStatement(res.data);
    } catch (err) {
      console.error("Failed to fetch company statement", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!statement?.timeline) return;
    const headers = ["Date", "Description", "Debit", "Credit", "Balance"];
    const rows = statement.timeline.map(item => [
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
    link.setAttribute("download", `Company_Statement_${new Date().toLocaleDateString()}.csv`);
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

  const totalCredits = statement?.timeline.reduce((sum, i) => sum + i.credit, 0) || 0;
  const totalDebits = statement?.timeline.reduce((sum, i) => sum + i.debit, 0) || 0;

  return (
    <AppLayout>
      <style>{`
        @media print {
          @page { size: A4; margin: 0.5cm; }
          html, body, #root { height: auto !important; overflow: visible !important; }
          .main-app-content, aside, header { display: none !important; }
          .printable-document { display: block !important; width: 100% !important; background: white !important; color: black !important; }
          table { width: 100% !important; border-collapse: collapse !important; table-layout: auto !important; }
          th, td { border: 1px solid #000 !important; padding: 6px !important; font-size: 8pt !important; word-wrap: break-word !important; }
          th { background: #f3f4f6 !important; }
          tr { page-break-inside: avoid !important; }
        }
        .printable-document { display: none; }
      `}</style>

      {/* PRINT VERSION */}
      <div className="printable-document font-serif">
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold uppercase">{statement?.companyName}</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest">{statement?.companyAddress}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest">GSTIN: {statement?.companyGstin}</p>
            <p className="mt-2 text-[8px] font-bold uppercase tracking-widest text-gray-500">Master Financial Statement</p>
          </div>
          <div className="text-right text-xs">
            <p>Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border border-black p-3">
                <p className="text-[8px] font-bold uppercase mb-1">Total Inflow (Credits)</p>
                <p className="text-lg font-bold">₹{totalCredits.toLocaleString()}</p>
            </div>
            <div className="border border-black p-3">
                <p className="text-[8px] font-bold uppercase mb-1">Total Outflow (Debits)</p>
                <p className="text-lg font-bold">₹{totalDebits.toLocaleString()}</p>
            </div>
            <div className="border border-black p-3 bg-gray-50">
                <p className="text-[8px] font-bold uppercase mb-1">Net Balance</p>
                <p className="text-lg font-bold">₹{statement?.totalBalance.toLocaleString()}</p>
            </div>
        </div>

        <table className="w-full">
            <thead>
                <tr className="text-[10px] uppercase font-bold">
                    <th className="text-left">Date</th>
                    <th className="text-left">Transaction Details</th>
                    <th className="text-right">Debit (₹)</th>
                    <th className="text-right">Credit (₹)</th>
                    <th className="text-right">Balance (₹)</th>
                </tr>
            </thead>
            <tbody>
                {statement?.timeline.map((item, idx) => (
                    <tr key={idx} className="text-[10px]">
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                        <td>
                            <p className="font-bold uppercase">{item.description}</p>
                            <p className="text-[8px] text-gray-500 italic">REF: {String(item.ref).slice(-8).toUpperCase()}</p>
                        </td>
                        <td className="text-right">{item.debit > 0 ? item.debit.toLocaleString() : "-"}</td>
                        <td className="text-right">{item.credit > 0 ? item.credit.toLocaleString() : "-"}</td>
                        <td className="text-right font-bold">{item.balance.toLocaleString()} {item.balance >= 0 ? "Cr" : "Dr"}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* WEB VERSION */}
      <div className="main-app-content space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight italic flex items-center gap-3">
               <div className="p-3 bg-gray-900 text-white rounded-2xl shadow-xl shadow-gray-200">
                  <ArrowRightLeft className="w-8 h-8" />
               </div>
               Full Company Statement
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 ml-16 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Official Record for {statement?.companyName}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => window.print()} className="px-6 py-3 bg-white border border-gray-100 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm">
                <Printer className="w-4 h-4" /> Print Statement
             </button>
             <button onClick={handleExport} className="px-6 py-3 bg-gray-900 text-white rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-200">
                <Download className="w-4 h-4" /> Export CSV
             </button>
          </div>
        </div>

        {/* Master Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <TrendingUp className="w-16 h-16 text-green-600" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Credit Inflow</p>
              <h3 className="text-3xl font-black italic tracking-tighter text-green-600">₹{totalCredits.toLocaleString()}</h3>
           </div>
           <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <TrendingDown className="w-16 h-16 text-red-600" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Debit Outflow</p>
              <h3 className="text-3xl font-black italic tracking-tighter text-red-600">₹{totalDebits.toLocaleString()}</h3>
           </div>
           <div className={`p-8 rounded-[2.5rem] border shadow-sm relative overflow-hidden group transition-all ${statement?.totalBalance >= 0 ? "bg-blue-600 border-blue-500 shadow-blue-500/10" : "bg-red-600 border-red-500 shadow-red-500/10"}`}>
              <div className="absolute top-0 right-0 p-8 opacity-20">
                 <Wallet className="w-16 h-16 text-white" />
              </div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Net Master Balance</p>
              <h3 className="text-3xl font-black italic tracking-tighter text-white">₹{Math.abs(statement?.totalBalance).toLocaleString()} <span className="text-xs uppercase">{statement?.totalBalance >= 0 ? "Cr" : "Dr"}</span></h3>
           </div>
        </div>

        {/* Master Table */}
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                       <th className="px-8 py-5">Posting Date</th>
                       <th className="px-8 py-5">Transaction Summary</th>
                       <th className="px-8 py-5 text-right">Debit (₹)</th>
                       <th className="px-8 py-5 text-right">Credit (₹)</th>
                       <th className="px-8 py-5 text-right pr-12">Running Balance</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 uppercase tracking-tight">
                    {statement?.timeline.map((item, idx) => (
                       <tr key={idx} className="hover:bg-gray-50/30 transition-colors group">
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-gray-300" />
                                <span className="text-xs font-black text-gray-900 italic tracking-tight">{new Date(item.date).toLocaleDateString()}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 max-w-md">
                             <p className="text-xs font-bold text-gray-700 truncate">{item.description}</p>
                             <span className="text-[9px] font-black text-gray-300 tracking-widest">REF: {String(item.ref).slice(-8).toUpperCase()}</span>
                          </td>
                          <td className="px-8 py-6 text-right tabular-nums text-red-600 font-bold">
                             {item.debit > 0 ? `₹${item.debit.toLocaleString()}` : "-"}
                          </td>
                          <td className="px-8 py-6 text-right tabular-nums text-green-600 font-bold">
                             {item.credit > 0 ? `₹${item.credit.toLocaleString()}` : "-"}
                          </td>
                          <td className="px-8 py-6 text-right pr-12">
                             <span className={`text-sm font-black tabular-nums italic ${item.balance >= 0 ? "text-blue-600" : "text-red-900"}`}>
                                ₹{Math.abs(item.balance).toLocaleString()}
                                <span className="text-[10px] ml-1 uppercase">{item.balance >= 0 ? "Cr" : "Dr"}</span>
                             </span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CompanyStatement;
