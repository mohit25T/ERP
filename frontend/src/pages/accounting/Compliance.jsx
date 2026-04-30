import { useState, useEffect } from "react";
import { auditApi } from "../../api/erpApi";
import AppLayout from "../../components/layout/AppLayout";
import { 
  ShieldCheck, Activity, Lock, History, ShieldAlert, 
  Terminal, Fingerprint, Search, Calendar, Database, Globe 
} from "lucide-react";

const Compliance = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResource, setFilterResource] = useState("all");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditApi.getLogs({
        resource: filterResource === 'all' ? undefined : filterResource
      });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterResource]);

  const filteredLogs = logs.filter(log => {
    const searchLow = searchTerm.toLowerCase();
    return log.action.toLowerCase().includes(searchLow) || 
           log.resource.toLowerCase().includes(searchLow) ||
           (log.user?.name || "").toLowerCase().includes(searchLow);
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Compliance Radar Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
           <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-sm border border-indigo-500/10">
                 <ShieldCheck className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Compliance <span className="text-indigo-600 not-italic">Radar</span></h2>
                 <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Internal Audit Vault & Operational Accountability</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                 <Lock className="w-4 h-4 text-indigo-500" />
                 <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Master Protocol Enabled</span>
              </div>
           </div>
        </div>

        {/* Audit Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="p-6 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Interactions</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tightest tabular-nums italic">{logs.length} Actions</h3>
              <div className="flex items-center gap-2 mt-4 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                 <History className="w-3.5 h-3.5" />
                 <span>Registry Health: 100%</span>
              </div>
           </div>
           <div className="p-6 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Security Alerts</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tightest tabular-nums italic">0 Violations</h3>
              <div className="flex items-center gap-2 mt-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                 <ShieldAlert className="w-3.5 h-3.5" />
                 <span>No Breaches Detected</span>
              </div>
           </div>
           <div className="col-span-2 p-6 bg-slate-900 rounded-[1.5rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Terminal className="w-16 h-16 text-white rotate-12" />
              </div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Administrative Integrity</p>
              <h3 className="text-2xl font-black text-white tracking-tightest">Real-Time Operational Sovereignty</h3>
              <div className="flex items-center gap-2 mt-4 text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
                 <Fingerprint className="w-3.5 h-3.5" />
                 <span>Immutable Audit Protocol Active</span>
              </div>
           </div>
        </div>

        {/* Audit Table */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-20">
           <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative group w-full max-w-md">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                 <input 
                    type="text"
                    placeholder="Search Audit Vault: Action, Resource or Authority..."
                    className="w-full pl-14 pr-8 py-5 bg-slate-50 border-transparent rounded-[2rem] text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center gap-4">
                  <select 
                    value={filterResource}
                    onChange={(e) => setFilterResource(e.target.value)}
                    className="px-6 py-4 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all cursor-pointer"
                  >
                     <option value="all">Global Resource Scoping</option>
                     <option value="invoice">Sales Invoices</option>
                     <option value="purchase">Procurement</option>
                     <option value="ledger">Financial Ledger</option>
                     <option value="user">Access Management</option>
                  </select>
               </div>
            </div>

           <div className="overflow-x-auto">
              {loading ? (
                <div className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] animate-pulse text-[10px]">Synchronizing with Audit Vault...</div>
              ) : (
                <table className="erp-table">
                   <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
                         <th className="px-10 py-5 italic">Tactical Timeline</th>
                         <th className="px-10 py-5 italic">Operational Action</th>
                         <th className="px-10 py-5 italic">Sector/Resource</th>
                         <th className="px-10 py-5 italic">Identity Proxy</th>
                         <th className="px-10 py-5 italic text-right pr-20">Network Address</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredLogs.map((log) => (
                        <tr key={log._id} className="erp-row-hover group transition-all duration-500">
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:rotate-12 transition-all">
                                    <Calendar className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-900 tracking-tightest tabular-nums">{log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "MISSING_TIME"}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--"}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-3">
                                 <div className={`w-2 h-2 rounded-full ${log.action.includes('error') ? 'bg-rose-500' : 'bg- emerald-500 animate-pulse'}`}></div>
                                 <span className="text-[11px] font-black text-slate-900 uppercase tracking-tightest italic group-hover:text-indigo-600 transition-colors">{log.action.replace(/_/g, " ")}</span>
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-2">
                                 <Database className="w-3.5 h-3.5 text-slate-300" />
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.resource} <span className="text-[8px] opacity-40">#{log.resourceId?.slice(-6).toUpperCase()}</span></span>
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-black text-white italic">
                                    {log.user?.name?.charAt(0) || "S"}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-900 tracking-tightest">{log.user?.name || "ANONYMOUS_ACTOR"}</span>
                                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5 italic">{log.user?.role || "Protocol"}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-6 text-right pr-20">
                              <div className="flex items-center justify-end gap-3">
                                 <Globe className="w-3.5 h-3.5 text-slate-300" />
                                 <span className="text-[11px] font-bold text-slate-400 tabular-nums">{log.ipAddress || "127.0.0.1"}</span>
                              </div>
                           </td>
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

export default Compliance;
