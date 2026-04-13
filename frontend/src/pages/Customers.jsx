import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/common/Modal";
import CustomerForm from "../components/forms/CustomerForm";
import { customerApi } from "../api/erpApi";
import { 
  Plus, Search, Users as UsersIcon, Edit2, Trash2, 
  Activity, ShieldCheck, Zap, ArrowRight, UserPlus,
  Briefcase, Globe, Star, TrendingUp, Filter, Download
} from "lucide-react";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerApi.getAll();
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data) => {
    try {
      setFormLoading(true);
      if (editingCustomer) {
        await customerApi.update(editingCustomer._id, data);
      } else {
        await customerApi.create(data);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      alert("Validation failure: " + (err.response?.data?.msg || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("CRITICAL: Permanent deletion of client account? Historical transaction links will be preserved in audit logs only.")) {
      try {
        await customerApi.delete(id);
        fetchCustomers();
      } catch (err) {
        alert("Deletion failed: Account has active receivables.");
      }
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.company || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'regular' && (c.type === 'regular' || !c.type)) ||
                      (activeTab === 'scrap_buyer' && c.type === 'scrap_buyer');
    return matchesSearch && matchesTab;
  });

  return (
    <AppLayout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Elite CRM Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center group hover:rotate-12 transition-transform duration-500 shadow-sm border border-primary/10">
                 <UsersIcon className="w-10 h-10 text-primary" />
              </div>
              <div>
                 <h2 className="text-5xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Client <span className="text-primary not-italic">Dynamics</span></h2>
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Strategic Account Governance & CRM Hub</span>
                 </div>
              </div>
           </div>

           <button onClick={handleOpenAdd} className="erp-button-primary !py-5 !bg-slate-900 !rounded-[2rem] hover:!bg-black group">
              <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Initialize New Account
           </button>
        </div>

        {/* Strategic Account Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm group hover:border-primary/20 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp className="w-16 h-16 text-primary" /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Portfolio Intensity</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums italic">{customers.length} Nodes</h3>
              <div className="flex items-center gap-2 mt-4 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                 <Globe className="w-3.5 h-3.5" />
                 <span>Global Relationship Coverage</span>
              </div>
           </div>
           <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Top Tier Retention</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums underline decoration-primary/20 decoration-8 underline-offset-4">94.2%</h3>
              <div className="flex items-center gap-2 mt-4 text-primary font-bold text-[10px] uppercase tracking-widest">
                 <Star className="w-3.5 h-3.5 animate-pulse" />
                 <span>Strategic Loyalty Index</span>
              </div>
           </div>
           <div className="p-10 bg-slate-900 rounded-[3rem] shadow-2xl shadow-slate-900/20 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Zap className="w-16 h-16 text-white rotate-12" />
              </div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Market Exposure</p>
              <h3 className="text-4xl font-black text-white tracking-tightest tabular-nums italic">₹8.4M</h3>
              <div className="flex items-center gap-2 mt-4 text-primary font-bold text-[10px] uppercase tracking-widest">
                 <Briefcase className="w-3.5 h-3.5" />
                 <span>Projected Quarterly Flux</span>
              </div>
           </div>
        </div>

        {/* Account Control Strip */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm gap-6">
           <div className="relative group w-full max-w-md">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                 type="text"
                 placeholder="Locate Account Identity or Company Node..."
                 className="w-full pl-14 pr-8 py-5 bg-slate-50 border-transparent rounded-[2rem] text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all shadow-inner"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              {[
                { id: 'all', label: 'All Partners' },
                { id: 'regular', label: 'Commercial Clients' },
                { id: 'scrap_buyer', label: 'Salvage Partners' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
           </div>
        </div>

        {/* Global Client Registry */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
           {loading ? (
              <div className="col-span-full p-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] animate-pulse text-[10px]">Accessing Client Master Data...</div>
           ) : filteredCustomers.length === 0 ? (
              <div className="col-span-full p-40 flex flex-col items-center justify-center text-slate-200">
                 <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-10 border border-slate-100">
                    <UsersIcon className="w-10 h-10 text-slate-300" />
                 </div>
                 <h3 className="text-3xl font-black text-slate-900 tracking-tightest uppercase italic">Archive Uncharted</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">No account nodes matching parameters</p>
              </div>
           ) : (
             filteredCustomers.map((customer) => (
               <div key={customer._id} className="group bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:border-primary/20 transition-all duration-500 overflow-hidden relative">
                  <div className="p-10 space-y-8">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white font-black text-2xl group-hover:rotate-6 transition-transform shadow-lg shadow-black/10">
                              {customer.name.charAt(0).toUpperCase()}
                           </div>
                           <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tightest group-hover:text-primary transition-colors uppercase leading-none">{customer.name}</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 w-fit">{customer.company || "Individual Operator"}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleOpenEdit(customer)} className="p-3 bg-slate-50 text-slate-400 hover:bg-primary hover:text-white rounded-2xl transition-all active:scale-90"><Edit2 className="w-4 h-4" /></button>
                           <button onClick={() => handleDelete(customer._id)} className="p-3 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all active:scale-90"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="flex flex-col p-6 bg-slate-50 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                              {customer.type === 'scrap_buyer' ? <Recycle className="w-3 h-3 text-rose-500" /> : <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                              Account Classification
                           </span>
                           <span className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">
                              {customer.type === 'scrap_buyer' ? "Salvage Partnership Node" : "Premium Commercial Client"}
                           </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="flex flex-col p-6 bg-slate-50 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Node Connectivity</span>
                              <span className="text-xs font-bold text-slate-900 truncate">{customer.email || "OFFLINE_REF"}</span>
                           </div>
                           <div className="flex flex-col p-6 bg-slate-50 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Uptime Pulse</span>
                              <span className="text-xs font-bold text-slate-900">{customer.phone || "+91-REFERENCE"}</span>
                           </div>
                        </div>
                     </div>

                     <Link 
                        to={`/statements/${customer._id}?type=customer`}
                        className="flex items-center justify-between w-full p-6 bg-slate-900 rounded-[2rem] text-white hover:bg-primary transition-all group/btn"
                     >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Open Ledger Archive</span>
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                     </Link>
                  </div>
                  
                  {/* Bottom Accents */}
                  <div className={`h-2 w-full ${customer.type === 'scrap_buyer' ? 'bg-rose-500' : 'bg-primary'}`}></div>
               </div>
             ))
           )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? "Account Override: Identity Settings" : "Initialize New Client Relationship"}
      >
        <div className="p-4">
          <CustomerForm 
            initialData={editingCustomer} 
            onSubmit={handleSubmit} 
            onCancel={() => setIsModalOpen(false)} 
            loading={formLoading}
          />
        </div>
      </Modal>

    </AppLayout>
  );
};

const Recycle = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

export default Customers;
