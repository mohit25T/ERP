import { useState, useEffect } from "react";
import { reportsApi, ledgerApi } from "../api/erpApi";
import AppLayout from "../components/layout/AppLayout.jsx";
import HammerLoader from "../components/common/HammerLoader";
import { 
  Box as FileBox, Calendar, Globe, TrendingUp, Activity, Scale, 
  ShieldCheck, Building2, TrendingDown, Download, PieChart, Zap
} from "lucide-react";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const exportCSV = (data, filename) => {
  if (!data || data.length === 0) return alert("No data available to export");
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(obj => Object.values(obj).map(val => `"${val || ''}"`).join(","));
  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${new Date().toLocaleDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const Reports = () => {
  const [gstr1, setGstr1] = useState(null);
  const [gstr3b, setGstr3b] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReports();
  }, [selectedMonth, selectedYear]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [r1, r3b, bs] = await Promise.all([
        reportsApi.getGSTR1(selectedMonth, selectedYear),
        reportsApi.getGSTR3B(selectedMonth, selectedYear),
        reportsApi.getBalanceSheet()
      ]);
      setGstr1(r1.data);
      setGstr3b(r3b.data);
      setBalanceSheet(bs.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportLedger = async () => {
    try {
      setExportLoading(true);
      const res = await ledgerApi.getAll();
      const flatData = res.data.map(item => ({
        Date: new Date(item.date).toLocaleDateString(),
        Type: item.type,
        Category: item.category,
        Amount: item.amount,
        Taxable: item.taxableAmount,
        GST: item.taxAmount,
        Description: item.description,
        Is_B2B: item.isB2B,
        GSTIN: item.gstin || 'N/A'
      }));
      exportCSV(flatData, "Global_ERp_Ledger");
    } catch (err) {
      alert("Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDaybookExport = async () => {
    try {
      setExportLoading(true);
      const res = await ledgerApi.getAll();
      const filtered = res.data.filter(item => {
        const d = new Date(item.date);
        return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
      });
      const flatData = filtered.map(item => ({
        Date: new Date(item.date).toLocaleDateString(),
        Type: item.type,
        Category: item.category,
        Amount: item.amount,
        Description: item.description
      }));
      exportCSV(flatData, `Analytical_Daybook_${months[selectedMonth-1]}`);
    } catch (err) {
      alert("Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  if (loading && !gstr1) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <HammerLoader />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-8 animate-pulse">Calibrating Regulatory Datasets...</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-6">
           <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-slate-900 rounded-md flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-xl border border-slate-800">
                 <PieChart className="w-7 h-7 text-white" />
              </div>
              <div>
                 <h2 className="text-4xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Intelligence <span className="text-primary not-italic">Terminal</span></h2>
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Statutory Compliance, GST Filing, and Financial Analytics</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-md border border-slate-100 shadow-sm">
                 <Calendar className="w-4 h-4 text-slate-400" />
                 <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-[10px] font-black text-slate-900 uppercase tracking-widest outline-none cursor-pointer">
                    {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                 </select>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-md border border-slate-100 shadow-sm">
                 <Globe className="w-4 h-4 text-slate-400" />
                 <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent text-[10px] font-black text-slate-900 uppercase tracking-widest outline-none cursor-pointer">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           <div className="lg:col-span-7 space-y-8">
              {/* GSTR-1 OUTWARD SUPPLIES */}
              <div className="bg-white rounded-md p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp className="w-16 h-16 text-indigo-600" /></div>
                 <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center text-white"><TrendingUp className="w-6 h-6" /></div>
                       <div>
                         <h4 className="text-xl font-black text-slate-900 italic tracking-tightest">GSTR-1 Outward Supplies</h4>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregated Sales & Output Tax Analysis</p>
                       </div>
                    </div>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md text-[9px] font-black uppercase tracking-[0.2em]">Validated</span>
                 </div>

                 <div className="grid grid-cols-2 gap-10 mb-10">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">B2B Core Transactions</p>
                       <h3 className="text-3xl font-black text-slate-900 italic tracking-tightest">₹{gstr1?.b2b?.taxableValue.toLocaleString() || '0'}</h3>
                       <div className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 w-fit px-3 py-1 rounded-md mt-4">
                          <span>{gstr1?.b2b?.count || 0} Invoices Registry</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">B2C Retail Flux</p>
                       <h3 className="text-3xl font-black text-slate-900 italic tracking-tightest">₹{gstr1?.b2c?.taxableValue.toLocaleString() || '0'}</h3>
                       <div className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 w-fit px-3 py-1 rounded-md mt-4">
                          <span>{gstr1?.b2c?.count || 0} Unified Registry</span>
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-900 rounded-md flex items-center justify-between border border-slate-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Zap className="w-12 h-12 text-white" /></div>
                    <div className="relative z-10">
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Output Tax Liability</p>
                       <h3 className="text-3xl font-black text-white italic tracking-tightest">₹{((gstr1?.b2b?.taxAmount || 0) + (gstr1?.b2c?.taxAmount || 0)).toLocaleString() || '0'}</h3>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center text-white"><Activity className="w-6 h-6" /></div>
                 </div>
              </div>

              {/* GSTR-3B TAX OFFSET */}
              <div className="bg-white rounded-md p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                 <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-50">
                    <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center text-white"><Scale className="w-6 h-6" /></div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 italic tracking-tightest">GSTR-3B Fiscal Offset</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Input Tax Credit vs Output Liability Calibration</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="p-6 bg-emerald-50/50 rounded-md border border-emerald-100 shadow-sm relative overflow-hidden">
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Available ITC (Inward)</p>
                       <h3 className="text-2xl font-black text-emerald-700 italic tracking-tightest">₹{gstr3b?.inward?.taxAmount.toLocaleString() || '0'}</h3>
                    </div>
                    <div className="p-6 bg-rose-50/50 rounded-md border border-rose-100 shadow-sm relative overflow-hidden">
                       <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3">Output Liability (Outward)</p>
                       <h3 className="text-2xl font-black text-rose-700 italic tracking-tightest">₹{gstr3b?.outward?.taxAmount.toLocaleString() || '0'}</h3>
                    </div>
                 </div>

                 <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50 border border-slate-100 rounded-md">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Fiscal Payable</p>
                       <h3 className="text-4xl font-black text-slate-900 italic tracking-tightest">₹{Math.max(0, gstr3b?.netPayable || 0).toLocaleString()}</h3>
                    </div>
                    <div className={`px-6 py-3 rounded-md text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-sm ${gstr3b?.netPayable < 0 ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-slate-900 text-white shadow-slate-900/20'}`}>
                       {gstr3b?.netPayable < 0 ? <ShieldCheck className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                       {gstr3b?.netPayable < 0 ? "Excess ITC Shield Active" : "Payment Protocol Required"}
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-5 space-y-8">
              {/* BALANCE SHEET */}
              <div className="bg-white rounded-md p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                 <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-50">
                     <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center text-white"><Building2 className="w-6 h-6" /></div>
                     <div>
                        <h4 className="text-xl font-black text-slate-900 italic tracking-tightest">Balance Sheet</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Financial Position Snapshot</p>
                     </div>
                 </div>
                 
                 <div className="space-y-8">
                    {/* ASSETS */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                             <TrendingUp className="w-4 h-4 text-emerald-500" />
                             Asset Matrix
                          </span>
                          <span className="text-2xl font-black text-slate-900 italic tracking-tightest">₹{balanceSheet?.assets?.total?.toLocaleString() || '0'}</span>
                       </div>
                       <div className="space-y-3 px-6 py-5 bg-slate-50/50 rounded-md border border-slate-100">
                          {[
                            { label: "Cash & Treasury Bank", val: balanceSheet?.assets?.cashAndBank },
                            { label: "Accounts Receivable Flow", val: balanceSheet?.assets?.receivables },
                            { label: "Inventory Asset Value", val: balanceSheet?.assets?.inventory }
                          ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                               <span className="text-sm font-black text-slate-900 italic tracking-tighter">₹{item.val?.toLocaleString() || '0'}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* LIABILITIES */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                             <TrendingDown className="w-4 h-4 text-rose-500" />
                             Liability Matrix
                          </span>
                          <span className="text-2xl font-black text-slate-900 italic tracking-tightest">₹{balanceSheet?.liabilities?.total?.toLocaleString() || '0'}</span>
                       </div>
                       <div className="space-y-3 px-6 py-5 bg-slate-50/50 rounded-md border border-slate-100">
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accounts Payable Flow</span>
                             <span className="text-sm font-black text-slate-900 italic tracking-tighter">₹{balanceSheet?.liabilities?.payables?.toLocaleString() || '0'}</span>
                          </div>
                       </div>
                    </div>

                    {/* EQUITY */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                       <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Aggregate Equity</span>
                       <span className="text-3xl font-black text-indigo-600 italic tracking-tightest">₹{balanceSheet?.equity?.toLocaleString() || '0'}</span>
                    </div>
                 </div>
              </div>

              {/* ACTION MATRIX */}
              <div className="grid grid-cols-2 gap-6">
                 <button onClick={handleExportLedger} disabled={exportLoading} className="p-8 bg-white rounded-md border border-slate-100 shadow-sm text-center hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-4 group">
                    <div className="w-14 h-14 bg-slate-900 rounded-md flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                       <Download className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Export Ledger</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Global CSV Dataset</p>
                    </div>
                 </button>
                 <button onClick={handleDaybookExport} disabled={exportLoading} className="p-8 bg-white rounded-md border border-slate-100 shadow-sm text-center hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-4 group">
                    <div className="w-14 h-14 bg-slate-900 rounded-md flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                       <PieChart className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Export Daybook</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Monthly Temporal summary</p>
                    </div>
                 </button>
              </div>

           </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
