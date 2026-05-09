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
    if (window.confirm("Delete this customer? This will remove their record from the list.")) {
      try {
        await customerApi.delete(id);
        fetchCustomers();
      } catch (err) {
        alert("Could not delete: This customer has pending payments.");
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
      <div className="space-y-4 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-card rounded-md flex items-center justify-center shadow-sm border border-border">
                 <UsersIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Customers</h2>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">List of customers and companies</p>
              </div>
           </div>

           <button onClick={handleOpenAdd} className="erp-button-primary">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Account
           </button>
        </div>

        {/* High-Impact Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <div className="p-3 bg-card rounded-md border border-border shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Customers</p>
                 <div className="p-2 bg-primary/10 rounded text-primary">
                    <TrendingUp className="w-4 h-4" />
                 </div>
              </div>
               <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tighter">{customers.length} Accounts</h3>
                  <p className="text-[9px] font-bold text-primary mt-1 uppercase tracking-widest">
                     Industrial Scale reach
                  </p>
               </div>
           </div>
           
           <div className="p-3 bg-card rounded-md border border-border shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rating</p>
                 <div className="p-2 bg-amber-500/10 rounded text-amber-600 dark:text-amber-400">
                    <Star className="w-4 h-4" />
                 </div>
              </div>
               <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tighter">Tier A</h3>
                  <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-1 uppercase tracking-widest">
                     Compliance Grade
                  </p>
               </div>
           </div>

           <div className="p-3 bg-primary/5 rounded-md border border-primary/20 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Total Revenue</p>
                 <div className="p-2 bg-primary/20 rounded text-primary">
                    <Briefcase className="w-4 h-4" />
                 </div>
              </div>
               <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tighter">₹0</h3>
                  <p className="text-[9px] font-bold text-primary mt-1 uppercase tracking-widest">
                     Market Exposure
                  </p>
               </div>
           </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden mt-4 mb-4">
           <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/5">
              <div className="relative w-full max-w-sm">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input 
                    type="text"
                    placeholder="Search accounts or companies..."
                    className="erp-input w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              
              <div className="flex bg-muted/30 p-1 rounded border border-border/50">
                 {[
                   { id: 'all', label: 'All Accounts' },
                   { id: 'regular', label: 'Commercial' },
                   { id: 'scrap_buyer', label: 'Scrap' }
                 ].map((tab) => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
                       activeTab === tab.id 
                         ? 'bg-card text-primary shadow-sm border border-border/50' 
                         : 'text-muted-foreground hover:text-foreground'
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
              <div className="col-span-full p-20 flex flex-col items-center justify-center text-muted-foreground">
                 <div className="w-16 h-16 bg-muted/20 rounded-md flex items-center justify-center mb-4 border border-border">
                    <UsersIcon className="w-8 h-8 text-muted-foreground/30" />
                 </div>
                 <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-1">No customers found</h3>
                 <p className="text-[10px] font-medium uppercase tracking-tighter">Try searching something else</p>
              </div>
           ) : (
              <AnimatePresence mode="popLayout">
                {filteredCustomers.map((customer, index) => (
                  <motion.div 
                    key={customer._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-card rounded-md border border-border shadow-sm hover:shadow-md hover:border-primary/40 transition-all overflow-hidden relative group"
                  >
                     <div className={`h-1 w-full ${customer.type === 'scrap_buyer' ? 'bg-orange-500' : 'bg-primary'}`}></div>
                     <div className="p-3">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded bg-muted/30 flex items-center justify-center text-foreground font-black text-lg border border-border">
                                 {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                 <h3 className="text-sm font-bold text-foreground tracking-tight mb-0.5">{customer.name}</h3>
                                 <span className="text-[9px] font-bold text-muted-foreground bg-muted/20 px-2 py-0.5 rounded border border-border/50 uppercase tracking-widest">{customer.company || "Individual"}</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3 mb-3">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-muted/20 flex items-center justify-center text-muted-foreground border border-border/50">
                                 {customer.type === 'scrap_buyer' ? <Recycle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Type</span>
                                 <span className="text-[11px] font-bold text-foreground">{customer.type === 'scrap_buyer' ? "Scrap Buyer" : "Regular Customer"}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-muted/20 flex items-center justify-center text-muted-foreground border border-border/50">
                                 <Globe className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Email</span>
                                 <span className="text-[11px] font-bold text-foreground truncate max-w-[150px]">{customer.email || "N/A"}</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-border/50">
                           <div className="flex gap-1">
                              <button onClick={() => handleOpenEdit(customer)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(customer._id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                           </div>
                           <Link 
                              to={`/statements/${customer._id}?type=customer`}
                              className="text-[9px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-[0.15em] flex items-center gap-1"
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
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
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
