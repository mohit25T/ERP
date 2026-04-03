import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/common/Modal";
import ProductForm from "../components/forms/ProductForm";
import { productApi } from "../api/erpApi";
import { Plus, Edit2, Trash2, Search, PackageOpen, Layers } from "lucide-react";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.getAll();
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data) => {
    try {
      setFormLoading(true);
      if (editingProduct) {
        await productApi.update(editingProduct._id, data);
      } else {
        await productApi.create(data);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert("Error saving product: " + (err.response?.data?.msg || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await productApi.delete(id);
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products & Inventory</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your catalog, stock levels, and pricing.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product" : "New Product"}
      >
        <ProductForm 
          initialData={editingProduct} 
          onSubmit={handleSubmit} 
          onCancel={() => setIsModalOpen(false)} 
          loading={formLoading}
        />
      </Modal>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 flex justify-center text-gray-500">Loading...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <PackageOpen className="w-12 h-12 text-gray-300 mb-4" />
              <p>No products found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                  <th className="px-8 py-4 text-left">SKU / HSN</th>
                  <th className="px-8 py-4 text-left">Product Details</th>
                  <th className="px-8 py-4 text-left">Category</th>
                  <th className="px-8 py-4 text-center">In Stock</th>
                  <th className="px-8 py-4 text-center">GST Rate</th>
                  <th className="px-8 py-4 text-right">Unit Price</th>
                  <th className="px-8 py-4 text-right pr-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/80 transition-all group">
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{p.sku}</span>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tight">HSN: {p.hsnCode || 'N/A'}</span>
                             <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${p.type === 'raw_material' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                {p.type === 'raw_material' ? 'Raw Material' : 'Finished'}
                             </span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6 font-bold text-gray-900 border-l-2 border-transparent group-hover:border-blue-500 transition-all">
                       <div className="flex items-center gap-2">
                          {p.name}
                          {p.bom && p.bom.length > 0 && (
                             <div className="group/bom relative">
                                <Layers className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-600 text-[8px] text-white font-black px-1.5 py-0.5 rounded opacity-0 group-hover/bom:opacity-100 transition-opacity uppercase tracking-widest whitespace-nowrap">Composition Linked</span>
                             </div>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-500 font-medium uppercase italic">{p.category}</td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1 rounded-full text-xs font-black ${p.stock < 10 ? 'bg-red-50 text-red-600 shadow-sm' : 'bg-green-50 text-green-700 underline decoration-green-200 decoration-4 underline-offset-4'}`}>
                        {p.stock} Units
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center font-black text-blue-600 text-xs">
                       {p.gstRate || 18}%
                    </td>
                    <td className="px-8 py-6 text-right font-black text-gray-900 tracking-tight">
                       ₹{p.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-6 text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(p._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
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
    </AppLayout>
  );
};

export default Products;
