import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { Plus, Search, Building2, Phone, Mail, MapPin, Trash2, Edit2, ShieldCheck, ExternalLink, CheckCircle2, XCircle, AlertCircle, Loader2, FileText } from "lucide-react";
import Modal from "../components/common/Modal";
import { api, gstApi } from "../api/erpApi";
import { validateGSTIN } from "../utils/gstValidator";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    gstin: "",
    state: "",
    address: "",
    pincode: ""
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
      const { companyName, address, state } = res.data;
      
      setFormData(prev => ({
        ...prev,
        company: companyName || prev.company,
        address: address || prev.address,
        state: state || prev.state
      }));
    } catch (err) {
      console.error("Failed to fetch GST details", err);
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
      console.error("Error fetching suppliers:", err);
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
      console.error("Error saving supplier:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await api.delete(`/suppliers/${id}`);
        fetchSuppliers();
      } catch (err) {
        console.error("Error deleting supplier:", err);
      }
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.gstin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Header section with Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-3xl shadow-xl shadow-purple-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
               <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Vendor Hub</h2>
              <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                Procurement & Supply Chain
              </p>
            </div>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="group relative px-8 py-4 bg-gray-900 rounded-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl hover:shadow-purple-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Plus className="w-5 h-5 text-white relative z-10" />
            <span className="text-white font-black text-sm relative z-10">Add Supplier</span>
          </button>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100/50 backdrop-blur-xl overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
              <input 
                type="text"
                placeholder="Search by vendor, GSTIN or company..."
                className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
              <span className="px-3 py-1 bg-gray-50 rounded-full">{filteredSuppliers.length} Total Partners</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center">
                <div className="inline-block w-12 h-12 border-4 border-gray-100 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-400 font-bold uppercase text-[10px] tracking-widest">Accessing Vendor Ledger...</p>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-20 text-center">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10 text-gray-300" />
                 </div>
                 <p className="text-gray-900 font-black text-xl mb-2">No Vendors Documented</p>
                 <p className="text-gray-400 text-sm max-w-xs mx-auto font-medium">Capture your supply chain details to enable seamless inward stock management.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                    <th className="px-8 py-4">Partner Details</th>
                    <th className="px-8 py-4">Corporate Info</th>
                    <th className="px-8 py-4">Contact</th>
                    <th className="px-8 py-4 text-right pr-12">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSuppliers.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50/80 transition-all group">
                      <td className="px-8 py-6">
                         <div className="flex flex-col">
                            <span className="text-[10px] text-purple-600 font-black uppercase tracking-widest mb-1">{s.state || 'Unknown State'}</span>
                            <span className="font-black text-gray-900 text-lg group-hover:text-purple-600 transition-colors uppercase tracking-tighter">{s.name}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-tight">
                             <Building2 className="w-3.5 h-3.5 text-gray-400" />
                             {s.company || 'Private Vendor'}
                          </div>
                          <div className="text-[10px] font-black text-blue-500 bg-blue-50 inline-block px-2 py-0.5 rounded uppercase tracking-widest border border-blue-100 shadow-sm shadow-blue-500/10">
                             GSTIN: {s.gstin || 'B2C VENDOR'}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                             <Mail className="w-3.5 h-3.5" />
                             {s.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                             <Phone className="w-3.5 h-3.5" />
                             {s.phone || 'No phone'}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right pr-8">
                          <div className="flex justify-end gap-2 text-right">
                             <Link 
                               to={`/statements/${s._id}?type=supplier`}
                               className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/10"
                             >
                                <FileText className="w-4 h-4" />
                             </Link>
                             <button 
                               onClick={() => handleOpenModal(s)}
                               className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm hover:shadow-xl hover:shadow-purple-500/10"
                             >
                                <Edit2 className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => handleDelete(s._id)}
                               className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-600 hover:border-red-200 transition-all shadow-sm hover:shadow-xl hover:shadow-red-500/10"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Supplier Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={editingSupplier ? "Configure Partner" : "Onboard New Supplier"}
        >
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Supplier / Contact Name</label>
                <input 
                  required
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-inner"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Company Name</label>
                <input 
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-inner"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="Business Name Ltd."
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center justify-between mb-2 px-1">
                   <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Vendor GSTIN</label>
                   {formData.gstin && gstValidation.isValid && (
                      <button 
                        type="button"
                        onClick={handleFetchDetails}
                        disabled={fetchLoading}
                        className="flex items-center gap-1 text-[9px] font-black text-purple-600 uppercase hover:text-purple-700 transition-colors disabled:opacity-50"
                      >
                         {fetchLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Search className="w-2.5 h-2.5" />}
                         {fetchLoading ? "Fetching..." : "Auto-Fill"}
                      </button>
                   )}
                </div>
                <div className="relative">
                  <input 
                    className={`w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all shadow-inner uppercase tracking-widest placeholder:normal-case ${
                      formData.gstin 
                        ? (gstValidation.isValid ? 'text-green-600 ring-green-500/20' : 'text-red-500 ring-red-500/20')
                        : 'text-blue-600 focus:ring-purple-500/20'
                    }`}
                    value={formData.gstin}
                    onChange={(e) => setFormData({...formData, gstin: e.target.value.replace(/\s+/g, "").toUpperCase()})}
                    placeholder="Optional for ITC"
                  />
                  {formData.gstin && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {gstValidation.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
                {formData.gstin && !gstValidation.isValid && (
                  <p className="mt-1.5 px-1 flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-tight leading-tight">
                    <AlertCircle className="w-3 h-3" />
                    {gstValidation.message}
                  </p>
                )}
              </div>

              <div className="col-span-2 md:col-span-1">
                 <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">State (Supply Source)</label>
                 <input 
                   required
                   className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-inner uppercase font-black"
                   value={formData.state}
                   onChange={(e) => setFormData({...formData, state: e.target.value})}
                   placeholder="e.g. GUJARAT"
                 />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Mobile / Phone</label>
                <input 
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-inner"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 XXXX XXX XXX"
                />
              </div>

              <div className="col-span-2">
                 <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Email Address</label>
                 <input 
                   required
                   type="email"
                   className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-inner"
                   value={formData.email}
                   onChange={(e) => setFormData({...formData, email: e.target.value})}
                   placeholder="vendor@example.com"
                 />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Full Logistics Address</label>
                <textarea 
                  rows="3"
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-inner resize-none"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Warehouse address, Landmarker, etc."
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Partner Pincode</label>
                <input 
                  required
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-inner"
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                  placeholder="400001"
                  maxLength="6"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-50">
               <button 
                 type="button" 
                 onClick={() => setIsModalOpen(false)}
                 className="flex-1 py-4 bg-white text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all"
               >
                 Discard
               </button>
               <button 
                 type="submit"
                 className="flex-1 py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-gray-400/20 hover:bg-purple-600 active:scale-95 transition-all"
               >
                 {editingSupplier ? "Update Ledger" : "Onboard Partner"}
               </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Suppliers;
