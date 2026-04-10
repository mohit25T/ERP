import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import { paymentApi, customerApi, supplierApi, orderApi, api, ledgerApi } from "../api/erpApi";
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Search, 
  Filter, 
  Building2, 
  Users, 
  ChevronRight,
  TrendingUp,
  FileBarChart,
  History,
  Plus,
  ArrowRightLeft,
  DollarSign
} from "lucide-react";
import Modal from "../components/common/Modal";

const Accounting = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("receivables"); 
  const [details, setDetails] = useState([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterParty, setFilterParty] = useState("all");

  // Reset filters when tab changes
  useEffect(() => {
    setSearchTerm("");
    setFilterMonth("all");
    setFilterParty("all");
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const summaryRes = await paymentApi.getSummary();
      setSummary(summaryRes.data);

      if (activeTab === "receivables") {
          const res = await api.get("/orders");
          setDetails(res.data.filter(o => o.paymentStatus !== "paid" && !["cancelled", "refunded"].includes(o.status)));
      } else if (activeTab === "payables") {
          const res = await api.get("/purchases");
          setDetails(res.data.filter(p => p.paymentStatus !== "paid" && !["cancelled", "refunded"].includes(p.status)));
      } else {
          const res = await ledgerApi.getAll();
          setDetails(res.data);
      }
    } catch (err) {
      console.error("Accounting data fetch failed", err);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Derived Data for Filters
  const getPartyName = (item) => {
    if (item.customer?.name) return item.customer.name;
    if (item.supplier?.company) return item.supplier.company;
    if (item.supplier?.name) return item.supplier.name;
    return "Unknown/Other";
  };

  const getMonthStr = (item) => {
    const d = new Date(item.date || item.createdAt);
    if (isNaN(d.valueOf())) return "Invalid Date";
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
  };

  const uniqueMonths = [...new Set(details.map(getMonthStr))].filter(m => m !== "Invalid Date");
  const uniqueParties = [...new Set(details.map(getPartyName))];

  // Apply all active filters
  const filteredDetails = details.filter(item => {
    const s = searchTerm.toLowerCase();
    const matchSearch = s === "" || 
      getPartyName(item).toLowerCase().includes(s) ||
      (item.description && item.description.toLowerCase().includes(s)) ||
      (item.category && item.category.toLowerCase().includes(s)) ||
      (item._id && item._id.toLowerCase().includes(s));
      
    const matchMonth = filterMonth === "all" || getMonthStr(item) === filterMonth;
    const matchParty = filterParty === "all" || getPartyName(item) === filterParty;
    
    return matchSearch && matchMonth && matchParty;
  });

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gray-900 rounded-3xl shadow-xl shadow-gray-200 shadow-xl">
               <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Financial Ledger</h2>
              <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Cash Flow & Dues Management
              </p>
            </div>
          </div>
        </div>

        {/* Financial KPI Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className={`p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer ${activeTab === 'receivables' ? 'bg-blue-600 border-blue-500 shadow-2xl shadow-blue-500/20' : 'bg-white border-gray-100 hover:border-blue-200 shadow-sm'}`}
                onClick={() => setActiveTab('receivables')}>
              <div className="flex justify-between items-start mb-4">
                 <div className={`p-3 rounded-2xl ${activeTab === 'receivables' ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-600'}`}>
                    <ArrowUpCircle className="w-6 h-6" />
                 </div>
              </div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'receivables' ? 'text-blue-100' : 'text-gray-400'}`}>Receivables</p>
              <h3 className={`text-xl font-black mt-1 ${activeTab === 'receivables' ? 'text-white' : 'text-gray-900'}`}>
                 ₹{summary?.totalReceivable.toLocaleString('en-IN')}
              </h3>
           </div>

           <div className={`p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer ${activeTab === 'payables' ? 'bg-red-600 border-red-500 shadow-2xl shadow-red-500/20' : 'bg-white border-gray-100 hover:border-red-200 shadow-sm'}`}
                onClick={() => setActiveTab('payables')}>
              <div className="flex justify-between items-start mb-4">
                 <div className={`p-3 rounded-2xl ${activeTab === 'payables' ? 'bg-white/10 text-white' : 'bg-red-50 text-red-600'}`}>
                    <ArrowDownCircle className="w-6 h-6" />
                 </div>
              </div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'payables' ? 'text-red-100' : 'text-gray-400'}`}>Payables</p>
              <h3 className={`text-xl font-black mt-1 ${activeTab === 'payables' ? 'text-white' : 'text-gray-900'}`}>
                 ₹{summary?.totalPayable.toLocaleString('en-IN')}
              </h3>
           </div>

           <div className={`p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer ${activeTab === 'journal' ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-500/20' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'}`}
                onClick={() => setActiveTab('journal')}>
              <div className="flex justify-between items-start mb-4">
                 <div className={`p-3 rounded-2xl ${activeTab === 'journal' ? 'bg-white/10 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                    <BookOpen className="w-6 h-6" />
                 </div>
              </div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'journal' ? 'text-indigo-100' : 'text-gray-400'}`}>Double-Entry Journal</p>
              <h3 className={`text-xl font-black mt-1 ${activeTab === 'journal' ? 'text-white' : 'text-gray-900'}`}>
                 Accounting logs
              </h3>
           </div>

           <div className={`p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer ${activeTab === 'ledger' ? 'bg-gray-900 border-gray-800 shadow-2xl shadow-gray-900/20' : 'bg-white border-gray-100 hover:border-gray-300 shadow-sm'}`}
                onClick={() => setActiveTab('ledger')}>
              <div className="flex justify-between items-start mb-4">
                 <div className={`p-3 rounded-2xl ${activeTab === 'ledger' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <ArrowRightLeft className="w-6 h-6" />
                 </div>
              </div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'ledger' ? 'text-gray-400' : 'text-gray-400'}`}>Cash Ledger</p>
              <h3 className={`text-xl font-black mt-1 ${activeTab === 'ledger' ? 'text-white' : 'text-gray-900'}`}>
                 Bookkeeping
              </h3>
           </div>
        </div>

        {/* Detailed List */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
           <div className="p-8 border-b border-gray-50 flex items-center justify-between gap-4">
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                 {activeTab === 'receivables' ? <Users className="w-5 h-5 text-blue-600" /> : <Building2 className="w-5 h-5 text-red-600" />}
                 Detailed {activeTab === 'receivables' ? 'Receivables' : 'Payables'} Breakdown
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                 <select 
                   className="px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold text-gray-700 outline-none hover:bg-gray-100 focus:ring-2 focus:ring-blue-500/10 transition-colors cursor-pointer"
                   value={filterMonth}
                   onChange={(e) => setFilterMonth(e.target.value)}
                 >
                   <option value="all">All Months</option>
                   {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>

                 <select 
                   className="px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold text-gray-700 outline-none hover:bg-gray-100 focus:ring-2 focus:ring-blue-500/10 transition-colors cursor-pointer max-w-[180px]"
                   value={filterParty}
                   onChange={(e) => setFilterParty(e.target.value)}
                 >
                   <option value="all">All Parties</option>
                   {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>

                 <div className="relative hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      className="pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none w-64 transition-all" 
                      placeholder="Search entity, ref, or notes..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 text-center">
                   <div className="inline-block w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : filteredDetails.length === 0 ? (
                <div className="p-24 text-center">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <History className="w-10 h-10 text-gray-200" />
                   </div>
                   <p className="text-gray-900 font-black text-xl mb-1 uppercase tracking-tighter italic">Ledger Clean</p>
                   <p className="text-gray-400 font-medium text-sm">No pending payments found in this category.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                         {activeTab === "journal" ? (
                           <>
                             <th className="px-8 py-4">Ref / Date</th>
                             <th className="px-8 py-4">Transaction Details</th>
                             <th className="px-8 py-4">Ledger Accounts</th>
                             <th className="px-8 py-4 text-right">Debit</th>
                             <th className="px-8 py-4 text-right pr-12">Credit</th>
                           </>
                         ) : activeTab === "ledger" ? (
                           <>
                             <th className="px-8 py-4">Date</th>
                             <th className="px-8 py-4">Type / Category</th>
                             <th className="px-8 py-4">Description</th>
                             <th className="px-8 py-4">Related Entity</th>
                             <th className="px-8 py-4 text-right pr-12">Amount</th>
                           </>
                         ) : (
                           <>
                             <th className="px-8 py-4">Reference</th>
                             <th className="px-8 py-4">Entity Details</th>
                             <th className="px-8 py-4 text-right">Total Invoice</th>
                             <th className="px-8 py-4 text-right">Amount Paid</th>
                             <th className="px-8 py-4 text-right pr-12">Balance Due</th>
                           </>
                         )}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {filteredDetails.map((item) => (
                        <tr key={item._id} className="group hover:bg-gray-50/80 transition-colors">
                           {activeTab === "journal" ? (
                             <>
                               <td className="px-8 py-6">
                                  <div className="flex flex-col">
                                     <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit mb-1">
                                        JV-{item._id.substring(item._id.length - 4).toUpperCase()}
                                     </span>
                                     <span className="text-[10px] font-bold text-gray-400">
                                        {new Date(item.date).toLocaleDateString()}
                                     </span>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="flex flex-col">
                                     <span className="text-sm font-black text-gray-900 uppercase tracking-tight italic">{item.description}</span>
                                     <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.referenceType} Ref: {item.referenceId?.substring(18)}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6" colSpan={3}>
                                  <div className="space-y-1">
                                     {item.entries.map((entry, idx) => (
                                       <div key={idx} className="grid grid-cols-12 gap-2 text-[11px] font-bold border-b border-gray-50 pb-1">
                                          <div className="col-span-6 flex items-center gap-2">
                                             <div className={`w-1.5 h-1.5 rounded-full ${entry.debit > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                             <span className="text-gray-700 uppercase tracking-tight">{entry.account}</span>
                                          </div>
                                          <div className="col-span-3 text-right tabular-nums text-gray-900">
                                             {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                                          </div>
                                          <div className="col-span-3 text-right tabular-nums text-gray-900 pr-4">
                                             {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                                          </div>
                                       </div>
                                     ))}
                                  </div>
                               </td>
                             </>
                           ) : activeTab === "ledger" ? (
                             <>
                               <td className="px-8 py-6">
                                  <span className="text-[10px] font-black text-gray-400">
                                     {new Date(item.date).toLocaleDateString()}
                                  </span>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-2">
                                     <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.type}
                                     </span>
                                     <span className="text-xs font-bold text-gray-900">{item.category}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <span className="text-xs text-gray-500 italic max-w-xs truncate block">{item.description || 'No notes provided'}</span>
                               </td>
                               <td className="px-8 py-6">
                                  {item.customer ? (
                                    <span className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1"><Users className="w-3 h-3" /> {item.customer?.name}</span>
                                  ) : item.supplier ? (
                                    <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1"><Building2 className="w-3 h-3" /> {item.supplier?.company || item.supplier?.name}</span>
                                  ) : (
                                    <span className="text-[10px] font-black text-gray-300 uppercase italic">N/A</span>
                                  )}
                               </td>
                               <td className="px-8 py-6 text-right pr-12">
                                  <span className={`text-lg font-black tracking-tight ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                     {item.type === 'income' ? '+' : '-'} ₹{item.amount?.toLocaleString() || '0'}
                                  </span>
                               </td>
                             </>
                           ) : (
                             <>
                               <td className="px-8 py-6">
                                  <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
                                     #{item._id.substring(item._id.length - 6).toUpperCase()}
                                  </span>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="flex flex-col">
                                     <span className="text-sm font-black text-gray-900">
                                        {activeTab === 'receivables' ? item.customer?.name : (item.supplier?.company || item.supplier?.name)}
                                     </span>
                                     <span className="text-[10px] font-bold text-gray-400 uppercase">{item.product?.name || item.material?.name}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <span className="text-sm font-black text-gray-900">₹{item.totalAmount?.toLocaleString('en-IN')}</span>
                                </td>
                               <td className="px-8 py-6 text-right">
                                  <span className="text-sm font-bold text-green-600">₹{item.amountPaid?.toLocaleString('en-IN')}</span>
                               </td>
                               <td className="px-8 py-6 text-right pr-12">
                                  <div className="flex flex-col items-end">
                                     <span className="text-base font-black text-red-600 tracking-tight italic">₹{(item.totalAmount - (item.amountPaid || 0)).toLocaleString('en-IN')}</span>
                                     <div className="w-20 h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                         <div className="h-full bg-blue-500" style={{ width: `${((item.amountPaid || 0) / item.totalAmount) * 100}%` }}></div>
                                     </div>
                                  </div>
                               </td>
                             </>
                           )}
                        </tr>
                      ))}
                   </tbody>

                </table>
              )}
           </div>
        </div>


      </div>
    </AppLayout>
  );
};

export default Accounting;
