import { useState, useEffect } from "react";
import { staffApi, payrollApi } from "../../api/erpApi";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
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
         if (activeTab === "staff") {
            const res = await staffApi.getAll();
            setStaff(res.data);
         } else {
            const res = await payrollApi.getAll(selectedMonth, selectedYear);
            setPayrollEntries(res.data);
         }
      } catch (err) {
         console.error(err);
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
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">

            {/* Elite Human Capital Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-slate-900 rounded-[2.5rem] flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-xl border border-slate-800">
                     <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                     <h2 className="text-3xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Workforce <span className="text-slate-400 not-italic">Intelligence</span></h2>
                     <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Human Capital Analytics & Payroll Orchestration</span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center p-2 bg-slate-100 rounded-3xl border border-slate-200">
                  <button onClick={() => setActiveTab("staff")} className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "staff" ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                     <UserCheck className="w-4 h-4" /> Workforce Registry
                  </button>
                  <button onClick={() => setActiveTab("payroll")} className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "payroll" ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                     <Banknote className="w-4 h-4" /> Salary Dispersion
                  </button>
               </div>
            </div>

            {/* Dynamic Toolbar */}
            <div className="flex flex-wrap gap-6 items-center justify-between bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
               <div className="flex items-center gap-4">
                  {activeTab === "payroll" && (
                     <>
                        <select className="px-6 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                           {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select className="px-6 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                           {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                     </>
                  )}
                  {activeTab === "staff" && (
                     <div className="relative group w-80">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input className="pl-12 pr-6 py-3.5 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all w-full shadow-inner" placeholder="Personnel Lookup..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                     </div>
                  )}
               </div>

               <button onClick={() => activeTab === "staff" ? (setEditingStaff(null), setIsStaffModalOpen(true)) : setIsPayrollModalOpen(true)} className="erp-button-primary !py-5 !bg-indigo-600 !rounded-[2rem] hover:!bg-indigo-700 shadow-indigo-200">
                  {activeTab === "staff" ? <UserPlus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {activeTab === "staff" ? "Enlist Associate" : "Initialize Payroll"}
               </button>
            </div>

            {activeTab === "staff" ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staff.length === 0 ? (
                     <div className="col-span-full py-40 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 italic font-black text-slate-300 uppercase tracking-widest text-[11px]">
                        <Users className="w-16 h-16 mx-auto mb-6 opacity-20" />
                        Zero personnel records synchronized in current repository.
                     </div>
                  ) : filteredStaff.map((s) => (
                     <div key={s._id} className="group bg-white rounded-[3.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 hover:-translate-y-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all duration-500">
                           <button onClick={() => { setEditingStaff(s); setIsStaffModalOpen(true); }} className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-100 hover:rotate-90">
                              <ChevronRight className="w-6 h-6" />
                           </button>
                        </div>

                        <div className="flex items-center gap-6 mb-10">
                           <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-[2rem] flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner group-hover:scale-110 transition-transform duration-700">
                              <span className="text-3xl font-black italic">{s.name.charAt(0).toUpperCase()}</span>
                           </div>
                           <div>
                              <h4 className="text-2xl font-black text-slate-900 tracking-tightest uppercase italic">{s.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                                 <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{s.position}</span>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-10">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Compensation</p>
                              <p className="text-xl font-black text-slate-900 tracking-tightest italic">₹{s.baseSalary.toLocaleString()}</p>
                              <span className="text-[9px] font-black text-slate-400 uppercase opacity-40">Per {s.salaryType}</span>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Telemetry Node</p>
                              <p className="text-xs font-black text-slate-600 truncate underline decoration-slate-200 decoration-2 underline-offset-4 tracking-tightest italic">{s.mobile}</p>
                           </div>
                        </div>

                        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-indigo-50 rounded-full opacity-5 group-hover:opacity-20 transition-opacity"></div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-20 animate-in fade-in slide-in-from-right-4 duration-1000">
                  <div className="overflow-x-auto">
                     {payrollEntries.length === 0 ? (
                        <div className="py-40 text-center text-slate-300 font-black uppercase tracking-[0.4em] italic text-[11px]">Zero Salary Fluctuations Detected.</div>
                     ) : (
                        <table className="erp-table">
                           <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                                 <th className="px-10 py-3">Associate Node</th>
                                 <th className="px-10 py-3 text-center">Operational Units</th>
                                 <th className="px-10 py-3 text-right">Yield (Net Salary)</th>
                                 <th className="px-10 py-3 text-center">Registry Status</th>
                                 <th className="px-10 py-3 text-right pr-20">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {filteredPayrollEntries.map((p) => (
                                 <tr key={p._id} className="group erp-row-hover transition-all duration-500">
                                    <td className="px-10 py-3">
                                       <div className="flex items-center gap-5">
                                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm italic shadow-lg shadow-indigo-100 border border-indigo-50 group-hover:scale-110 transition-transform">
                                             {p.staff?.name.charAt(0)}
                                          </div>
                                          <div>
                                             <p className="text-base font-black text-slate-900 tracking-tightest uppercase italic">{p.staff?.name}</p>
                                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">{p.staff?.position}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-10 py-3 text-center">
                                       <div className="inline-flex items-center gap-3 px-5 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                                          <Clock className="w-4 h-4 text-slate-400" />
                                          <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter italic">
                                             {p.workingDays} {p.staff?.salaryType === 'daily' ? 'Days' : 'Months'}
                                          </span>
                                       </div>
                                    </td>
                                    <td className="px-10 py-3 text-right">
                                       <p className="text-2xl font-black text-slate-900 tracking-tightest italic tabular-nums">₹{p.netSalary.toLocaleString()}</p>
                                       <div className="flex justify-end items-center gap-3 mt-1.5 opacity-60">
                                          {p.bonus > 0 && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase tracking-tight">+{p.bonus} Growth</span>}
                                          {p.deductions > 0 && <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg uppercase tracking-tight">-{p.deductions} Offset</span>}
                                       </div>
                                    </td>
                                    <td className="px-10 py-3 text-center">
                                       <span className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest italic border ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'}`}>
                                          {p.status === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                                          {p.status}
                                       </span>
                                    </td>
                                    <td className="px-10 py-3 text-right pr-20">
                                       {p.status === 'unpaid' ? (
                                          <button onClick={() => handleDisburseSalary(p._id)} className="erp-button-primary !py-3.5 !px-8 !bg-indigo-600 !rounded-2xl shadow-indigo-100 group transition-all">
                                             Authorized Payment
                                             <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                          </button>
                                       ) : (
                                          <div className="flex items-center justify-end gap-3 text-slate-400 font-black italic uppercase tracking-widest text-[10px]">
                                             <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                             Settled
                                          </div>
                                       )}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     )}
                  </div>
               </div>
            )}

            {/* MODAL CONFIG */}
            <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title={<div className="flex items-center gap-4"><UserPlus className="w-6 h-6 text-indigo-600" /><span className="text-xl font-black italic tracking-tightest uppercase">Personnel Registration</span></div>}>
               <form onSubmit={handleCreateStaff} className="space-y-10 p-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2 space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 italic">Full Legal Identity</label>
                        <input name="name" required defaultValue={editingStaff?.name} className="erp-input !py-5 !bg-slate-50 focus:!bg-white" placeholder="Associate Name..." />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 italic">Operational Node (Mobile)</label>
                        <input name="mobile" required defaultValue={editingStaff?.mobile} className="erp-input !py-5 !bg-slate-50 font-mono tracking-widest" placeholder="+91 XXXX XXX XXX" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 italic">Designation / Role</label>
                        <input name="position" defaultValue={editingStaff?.position || "Analyst"} className="erp-input !py-5 uppercase !font-black" placeholder="Role Identifier..." />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 italic">Base Compensation (₹)</label>
                        <input name="baseSalary" type="number" required defaultValue={editingStaff?.baseSalary} className="erp-input !py-5 !text-indigo-600 !font-black !text-lg" placeholder="0" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 italic">Yield Frequency</label>
                        <select name="salaryType" defaultValue={editingStaff?.salaryType || "monthly"} className="erp-input !py-5 uppercase !font-black cursor-pointer bg-slate-50">
                           <option value="monthly">Monthly Fixed</option>
                           <option value="daily">Daily Wage</option>
                        </select>
                     </div>
                  </div>
                  <div className="pt-6 border-t border-slate-50 flex gap-6">
                     <button type="button" onClick={() => setIsStaffModalOpen(false)} className="flex-1 py-6 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-widest italic">Abort Protocol</button>
                     <button type="submit" disabled={formLoading} className="flex-2 erp-button-primary !py-6 !px-12 !bg-slate-900 !rounded-[2.5rem] hover:!bg-black group">
                        <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {formLoading ? "Synchronizing..." : editingStaff ? "Commit Updates" : "Enlist Personnel"}
                     </button>
                  </div>
               </form>
            </Modal>

            <Modal isOpen={isPayrollModalOpen} onClose={() => setIsPayrollModalOpen(false)} title={<div className="flex items-center gap-4"><Banknote className="w-6 h-6 text-indigo-600" /><span className="text-xl font-black italic tracking-tightest uppercase">Initialize Dispersion</span></div>}>
               <form onSubmit={handleGeneratePayroll} className="space-y-10 p-4">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 italic">Target Associate</label>
                     <select name="staffId" required className="erp-input !py-5 uppercase !font-black cursor-pointer bg-slate-50">
                        <option value="">-- Access Personnel Hub --</option>
                        {staff.map(s => <option key={s._id} value={s._id}>{s.name} [{s.position}]</option>)}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 italic">Operational Units</label>
                        <input name="workingDays" type="number" step="0.5" defaultValue="30" required className="erp-input !py-5 !font-black !text-lg" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 italic">Growth Bonus (₹)</label>
                        <input name="bonus" type="number" defaultValue="0" className="erp-input !py-5 !text-emerald-600 !font-black !text-lg" />
                     </div>
                     <div className="col-span-2 space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 italic">Operational Deductions (₹)</label>
                        <input name="deductions" type="number" defaultValue="0" className="erp-input !py-5 !text-rose-600 !font-black !text-lg" />
                     </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                     <Activity className="w-6 h-6 text-slate-300" />
                     <span className="text-[9px] font-black uppercase text-slate-400 leading-relaxed italic">Calculations synchronized with daily/monthly performance protocols.</span>
                  </div>
                  <button type="submit" disabled={formLoading} className="w-full erp-button-primary !py-7 !bg-slate-900 !rounded-[2.5rem] hover:!bg-black shadow-xl shadow-slate-900/10">
                     <Database className="w-5 h-5" />
                     {formLoading ? "Computing Yield..." : "Deploy Financial Entry"}
                  </button>
               </form>
            </Modal>

         </div>
      </AppLayout>
   );
};

export default Payroll;
