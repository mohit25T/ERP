import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/common/Modal";
import CustomerForm from "../components/forms/CustomerForm";
import { customerApi } from "../api/erpApi";
import { Plus, Search, Users as UsersIcon, Edit2, Trash2 } from "lucide-react";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
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
      alert("Error saving customer: " + (err.response?.data?.msg || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      await customerApi.delete(id);
      fetchCustomers();
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers (CRM)</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your customer relationships and contacts.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </button>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? "Edit Customer" : "New Customer"}
      >
        <CustomerForm 
          initialData={editingCustomer} 
          onSubmit={handleSubmit} 
          onCancel={() => setIsModalOpen(false)} 
          loading={formLoading}
        />
      </Modal>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {loading ? (
             <p className="text-gray-500 col-span-full text-center py-8">Loading...</p>
          ) : filteredCustomers.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
              <UsersIcon className="w-12 h-12 text-gray-300 mb-4" />
              <p>No customers found.</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer._id} className="group p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-100 transition duration-200">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                      <p className="text-xs text-gray-500">{customer.company || "Individual"}</p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                     <button 
                       onClick={() => handleOpenEdit(customer)}
                       className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                     >
                        <Edit2 className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => handleDelete(customer._id)}
                       className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-16 font-medium">Email:</span>
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-16 font-medium">Phone:</span>
                    <span>{customer.phone || "N/A"}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-50 flex justify-end">
                     <Link 
                       to={`/reports/party/${customer._id}?type=customer`}
                       className="text-xs font-black italic text-blue-600 uppercase tracking-widest hover:underline underline-offset-4 decoration-2"
                     >
                       View Statement 📄
                     </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Customers;
