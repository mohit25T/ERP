import { useState, useEffect } from "react";
import { reportsApi, ledgerApi } from "../api/erpApi";
import AppLayout from "../components/layout/AppLayout.jsx";
import { 
  Box as FileBox, Calendar, Globe, TrendingUp, Activity, Scale, 
  ShieldCheck, Building2, TrendingDown, Download, PieChart
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
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Calibrating Regulatory Datasets...</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-6 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                 <FileBox className="w-6 h-6 text-primary" />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Reports & Analytics</h2>
                 <p className="text-sm font-medium text-slate-500">Statutory compliance, GST filing, and financial overview</p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                 <Calendar className="w-4 h-4 text-slate-400" />
                 <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer">
                    {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                 </select>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                 <Globe className="w-4 h-4 text-slate-400" />
                 <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           
           <div className="lg:col-span-7 space-y-6">
              {/* GSTR-1 OUTWARD SUPPLIES */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                 <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><TrendingUp className="w-5 h-5" /></div>
                       <div>
                         <h4 className="text-base font-bold text-slate-900">GSTR-1 Outward Supplies</h4>
                         <p className="text-xs font-medium text-slate-500">Sales and output tax</p>
                       </div>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold uppercase tracking-wider">Computed</span>
                 </div>

                 <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">B2B Sales</p>
                       <h3 className="text-3xl font-bold text-slate-900">₹{gstr1?.b2b?.taxableValue.toLocaleString() || '0'}</h3>
                       <div className="flex gap-2 text-xs font-semibold text-slate-500 mt-2">
                          <span className="text-indigo-600">{gstr1?.b2b?.count || 0} Invoices</span>
                          <span>•</span>
                          <span>₹{gstr1?.b2b?.taxAmount.toLocaleString() || '0'} GST</span>
                       </div>
                    </div>
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">B2C Sales</p>
                       <h3 className="text-3xl font-bold text-slate-900">₹{gstr1?.b2c?.taxableValue.toLocaleString() || '0'}</h3>
                       <div className="flex gap-2 text-xs font-semibold text-slate-500 mt-2">
                          <span className="text-indigo-600">{gstr1?.b2c?.count || 0} Invoices</span>
                          <span>•</span>
                          <span>₹{gstr1?.b2c?.taxAmount.toLocaleString() || '0'} GST</span>
                       </div>
                    </div>
                 </div>

                 <div className="p-5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
                    <div>
                       <p className="text-sm font-semibold text-slate-600 mb-1">Total Output Tax Liability</p>
                       <h3 className="text-2xl font-bold text-slate-900">₹{((gstr1?.b2b?.taxAmount || 0) + (gstr1?.b2c?.taxAmount || 0)).toLocaleString() || '0'}</h3>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600"><Activity className="w-6 h-6" /></div>
                 </div>
              </div>

              {/* GSTR-3B TAX OFFSET */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600"><Scale className="w-5 h-5" /></div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">GSTR-3B Offset</h4>
                      <p className="text-xs font-medium text-slate-500">Input Tax Credit vs Output Liability</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Available ITC</p>
                       <h3 className="text-2xl font-bold text-emerald-600">₹{gstr3b?.inward?.taxAmount.toLocaleString() || '0'}</h3>
                       <p className="text-xs font-medium text-slate-400 mt-1">From Purchases</p>
                    </div>
                    <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Output Liability</p>
                       <h3 className="text-2xl font-bold text-rose-600">₹{gstr3b?.outward?.taxAmount.toLocaleString() || '0'}</h3>
                       <p className="text-xs font-medium text-slate-400 mt-1">From Sales</p>
                    </div>
                 </div>

                 <div className="p-5 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                       <p className="text-sm font-semibold text-slate-600 mb-1">Net Cash Payable</p>
                       <h3 className="text-3xl font-bold text-slate-900">₹{Math.max(0, gstr3b?.netPayable || 0).toLocaleString()}</h3>
                    </div>
                    <div className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${gstr3b?.netPayable < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                       {gstr3b?.netPayable < 0 ? <ShieldCheck className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                       {gstr3b?.netPayable < 0 ? "Excess ITC Available" : "Payment Required"}
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-5 space-y-6">
              {/* BALANCE SHEET */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                     <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center"><Building2 className="w-5 h-5 text-slate-700" /></div>
                     <div>
                        <h4 className="text-base font-bold text-slate-900">Balance Sheet</h4>
                        <p className="text-xs font-medium text-slate-500">Financial Position</p>
                     </div>
                 </div>
                 
                 <div className="space-y-6">
                    {/* ASSETS */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                             <TrendingUp className="w-4 h-4 text-emerald-500" />
                             Assets
                          </span>
                          <span className="text-lg font-bold text-slate-900">₹{balanceSheet?.assets?.total?.toLocaleString() || '0'}</span>
                       </div>
                       <div className="space-y-2 px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
                          {[
                            { label: "Cash & Bank", val: balanceSheet?.assets?.cashAndBank },
                            { label: "Accounts Receivable", val: balanceSheet?.assets?.receivables },
                            { label: "Inventory Value", val: balanceSheet?.assets?.inventory }
                          ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center">
                               <span className="text-xs font-medium text-slate-600">{item.label}</span>
                               <span className="text-sm font-semibold text-slate-800">₹{item.val?.toLocaleString() || '0'}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* LIABILITIES */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                             <TrendingDown className="w-4 h-4 text-rose-500" />
                             Liabilities
                          </span>
                          <span className="text-lg font-bold text-slate-900">₹{balanceSheet?.liabilities?.total?.toLocaleString() || '0'}</span>
                       </div>
                       <div className="space-y-2 px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-medium text-slate-600">Accounts Payable</span>
                             <span className="text-sm font-semibold text-slate-800">₹{balanceSheet?.liabilities?.payables?.toLocaleString() || '0'}</span>
                          </div>
                       </div>
                    </div>

                    {/* EQUITY */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                       <span className="text-sm font-bold text-indigo-700">Total Equity</span>
                       <span className="text-xl font-bold text-indigo-700">₹{balanceSheet?.equity?.toLocaleString() || '0'}</span>
                    </div>
                 </div>
              </div>

              {/* ACTION MATRIX */}
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={handleExportLedger} disabled={exportLoading} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center hover:border-primary/30 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-3">
                    <Download className="w-8 h-8 text-slate-400" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Export Ledger</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">Global CSV</p>
                    </div>
                 </button>
                 <button onClick={handleDaybookExport} disabled={exportLoading} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center hover:border-primary/30 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-3">
                    <PieChart className="w-8 h-8 text-slate-400" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Export Daybook</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">Monthly summary</p>
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
