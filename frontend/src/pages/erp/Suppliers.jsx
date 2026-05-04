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
      <div className="space-y-6 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center shadow-sm border border-slate-100">
                 <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Suppliers</h2>
                 <p className="text-sm font-medium text-slate-500">Manage vendor portfolios, contacts, and inward logistics</p>
              </div>
           </div>

           <button onClick={() => handleOpenModal()} className="erp-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Supplier
           </button>
        </div>

        {/* Global Sourcing Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="p-5 bg-white rounded-md border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-sm font-semibold text-slate-500">Active Suppliers</p>
                 <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Globe className="w-4 h-4" />
                 </div>
              </div>
               <div>
                  <h3 className="text-2xl font-bold text-slate-900">{suppliers.length} Suppliers</h3>
                  <p className="text-xs font-medium text-indigo-600 mt-1 flex items-center gap-1">
                     Registered Partners
                  </p>
               </div>
           </div>
           
           <div className="p-5 bg-white rounded-md border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-sm font-semibold text-slate-500">Total Procurement</p>
                 <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <ShoppingCart className="w-4 h-4" />
                 </div>
              </div>
               <div>
                  <h3 className="text-2xl font-bold text-slate-900">₹0</h3>
                  <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                     Total Procurement Value
                  </p>
               </div>
           </div>

           <div className="p-5 bg-primary/5 rounded-md border border-primary/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-sm font-semibold text-primary">Risk Exposure</p>
                 <div className="p-2 bg-primary/20 rounded-lg text-primary">
                    <Database className="w-4 h-4" />
                 </div>
              </div>
               <div>
                  <h3 className="text-2xl font-bold text-slate-900">0.0 Alpha</h3>
                  <p className="text-xs font-medium text-primary/80 mt-1 flex items-center gap-1">
                     Active Risk Monitoring
                  </p>
               </div>
           </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden mb-20">
           <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full max-w-sm">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    type="text"
                    placeholder="Search partner, GSTIN or corporate label..."
                    className="erp-input w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                 <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2.5 rounded-md border transition-colors ${showFilters ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    title="Filters"
                 >
                    <Filter className="w-4 h-4" />
                 </button>
                 <button className="p-2.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors" title="Export">
                    <Download className="w-4 h-4" />
                 </button>
              </div>
           </div>

           {/* Filters */}
           {showFilters && (
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-6 items-end animate-in fade-in slide-in-from-top-2">
                 <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Regional Distribution</p>
                    <div className="flex flex-wrap gap-2">
                       {['all', ...new Set(suppliers.map(s => s.state).filter(Boolean))].map(state => (
                          <button 
                             key={state}
                             onClick={() => setFilterState(state)}
                             className={`px-4 py-2 rounded-md text-sm font-semibold transition-all border capitalize ${filterState === state ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                          >
                             {state}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex-1 flex justify-end">
                    <button 
                       onClick={() => { setFilterState("all"); setSearchTerm(""); }}
                       className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2"
                    >
                       <Trash2 className="w-4 h-4" /> Clear Filters
                    </button>
                 </div>
              </div>
           )}

           <div className="overflow-x-auto">
              {loading ? (
                <HammerLoader />
              ) : filteredSuppliers.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center text-slate-500">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Anchor className="w-8 h-8 text-slate-300" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-1">No suppliers found</h3>
                   <p className="text-sm font-medium">Adjust your search or filters to find what you're looking for.</p>
                </div>
              ) : (
                <table className="erp-table">
                   <thead>
                      <tr>
                         <th>Supplier Contact</th>
                         <th>Corporate Entity</th>
                         <th className="text-center">Contact Info</th>
                         <th className="text-center">Actions</th>
                      </tr>
                   </thead>
                   <tbody>
                      <AnimatePresence mode="popLayout">
                        {filteredSuppliers.map((s, index) => (
                          <motion.tr 
                            key={s._id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.02 }}
                            className="group erp-row-hover"
                          >
                           <td>
                              <div className="flex flex-col">
                                 <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{s.state || "Global"}</span>
                                 <span className="text-sm font-bold text-slate-900">{s.name || "Unknown"}</span>
                                 <div className="flex items-center gap-2 mt-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-500 truncate max-w-xs">{s.address?.slice(0, 30)}...</span>
                                 </div>
                              </div>
                           </td>
                           <td>
                              <div className="flex flex-col">
                                 <span className="text-sm font-bold text-slate-900">{s.company || "Corporate Entity"}</span>
                                 <div className="flex items-center gap-2 mt-1">
                                    <div className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200 tracking-wider">GSTIN: {s.gstin || "N/A"}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                 <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                    {s.phone || "---"}
                                 </div>
                                 <div className="text-xs font-medium text-slate-500 truncate max-w-[150px]">{s.email}</div>
                              </div>
                           </td>
                           <td className="text-center">
                              <div className="flex items-center justify-center gap-2 transition-all">
                                 <Link to={`/statements/${s._id}?type=supplier`} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-md transition-colors" title="Statement"><FileText className="w-4 h-4" /></Link>
                                 <button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-md transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                 <button onClick={() => handleDelete(s._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
        title={editingSupplier ? "Edit Supplier" : "New Supplier"}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">Contact Name</label>
                 <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Ramesh Kumar" className="erp-input" />
              </div>
              <div className="col-span-2">
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">Company Name</label>
                 <input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Global Sourcing Ltd." className="erp-input" />
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">GSTIN</label>
                 <div className="relative">
                    <input value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value.toUpperCase()})} placeholder="GSTIN-REF-XX" className="erp-input uppercase pr-10" />
                    <button type="button" onClick={handleFetchDetails} disabled={fetchLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-md transition-colors">
                       {fetchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                 </div>
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">State</label>
                 <input required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} placeholder="e.g. GUJARAT" className="erp-input uppercase" />
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">Phone Number</label>
                 <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 XXXX XXX XXX" className="erp-input" />
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">Email Address</label>
                 <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="vendor@example.com" className="erp-input" />
              </div>
              <div className="col-span-2">
                 <label className="text-xs font-semibold text-slate-500 block mb-1.5">Registered Address</label>
                 <textarea rows="3" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="erp-input resize-none py-2.5 h-24" placeholder="Full corporate or warehouse address..." />
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="erp-button-secondary">Cancel</button>
              <button type="submit" className="erp-button-primary">
                 {editingSupplier ? "Save Changes" : "Create Supplier"}
              </button>
           </div>
        </form>
      </Modal>

    </AppLayout>
  );
};

export default Suppliers;
