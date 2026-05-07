import { useState, useEffect } from "react";
import { api } from "../../api/erpApi";
import {
  Zap, Package, Database, Type, Hash, Tag,
  IndianRupee, Layers, Plus, Info, Trash2, ShieldCheck
} from "lucide-react";

/**
 * ProductForm: The Asset Intelligence Node
 * Refined for enterprise density and dark mode support.
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
    <form onSubmit={handleSubmit} className="space-y-4">
      
      {/* Classification Protocol */}
      <div className="space-y-3">
         <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Asset Classification</label>
         </div>
         <div className="flex bg-muted/50 p-1 rounded-md border border-border">
           <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, type: 'finished_good' }))}
              className={`flex-1 py-2 px-4 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.type === 'finished_good' ? 'bg-card text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
           >
              <Package className={`w-3.5 h-3.5 ${formData.type === 'finished_good' ? 'text-primary' : 'text-muted-foreground'}`} />
              Finished Good
           </button>
           <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, type: 'raw_material' }))}
              className={`flex-1 py-2 px-4 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.type === 'raw_material' ? 'bg-foreground text-background shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
           >
              <Database className={`w-3.5 h-3.5 ${formData.type === 'raw_material' ? 'text-primary' : 'text-muted-foreground'}`} />
              Raw Material
           </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PRODUCT CORE */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Product Nomenclature</label>
          <div className="relative group">
            <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              name="name"
              required
              className="erp-input !pl-10"
              placeholder="ENTER PRODUCT NAME"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-1.5">
           <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Asset SKU</label>
           <div className="relative group">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                name="sku"
                required
                className="erp-input !pl-10 uppercase !font-mono"
                placeholder="SKU-XXXX"
                value={formData.sku}
                onChange={handleChange}
              />
           </div>
        </div>

        <div className="space-y-1.5">
           <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Industrial Category</label>
           <div className="relative group">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                name="category"
                className="erp-input !pl-10 uppercase"
                placeholder="UNSPECIFIED"
                value={formData.category}
                onChange={handleChange}
              />
           </div>
        </div>

        <div className="space-y-1.5">
           <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">HSN/SAC UID</label>
           <input
             name="hsnCode"
             required
             className="erp-input uppercase tracking-widest"
             placeholder="HSN-0000"
             value={formData.hsnCode}
             onChange={handleChange}
           />
        </div>

        <div className="space-y-1.5">
           <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">GST Rate (%)</label>
           <select
             name="gstRate"
             className="erp-input"
             value={formData.gstRate}
             onChange={handleChange}
           >
             <option value="5">05% ESSENTIAL</option>
             <option value="12">12% STANDARD</option>
             <option value="18">18% REVENUE MASTER</option>
             <option value="28">28% LUXURY / DE-MERIT</option>
           </select>
        </div>

        <div className="space-y-1.5">
           <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Inventory Balance</label>
           <div className="flex gap-2">
              <input
                name="stock"
                type="number"
                required
                className="erp-input flex-1 font-bold"
                value={formData.stock}
                onChange={handleChange}
              />
              <select
                name="unit"
                className="w-28 erp-input !text-center uppercase"
                value={formData.unit}
                onChange={handleChange}
              >
                {["kg", "gram", "dagina", "pcs", "meters", "tons", "mts", "unit", "amount"].map(u => (
                  <option key={u} value={u} className="bg-card">{u.toUpperCase()}</option>
                ))}
              </select>
           </div>
        </div>

        <div className="space-y-1.5">
           <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Base Price</label>
           <div className="relative group">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                name="price"
                type="number"
                step="0.01"
                required
                className="erp-input !pl-10 font-bold"
                value={formData.price}
                onChange={handleChange}
              />
           </div>
        </div>
      </div>

      {/* MANUFACTURING BLUEPRINT (BOM) */}
      {formData.type === "finished_good" && (
        <div className="mt-4 p-4 bg-muted/20 rounded border border-border space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded shadow-sm">
                <Layers className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground uppercase tracking-tight">Resource Blueprint</h4>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Bill of Materials</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted text-foreground border border-border rounded text-[9px] font-bold uppercase tracking-widest transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Component
            </button>
          </div>

          {formData.bom.length === 0 ? (
            <div className="bg-muted/10 rounded p-3 text-center border border-dashed border-border">
              <Info className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Blueprint not initialized</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.bom.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 bg-card p-4 rounded border border-border shadow-sm group/row transition-all">
                  <div className="col-span-6 space-y-1">
                    <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Component Source</label>
                    <select
                      required
                      className="w-full erp-input !py-1.5"
                      value={item.material?._id || item.material}
                      onChange={(e) => handleIngredientChange(idx, "material", e.target.value)}
                    >
                      <option value="" className="bg-card">SELECT MATERIAL</option>
                      {availableComponents.map(m => (
                        <option key={m._id} value={m._id} className="bg-card">
                          {m.name.toUpperCase()} [{m.unit.toUpperCase()}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Unit</label>
                    <select
                      className="w-full erp-input !py-1.5 !px-2 !text-center"
                      value={item.unit || availableComponents.find(m => m._id === (item.material?._id || item.material))?.unit || 'pcs'}
                      onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                    >
                      {["pcs", "dagina", "kg", "gram", "meters", "unit", "amount"].map(u => (
                        <option key={u} value={u} className="bg-card">{u.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3 space-y-1">
                    <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Quantity</label>
                    <input
                      type="number"
                      step="0.001"
                      className="w-full erp-input !py-1.5 text-right font-bold"
                      value={item.quantity}
                      onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex items-end justify-center pb-0.5">
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="erp-button-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="erp-button-primary flex-1 group"
        >
          {loading ? "Commiting..." : initialData ? "Commit Update" : "Authorize Asset"}
          <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
