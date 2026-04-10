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
    stock: initialData?.unit === 'dagina' ? (initialData.stock / 50) : (initialData?.stock || 0),
    unit: initialData?.unit || "kg",
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
    
    if (name === 'unit') {
      const prevUnit = formData.unit;
      const nextUnit = value;
      let newStock = formData.stock;

      // Logic: Convert current view quantity back to KG (base), then to new unit
      const baseStock = prevUnit === 'dagina' ? newStock * 50 : newStock;
      const convertedStock = nextUnit === 'dagina' ? baseStock / 50 : baseStock;

      setFormData(prev => ({
        ...prev,
        unit: nextUnit,
        stock: convertedStock
      }));
      return;
    }

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
    // CRITICAL: Always convert back to KG (base unit) before submitting to database
    const submissionData = {
      ...formData,
      stock: formData.unit === 'dagina' ? formData.stock * 50 : formData.stock
    };
    onSubmit(submissionData);
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
          <div className="flex items-center gap-2">
            <input
              name="stock"
              type="number"
              required
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              value={formData.stock}
              onChange={handleChange}
            />
            <select
              name="unit"
              className="w-24 px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs font-bold"
              value={formData.unit}
              onChange={handleChange}
            >
              <option value="kg">kg</option>
              <option value="gram">gram</option>
              <option value="meters">meters</option>
              <option value="unit">unit</option>
              <option value="dagina">dagina</option>
              <option value="amount">amount</option>
            </select>
          </div>
        </div>
      </div>

      {formData.type === "finished_good" && (
        <div className="mt-8 p-6 bg-blue-50/30 rounded-3xl border border-blue-100/50 space-y-5 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between border-b border-blue-100/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Production Recipe <span className="text-blue-600">(Per 1 Piece)</span></h4>
                <p className="text-[10px] text-gray-500 font-medium italic">Define exact raw material weights/usage required to manufacture one unit.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-100 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Material
            </button>
          </div>

          {formData.bom.length === 0 ? (
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-dashed border-blue-200/50">
              <Info className="w-8 h-8 text-blue-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No components defined</p>
              <p className="text-[10px] text-gray-400 mt-1 max-w-xs mx-auto">Skip this if the product is ready-made or has no manufacturing process.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.bom.map((item, idx) => {
                return (
                  <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-left duration-300 group hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Select Raw Material</label>
                      <select
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
                        value={item.material?._id || item.material}
                        onChange={(e) => handleIngredientChange(idx, "material", e.target.value)}
                      >
                        <option value="">-- Choose Ingredient --</option>
                        {availableComponents.map(m => (
                          <option key={m._id} value={m._id}>
                            {m.name} ({m.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-48">
                      <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Usage / Piece</label>
                      <div className="flex items-stretch bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all overflow-hidden h-11">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          placeholder="0.000"
                          className="w-24 bg-transparent px-3 border-none text-sm font-black text-gray-900 outline-none text-right"
                          value={item.quantity}
                          onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                        />
                        <select
                          className="flex-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2 outline-none cursor-pointer hover:bg-blue-700 transition-colors border-none min-w-[60px]"
                          value={item.unit || "kg"}
                          onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                        >
                          <option className="text-gray-900 bg-white" value="kg">kg</option>
                          <option className="text-gray-900 bg-white" value="gram">gram</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="mt-5 p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
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
