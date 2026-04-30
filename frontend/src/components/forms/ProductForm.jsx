import { useState, useEffect } from "react";
import { api } from "../../api/erpApi";
import {
  Zap, Package, Database, Type, Hash, Tag,
  IndianRupee, Layers, Plus, Info, Trash2, ShieldCheck
} from "lucide-react";

/**
 * ProductForm: The Asset Intelligence Node
 * High-fidelity catalog management for master inventory governance.
 */
const ProductForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    sku: initialData?.sku || "",
    category: initialData?.category || "",
    type: initialData?.type || "finished_good",
    hsnCode: initialData?.hsnCode || "",
    gstRate: initialData?.gstRate || 18,
    price: initialData?.unit === 'dagina' ? (initialData.price * 50) : (initialData?.price || 0),
    stock: initialData?.unit === 'dagina' ? (initialData.stock / 50) : (initialData?.stock || 0),
    unit: initialData?.unit || "kg",
    bom: initialData?.bom || []
  });

  const [availableComponents, setAvailableComponents] = useState([]);

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const res = await api.get("/products");
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
      const prevStock = formData.stock;
      const baseStock = prevUnit === 'dagina' ? prevStock * 50 : prevStock;
      const convertedStock = nextUnit === 'dagina' ? baseStock / 50 : baseStock;

      const prevPrice = formData.price;
      const basePrice = prevUnit === 'dagina' ? prevPrice / 50 : prevPrice;
      const convertedPrice = nextUnit === 'dagina' ? basePrice * 50 : basePrice;

      setFormData(prev => ({
        ...prev,
        unit: nextUnit,
        stock: convertedStock,
        price: convertedPrice
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
      bom: [...prev.bom, { material: "", quantity: 1, unit: "pcs" }]
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
    if (!formData.sku || !formData.sku.trim()) {
      alert("Error: SKU Identity cannot be empty or whitespace.");
      return;
    }
    const submissionData = {
      ...formData,
      sku: formData.sku.trim(),
      stock: formData.unit === 'dagina' ? formData.stock * 50 : formData.stock,
      price: formData.unit === 'dagina' ? formData.price / 50 : formData.price
    };
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
      
      {/* Classification Protocol */}
      <div className="space-y-4">
         <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-indigo-500" />
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Asset Classification Protocol</label>
         </div>
         <div className="flex bg-slate-100/50 p-1.5 rounded-[1.5rem] border border-slate-200/50">
           <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, type: 'finished_good' }))}
              className={`flex-1 py-4 px-6 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2 ${formData.type === 'finished_good' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200/50 scale-[1.02] z-10' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <Package className={`w-3.5 h-3.5 ${formData.type === 'finished_good' ? 'text-indigo-600' : 'text-slate-300'}`} />
              Finished Good
           </button>
           <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, type: 'raw_material' }))}
              className={`flex-1 py-4 px-6 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2 ${formData.type === 'raw_material' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-[1.02] z-10' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <Database className={`w-3.5 h-3.5 ${formData.type === 'raw_material' ? 'text-emerald-400' : 'text-slate-300'}`} />
              Raw Material
           </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PRODUCT CORE */}
        <div className="md:col-span-2 space-y-2.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Product Asset Nomenclature</label>
          <div className="relative group">
            <Type className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input
              name="name"
              required
              className="erp-input !pl-14 !bg-slate-50/50 focus:!bg-white"
              placeholder="ENTER PRODUCT NAME"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2.5">
           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Asset Master SKU</label>
           <div className="relative group">
              <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <input
                name="sku"
                required
                className="erp-input !pl-14 !bg-slate-50/50 focus:!bg-white uppercase !font-mono"
                placeholder="SKU-XXXX"
                value={formData.sku}
                onChange={handleChange}
              />
           </div>
        </div>

        <div className="space-y-2.5">
           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Industrial Category</label>
           <div className="relative group">
              <Tag className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <input
                name="category"
                className="erp-input !pl-14 !bg-slate-50/50 focus:!bg-white uppercase font-black"
                placeholder="UNSPECIFIED CATEGORY"
                value={formData.category}
                onChange={handleChange}
              />
           </div>
        </div>

        <div className="space-y-2.5">
           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">HSN/SAC Protocol UID</label>
           <input
             name="hsnCode"
             required
             className="erp-input !bg-slate-50/50 focus:!bg-white uppercase font-black tracking-widest"
             placeholder="HSN-0000"
             value={formData.hsnCode}
             onChange={handleChange}
           />
        </div>

        <div className="space-y-2.5">
           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Fiscal GST Contribution (%)</label>
           <select
             name="gstRate"
             className="erp-input !bg-indigo-50/30 !text-indigo-600 !font-black"
             value={formData.gstRate}
             onChange={handleChange}
           >
             <option value="5">05% ESSENTIAL</option>
             <option value="12">12% STANDARD</option>
             <option value="18">18% REVENUE MASTER</option>
             <option value="28">28% LUXURY / DE-MERIT</option>
           </select>
        </div>

        <div className="space-y-2.5">
           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Inventory Telemetry (Stock)</label>
           <div className="flex gap-4">
              <input
                name="stock"
                type="number"
                required
                className="erp-input flex-1 !bg-slate-50/50 focus:!bg-black focus:!text-white !font-black"
                value={formData.stock}
                onChange={handleChange}
              />
              <select
                name="unit"
                className="w-32 erp-input !bg-slate-100 !border-slate-200 !text-center !font-black uppercase"
                value={formData.unit}
                onChange={handleChange}
              >
                {["kg", "gram", "dagina", "pcs", "meters", "tons", "mts", "unit", "amount"].map(u => (
                  <option key={u} value={u}>{u.toUpperCase()}</option>
                ))}
              </select>
           </div>
        </div>

        <div className="space-y-2.5">
           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Base Unit Price</label>
           <div className="relative group">
              <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <input
                name="price"
                type="number"
                step="0.01"
                required
                className="erp-input !pl-14 !bg-slate-50/50 focus:!bg-white !font-black !text-lg"
                value={formData.price}
                onChange={handleChange}
              />
           </div>
        </div>
      </div>

      {/* MANUFACTURING BLUEPRINT (BOM) */}
      {formData.type === "finished_good" && (
        <div className="mt-12 p-8 bg-slate-900 rounded-[3rem] border border-slate-800 space-y-8 shadow-2xl shadow-slate-900/40 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
             <Layers className="w-40 h-40 text-white" />
          </div>
          
          <div className="flex items-center justify-between border-b border-white/5 pb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white uppercase tracking-tight italic">Manufacturing <span className="text-indigo-400">Blueprint</span></h4>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Resource allocation per output unit</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300"
            >
              <Plus className="w-4 h-4" /> Add Component
            </button>
          </div>

          {formData.bom.length === 0 ? (
            <div className="bg-white/5 rounded-[2rem] p-12 text-center border border-dashed border-white/10">
              <Info className="w-10 h-10 text-white/10 mx-auto mb-4" />
              <p className="text-[11px] text-white/40 font-black uppercase tracking-widest">Recipe protocol not initialized</p>
              <p className="text-[9px] text-white/20 mt-2 italic">Add raw materials to track production yield analytics</p>
            </div>
          ) : (
            <div className="space-y-4 relative z-10">
              {formData.bom.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 bg-white/5 p-5 rounded-3xl border border-white/5 group/row hover:bg-white/10 transition-all">
                  <div className="col-span-6 space-y-2">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-1">Master Material Source</label>
                    <select
                      required
                      className="w-full h-12 bg-slate-950/50 border border-white/5 rounded-2xl text-[10px] font-black text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all uppercase px-4 cursor-pointer"
                      value={item.material?._id || item.material}
                      onChange={(e) => handleIngredientChange(idx, "material", e.target.value)}
                    >
                      <option value="">-- AUTHORIZE MATERIAL --</option>
                      {availableComponents.map(m => (
                        <option key={m._id} value={m._id} className="bg-slate-900 text-white">
                          {m.name.toUpperCase()} [{m.unit.toUpperCase()}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-1">Asset Unit</label>
                    <select
                      className="w-full h-12 bg-slate-950/50 border border-white/5 rounded-2xl text-[9px] font-black text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all uppercase px-2 cursor-pointer"
                      value={item.unit || availableComponents.find(m => m._id === (item.material?._id || item.material))?.unit || 'pcs'}
                      onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                    >
                      {["pcs", "dagina", "kg", "gram", "meters", "unit", "amount"].map(u => (
                        <option key={u} value={u} className="bg-slate-900 text-white">{u.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3 space-y-2 text-right">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest mr-1">Usage Node</label>
                    <div className="flex items-stretch bg-slate-950/50 rounded-2xl border border-white/5 overflow-hidden h-12">
                      <input
                        type="number"
                        step="0.001"
                        className="flex-1 bg-transparent px-4 border-none text-[13px] font-black text-white outline-none text-right"
                        value={item.quantity}
                        onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-span-2 flex items-end justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="p-3.5 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-6 pt-10 border-t border-slate-50">
        <button
          type="button"
          onClick={onCancel}
          className="erp-button-secondary flex-1"
        >
          Abort Blueprint
        </button>
        <button
          type="submit"
          disabled={loading}
          className="erp-button-primary flex-1 group shadow-primary/10"
        >
          {loading ? "Synchronizing Asset..." : initialData ? "Commit Asset Update" : "Authorize New Asset"}
          <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
