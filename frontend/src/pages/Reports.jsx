import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import { reportsApi, ledgerApi } from "../api/erpApi";
import { 
  FileBox, BarChart3, PieChart, FileText, ArrowUpRight, ArrowDownRight, 
  Scale, Calendar, Layers, ShieldCheck, Building2, Wallet, 
  Download, Activity, Zap, Search, Filter, Database, TrendingUp, TrendingDown,
  ChevronRight, Globe, Lock
} from "lucide-react";

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

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (loading && !gstr1) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Calibrating Regulatory Datasets...</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Elite Intelligence Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-xl border border-indigo-500">
                 <FileBox className="w-10 h-10 text-white" />
              </div>
              <div>
                 <h2 className="text-5xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Predictive <span className="text-slate-400 not-italic">Intelligence</span></h2>
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Statutory Compliance Dashboard & Fiscal Audit Hub</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-3 bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-sm shadow-slate-200/50">
              <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                 <Calendar className="w-4 h-4 text-indigo-600" />
                 <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-[10px] font-black uppercase text-slate-900 outline-none cursor-pointer tracking-widest">
                    {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                 </select>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                 <Globe className="w-4 h-4 text-indigo-600" />
                 <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent text-[10px] font-black uppercase text-slate-900 outline-none cursor-pointer tracking-widest">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           
           <div className="lg:col-span-7 space-y-8">
              {/* GSTR-1 OUTWARD SUPPLIES */}
              <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"><BarChart3 className="w-40 h-40 text-indigo-600 translate-x-10 -translate-y-10" /></div>
                 
                 <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><TrendingUp className="w-5 h-5" /></div>
                       <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">GSTR-1: Outward Logistics Yield</h4>
                    </div>
                    <div className="px-4 py-1.5 bg-indigo-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest italic">Live Regulation</div>
                 </div>

                 <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">B2B Core Supplies</p>
                       <h3 className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums italic">₹{gstr1?.b2b?.taxableValue.toLocaleString()}</h3>
                       <div className="flex items-center gap-3 text-[10px] font-black text-indigo-600 uppercase tracking-tighter">
                          <span className="bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg shadow-sm shadow-indigo-500/5">{gstr1?.b2b?.count} ANALYTICAL NODES</span>
                          <span className="text-slate-300">|</span>
                          <span>₹{gstr1?.b2b?.taxAmount.toLocaleString()} GST REVENUE</span>
                       </div>
                    </div>
                    <div className="space-y-2 text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">B2C Retail Flux</p>
                       <h3 className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums italic">₹{gstr1?.b2c?.taxableValue.toLocaleString()}</h3>
                       <div className="flex items-center justify-end gap-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          <span className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg">{gstr1?.b2c?.count} ANALYTICAL NODES</span>
                          <span className="text-slate-200">|</span>
                          <span>₹{gstr1?.b2c?.taxAmount.toLocaleString()} GST REVENUE</span>
                       </div>
                    </div>
                 </div>

                 <div className="mt-12 p-8 bg-indigo-600 rounded-[2.5rem] flex items-center justify-between text-white shadow-2xl shadow-indigo-600/30 group-hover:bg-slate-900 transition-colors duration-500">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 italic">Total Output Tax Liability</p>
                       <h3 className="text-4xl font-black italic tracking-tightest">₹{(gstr1?.b2b?.taxAmount + gstr1?.b2c?.taxAmount).toLocaleString()}</h3>
                    </div>
                    <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20"><Activity className="w-8 h-8 text-white animate-pulse" /></div>
                 </div>
              </div>

              {/* GSTR-3B TAX OFFSET */}
              <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
                 <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600"><Scale className="w-5 h-5" /></div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">GSTR-3B: Equilibrium Offset</h4>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 transition-transform group-hover:scale-[1.02] duration-500">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Input Credit (ITC Delta)</p>
                       <div className="flex items-end gap-2">
                          <h3 className="text-3xl font-black text-emerald-600 tracking-tightest tabular-nums italic">₹{gstr3b?.inward?.taxAmount.toLocaleString()}</h3>
                          <span className="text-[10px] font-black text-slate-300 uppercase mb-1">Inward Flux</span>
                       </div>
                       <div className="h-2 w-full bg-slate-200 rounded-full mt-6 overflow-hidden"><div className="h-full bg-emerald-500 w-[70%]"></div></div>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 transition-transform group-hover:scale-[1.02] duration-500 delay-75">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Liability Capture (Output)</p>
                       <div className="flex items-end gap-2">
                          <h3 className="text-3xl font-black text-rose-600 tracking-tightest tabular-nums italic">₹{gstr3b?.outward?.taxAmount.toLocaleString()}</h3>
                          <span className="text-[10px] font-black text-slate-300 uppercase mb-1">Outward Flux</span>
                       </div>
                       <div className="h-2 w-full bg-slate-200 rounded-full mt-6 overflow-hidden"><div className="h-full bg-rose-500 w-[50%]"></div></div>
                    </div>
                 </div>

                 <div className="mt-10 border-t border-slate-50 pt-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                       <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3">Adjusted Cash Liability</h5>
                       <p className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums italic underline decoration-slate-200 decoration-8 underline-offset-4 decoration-transparent hover:decoration-slate-200 transition-all">₹{Math.max(0, gstr3b?.netPayable).toLocaleString()}</p>
                    </div>
                    <div className={`px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic shadow-xl shadow-slate-200/50 flex items-center gap-3 ${gstr3b?.netPayable < 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                       {gstr3b?.netPayable < 0 ? <Zap className="w-4 h-4" /> : <Activity className="w-4 h-4 animate-pulse" />}
                       {gstr3b?.netPayable < 0 ? "Excess ITC Protcol Active" : "Disbursement Readiness Confirmed"}
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-5 space-y-8">
              {/* MASTER POSITION CARD */}
              <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                       <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20"><Building2 className="w-6 h-6 text-white" /></div>
                       <div>
                          <h4 className="text-xl font-black tracking-tighter italic leading-none mb-1">Position Analysis</h4>
                          <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Global Asset Ledger</p>
                       </div>
                    </div>
                    
                    <div className="space-y-12">
                       {/* ASSETS */}
                       <div className="space-y-6">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Operational Assets</span>
                             </div>
                             <span className="text-2xl font-black italic tracking-tightest">₹{balanceSheet?.assets?.total.toLocaleString()}</span>
                          </div>
                          <div className="space-y-4 px-6 border-l border-white/10">
                             {[
                               { label: "Treasury (Cash/Bank)", val: balanceSheet?.assets?.cashAndBank },
                               { label: "Account Receivables", val: balanceSheet?.assets?.receivables },
                               { label: "Inventory Mass Value", val: balanceSheet?.assets?.inventory }
                             ].map((item, i) => (
                               <div key={i} className="flex justify-between items-center group/item cursor-default">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-white/30 group-hover/item:text-white/60 transition-colors uppercase italic">{item.label}</span>
                                  <span className="text-sm font-black italic tabular-nums">₹{item.val.toLocaleString()}</span>
                               </div>
                             ))}
                          </div>
                       </div>

                       {/* LIABILITIES */}
                       <div className="space-y-6">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-rose-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Aggregated Liabilities</span>
                             </div>
                             <span className="text-2xl font-black italic tracking-tightest">₹{balanceSheet?.liabilities?.total.toLocaleString()}</span>
                          </div>
                          <div className="space-y-4 px-6 border-l border-rose-500/20">
                             <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">Strategic Payables</span>
                                <span className="text-sm font-black italic tabular-nums">₹{balanceSheet?.liabilities?.payables.toLocaleString()}</span>
                             </div>
                          </div>
                       </div>

                       {/* EQUITY */}
                       <div className="pt-10 border-t border-white/10 relative group/equity">
                          <div className="absolute top-0 right-0 w-20 h-px bg-gradient-to-r from-transparent to-indigo-500"></div>
                          <div className="flex items-end justify-between">
                             <div>
                                <p className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-3">Equity Nucleus</p>
                                <h3 className="text-5xl font-black italic tracking-tightest text-white drop-shadow-2xl">₹{balanceSheet?.equity.toLocaleString()}</h3>
                             </div>
                             <div className="mb-2 p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl group-hover/equity:scale-125 transition-transform"><ShieldCheck className="w-6 h-6 text-emerald-400 shadow-sm" /></div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="absolute top-1/2 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-10 translate-x-1/2 pointer-events-none"></div>
                 <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-emerald-600 rounded-full blur-[100px] opacity-5 -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
              </div>

              {/* ANALYTICAL ACTION MATRIX */}
              <div className="grid grid-cols-2 gap-6">
                 <button onClick={handleExportLedger} disabled={exportLoading} className="relative group p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden text-center hover:border-indigo-200 transition-all active:scale-95 disabled:opacity-50">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform"></div>
                    <Download className="w-10 h-10 text-slate-200 mb-6 mx-auto group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                    <p className="text-[11px] font-black uppercase text-slate-900 tracking-widest italic">{exportLoading ? "Capturing Flux..." : "Master Ledger Dataset"}</p>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Global CSV Archive</p>
                 </button>
                 <button onClick={handleDaybookExport} disabled={exportLoading} className="relative group p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden text-center hover:border-emerald-200 transition-all active:scale-95 disabled:opacity-50">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform"></div>
                    <PieChart className="w-10 h-10 text-slate-200 mb-6 mx-auto group-hover:text-emerald-600 group-hover:scale-110 transition-all" />
                    <p className="text-[11px] font-black uppercase text-slate-900 tracking-widest italic">{exportLoading ? "Isolating Temporal..." : "Temporal Phase Analysis"}</p>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Consolidated Daybook</p>
                 </button>
              </div>

              {/* ACCESS LOG */}
              <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-between group cursor-help">
                 <div className="flex items-center gap-4">
                    <Lock className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Registry Access Policy: <span className="text-slate-900">SYSTEM_ADMIN_LEVEL_0</span></span>
                 </div>
                 <Database className="w-5 h-5 text-slate-200 group-hover:text-indigo-600 transition-colors" />
              </div>
           </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
