import React, { useState, useEffect } from "react";
import { customerApi, productApi } from "../../api/erpApi";

const OrderForm = ({ onSubmit, onCancel, loading }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    customer: "",
    product: "",
    quantity: 1,
  });

  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          customerApi.getAll(),
          productApi.getAll()
        ]);
        setCustomers(custRes.data);
        setProducts(prodRes.data); // Support backordering (include items with 0 stock)
      } catch (err) {
        console.error("Error fetching form data", err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "product") {
      const prod = products.find(p => p._id === value);
      setSelectedProduct(prod);
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === "quantity" ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customer || !formData.product) {
      alert("Please select a customer and product");
      return;
    }
    onSubmit(formData);
  };

  if (fetching) return <p className="text-center py-4 text-gray-500 text-sm italic">Loading master data...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 ">Select Customer</label>
          <select
            name="customer"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition appearance-none"
            value={formData.customer}
            onChange={handleChange}
          >
            <option value="">-- Choose Customer --</option>
            {customers.map(c => (
              <option key={c._id} value={c._id}>{c.name} ({c.company || "Individual"})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Product</label>
          <select
            name="product"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition appearance-none"
            value={formData.product}
            onChange={handleChange}
          >
            <option value="">-- Choose Product --</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name} - ₹{p.price} (Stock: {p.stock} | GST: {p.gstRate}%)</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 ">Quantity</label>
            <input
              name="quantity"
              type="number"
              min="1"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition font-bold"
              value={formData.quantity}
              onChange={handleChange}
            />
          </div>
          
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 shadow-xl shadow-blue-500/20 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-black text-blue-100 tracking-widest opacity-70">Payable Amount</span>
            <span className="text-2xl font-black text-white tracking-tighter">
               ₹{selectedProduct ? ((selectedProduct.price * formData.quantity) * (1 + (selectedProduct.gstRate || 18)/100)).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : "0.00"}
            </span>
            <div className="flex justify-between items-center mt-1 border-t border-white/10 pt-1">
               <span className="text-[8px] font-bold text-blue-200 uppercase tracking-tighter">Inc. GST (${selectedProduct?.gstRate || 18}%)</span>
            </div>
          </div>
        </div>

      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !selectedProduct || (selectedProduct.stock < formData.quantity)}
          className="flex-2 py-2.5 px-8 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition disabled:opacity-50 disabled:bg-gray-400 disabled:shadow-none"
        >
          {loading ? "Processing..." : (selectedProduct?.stock < formData.quantity) ? "Insufficient Stock" : "Confirm Selection & Order"}
        </button>
      </div>
    </form>
  );
};

export default OrderForm;
