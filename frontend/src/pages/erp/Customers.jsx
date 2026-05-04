import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { customerApi } from "../../api/erpApi";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import HammerLoader from "../../components/common/HammerLoader";
import CustomerForm from "../../components/forms/CustomerForm";
import { 
  Users as UsersIcon, UserPlus, TrendingUp, Star, 
  Briefcase, Search, ShieldCheck, Globe, 
  Edit2, Trash2, ArrowRight, Recycle
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
      <div className="space-y-6 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center shadow-sm border border-slate-100">
                 <UsersIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Customers</h2>
                 <p className="text-sm font-medium text-slate-500">Manage client relationships, accounts, and contacts</p>
              </div>
           </div>

           <button onClick={handleOpenAdd} className="erp-button-primary">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Account
           </button>
        </div>

        {/* High-Impact Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <div className="p-5 bg-white rounded-md border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-sm font-semibold text-slate-500">Active Pipeline</p>
                 <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <TrendingUp className="w-4 h-4" />
                 </div>
              </div>
               <div>
                  <h3 className="text-2xl font-bold text-slate-900">{customers.length} Accounts</h3>
                  <p className="text-xs font-medium text-primary/80 mt-1 flex items-center gap-1">
                     Industrial scale reach
                  </p>
               </div>
           </div>
           
           <div className="p-5 bg-white rounded-md border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-sm font-semibold text-slate-500">Service Level</p>
                 <div className="p-2 bg-amber-50 rounded-md text-amber-600">
                    <Star className="w-4 h-4" />
                 </div>
              </div>
               <div>
                  <h3 className="text-2xl font-bold text-slate-900">Tier A</h3>
                  <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
                     Compliance Grade
                  </p>
               </div>
           </div>

           <div className="p-5 bg-primary/5 rounded-md border border-primary/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-sm font-semibold text-primary">Revenue Focus</p>
                 <div className="p-2 bg-primary/20 rounded-md text-primary">
                    <Briefcase className="w-4 h-4" />
                 </div>
              </div>
               <div>
                  <h3 className="text-2xl font-bold text-slate-900">₹0</h3>
                  <p className="text-xs font-medium text-primary/80 mt-1 flex items-center gap-1">
                     Market Exposure
                  </p>
               </div>
           </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden mt-6 mb-6">
           <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full max-w-sm">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    type="text"
                    placeholder="Search accounts or companies..."
                    className="erp-input w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              
              <div className="flex bg-slate-100 p-1 rounded-md">
                 {[
                   { id: 'all', label: 'All Customers' },
                   { id: 'regular', label: 'Commercial' },
                   { id: 'scrap_buyer', label: 'Scrap Buyers' }
                 ].map((tab) => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                       activeTab === tab.id 
                         ? 'bg-white text-primary shadow-sm' 
                         : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                     }`}
                   >
                     {tab.label}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Global Client Registry */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
           {loading ? (
              <div className="col-span-full">
                <HammerLoader />
              </div>
           ) : filteredCustomers.length === 0 ? (
              <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-500">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                    <UsersIcon className="w-8 h-8 text-slate-300" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-1">No customers found</h3>
                 <p className="text-sm font-medium">Adjust your search or filters.</p>
              </div>
           ) : (
              <AnimatePresence mode="popLayout">
                {filteredCustomers.map((customer, index) => (
                  <motion.div 
                    key={customer._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white rounded-md border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all overflow-hidden relative"
                  >
                     <div className={`h-1.5 w-full ${customer.type === 'scrap_buyer' ? 'bg-orange-500' : 'bg-primary'}`}></div>
                     <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg border border-slate-200">
                                 {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                 <h3 className="text-lg font-bold text-slate-900 mb-0.5">{customer.name}</h3>
                                 <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{customer.company || "Individual"}</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3 mb-5">
                           <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                 {customer.type === 'scrap_buyer' ? <Recycle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classification</span>
                                 <span className="font-semibold text-slate-700">{customer.type === 'scrap_buyer' ? "Scrap Buyer" : "Commercial Client"}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                 <Globe className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                                 <span className="font-semibold text-slate-700 truncate max-w-[200px]">{customer.email || "N/A"}</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                           <div className="flex gap-2">
                              <button onClick={() => handleOpenEdit(customer)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(customer._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                           </div>
                           <Link 
                              to={`/statements/${customer._id}?type=customer`}
                              className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider flex items-center gap-1"
                           >
                              View Ledger <ArrowRight className="w-3 h-3" />
                           </Link>
                        </div>
                     </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? "Edit Customer" : "New Customer"}
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



export default Customers;
