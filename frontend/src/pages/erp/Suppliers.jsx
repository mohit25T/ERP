import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, gstApi } from "../../api/erpApi";
import { validateGSTIN } from "../../utils/gstValidator";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import HammerLoader from "../../components/common/HammerLoader";
import { 
  Building2, Plus, Globe, ShoppingCart, Database, 
  Search, Filter, Download, Trash2, Anchor, 
  MapPin, Phone, FileText, Edit2, Loader2 
} from "lucide-react";

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
    if (window.confirm("CRITICAL: Permanent removal of vendor entity?")) {
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
      <div className="space-y-6 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-card rounded-md flex items-center justify-center shadow-sm border border-border">
                 <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Supply Chain Hub</h2>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vendor Portfolios & Strategic Inward Logistics</p>
              </div>
           </div>

           <button onClick={() => handleOpenModal()} className="erp-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Authorize Partner
           </button>
        </div>

        {/* Global Sourcing Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="p-5 bg-card rounded-md border border-border shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Network</p>
                 <div className="p-2 bg-indigo-500/10 rounded text-indigo-600 dark:text-indigo-400">
                    <Globe className="w-4 h-4" />
                 </div>
              </div>
               <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tighter">{suppliers.length} Nodes</h3>
                  <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 uppercase tracking-widest">
                     Registered Sourcing Partners
                  </p>
               </div>
           </div>
           
           <div className="p-5 bg-card rounded-md border border-border shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fiscal Inflow</p>
                 <div className="p-2 bg-emerald-500/10 rounded text-emerald-600 dark:text-emerald-400">
                    <ShoppingCart className="w-4 h-4" />
                 </div>
              </div>
               <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tighter">₹0</h3>
                  <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-widest">
                     Total Procurement Index
                  </p>
               </div>
           </div>

           <div className="p-5 bg-primary/5 rounded-md border border-primary/20 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Risk Assessment</p>
                 <div className="p-2 bg-primary/20 rounded text-primary">
                    <Database className="w-4 h-4" />
                 </div>
              </div>
               <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tighter">0.0 Alpha</h3>
                  <p className="text-[9px] font-bold text-primary mt-1 uppercase tracking-widest">
                     Active Exposure Monitoring
                  </p>
               </div>
           </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden mb-20">
           <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/5">
              <div className="relative w-full max-w-sm group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input 
                    type="text"
                    placeholder="Search Partners..."
                    className="erp-input w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                 <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 border rounded-md transition-all ${showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
                    title="Filters"
                 >
                    <Filter className="w-4 h-4" />
                 </button>
                 <button className="p-2 border border-border bg-card rounded-md text-muted-foreground hover:text-foreground transition-all shadow-sm" title="Export">
                    <Download className="w-4 h-4" />
                 </button>
              </div>
           </div>

           {/* Filters */}
           {showFilters && (
              <div className="p-4 bg-muted/10 border-b border-border flex flex-wrap gap-6 items-end animate-in fade-in slide-in-from-top-2">
                 <div className="space-y-2">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Regional Matrix</p>
                    <div className="flex flex-wrap gap-2">
                       {['all', ...new Set(suppliers.map(s => s.state).filter(Boolean))].map(state => (
                          <button 
                             key={state}
                             onClick={() => setFilterState(state)}
                             className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all border ${filterState === state ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'}`}
                          >
                             {state}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex-1 flex justify-end">
                    <button 
                       onClick={() => { setFilterState("all"); setSearchTerm(""); }}
                       className="text-[9px] font-bold text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2 uppercase tracking-widest"
                    >
                       <Trash2 className="w-3.5 h-3.5" /> Clear Matrix
                    </button>
                 </div>
              </div>
           )}

           <div className="overflow-x-auto">
              {loading ? (
                <HammerLoader />
              ) : filteredSuppliers.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
                   <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4 border border-border">
                      <Anchor className="w-8 h-8 text-muted-foreground/30" />
                   </div>
                   <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-1">No identifiers detected</h3>
                   <p className="text-[10px] font-medium uppercase tracking-tighter">Adjust search or regional matrix</p>
                </div>
              ) : (
                <table className="erp-table">
                   <thead>
                      <tr>
                         <th>Vendor Protocol</th>
                         <th>Corporate Entity</th>
                         <th className="text-center">Communication Nodes</th>
                         <th className="text-center">Control</th>
                      </tr>
                   </thead>
                   <tbody>
                      <AnimatePresence mode="popLayout">
                        {filteredSuppliers.map((s, index) => (
                          <motion.tr 
                            key={s._id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.01 }}
                            className="erp-row-hover"
                          >
                           <td>
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">{s.state || "GLOBAL"}</span>
                                 <span className="text-sm font-bold text-foreground">{s.name || "Unknown"}</span>
                                 <div className="flex items-center gap-2 mt-1">
                                    <MapPin className="w-3 h-3 text-muted-foreground opacity-50" />
                                    <span className="text-[10px] font-medium text-muted-foreground truncate max-w-xs">{s.address?.slice(0, 40)}...</span>
                                 </div>
                              </div>
                           </td>
                           <td>
                              <div className="flex flex-col">
                                 <span className="text-xs font-bold text-foreground">{s.company || "CORPORATE ENTITY"}</span>
                                 <div className="flex items-center gap-2 mt-1">
                                    <div className="px-2 py-0.5 bg-muted/40 text-muted-foreground rounded text-[10px] font-black border border-border/50 tracking-wider">GSTIN: {s.gstin || "NOT-REQUIRED"}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                 <div className="flex items-center gap-2 text-xs font-black text-foreground tabular-nums">
                                    <Phone className="w-3.5 h-3.5 text-muted-foreground opacity-40" />
                                    {s.phone || "---"}
                                 </div>
                                 <div className="text-[10px] font-bold text-muted-foreground truncate max-w-[150px] opacity-70">{s.email}</div>
                              </div>
                           </td>
                           <td className="text-center">
                              <div className="flex items-center justify-center gap-1.5 transition-all">
                                 <Link to={`/statements/${s._id}?type=supplier`} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded transition-colors" title="Audit Statement"><FileText className="w-3.5 h-3.5" /></Link>
                                 <button onClick={() => handleOpenModal(s)} className="p-1.5 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Modify Record"><Edit2 className="w-3.5 h-3.5" /></button>
                                 <button onClick={() => handleDelete(s._id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors" title="Decommission"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                           </td>
                        </motion.tr>
                      ))}
                      </AnimatePresence>
                   </tbody>
                </table>
              )}
           </div>
        </div>

      </div>

      {/* Modals */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingSupplier ? "Modify Vendor Protocol" : "Authorize New Strategic Partner"}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 ml-1">Principal Name</label>
                 <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full legal name..." className="erp-input" />
              </div>
              <div className="col-span-2">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 ml-1">Corporate Label</label>
                 <input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Registered entity name..." className="erp-input" />
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 ml-1">GSTIN Registry</label>
                 <div className="relative">
                    <input value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value.toUpperCase()})} placeholder="GSTIN..." className="erp-input uppercase pr-10" />
                    <button type="button" onClick={handleFetchDetails} disabled={fetchLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded transition-colors">
                       {fetchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    </button>
                 </div>
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 ml-1">State Jurisdiction</label>
                 <input required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} placeholder="e.g. MAHARASHTRA" className="erp-input uppercase" />
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 ml-1">Communication Node (Phone)</label>
                 <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91..." className="erp-input" />
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 ml-1">Communication Node (Email)</label>
                 <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="node@corp.com" className="erp-input" />
              </div>
              <div className="col-span-2">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 ml-1">Registered Logistics Point</label>
                 <textarea rows="3" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="erp-input resize-none py-2.5 h-24" placeholder="Full address..." />
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={() => setIsModalOpen(false)} className="erp-button-secondary">Cancel</button>
              <button type="submit" className="erp-button-primary">
                 {editingSupplier ? "Commit Changes" : "Authorize Node"}
              </button>
           </div>
        </form>
      </Modal>

    </AppLayout>
  );
};

export default Suppliers;
