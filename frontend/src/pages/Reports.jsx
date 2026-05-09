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
   if (!data || data.length === 0) return alert("No data available to export. Ensure you have recorded payments or ledger entries first.");
   const headers = Object.keys(data[0]).join(",");
   const rows = data.map(obj => Object.values(obj).map(val => `"${val || ''}"`).join(","));
   const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
   const encodedUri = encodeURI(csvContent);
   const link = document.createElement("a");
   link.setAttribute("href", encodedUri);
   link.setAttribute("download", `${filename}_${formatDate(new Date())}.csv`);
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
            Date: formatDate(item.date),
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
            Date: formatDate(item.date),
            Type: item.type,
            Category: item.category,
            Amount: item.amount,
            Description: item.description
         }));
         exportCSV(flatData, `Analytical_Daybook_${months[selectedMonth - 1]}`);
      } catch (err) {
         alert("Export failed");
      } finally {
         setExportLoading(false);
      }
   };

   if (loading && !gstr1) return (
      <AppLayout>
         <div className="flex flex-col items-center justify-center h-[60vh]">
            <HammerLoader />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-4 animate-pulse">Loading reports...</p>
         </div>
      </AppLayout>
   );

   return (
      <AppLayout>
         <div className="space-y-4 pb-10">

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded flex items-center justify-center shadow-lg">
                     <PieChart className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-foreground tracking-tight uppercase leading-none mb-1">Business Reports</h2>
                     <div className="flex items-center gap-2 print:hidden">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none opacity-70">GST and Tax Details</span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-2 print:hidden">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded border border-border">
                     <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                     <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-[10px] font-bold text-foreground uppercase tracking-widest outline-none cursor-pointer">
                        {months.map((m, i) => <option key={m} value={i + 1} className="bg-card">{m}</option>)}
                     </select>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded border border-border">
                     <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                     <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent text-[10px] font-bold text-foreground uppercase tracking-widest outline-none cursor-pointer">
                        {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-card">{y}</option>)}
                     </select>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

               <div className="lg:col-span-7 space-y-4">
                  {/* GSTR-1 OUTWARD SUPPLIES */}
                  <div className="bg-card rounded p-4 border border-border shadow-sm relative overflow-hidden">
                     <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary"><TrendingUp className="w-5 h-5" /></div>
                           <div>
                              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Sales Tax Report (GSTR-1)</h4>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Tax on Sales</p>
                           </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded text-[9px] font-bold uppercase tracking-widest">Validated</span>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Registered Business Sales</p>
                           <h3 className="text-2xl font-black text-foreground tracking-tighter">₹{gstr1?.b2b?.taxableValue.toLocaleString() || '0'}</h3>
                           <div className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 w-fit px-2 py-0.5 rounded mt-2">
                              {gstr1?.b2b?.count || 0} Invoices
                           </div>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Direct Customer Sales</p>
                           <h3 className="text-2xl font-black text-foreground tracking-tighter">₹{gstr1?.b2c?.taxableValue.toLocaleString() || '0'}</h3>
                           <div className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 w-fit px-2 py-0.5 rounded mt-2">
                              {gstr1?.b2c?.count || 0} Records
                           </div>
                        </div>
                     </div>

                     <div className="p-3 bg-muted/30 rounded border border-border flex items-center justify-between relative overflow-hidden">
                        <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Tax on Sales</p>
                           <h3 className="text-2xl font-black text-foreground tracking-tighter">₹{((gstr1?.b2b?.taxAmount || 0) + (gstr1?.b2c?.taxAmount || 0)).toLocaleString() || '0'}</h3>
                        </div>
                        <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center text-primary"><Activity className="w-5 h-5" /></div>
                     </div>
                  </div>

                  {/* GSTR-3B TAX OFFSET */}
                  <div className="bg-card rounded p-4 border border-border shadow-sm relative overflow-hidden">
                     <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
                        <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary"><Scale className="w-5 h-5" /></div>
                        <div>
                           <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Monthly Tax Payment (GSTR-3B)</h4>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">GST Credit vs GST Payable</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-emerald-500/5 rounded border border-emerald-500/10">
                           <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">GST Credit (ITC)</p>
                           <h3 className="text-xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">₹{gstr3b?.inward?.taxAmount.toLocaleString() || '0'}</h3>
                        </div>
                        <div className="p-4 bg-rose-500/5 rounded border border-rose-500/10">
                           <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">GST to be Paid</p>
                           <h3 className="text-xl font-black text-rose-700 dark:text-rose-400 tracking-tighter">₹{gstr3b?.outward?.taxAmount.toLocaleString() || '0'}</h3>
                        </div>
                     </div>

                     <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20 border border-border rounded">
                        <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Final GST to Pay</p>
                           <h3 className="text-3xl font-black text-foreground tracking-tighter">₹{Math.max(0, gstr3b?.netPayable || 0).toLocaleString()}</h3>
                        </div>
                        <div className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm print:hidden ${gstr3b?.netPayable < 0 ? 'bg-emerald-600 text-white' : 'bg-foreground text-background'}`}>
                           {gstr3b?.netPayable < 0 ? <ShieldCheck className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                           {gstr3b?.netPayable < 0 ? "Credit Available" : "Pay GST Now"}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-5 space-y-4">
                  {/* BALANCE SHEET */}
                  <div className="bg-card rounded p-4 border border-border shadow-sm">
                     <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
                        <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary"><Building2 className="w-5 h-5" /></div>
                        <div>
                           <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Money Status</h4>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Your Business Money Status</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                 <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                 Everything You Have (Assets)
                              </span>
                              <span className="text-xl font-black text-foreground tracking-tighter">₹{balanceSheet?.assets?.total?.toLocaleString() || '0'}</span>
                           </div>
                           <div className="space-y-2 px-4 py-3 bg-muted/30 rounded border border-border/50">
                              {[
                                 { label: "Cash & Bank", val: balanceSheet?.assets?.cashAndBank },
                                 { label: "Receivables", val: balanceSheet?.assets?.receivables },
                                 { label: "Inventory", val: balanceSheet?.assets?.inventory }
                              ].map((item, i) => (
                                 <div key={i} className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</span>
                                    <span className="text-xs font-bold text-foreground tracking-tight">₹{item.val?.toLocaleString() || '0'}</span>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                 <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                                 Everything You Owe (Liabilities)
                              </span>
                              <span className="text-xl font-black text-foreground tracking-tighter">₹{balanceSheet?.liabilities?.total?.toLocaleString() || '0'}</span>
                           </div>
                           <div className="px-4 py-3 bg-muted/30 rounded border border-border/50">
                              <div className="flex justify-between items-center">
                                 <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Money you owe to sellers</span>
                                 <span className="text-xs font-bold text-foreground tracking-tight">₹{balanceSheet?.liabilities?.payables?.toLocaleString() || '0'}</span>
                              </div>
                           </div>
                        </div>

                        <div className="pt-4 border-t border-border flex items-center justify-between">
                           <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Your Total Money</span>
                           <span className="text-2xl font-black text-primary tracking-tighter">₹{balanceSheet?.equity?.toLocaleString() || '0'}</span>
                        </div>
                     </div>
                  </div>

                  {/* ACTION MATRIX */}
                  <div className="grid grid-cols-2 gap-4 print:hidden">
                     <button onClick={handleExportLedger} disabled={exportLoading} className="p-4 bg-indigo-600 rounded-md border border-indigo-700 shadow-xl shadow-indigo-500/20 text-center hover:bg-indigo-700 transition-all flex flex-col items-center justify-center gap-3 group">
                        <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center text-white group-hover:scale-110 transition-all">
                           <Download className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-[9px] font-bold text-white uppercase tracking-widest">Export Dataset</p>
                           <p className="text-[8px] font-medium text-white/60 uppercase tracking-tighter mt-0.5">All Transactions</p>
                        </div>
                     </button>
                     <button onClick={handleDaybookExport} disabled={exportLoading} className="p-4 bg-white rounded-md border border-slate-200 shadow-sm text-center hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-3 group">
                        <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-all">
                           <PieChart className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-[9px] font-bold text-slate-900 uppercase tracking-widest">Export Monthly Dataset</p>
                           <p className="text-[8px] font-medium text-slate-400 uppercase tracking-tighter mt-0.5">Daily Records</p>
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
