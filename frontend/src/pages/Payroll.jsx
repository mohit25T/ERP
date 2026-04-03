import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/common/Modal";
import { staffApi, payrollApi } from "../api/erpApi";
import { 
  Users, 
  Banknote, 
  Plus, 
  Search, 
  Calendar, 
  ChevronRight, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  Clock,
  TrendingDown,
  Briefcase
} from "lucide-react";

const Payroll = () => {
  const [activeTab, setActiveTab] = useState("staff"); // "staff" or "payroll"
  const [staff, setStaff] = useState([]);
  const [payrollEntries, setPayrollEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal States
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  
  // Form States
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

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
      setFormLoading(true);
      if (editingStaff) {
        await staffApi.update(editingStaff._id, data);
      } else {
        await staffApi.create(data);
      }
      setIsStaffModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Error: " + (err.response?.data?.msg || err.message));
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
      await payrollApi.create({
          ...data,
          month: selectedMonth,
          year: selectedYear
      });
      setIsPayrollModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Error: " + (err.response?.data?.msg || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDisburseSalary = async (id) => {
    if (!window.confirm("Confirm salary disbursement? This will record an expense in the Financial Ledger.")) return;
    try {
      setLoading(true);
      await payrollApi.paySalary(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to disburse salary");
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
      {/* Header & Stats Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight italic flex items-center gap-2">
              <span className="p-2 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                <Banknote className="w-6 h-6" />
              </span>
              Payroll & Staff
            </h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1 ml-12">Workforce Management Hub</p>
          </div>

          <div className="flex items-center bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner">
             <button 
                onClick={() => setActiveTab("staff")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "staff" ? 'bg-white text-blue-600 shadow-md transform scale-105' : 'text-gray-400 hover:text-gray-600'}`}
             >
                <Users className="w-4 h-4" /> Staff Directory
             </button>
             <button 
                onClick={() => setActiveTab("payroll")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "payroll" ? 'bg-white text-blue-600 shadow-md transform scale-105' : 'text-gray-400 hover:text-gray-600'}`}
             >
                <Calendar className="w-4 h-4" /> Monthly Payroll
             </button>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
           <div className="flex gap-4">
              {activeTab === "payroll" && (
                <>
                   <select 
                     className="bg-white border border-gray-200 text-xs font-black uppercase px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500/10 outline-none"
                     value={selectedMonth}
                     onChange={(e) => setSelectedMonth(e.target.value)}
                   >
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                   </select>
                   <select 
                     className="bg-white border border-gray-200 text-xs font-black uppercase px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500/10 outline-none"
                     value={selectedYear}
                     onChange={(e) => setSelectedYear(e.target.value)}
                   >
                      {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                   </select>
                </>
              )}
           </div>

           <button 
             onClick={() => activeTab === "staff" ? (setEditingStaff(null), setIsStaffModalOpen(true)) : setIsPayrollModalOpen(true)}
             className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all active:scale-95"
           >
              {activeTab === "staff" ? <UserPlus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {activeTab === "staff" ? "Add Staff Member" : "Generate Payroll"}
           </button>
        </div>
      </div>

      {activeTab === "staff" ? (
         /* STAFF DIRECTORY VIEW */
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.length === 0 ? (
               <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100 italic font-bold text-gray-300">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  No staff members registered in the directory.
               </div>
            ) : staff.map((s) => (
               <div key={s._id} className="group bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => {setEditingStaff(s); setIsStaffModalOpen(true);}} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                     </button>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-xl font-black">
                        {s.name.charAt(0).toUpperCase()}
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-gray-900 tracking-tight">{s.name}</h4>
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full tracking-tighter italic">{s.position}</span>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Base Salary</p>
                        <p className="text-lg font-black text-gray-900 leading-none tracking-tighter italic">₹{s.baseSalary.toLocaleString()}</p>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">per {s.salaryType}</span>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile</p>
                        <p className="text-sm font-black text-gray-600 truncate underline decoration-gray-200 decoration-2 underline-offset-4 tracking-tighter">{s.mobile}</p>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      ) : (
         /* PAYROLL LOGS VIEW */
         <div className="space-y-4">
            {payrollEntries.length === 0 ? (
               <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100 italic font-bold text-gray-300">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  No payroll records found for {selectedMonth} {selectedYear}.
               </div>
            ) : (
               <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-50">
                           <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Employee</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Work Details</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Net Salary</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {payrollEntries.map((p) => (
                           <tr key={p._id} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs">
                                       {p.staff?.name.charAt(0)}
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-gray-900 tracking-tight">{p.staff?.name}</p>
                                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{p.staff?.position}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <p className="text-xs font-black text-gray-700 tracking-tighter flex items-center justify-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    {p.workingDays} {p.staff?.salaryType === 'daily' ? 'Days' : 'Months'}
                                 </p>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <p className="text-lg font-black text-gray-900 tracking-tighter italic">₹{p.netSalary.toLocaleString()}</p>
                                 <div className="flex justify-end items-center gap-2">
                                    {p.bonus > 0 && <span className="text-[8px] font-black text-green-600 bg-green-50 px-1 py-0.5 rounded uppercase">+{p.bonus} Bonus</span>}
                                    {p.deductions > 0 && <span className="text-[8px] font-black text-red-600 bg-red-50 px-1 py-0.5 rounded uppercase">-{p.deductions} Ded.</span>}
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic ${p.status === 'paid' ? 'bg-green-50 text-green-600 shadow-sm shadow-green-500/5' : 'bg-orange-50 text-orange-600 animate-pulse'}`}>
                                    {p.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                    {p.status}
                                 </span>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 {p.status === 'unpaid' ? (
                                    <button 
                                      onClick={() => handleDisburseSalary(p._id)}
                                      className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                                    >
                                       Pay Now
                                    </button>
                                 ) : (
                                    <span className="text-xs font-black text-gray-300 italic tracking-widest uppercase">Verified & Paid</span>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
         </div>
      )}

      {/* STAFF MODAL */}
      <Modal 
        isOpen={isStaffModalOpen} 
        onClose={() => setIsStaffModalOpen(false)} 
        title={editingStaff ? "Edit Staff Details" : "Register New Staff"}
      >
         <form onSubmit={handleCreateStaff} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Full Name</label>
                  <input name="name" required defaultValue={editingStaff?.name} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl text-sm font-black text-gray-900 border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none transition-all shadow-inner" placeholder="Enter name..." />
               </div>
               <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Mobile No.</label>
                  <input name="mobile" required defaultValue={editingStaff?.mobile} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl text-sm font-black text-gray-900 border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none transition-all shadow-inner font-mono" placeholder="+91..." />
               </div>
               <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Position / Role</label>
                  <input name="position" defaultValue={editingStaff?.position || "Worker"} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl text-sm font-black text-gray-900 border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none transition-all shadow-inner" placeholder="e.g. Foreman" />
               </div>
               <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Base Rate (₹)</label>
                  <input name="baseSalary" type="number" required defaultValue={editingStaff?.baseSalary} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl text-sm font-black text-gray-900 border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none transition-all shadow-inner" placeholder="0" />
               </div>
               <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Salary Type</label>
                  <select name="salaryType" defaultValue={editingStaff?.salaryType || "monthly"} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl text-sm font-black text-gray-900 border-2 border-transparent focus:border-blue-500/20 focus:bg-white appearance-none outline-none transition-all shadow-inner">
                     <option value="monthly">Monthly Fixed</option>
                     <option value="daily">Daily Wage</option>
                  </select>
               </div>
            </div>
            <div className="pt-4 border-t border-gray-100 flex gap-3">
               <button type="button" onClick={() => setIsStaffModalOpen(false)} className="flex-1 py-4 text-xs font-black uppercase text-gray-400 hover:text-gray-600">Dismiss</button>
               <button type="submit" disabled={formLoading} className="flex-2 py-4 px-10 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                  {formLoading ? "Processing..." : editingStaff ? "Save Updates" : "Register Worker"}
               </button>
            </div>
         </form>
      </Modal>

      {/* PAYROLL MODAL */}
      <Modal isOpen={isPayrollModalOpen} onClose={() => setIsPayrollModalOpen(false)} title={`Generate Payroll: ${selectedMonth} ${selectedYear}`}>
         <form onSubmit={handleGeneratePayroll} className="space-y-6">
            <div>
               <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Select Employee</label>
               <select name="staffId" required className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl text-sm font-black text-gray-900 border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none appearance-none transition-all shadow-inner">
                  <option value="">-- Choose Staff Member --</option>
                  {staff.map(s => <option key={s._id} value={s._id}>{s.name} ({s.position})</option>)}
               </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Working Days/Units</label>
                  <input name="workingDays" type="number" step="0.5" defaultValue="30" required className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl text-sm font-black text-gray-900 outline-none shadow-inner" />
               </div>
               <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Bonus (₹)</label>
                  <input name="bonus" type="number" defaultValue="0" className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl text-sm font-black text-gray-900 outline-none shadow-inner" />
               </div>
               <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Deductions (₹)</label>
                  <input name="deductions" type="number" defaultValue="0" className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl text-sm font-black text-gray-900 outline-none shadow-inner text-red-500" />
               </div>
            </div>
            <div className="pt-4 border-t border-gray-100 italic text-[10px] text-gray-400 text-center font-bold">
               Calculations will be performed based on Worker's Daily/Monthly rate.
            </div>
            <button type="submit" disabled={formLoading} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
               {formLoading ? "Generating..." : "Calculate & Record Entry"}
            </button>
         </form>
      </Modal>

    </AppLayout>
  );
};

export default Payroll;
