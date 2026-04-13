import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/common/Modal";
import ProductForm from "../components/forms/ProductForm";
import InventoryHistory from "../components/modals/InventoryHistory";
import { productApi, bomApi } from "../api/erpApi";
import unitsUtil from "../utils/units";
import { 
  Plus, Edit2, Trash2, Search, PackageOpen, Layers, Package, 
  History, Box, Activity, ShieldAlert, Zap, ArrowDown, ArrowUp,
  Filter, Download, Hammer, Database, Archive, TrendingUp
} from "lucide-react";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); 
  const [showFilters, setShowFilters] = useState(false);
  const [filterStock, setFilterStock] = useState("all");
  const [boms, setBoms] = useState([]); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewingBOMProduct, setViewingBOMProduct] = useState(null);
  const [prodQuantity, setProdQuantity] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [prodRes, bomRes] = await Promise.all([
        productApi.getAll(),
        bomApi.getAll()
      ]);
      setProducts(prodRes.data);
      setBoms(bomRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleOpenBOM = (product) => {
    setViewingBOMProduct(product);
    setProdQuantity(1);
    setIsBOMModalOpen(true);
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
    if (window.confirm("CRITICAL: Permanent deletion of master record? This cannot be undone.")) {
      try {
        await productApi.delete(id);
        fetchProducts();
      } catch (err) {
        alert("Deletion failed: " + err.message);
      }
    }
  };

  const counts = {
    all: products.length,
    finished: products.filter(p => p.type === 'finished_good').length,
    raw: products.filter(p => p.type === 'raw_material').length,
    scrap: products.filter(p => (p.scrapStock || 0) > 0).length
  };

  const filteredProducts = products.filter(p => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = (p.name || "").toLowerCase().includes(searchLow) ||
                         (p.sku || "").toLowerCase().includes(searchLow);
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'finished' && p.type === 'finished_good') ||
                      (activeTab === 'raw' && p.type === 'raw_material') ||
                      (activeTab === 'scrap' && (p.scrapStock || 0) > 0);
    const matchesStock = filterStock === 'all' ||
                        (filterStock === 'low' && p.stock < (p.minStock || 10)) ||
                        (filterStock === 'out' && p.stock <= 0) ||
                        (filterStock === 'optimal' && p.stock >= (p.minStock || 10));
    return matchesSearch && matchesTab && matchesStock;
  });

  const selectedProductBom = boms.find(b => b.product?._id === viewingBOMProduct?._id || b.product === viewingBOMProduct?._id);

  return (
    <AppLayout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
        
        {/* Elite Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center group hover:rotate-12 transition-transform duration-500 shadow-sm border border-primary/10">
                 <Database className="w-10 h-10 text-primary" />
              </div>
              <div>
                 <h2 className="text-5xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Inventory <span className="text-primary not-italic">Matrix</span></h2>
                 <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-1.5">
                       {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[7px] font-black text-white">L{i}</div>)}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Stock Governance & Master Catalog</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                 {[
                   { id: 'all', label: 'Nodes', icon: Archive },
                   { id: 'finished', label: 'Yield', icon: Layers },
                   { id: 'raw', label: 'Resource', icon: Package },
                   { id: 'scrap', label: 'Salvage', icon: Hammer }
                 ].map((tab) => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all duration-300 ${
                       activeTab === tab.id 
                         ? 'bg-white text-primary shadow-sm scale-100' 
                         : 'text-slate-400 hover:text-slate-600'
                     }`}
                   >
                     {tab.label}
                     <span className={`px-2 py-0.5 rounded-lg text-[8px] border ${activeTab === tab.id ? 'bg-primary/5 border-primary/10' : 'bg-slate-200 border-transparent text-slate-500'}`}>
                       {counts[tab.id]}
                     </span>
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Advanced Filter Manifold */}
        {showFilters && (
           <div className="px-10 py-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 flex flex-wrap gap-10 animate-in slide-in-from-top-2 duration-500">
              <div className="space-y-4">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Operational Reserve Status</p>
                 <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'Global Inventory' },
                      { id: 'optimal', label: 'Optimal Flux' },
                      { id: 'low', label: 'Low-Stock Warning' },
                      { id: 'out', label: 'Out of Stock' }
                    ].map(stock => (
                       <button 
                          key={stock.id}
                          onClick={() => setFilterStock(stock.id)}
                          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filterStock === stock.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                       >
                          {stock.label}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="flex-1 flex justify-end items-end pb-1">
                 <button 
                    onClick={() => { setFilterStock("all"); setSearchTerm(""); setActiveTab("all"); }}
                    className="text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                 >
                    <Trash2 className="w-3.5 h-3.5" /> Reset Matrix
                 </button>
              </div>
           </div>
        )}

        {/* Dynamic Statistics Overlay */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm group hover:border-primary/20 transition-all duration-500">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Capital Immobilized</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums">₹{(products.reduce((acc, p) => acc + (p.stock * p.price), 0) / 100000).toFixed(1)}L</h3>
              <div className="flex items-center gap-2 mt-4 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                 <TrendingUp className="w-3.5 h-3.5" />
                 <span>Asset Liquidity Peak</span>
              </div>
           </div>
           <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm group hover:border-amber-200 transition-all duration-500">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operational Risk</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums">{products.filter(p => p.stock < (p.minStock || 10)).length} Items</h3>
              <div className="flex items-center gap-2 mt-4 text-amber-500 font-bold text-[10px] uppercase tracking-widest">
                 <ShieldAlert className="w-3.5 h-3.5" />
                 <span>Critical Replenishment Need</span>
              </div>
           </div>
           <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm group hover:border-rose-200 transition-all duration-500">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Salvage Potential</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums">{(products.reduce((acc, p) => acc + (p.scrapStock || 0), 0) / 1000).toFixed(1)}T</h3>
              <div className="flex items-center gap-2 mt-4 text-rose-500 font-bold text-[10px] uppercase tracking-widest">
                 <Hammer className="w-3.5 h-3.5" />
                 <span>Pending Disposal Value</span>
              </div>
           </div>
           <div className="p-10 bg-slate-900 rounded-[3rem] shadow-2xl shadow-slate-900/20 group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Zap className="w-16 h-16 text-white" />
              </div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Stock Velocity</p>
              <h3 className="text-4xl font-black text-white tracking-tightest tabular-nums">84.2%</h3>
              <div className="flex items-center gap-2 mt-4 text-primary font-bold text-[10px] uppercase tracking-widest">
                 <Activity className="w-3.5 h-3.5" />
                 <span>Optimal Flux Gradient</span>
              </div>
           </div>
        </div>

        {/* Global Catalog Container */}
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden mb-20">
           <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative group w-full max-w-md">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                 <input 
                    type="text"
                    placeholder="Identify SKU reference or Node Identity..."
                    className="w-full pl-14 pr-8 py-5 bg-slate-50 border-transparent rounded-[2rem] text-[11px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-4 rounded-2xl transition-all active:scale-95 ${showFilters ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                     <Filter className="w-5 h-5" />
                  </button>
                 <button className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95">
                    <Download className="w-5 h-5" />
                 </button>
                 <div className="h-10 w-px bg-slate-100 mx-2"></div>
                 <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="erp-button-primary !py-5">
                    <Plus className="w-4 h-4" />
                    Initialize Node
                 </button>
              </div>
           </div>

           <div className="overflow-x-auto">
              {loading ? (
                <div className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] animate-pulse text-[10px]">Accessing Master Data Layers...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-40 flex flex-col items-center justify-center text-slate-200">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-10 border border-slate-100">
                      <Archive className="w-10 h-10 text-slate-300" />
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tightest uppercase italic">Archive Uncharted</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">No data nodes matching search criteria</p>
                </div>
              ) : (
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
                         <th className="px-12 py-8">SKU Identity</th>
                         <th className="px-12 py-8">Identity Label</th>
                         <th className="px-12 py-8 text-center">Operational Reserve</th>
                         <th className="px-12 py-8 text-center">Salvage Mass</th>
                         <th className="px-12 py-8 text-center">Price Index</th>
                         <th className="px-12 py-8 text-right pr-20">Control</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredProducts.map((p) => {
                        const isStockWarning = p.stock < (p.minStock || 10);
                        return (
                          <tr key={p._id} className="group/row hover:bg-slate-50/80 transition-all duration-500">
                             <td className="px-12 py-10">
                                <div className="flex flex-col">
                                   <span className="text-[11px] font-black text-slate-900 tracking-[0.1em] bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 w-fit mb-2 group-hover/row:bg-primary/10 group-hover/row:text-primary group-hover/row:border-primary/20 transition-all shadow-sm uppercase">{p.sku || "UNIDENTIFIED"}</span>
                                   <div className="flex items-center gap-2">
                                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">HSN: {p.hsnCode || "XXXX"}</span>
                                       <div className={`w-1.5 h-1.5 rounded-full ${p.type === 'raw_material' ? 'bg-orange-500' : 'bg-primary'}`}></div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-12 py-10">
                                <div className="flex flex-col">
                                   <span className="text-base font-black text-slate-900 tracking-tightest group-hover/row:text-primary transition-colors">{p.name}</span>
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic leading-none">{p.category || "General Classification"}</span>
                                </div>
                             </td>
                             <td className="px-12 py-10 text-center">
                                <div className="flex flex-col items-center gap-3">
                                   <div className={`px-5 py-2 rounded-2xl text-xs font-black shadow-lg shadow-black/5 flex items-center gap-2 ${isStockWarning ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-white text-slate-900 border border-slate-100 group-hover/row:border-primary/20'}`}>
                                      {isStockWarning ? <ArrowDown className="w-3 h-3 animate-bounce" /> : <Box className="w-3 h-3 text-slate-400" />}
                                      {p.stock.toLocaleString()} <span className="opacity-50 text-[10px]">{p.unit || 'KG'}</span>
                                   </div>
                                   {isStockWarning && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse">Replenishment Critical</span>}
                                </div>
                             </td>
                             <td className="px-12 py-10 text-center">
                                <div className="flex flex-col items-center gap-2">
                                   <span className={`text-[11px] font-black tracking-tight tabular-nums px-4 py-1.5 rounded-xl border transition-all duration-500 ${(p.scrapStock || 0) > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-300 border-transparent italic'}`}>
                                      {(p.scrapStock || 0).toLocaleString()} {p.unit || 'KG'}
                                   </span>
                                   {(p.scrapStock || 0) > 1000 && <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest shadow-text-glow">Heavy Salvage</span>}
                                </div>
                             </td>
                             <td className="px-12 py-10 text-center font-black">
                                <div className="flex flex-col items-center">
                                   <span className="text-xl font-black text-slate-900 tracking-tightest group-hover/row:scale-110 transition-transform tabular-nums">₹{p.price?.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</span>
                                   <div className="flex items-center gap-1.5 mt-1.5 opacity-40 group-hover/row:opacity-100 transition-opacity">
                                      <Activity className="w-2.5 h-2.5 text-primary" />
                                      <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Rate {p.gstRate || 18}% GST</span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-12 py-10 text-right pr-20">
                                <div className="flex items-center justify-end gap-3 text-slate-400">
                                   <button onClick={() => { setSelectedProduct(p); setHistoryModalOpen(true); }} className="p-3 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all active:scale-90" title="Audit Vault">
                                      <History className="w-5 h-5" />
                                   </button>
                                   <div className="h-6 w-px bg-slate-100 mx-1"></div>
                                   {boms.some(b => b.product?._id === p._id || b.product === p._id) && (
                                     <button onClick={() => handleOpenBOM(p)} className="p-3 hover:bg-primary/5 hover:text-primary rounded-xl transition-all active:scale-90" title="Recipe Control">
                                        <Layers className="w-5 h-5" />
                                     </button>
                                   )}
                                   <button onClick={() => handleOpenEdit(p)} className="p-3 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all active:scale-90">
                                      <Edit2 className="w-5 h-5" />
                                   </button>
                                   <button onClick={() => handleDelete(p._id)} className="p-3 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all active:scale-90">
                                      <Trash2 className="w-5 h-5" />
                                   </button>
                                </div>
                             </td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>
              )}
           </div>
        </div>
      </div>

      {/* Modern High-Fidelity Modals */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Node Override: Configuration" : "New Node Initialization"}>
        <div className="p-4">
          <ProductForm initialData={editingProduct} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} loading={formLoading} />
        </div>
      </Modal>

      <Modal isOpen={isBOMModalOpen} onClose={() => setIsBOMModalOpen(false)} title="Formula Availability Check">
        <div className="p-10 space-y-10">
           <div className="flex items-center justify-between bg-slate-900 p-10 rounded-[3rem] shadow-2xl shadow-slate-900/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Zap className="w-20 h-20 text-white" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Simulated Yield</p>
                 <p className="text-sm font-bold text-white italic capitalize">Target: {viewingBOMProduct?.name}</p>
              </div>
              <div className="relative">
                 <input 
                    type="number"
                    min="1"
                    className="w-32 px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-2xl font-black text-white focus:ring-4 focus:ring-primary/20 outline-none transition-all tabular-nums text-center"
                    value={prodQuantity}
                    onChange={(e) => setProdQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                 />
                 <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Units To Resource</span>
              </div>
           </div>

           <div className="space-y-4">
              {!selectedProductBom ? (
                 <div className="p-20 bg-slate-50 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                    <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-6" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No analytical recipe defined</p>
                 </div>
              ) : (
                <div className="grid gap-4">
                   {selectedProductBom.items.map((item, idx) => {
                      const itemUnit = item.unit || item.material?.unit || 'pcs';
                      const materialUnit = item.material?.unit || 'pcs';
                      
                      // Normalize requirements based on explicit BOM item unit
                      const requiredPieces = unitsUtil.normalizeToPieces(item.quantity * prodQuantity, itemUnit);
                      const required = unitsUtil.convertFromPieces(requiredPieces, materialUnit);
                      
                      // Stock is already stored in pieces in the DB for dagina items
                      const availablePieces = item.material?.stock || 0;
                      const available = unitsUtil.convertFromPieces(availablePieces, materialUnit);
                      
                      const isShortfall = availablePieces < requiredPieces;
                      return (
                        <div key={idx} className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:border-primary/20 transition-all duration-300">
                           <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 ${isShortfall ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                 {isShortfall ? <ArrowDown className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-base font-black text-slate-900 tracking-tightest">{item.material?.name || 'Unknown Node'}</span>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    Ratio: {item.quantity} {itemUnit} {itemUnit !== materialUnit && `[${required.toFixed(2)} ${materialUnit}]`}
                                 </span>
                              </div>
                           </div>
                           <div className="text-right">
                               <p className="text-xl font-black text-slate-900 tracking-tightest tabular-nums">Need {required.toFixed(2)} {materialUnit}</p>
                               <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isShortfall ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {isShortfall ? `Deficit Identified: ${(required - available).toFixed(2)} ${materialUnit}` : `Node Flux Ready: ${available.toFixed(2)} ${materialUnit}`}
                               </p>
                           </div>
                        </div>
                      )
                   })}
                </div>
              )}
           </div>

           <div className="flex gap-4 pt-4">
              <button onClick={() => setIsBOMModalOpen(false)} className="erp-button-primary flex-1 !py-6 !bg-slate-900 !text-white hover:!bg-black">Return to Terminal</button>
           </div>
        </div>
      </Modal>

      <InventoryHistory 
        isOpen={historyModalOpen} 
        onClose={() => setHistoryModalOpen(false)} 
        product={selectedProduct} 
      />
    </AppLayout>
  );
};

export default Products;
