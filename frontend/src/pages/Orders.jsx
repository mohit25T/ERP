import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import { orderApi } from "../api/erpApi";
import { Plus, Clock, Search, CheckCircle, PackageSearch } from "lucide-react";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getAll();
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadgeOptions = (status) => {
    switch (status) {
      case "pending":
        return { color: "bg-yellow-100 text-yellow-800", label: "Pending", icon: <Clock className="w-3 h-3 mr-1" /> };
      case "in_progress":
        return { color: "bg-blue-100 text-blue-800", label: "In Progress", icon: <PackageSearch className="w-3 h-3 mr-1" /> };
      case "completed":
        return { color: "bg-green-100 text-green-800", label: "Completed", icon: <CheckCircle className="w-3 h-3 mr-1" /> };
      default:
        return { color: "bg-gray-100 text-gray-800", label: "Unknown", icon: null };
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-sm text-gray-500 mt-1">Track orders, manage fulfillment statuses, and generate invoices.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium">
          <Plus className="w-4 h-4 mr-2" />
          Create Order
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
             <div className="relative w-full max-w-sm">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input
                     type="text"
                     placeholder="Search order ID or customer..."
                     className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                 />
             </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
              <p>No orders found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium text-right">Qty</th>
                  <th className="px-6 py-4 font-medium text-right">Total</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => {
                  const statusOpts = getStatusBadgeOptions(o.status);
                  return (
                    <tr key={o._id} className="hover:bg-gray-50/50 transition cursor-pointer">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-l-4 border-transparent hover:border-blue-500">
                        #{o._id.substring(o._id.length - 6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-col">
                           <span>{o.customer?.name || "Deleted User"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{o.product?.name || "Deleted Product"}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{o.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right font-bold">${o.totalAmount?.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusOpts.color}`}>
                          {statusOpts.icon}
                          {statusOpts.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-right">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Orders;
