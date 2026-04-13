import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { 
  Plus, Search, Building2, Phone, Mail, MapPin, Trash2, Edit2, 
  ShieldCheck, ExternalLink, CheckCircle2, XCircle, AlertCircle, 
  Loader2, FileText, Anchor, Truck, ShoppingCart, Activity,
  Zap, Globe, Database, ArrowRight, Filter, Download
} from "lucide-react";
import Modal from "../components/common/Modal";
import { api, gstApi } from "../api/erpApi";
import { validateGSTIN } from "../utils/gstValidator";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterState, setFilterState] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", company: "", gstin: "", state: "", address: "", pincode: ""
  });

  const [gstValidation, setGstValidation] = useState({ isValid: true, message: "" });
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    if (formData.gstin) {
      const result = validateGSTIN(formData.gstin);
      setGstValidation(result);
    } else {
      setGstValidation({ isValid: true, message: "" });
    }
  }, [formData.gstin]);

  const handleFetchDetails = async () => {
    if (!gstValidation.isValid || !formData.gstin) return;
    try {
      setFetchLoading(true);
      const res = await gstApi.lookup(formData.gstin);
      const data = res.data;
      setFormData(prev => ({
        ...prev,
        company: data.companyName || prev.company,
        address: data.address || prev.address,
        state: data.state || prev.state,
        pincode: data.pincode || prev.pincode
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData(supplier);
    } else {
      setEditingSupplier(null);
      setFormData({ name: "", email: "", phone: "", company: "", gstin: "", state: "", address: "", pincode: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier._id}`, formData);
      } else {
        await api.post("/suppliers", formData);
      }
      fetchSuppliers();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("CRITICAL: Permanent removal of vendor entity? This action will archive historical inward links.")) {
      try {
        await api.delete(`/suppliers/${id}`);
        fetchSuppliers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const searchLow = searchTerm.toLowerCase();
    const matchSearch = (s.name || "").toLowerCase().includes(searchLow) ||
                        (s.company || "").toLowerCase().includes(searchLow) ||
                        (s.gstin || "").toLowerCase().includes(searchLow) ||
                        (s._id?.toString() || "").toLowerCase().includes(searchLow);
    
    const matchRegion = filterState === 'all' || s.state === filterState;

    return matchSearch && matchRegion;
  });

  return (
    <AppLayout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Elite Strategic Sourcing Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-purple-500/10 rounded-[2.5rem] flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-sm border border-purple-500/10">
                 <Anchor className="w-10 h-10 text-purple-600" />
              </div>
              <div>
                 <h2 className="text-5xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Strategic <span className="text-purple-600 not-italic">Sourcing</span></h2>
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Supply Chain & Vendor Portfolio Governance</span>
                 </div>
              </div>
           </div>

           <button onClick={() => handleOpenModal()} className="erp-button-primary !py-5 !bg-slate-900 !rounded-[2rem] hover:!bg-black group">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Onboard Logistics Partner
           </button>
        </div>

        {/* Global Sourcing Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm group hover:border-purple-200 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><Globe className="w-16 h-16 text-purple-600" /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Supply Network Intensity</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums italic">{suppliers.length} Active Nodes</h3>
              <div className="flex items-center gap-2 mt-4 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                 <Truck className="w-3.5 h-3.5" />
                 <span>Primary Logistics Coverage</span>
              </div>
           </div>
           <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cumulative Inward Flux</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums underline decoration-purple-100 decoration-8 underline-offset-4">₹12.4M</h3>
              <div className="flex items-center gap-2 mt-4 text-purple-500 font-bold text-[10px] uppercase tracking-widest">
                 <ShoppingCart className="w-3.5 h-3.5 animate-bounce" />
                 <span>Total Procurement Volume</span>
              </div>
           </div>
           <div className="p-10 bg-slate-900 rounded-[3rem] shadow-2xl shadow-slate-900/20 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Zap className="w-16 h-16 text-white rotate-12" />
              </div>
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4">Risk Exposure Index</p>
              <h3 className="text-4xl font-black text-white tracking-tightest tabular-nums">0.08 <span className="text-[10px] uppercase opacity-40">ALPHA</span></h3>
              <div className="flex items-center gap-2 mt-4 text-purple-400 font-bold text-[10px] uppercase tracking-widest">
                 <Database className="w-3.5 h-3.5" />
                 <span>Systemic Stability Active</span>
              </div>
           </div>
        </div>

        {/* Unified Sourcing Hub Container */}
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden mb-20">
           <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative group w-full max-w-md">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                 <input 
                    type="text"
                    placeholder="Registry Lookup: Partner UID, GSTIN or Corporate Label..."
                    className="w-full pl-14 pr-8 py-5 bg-slate-50 border-transparent rounded-[2rem] text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/5 focus:border-purple-500/20 transition-all shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center gap-4">
                 <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-4 rounded-2xl transition-all active:scale-95 ${showFilters ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                     <Filter className="w-5 h-5" />
                  </button>
                 <button className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-all active:scale-95"><Download className="w-5 h-5" /></button>
                 <div className="h-10 w-px bg-slate-100 mx-2"></div>
                 <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-purple-100 flex items-center justify-center text-[10px] font-black text-purple-600">V{i}</div>)}
                 </div>
              </div>
           </div>

           {/* Advanced Filter Manifold */}
           {showFilters && (
              <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-50 flex flex-wrap gap-10 animate-in slide-in-from-top-2 duration-500">
                 <div className="space-y-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Regional Distribution</p>
                    <div className="flex flex-wrap gap-2">
                       {['all', ...new Set(suppliers.map(s => s.state).filter(Boolean))].map(state => (
                          <button 
                             key={state}
                             onClick={() => setFilterState(state)}
                             className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filterState === state ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                          >
                             {state}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex-1 flex justify-end items-end pb-1">
                    <button 
                       onClick={() => { setFilterState("all"); setSearchTerm(""); }}
                       className="text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                       <Trash2 className="w-3.5 h-3.5" /> Purge Matrix Filters
                    </button>
                 </div>
              </div>
           )}

           <div className="overflow-x-auto">
              {loading ? (
                <div className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] animate-pulse text-[10px]">Accessing Sourcing Master Registry...</div>
              ) : (
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
                         <th className="px-12 py-8">Partner Dynamics</th>
                         <th className="px-12 py-8">Corporate Logic</th>
                         <th className="px-12 py-8 text-center">Connectivity Pulse</th>
                         <th className="px-12 py-8 text-right pr-20">Protocol Control</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredSuppliers.map((s) => (
                        <tr key={s._id} className="group hover:bg-slate-50/80 transition-all duration-500">
                           <td className="px-12 py-10">
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1.5">{s.state || "GLOBAL SOURCE"}</span>
                                 <span className="text-xl font-black text-slate-900 tracking-tightest group-hover:text-purple-600 transition-colors uppercase italic">{s.name}</span>
                                 <div className="flex items-center gap-2 mt-2">
                                    <MapPin className="w-3 h-3 text-slate-300" />
                                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-xs">{s.address?.slice(0, 30)}...</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-12 py-10">
                              <div className="flex flex-col">
                                 <span className="text-base font-black text-slate-900 tracking-tightest uppercase">{s.company || "Private Stakeholder"}</span>
                                 <div className="flex items-center gap-2 mt-2">
                                    <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black border border-blue-100 uppercase tracking-widest shadow-sm shadow-blue-500/5">GSTIN: {s.gstin || "B2C_ENTITY"}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-12 py-10 text-center">
                              <div className="flex flex-col items-center gap-2">
                                 <div className="flex items-center gap-2 text-sm font-black text-slate-900 tracking-tightest tabular-nums">
                                    <Phone className="w-3.5 h-3.5 text-slate-300" />
                                    {s.phone || "---"}
                                 </div>
                                 <div className="text-[10px] font-bold text-slate-400 truncate max-w-[120px] italic">{s.email}</div>
                              </div>
                           </td>
                           <td className="px-12 py-10 text-right pr-20">
                              <div className="flex items-center justify-end gap-3 transition-all">
                                 <Link to={`/statements/${s._id}?type=supplier`} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm"><FileText className="w-5 h-5" /></Link>
                                 <button onClick={() => handleOpenModal(s)} className="p-3 bg-slate-50 text-slate-400 hover:text-purple-600 rounded-2xl transition-all shadow-sm"><Edit2 className="w-5 h-5" /></button>
                                 <button onClick={() => handleDelete(s._id)} className="p-3 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-2xl transition-all shadow-sm"><Trash2 className="w-5 h-5" /></button>
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

      {/* Advanced Onboarding Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingSupplier ? "Configure Logistics Entity" : "Authorize New Sourcing Node"}
      >
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
           <div className="grid grid-cols-2 gap-8">
              <div className="col-span-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Partner Identity / Contact Name</label>
                 <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Ramesh Kumar" className="erp-input !py-6 !bg-slate-50 focus:!bg-white" />
              </div>
              <div className="col-span-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Corporate Identity</label>
                 <input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Global Sourcing Ltd." className="erp-input !py-5" />
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Protocol UID (GSTIN)</label>
                 <div className="relative group">
                    <input value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value.toUpperCase()})} placeholder="GSTIN-REF-XX" className="erp-input !py-5 uppercase tabular-nums tracking-widest pr-14" />
                    <button type="button" onClick={handleFetchDetails} disabled={fetchLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-200 active:scale-90 transition-all">
                       {fetchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                 </div>
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Jurisdiction (State)</label>
                 <input required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} placeholder="e.g. GUJARAT" className="erp-input !py-5 uppercase font-black" />
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Mobile Pulse</label>
                 <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 XXXX XXX XXX" className="erp-input !py-5 font-mono" />
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Account Registry (Email)</label>
                 <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="vendor@node.com" className="erp-input !py-5" />
              </div>
              <div className="col-span-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Logistics Hub Address</label>
                 <textarea rows="3" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="erp-input !py-5 resize-none h-24" placeholder="Warehouse address link..." />
              </div>
           </div>

           <div className="flex gap-4 pt-6">
              <button type="submit" className="erp-button-primary flex-1 !py-6 !bg-slate-900 !text-white hover:!bg-black group">
                 <ShieldCheck className="w-5 h-5 group-hover:animate-bounce" />
                 {editingSupplier ? "Synchronize Entity Data" : "Onboard Strategic Partner"}
              </button>
           </div>
        </form>
      </Modal>

    </AppLayout>
  );
};

export default Suppliers;
