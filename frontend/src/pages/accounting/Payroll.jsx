import { useState, useEffect } from "react";
import { staffApi, payrollApi } from "../../api/erpApi";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import HammerLoader from "../../components/common/HammerLoader";
import { motion, AnimatePresence } from "framer-motion";
import {
   Users, ShieldCheck, UserCheck, Banknote, Search,
   UserPlus, Plus, ChevronRight, Clock, CheckCircle2,
   ArrowUpRight, Zap, Database, Activity
} from "lucide-react";


const Payroll = () => {
   const [activeTab, setActiveTab] = useState("staff");
   const [staff, setStaff] = useState([]);
   const [payrollEntries, setPayrollEntries] = useState([]);
   const [loading, setLoading] = useState(true);

   const [searchTerm, setSearchTerm] = useState("");
   const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

   const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
   const [editingStaff, setEditingStaff] = useState(null);
   const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);

   const [formLoading, setFormLoading] = useState(false);

   useEffect(() => {
      fetchData();
   }, [activeTab, selectedMonth, selectedYear]);

   const fetchData = async () => {
      try {
         setLoading(true);
         // Synchronize Associate Registry regardless of tab to ensure modals are populated
         const staffRes = await staffApi.getAll();
         setStaff(staffRes.data);

         if (activeTab === "payroll") {
            const payrollRes = await payrollApi.getAll(selectedMonth, selectedYear);
            setPayrollEntries(payrollRes.data);
         }
      } catch (err) {
         console.error("[PAYROLL FETCH ERROR]:", err);
      } finally {
         setLoading(false);
      }
   };

   const filteredStaff = staff.filter(s => {
      const searchLow = searchTerm.toLowerCase();
      return (s.name || "").toLowerCase().includes(searchLow) ||
         (s.position || "").toLowerCase().includes(searchLow) ||
         (s.mobile || "").toLowerCase().includes(searchLow);
   });

   const filteredPayrollEntries = payrollEntries.filter(p => {
      const searchLow = searchTerm.toLowerCase();
      return (p.staff?.name || "").toLowerCase().includes(searchLow) ||
         (p.staff?.position || "").toLowerCase().includes(searchLow) ||
         (p._id?.toString() || "").toLowerCase().includes(searchLow);
   });

   const handleCreateStaff = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      try {
         setFormLoading(true);
         if (editingStaff) await staffApi.update(editingStaff._id, data);
         else await staffApi.create(data);
         setIsStaffModalOpen(false);
         fetchData();
      } catch (err) {
         alert("Registration Protocol Failed.");
      } finally {
         setFormLoading(false);
      }
   };

   const handleGeneratePayroll = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      try {
         setFormLoading(true);
         await payrollApi.create({ ...data, month: selectedMonth, year: selectedYear });
         setIsPayrollModalOpen(false);
         fetchData();
      } catch (err) {
         alert("Payroll Generation Failed.");
      } finally {
         setFormLoading(false);
      }
   };

   const handleDisburseSalary = async (id) => {
      if (!window.confirm("Authorize salary disbursement?")) return;
      try {
         setLoading(true);
         await payrollApi.paySalary(id);
         fetchData();
      } catch (err) {
         alert("Disbursement failed.");
      } finally {
         setLoading(false);
      }
   };

   const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
   ];

   return (
      <AppLayout>
         <div className="space-y-3 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">

            {/* Elite Human Capital Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-4">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 rounded-md flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-xl border border-slate-800">
                     <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                     <h2 className="text-4xl font-black text-foreground tracking-tightest leading-none mb-2 ">Workforce <span className="text-primary not-">Intelligence</span></h2>
                     <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Human Capital Analytics & Payroll Orchestration</span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center p-1.5 bg-muted rounded-md border border-border">
                  <button onClick={() => setActiveTab("staff")} className={`flex items-center gap-2 px-4 py-3 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "staff" ? 'bg-card text-foreground shadow-lg scale-105' : 'text-muted-foreground hover:text-slate-600'}`}>
                     <UserCheck className="w-4 h-4" /> Workforce Registry
                  </button>
                  <button onClick={() => setActiveTab("payroll")} className={`flex items-center gap-2 px-4 py-3 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "payroll" ? 'bg-card text-foreground shadow-lg scale-105' : 'text-muted-foreground hover:text-slate-600'}`}>
                     <Banknote className="w-4 h-4" /> Salary Dispersion
                  </button>
               </div>
            </div>

            {/* Dynamic Toolbar */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-card p-4 rounded-md border border-border shadow-sm">
               <div className="flex items-center gap-4">
                  {activeTab === "payroll" && (
                     <>
                        <select className="px-4 py-4 bg-card border border-border rounded-md text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                           {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select className="px-4 py-4 bg-card border border-border rounded-md text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-sm" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                           {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                     </>
                  )}
                  {activeTab === "staff" && (
                     <div className="relative group w-80">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input className="pl-12 pr-4 py-4 bg-card border border-border rounded-md text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all w-full shadow-sm" placeholder="Personnel Lookup..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                     </div>
                  )}
               </div>

               <button onClick={() => activeTab === "staff" ? (setEditingStaff(null), setIsStaffModalOpen(true)) : setIsPayrollModalOpen(true)} className="erp-button-primary !py-3 !bg-slate-900 !text-white !rounded-md hover:!bg-black shadow-xl shadow-slate-900/10 group">
                  {activeTab === "staff" ? <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />}
                  {activeTab === "staff" ? "Enlist Associate" : "Initialize Payroll"}
               </button>
            </div>

            {loading ? (
               <div className="flex flex-col items-center justify-center h-[40vh]">
                  <HammerLoader />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-4 animate-pulse">Syncing Workforce Data...</p>
               </div>
            ) : activeTab === "staff" ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staff.length === 0 ? (
                     <div className="col-span-full py-40 text-center bg-muted/30 rounded-md border-2 border-dashed border-border flex flex-col items-center gap-4">
                        <Users className="w-16 h-16 opacity-10" />
                        <p className="font-black text-slate-300 uppercase tracking-widest text-[11px] ">Zero personnel records synchronized in current repository.</p>
                     </div>
                  ) : filteredStaff.map((s) => (
                     <div key={s._id} className="group bg-card rounded-md p-4 border border-border shadow-sm hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-700 hover:-translate-y-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-500">
                           <button onClick={() => { setEditingStaff(s); setIsStaffModalOpen(true); }} className="w-12 h-12 bg-slate-900 !text-white rounded-md flex items-center justify-center hover:bg-black transition-all shadow-xl hover:rotate-90">
                              <ChevronRight className="w-6 h-6" />
                           </button>
                        </div>

                        <div className="flex items-center gap-4 mb-10">
                           <div className="w-16 h-16 bg-muted/50 border border-border rounded-md flex items-center justify-center text-foreground shadow-inner group-hover:scale-110 transition-transform duration-700">
                              <span className="text-3xl font-black ">{s.name.charAt(0).toUpperCase()}</span>
                           </div>
                           <div>
                              <h4 className="text-2xl font-black text-foreground tracking-tightest uppercase  leading-none mb-2">{s.name}</h4>
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-sm shadow-indigo-500/50"></div>
                                 <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{s.position}</span>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-10">
                           <div className="space-y-1">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Compensation</p>
                              <p className="text-2xl font-black text-foreground tracking-tightest ">₹{s.baseSalary.toLocaleString()}</p>
                              <p className="text-[9px] font-black text-muted-foreground uppercase opacity-40">Per {s.salaryType}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Telemetry Node</p>
                              <p className="text-sm font-black text-slate-600 truncate underline decoration-slate-200 decoration-2 underline-offset-4 tracking-tightest ">{s.mobile}</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden mb-20 animate-in fade-in slide-in-from-right-4 duration-1000">
                  <div className="overflow-x-auto min-h-[400px] flex flex-col">
                     {payrollEntries.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-40 text-center opacity-20 gap-4">
                           <Banknote className="w-16 h-16" />
                           <p className="font-black uppercase tracking-[0.4em]  text-[11px]">Zero Salary Fluctuations Detected.</p>
                        </div>
                     ) : (
                        <table className="erp-table">
                           <thead>
                              <tr className="bg-muted/30 border-b border-slate-50 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                                 <th className="px-10 py-3">Associate Node</th>
                                 <th className="px-10 py-3 text-center">Operational Units</th>
                                 <th className="px-10 py-3 text-right">Yield (Net Salary)</th>
                                 <th className="px-10 py-3 text-center">Registry Status</th>
                                 <th className="px-10 py-3 text-right pr-20">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {filteredPayrollEntries.map((p, index) => (
                                 <motion.tr
                                    key={p._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.03 }}
                                    className="group erp-row-hover transition-all duration-500"
                                 >
                                    <td className="px-10 py-3">
                                       <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 bg-card rounded-md flex items-center justify-center text-foreground font-black text-lg  shadow-lg border border-border group-hover:scale-110 transition-transform">
                                             {p.staff?.name.charAt(0)}
                                          </div>
                                          <div>
                                             <p className="text-base font-black text-foreground tracking-tightest uppercase  leading-none mb-1.5">{p.staff?.name}</p>
                                             <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 bg-muted/50 w-fit px-2 py-0.5 rounded-md">{p.staff?.position}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-10 py-3 text-center">
                                       <div className="inline-flex items-center gap-3 px-3 py-2.5 bg-muted/50 rounded-md border border-border shadow-inner">
                                          <Clock className="w-4 h-4 text-muted-foreground" />
                                          <span className="text-[11px] font-black text-foreground uppercase tracking-tighter ">
                                             {p.workingDays} {p.staff?.salaryType === 'daily' ? 'Days' : 'Months'}
                                          </span>
                                       </div>
                                    </td>
                                    <td className="px-10 py-3 text-right">
                                       <p className="text-2xl font-black text-foreground tracking-tightest  tabular-nums leading-none">₹{p.netSalary.toLocaleString()}</p>
                                       <div className="flex justify-end items-center gap-3 mt-2 opacity-60">
                                          {p.bonus > 0 && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-tight">+{p.bonus} Growth</span>}
                                          {p.deductions > 0 && <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md uppercase tracking-tight">-{p.deductions} Offset</span>}
                                       </div>
                                    </td>
                                    <td className="px-10 py-3 text-center">
                                       <span className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest  border shadow-sm ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/5' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse shadow-amber-500/5'}`}>
                                          {p.status === 'paid' ? <CheckCircle2 className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                                          {p.status}
                                       </span>
                                    </td>
                                    <td className="px-10 py-3 text-right pr-20">
                                       {p.status === 'unpaid' ? (
                                          <button onClick={() => handleDisburseSalary(p._id)} className="erp-button-primary !py-4 !px-4 !bg-slate-900 !text-white !rounded-md shadow-xl shadow-slate-900/10 group transition-all">
                                             Authorized Payment
                                             <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                          </button>
                                       ) : (
                                          <div className="flex items-center justify-end gap-3 text-muted-foreground font-black  uppercase tracking-widest text-[10px] bg-muted/50 px-4 py-3 rounded-md border border-border w-fit ml-auto">
                                             <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                             Settled Protocol
                                          </div>
                                       )}
                                    </td>
                                 </motion.tr>
                              ))}
                           </tbody>
                        </table>
                     )}
                  </div>
               </div>
            )}

            {/* MODAL CONFIG */}
            <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title={<div className="flex items-center gap-4"><UserPlus className="w-6 h-6 text-foreground" /><span className="text-xl font-black  tracking-tightest uppercase">Personnel Registration</span></div>}>
               <form onSubmit={handleCreateStaff} className="space-y-3 p-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2 space-y-3">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2 ">Full Legal Identity</label>
                        <input name="name" required defaultValue={editingStaff?.name} className="erp-input !py-3 !bg-muted/50 focus:!bg-card rounded-md" placeholder="Associate Name..." />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2 ">Operational Node (Mobile)</label>
                        <input name="mobile" required defaultValue={editingStaff?.mobile} className="erp-input !py-3 !bg-muted/50 font-mono tracking-widest rounded-md" placeholder="+91 XXXX XXX XXX" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2 ">Designation / Role</label>
                        <input name="position" defaultValue={editingStaff?.position || "Analyst"} className="erp-input !py-3 uppercase !font-black rounded-md" placeholder="Role Identifier..." />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2 ">Base Compensation (₹)</label>
                        <input name="baseSalary" type="number" required defaultValue={editingStaff?.baseSalary} className="erp-input !py-3 !text-indigo-600 !font-black !text-lg rounded-md" placeholder="0" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2 ">Yield Frequency</label>
                        <select name="salaryType" defaultValue={editingStaff?.salaryType || "monthly"} className="erp-input !py-3 uppercase !font-black cursor-pointer bg-muted/50 rounded-md">
                           <option value="monthly">Monthly Fixed</option>
                           <option value="daily">Daily Wage</option>
                        </select>
                     </div>
                  </div>
                  <div className="pt-4 border-t border-border flex gap-4">
                     <button type="button" onClick={() => setIsStaffModalOpen(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-muted-foreground hover:text-foreground tracking-widest ">Abort Protocol</button>
                     <button type="submit" disabled={formLoading} className="flex-2 erp-button-primary !py-3 !px-12 !bg-slate-900 !text-white !rounded-md hover:!bg-black group shadow-xl shadow-slate-900/10">
                        <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {formLoading ? "Synchronizing..." : editingStaff ? "Commit Updates" : "Enlist Personnel"}
                     </button>
                  </div>
               </form>
            </Modal>

            <Modal isOpen={isPayrollModalOpen} onClose={() => setIsPayrollModalOpen(false)} title={<div className="flex items-center gap-4"><Banknote className="w-6 h-6 text-foreground" /><span className="text-xl font-black  tracking-tightest uppercase">Initialize Dispersion</span></div>}>
               <form onSubmit={handleGeneratePayroll} className="space-y-3 p-4">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2 ">Target Associate</label>
                     <select name="staffId" required className="erp-input !py-3 uppercase !font-black cursor-pointer bg-muted/50 rounded-md">
                        <option value="">-- Access Personnel Hub --</option>
                        {staff.map(s => <option key={s._id} value={s._id}>{s.name} [{s.position}]</option>)}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2 ">Operational Units</label>
                        <input name="workingDays" type="number" step="0.5" defaultValue="30" required className="erp-input !py-3 !font-black !text-lg rounded-md" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2 ">Growth Bonus (₹)</label>
                        <input name="bonus" type="number" defaultValue="0" className="erp-input !py-3 !text-emerald-600 !font-black !text-lg rounded-md" />
                     </div>
                     <div className="col-span-2 space-y-3">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2 ">Operational Deductions (₹)</label>
                        <input name="deductions" type="number" defaultValue="0" className="erp-input !py-3 !text-rose-600 !font-black !text-lg rounded-md" />
                     </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-md border border-border flex items-center gap-4 shadow-inner">
                     <Activity className="w-8 h-8 text-slate-300" />
                     <p className="text-[10px] font-black uppercase text-muted-foreground leading-relaxed ">Calculations synchronized with daily/monthly performance protocols.</p>
                  </div>
                  <button type="submit" disabled={formLoading} className="w-full erp-button-primary !py-4 !bg-slate-900 !text-white !rounded-md hover:!bg-black shadow-2xl shadow-slate-900/20 group">
                     <Database className="w-5 h-5 group-hover:scale-110 transition-transform" />
                     {formLoading ? "Computing Yield..." : "Deploy Financial Entry"}
                  </button>
               </form>
            </Modal>

         </div>
      </AppLayout>
   );
};

export default Payroll;
