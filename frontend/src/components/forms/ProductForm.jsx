import React, { useState, useEffect } from "react";
import { Plus, Trash2, Layers, Info } from "lucide-react";
import { api } from "../../api/erpApi";

const ProductForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    sku: initialData?.sku || "",
    category: initialData?.category || "",
    type: initialData?.type || "finished_good",
    hsnCode: initialData?.hsnCode || "",
    gstRate: initialData?.gstRate || 18,
    price: initialData?.price || 0,
    stock: initialData?.stock || 0,
    bom: initialData?.bom || [] 
  });

  const [availableComponents, setAvailableComponents] = useState([]);

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const res = await api.get("/products");
        // All products except the current one (prevents circular)
        setAvailableComponents(res.data.filter(p => p._id !== initialData?._id));
      } catch (err) {
        console.error("Failed to fetch components for BOM", err);
      }
    };
    fetchComponents();
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'price' || name === 'stock' || name === 'gstRate') ? parseFloat(value) : value
    }));
  };

  const handleAddIngredient = () => {
    setFormData(prev => ({
      ...prev,
      bom: [...prev.bom, { material: "", quantity: 1 }]
    }));
  };

  const handleRemoveIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      bom: prev.bom.filter((_, i) => i !== index)
    }));
  };

  const handleIngredientChange = (index, field, value) => {
    const newBom = [...formData.bom];
    newBom[index][field] = field === 'quantity' ? parseFloat(value) : value;
    setFormData({ ...formData, bom: newBom });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input
            name="name"
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            placeholder="e.g. Wireless Mouse"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input
            name="sku"
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            placeholder="WM-001"
            value={formData.sku}
            onChange={handleChange}
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-100">Category</label>
          <input
            name="category"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            placeholder="Electronics"
            value={formData.category}
            onChange={handleChange}
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
          <select
            name="type"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition font-bold"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="finished_good">Finished Good (Sales)</option>
            <option value="raw_material">Raw Material (Inward)</option>
          </select>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
           <input
             name="hsnCode"
             required
             className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition uppercase"
             placeholder="HSN-XXXX"
             value={formData.hsnCode}
             onChange={handleChange}
           />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
          <select
            name="gstRate"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition font-bold text-blue-600"
            value={formData.gstRate}
            onChange={handleChange}
          >
            <option value="5">5% (Essential)</option>
            <option value="12">12% (Standard)</option>
            <option value="18">18% (Standard+)</option>
            <option value="28">28% (Luxury)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition font-bold"
            value={formData.price}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">In-Stock Qty</label>
          <input
            name="stock"
            type="number"
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            value={formData.stock}
            onChange={handleChange}
          />
        </div>
      </div>

      {formData.type === "finished_good" && (
        <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
           <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                 <div className="p-2 bg-blue-50 rounded-lg">
                    <Layers className="w-5 h-5 text-blue-600" />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Bill of Materials (BOM)</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Define raw materials required to produce 1 unit.</p>
                 </div>
              </div>
              <button 
                type="button"
                onClick={handleAddIngredient}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition-colors"
              >
                 <Plus className="w-3.5 h-3.5" /> Add Ingredient
              </button>
           </div>

           {formData.bom.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-6 text-center border border-dashed border-gray-200">
                 <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No composition defined</p>
                 <p className="text-[10px] text-gray-400 mt-1 max-w-xs mx-auto">Skip this if product is ready-made or has no component tracking.</p>
              </div>
           ) : (
              <div className="space-y-3">
                 {formData.bom.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-left duration-300">
                       <div className="flex-1">
                          <select 
                             required
                             className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/10"
                             value={item.material?._id || item.material}
                             onChange={(e) => handleIngredientChange(idx, "material", e.target.value)}
                          >
                             <option value="">Choose Component...</option>
                             {availableComponents.map(m => (
                                <option key={m._id} value={m._id}>
                                   {m.name} [{m.sku}] - {m.type === 'raw_material' ? 'Raw' : 'Sub-assembly'}
                                </option>
                             ))}
                          </select>
                       </div>
                       <div className="w-32 flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-xl">
                          <input 
                             type="number"
                             min="0.001"
                             step="0.001"
                             className="w-full bg-transparent border-none text-xs font-black text-gray-900 outline-none text-right"
                             value={item.quantity}
                             onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                          />
                          <span className="text-[10px] font-black text-gray-400 uppercase">Qty</span>
                       </div>
                       <button 
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                       >
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 ))}
              </div>
           )}
        </div>
      )}

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
          disabled={loading}
          className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
        >
          {loading ? "Saving..." : initialData ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
