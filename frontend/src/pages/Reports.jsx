import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import { reportsApi } from "../api/erpApi";
import { 
  FileBox, 
  BarChart3, 
  PieChart, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  Scale, 
  Calendar,
  Layers,
  ShieldCheck,
  Building2,
  Wallet
} from "lucide-react";

const Reports = () => {
  const [gstr1, setGstr1] = useState(null);
  const [gstr3b, setGstr3b] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
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
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  if (loading && !gstr1) return (
    <AppLayout>
       <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse text-blue-600 font-black italic tracking-widest text-2xl uppercase">Analyzing Audit Data...</div>
       </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      {/* Header & Global Filters */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight italic flex items-center gap-3">
            <span className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
              <FileBox className="w-8 h-8" />
            </span>
            Statutory Reports
          </h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 ml-14">Audit & GST Compliance Dashboard</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm">
           <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
              <Calendar className="w-4 h-4 text-blue-600" />
              <select 
                className="bg-transparent text-xs font-black uppercase text-gray-900 outline-none cursor-pointer"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                 {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
              </select>
           </div>
           <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
              <Calendar className="w-4 h-4 text-blue-600" />
              <select 
                className="bg-transparent text-xs font-black uppercase text-gray-900 outline-none cursor-pointer"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                 {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* TOP ROW: GST SUMMARIES */}
        <div className="lg:col-span-7 col-span-1 space-y-8">
           {/* GSTR-1 SECTION */}
           <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 text-blue-50/20 group-hover:text-blue-100 transition-colors pointer-events-none">
                 <BarChart3 className="w-32 h-32" />
              </div>
              
              <div className="flex items-center gap-2 mb-8">
                 <ShieldCheck className="w-5 h-5 text-blue-600" />
                 <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">GSTR-1: Outward Supplies</h4>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">B2B Sales (In-State/Interstate)</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tighter italic">₹{gstr1?.b2b?.taxableValue.toLocaleString()}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600">
                       <span className="bg-blue-50 px-2 py-0.5 rounded-full">{gstr1?.b2b?.count} INVOICES</span>
                       <span>₹{gstr1?.b2b?.taxAmount.toLocaleString()} GST</span>
                    </div>
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">B2C Sales (General Consumers)</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tighter italic">₹{gstr1?.b2c?.taxableValue.toLocaleString()}</p>
                    <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-gray-400">
                       <span className="bg-gray-50 px-2 py-0.5 rounded-full">{gstr1?.b2c?.count} INVOICES</span>
                       <span>₹{gstr1?.b2c?.taxAmount.toLocaleString()} GST</span>
                    </div>
                 </div>
              </div>

              <div className="mt-10 p-5 bg-blue-600 rounded-[2rem] flex items-center justify-between text-white shadow-xl shadow-blue-500/20">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Outward Liability</p>
                    <h3 className="text-2xl font-black italic tracking-tight">₹{(gstr1?.b2b?.taxAmount + gstr1?.b2c?.taxAmount).toLocaleString()}</h3>
                 </div>
                 <ArrowUpRight className="w-8 h-8 opacity-40 shrink-0" />
              </div>
           </div>

           {/* GSTR-3B SECTION */}
           <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-8">
                 <Scale className="w-5 h-5 text-indigo-600" />
                 <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">GSTR-3B: Monthly Tax Offset</h4>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                 <div className="flex-1 p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100/50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Input Tax Credit (ITC)</p>
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-2xl font-black text-green-600 italic tracking-tighter">₹{gstr3b?.inward?.taxAmount.toLocaleString()}</h3>
                       <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Purchases</span>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-2 font-bold italic">Eligible for adjustment</p>
                 </div>
                 <div className="flex-1 p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100/50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tax Payable (Output)</p>
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-2xl font-black text-red-600 italic tracking-tighter">₹{gstr3b?.outward?.taxAmount.toLocaleString()}</h3>
                       <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Sales</span>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-2 font-bold italic">Mandatory liability</p>
                 </div>
              </div>

              <div className="mt-8 border-t border-dashed border-gray-100 pt-8 flex items-center justify-between">
                 <div>
                    <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Net Cash Liability</h5>
                    <p className="text-3xl font-black text-gray-900 tracking-tighter italic">₹{Math.max(0, gstr3b?.netPayable).toLocaleString()}</p>
                 </div>
                 <div className="text-right">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic ${gstr3b?.netPayable < 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                       {gstr3b?.netPayable < 0 ? "Exess ITC Carried Forward" : "Ready for Disbursement"}
                    </span>
                 </div>
              </div>
           </div>
        </div>

        {/* SIDE COLUMN: BALANCE SHEET */}
        <div className="lg:col-span-5 col-span-1 space-y-8">
           <div className="bg-gray-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                 <h4 className="text-xl font-black tracking-tight italic mb-1">Position Analysis</h4>
                 <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-8">Consolidated Balance Sheet</p>
                 
                 <div className="space-y-8">
                    {/* ASSETS */}
                    <div>
                       <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Assets</span>
                          <span className="text-xl font-black italic tracking-tighter">₹{balanceSheet?.assets?.total.toLocaleString()}</span>
                       </div>
                       <div className="space-y-3 px-2">
                          <div className="flex justify-between items-center opacity-70">
                             <span className="text-[9px] font-bold uppercase tracking-widest">Cash & Bank</span>
                             <span className="text-xs font-black">₹{balanceSheet?.assets?.cashAndBank.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center opacity-70">
                             <span className="text-[9px] font-bold uppercase tracking-widest">Account Receivables</span>
                             <span className="text-xs font-black">₹{balanceSheet?.assets?.receivables.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center opacity-70">
                             <span className="text-[9px] font-bold uppercase tracking-widest">Inventory Value</span>
                             <span className="text-xs font-black">₹{balanceSheet?.assets?.inventory.toLocaleString()}</span>
                          </div>
                       </div>
                    </div>

                    {/* LIABILITIES */}
                    <div>
                       <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Liabilities</span>
                          <span className="text-xl font-black italic tracking-tighter">₹{balanceSheet?.liabilities?.total.toLocaleString()}</span>
                       </div>
                       <div className="space-y-3 px-2">
                          <div className="flex justify-between items-center opacity-70">
                             <span className="text-[9px] font-bold uppercase tracking-widest">Accounts Payable</span>
                             <span className="text-xs font-black">₹{balanceSheet?.liabilities?.payables.toLocaleString()}</span>
                          </div>
                       </div>
                    </div>

                    {/* EQUITY */}
                    <div className="pt-6 border-t font-black border-blue-500/30">
                       <div className="flex items-center justify-between text-blue-400">
                          <span className="text-[10px] uppercase tracking-widest">Net Equity (Capital)</span>
                          <span className="text-3xl italic tracking-tighter">₹{balanceSheet?.equity.toLocaleString()}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-10 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
           </div>

           {/* Quick Export Cards */}
           <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                 <FileText className="w-6 h-6 text-gray-400 mb-2 group-hover:text-blue-600 transition-colors" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Export Ledger</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                 <PieChart className="w-6 h-6 text-gray-400 mb-2 group-hover:text-blue-600 transition-colors" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Daybook Analysis</span>
              </button>
           </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
