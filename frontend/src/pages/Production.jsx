import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/common/Modal";
import { productApi, productionApi, bomApi, inventoryApi } from "../api/erpApi";
import { 
  Hammer, History, Plus, Layers, AlertCircle, CheckCircle2, Trash2, 
  Eye, Info, Package, ShoppingBag, Factory, Recycle, Activity,
  Zap, ArrowRight, ShieldCheck, Database, ZapOff, TrendingUp, Search, Filter, Download
} from "lucide-react";

const Production = () => {
  const [productions, setProductions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completeBatchId, setCompleteBatchId] = useState(null);
  const [scrapQuantity, setScrapQuantity] = useState(0);
  const [scrapPieces, setScrapPieces] = useState(0);
  const [scrapCalcMode, setScrapCalcMode] = useState("mass"); // mass or pieces
  const [formLoading, setFormLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [activeView, setActiveView] = useState("batches"); 
  const [scrapLogs, setScrapLogs] = useState([]);

  const [rawMaterials, setRawMaterials] = useState([]);
  const [boms, setBoms] = useState([]); 
  const [localBom, setLocalBom] = useState([]);
  const [completeBatch, setCompleteBatch] = useState(null);
  const [isEditingBom, setIsEditingBom] = useState(false);

  const [isNewProduct, setIsNewProduct] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHsn, setNewHsn] = useState("");
  const [newUnit, setNewUnit] = useState("kg");
  const [newWeight, setNewWeight] = useState(0);

  const [formData, setFormData] = useState({
    productId: "",
    quantity: 1,
    notes: "",
    batchNumber: undefined
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, itemRes, bomRes, scrapRes] = await Promise.all([
        productionApi.getAll(),
        productApi.getAll(),
        bomApi.getAll(),
        inventoryApi.getScrapLogs()
      ]);
      setProductions(prodRes.data);
      setProducts(itemRes.data.filter(p => p.type === 'finished_good'));
      setRawMaterials(itemRes.data.filter(p => p.type === 'raw_material'));
      setBoms(bomRes.data);
      setScrapLogs(scrapRes.data);
      const insightRes = await productionApi.getInsights();
      setInsights(insightRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      let pId = formData.productId;
      if (isNewProduct) {
        const newProdRes = await productApi.create({
          name: newName,
          hsnCode: newHsn,
          sku: `FG-${newName.toUpperCase().replace(/\s+/g, '-')}`,
          type: "finished_good",
          unit: newUnit,
          unitWeightGrams: parseFloat(newWeight) || 0
        });
        pId = newProdRes.data._id;
        if (localBom.length > 0) await bomApi.upsert(pId, { items: localBom });
      } else if (isEditingBom && localBom.length > 0) {
        await bomApi.upsert(pId, { items: localBom });
      }
      await productionApi.create({ ...formData, productId: pId });
      fetchData();
      setIsModalOpen(false);
      setIsNewProduct(false);
      setLocalBom([]);
    } catch (err) {
      alert("Manufacturing authorization failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStart = async (id) => {
    try {
      await productionApi.start(id);
      fetchData();
    } catch (err) {
      alert("Batch initialization failed.");
    }
  };

  const handleComplete = async (e) => {
    if (!completeBatch) return;
    try {
      setFormLoading(true);
      await productionApi.complete(completeBatch._id, { scrapQuantity });
      fetchData();
      setIsCompleteModalOpen(false);
      setCompleteBatch(null);
    } catch (err) {
      alert("Batch completion failed: " + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setIsCompleteModalOpen(false);
    setCompleteBatch(null);
  };

  const handleExportBatches = () => {
    if (!productions.length) return;
    const headers = ["Batch ID", "Product", "Quantity", "Units", "Status", "Created At"];
    const rows = productions.map(b => [
      `"${b._id}"`,
      `"${b.product?.name || 'N/A'}"`,
      b.quantity,
      `"${b.product?.unit || 'PCS'}"`,
      `"${b.status}"`,
      `"${new Date(b.createdAt).toLocaleDateString()}"`
    ].join(","));
    const csvString = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Production_Batches_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportScrap = () => {
    if (!scrapLogs.length) return;
    const headers = ["Log ID", "Material", "Quantity", "Units", "Notes", "Created At"];
    const rows = scrapLogs.map(l => [
      `"${l._id}"`,
      `"${l.material?.name || 'N/A'}"`,
      l.quantity,
      `"${l.material?.unit || 'PCS'}"`,
      `"${l.notes || ''}"`,
      `"${new Date(l.createdAt).toLocaleDateString()}"`
    ].join(","));
    const csvString = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Scrap_Logs_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id) => {
    if (window.confirm("CRITICAL: Reverse production cycle? Stock levels will be rolled back across all nodes.")) {
      try {
        await productionApi.delete(id);
        fetchData();
      } catch (err) {
        alert("Rollback blocked: Node dependency detected.");
      }
    }
  };

  const handleAddIngredient = () => {
    setLocalBom([...localBom, { material: "", quantity: 1, unit: "kg" }]);
    setIsEditingBom(true);
  };

  const handleIngredientChange = (index, field, value) => {
    const newBom = [...localBom];
    newBom[index][field] = field === 'quantity' ? parseFloat(value) : value;
    setLocalBom(newBom);
    setIsEditingBom(true);
  };

  const selectedBom = boms.find(b => b.product?._id === formData.productId || b.product === formData.productId);

  useEffect(() => {
    if (selectedBom) {
      setLocalBom(selectedBom.items || []);
      setIsEditingBom(false);
    } else if (!isNewProduct) {
      setLocalBom([]);
    }
  }, [formData.productId, boms, isNewProduct]);

  const filteredBatches = productions.filter(b => 
    b.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.batchNumber && b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredScrap = scrapLogs.filter(l => 
    l.material?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Elite Command Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center group hover:rotate-12 transition-transform duration-500 shadow-sm border border-indigo-500/10">
                 <Factory className="w-10 h-10 text-indigo-600" />
              </div>
              <div>
                 <h2 className="text-5xl font-black text-slate-900 tracking-tightest leading-none mb-2 italic">Manufacturing <span className="text-indigo-600 not-italic">Command</span></h2>
                 <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-1.5">
                       <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Workshop Intelligence & Batch Lifecycle Hub</span>
                 </div>
              </div>
           </div>

           <button onClick={() => setIsModalOpen(true)} className="erp-button-primary !py-5 !bg-slate-900 !rounded-[2rem] hover:!bg-black group">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Initialize Production Cycle
           </button>
        </div>

        {/* Global Operational Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all duration-500">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Output Yield (24H)</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums italic">{(insights?.summary?.readyAssets || 0).toLocaleString()} <span className="text-[10px] uppercase not-italic opacity-40">Units</span></h3>
              <div className="flex items-center gap-2 mt-4 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                 <TrendingUp className="w-3.5 h-3.5" />
                 <span>Peak Efficiency Threshold</span>
              </div>
           </div>
           <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">WIP Pipeline</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tightest tabular-nums">{productions.filter(p => p.status === 'in_progress').length} Batches</h3>
              <div className="flex items-center gap-2 mt-4 text-indigo-500 font-bold text-[10px] uppercase tracking-widest">
                 <Activity className="w-3.5 h-3.5 animate-pulse" />
                 <span>Active Fabrication Nodes</span>
              </div>
           </div>
           <div className="p-10 bg-slate-900 rounded-[3rem] shadow-2xl shadow-slate-900/20 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Zap className="w-16 h-16 text-white rotate-12" />
              </div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Salvage Ratio</p>
              <h3 className="text-4xl font-black text-white tracking-tightest tabular-nums">4.2% <span className="text-[10px] uppercase opacity-40">Avg</span></h3>
              <div className="flex items-center gap-2 mt-4 text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
                 <Recycle className="w-3.5 h-3.5" />
                 <span>Optimized Waste Gradient</span>
              </div>
           </div>
        </div>

        {/* Unified Command Container */}
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden mb-20">
           <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                 <button onClick={() => setActiveView("batches")} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'batches' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Production Batches</button>
                 <button onClick={() => setActiveView("scrap")} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'scrap' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-rose-600'}`}>Salvage Logs</button>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                 <div className="relative group w-full md:w-64">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchTerm ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <input 
                      placeholder="Identify Batch or Node..." 
                      className="w-full pl-10 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-3 rounded-2xl transition-all ${showFilters ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40' : 'bg-slate-50 text-slate-400 hover:text-slate-900'}`}
                    >
                       <Filter className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={activeView === 'batches' ? handleExportBatches : handleExportScrap}
                      className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                    >
                       <Download className="w-5 h-5" />
                    </button>
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto">
              {loading ? (
                <div className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] animate-pulse text-[10px]">Accessing Fabrication Protocols...</div>
              ) : activeView === "batches" ? (
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
                         <th className="px-12 py-8">Batch UID</th>
                         <th className="px-12 py-8">Yield Identity</th>
                         <th className="px-12 py-8 text-center">Lifecycle</th>
                         <th className="px-12 py-8 text-center">Output Potency</th>
                         <th className="px-12 py-8 text-right pr-20">Operations</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredBatches.map((b) => (
                        <tr key={b._id} className="group hover:bg-slate-50/80 transition-all duration-500">
                           <td className="px-12 py-10">
                              <div className="flex flex-col">
                                 <span className="text-[11px] font-black text-slate-900 tracking-tightest bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 w-fit mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-all">BN-{b.batchNumber?.slice(-6).toUpperCase() || b._id.slice(-6).toUpperCase()}</span>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(b.createdAt).toLocaleDateString()}</span>
                              </div>
                           </td>
                           <td className="px-12 py-10">
                              <div className="flex flex-col">
                                 <span className="text-base font-black text-slate-900 tracking-tightest group-hover:text-indigo-600 transition-colors italic uppercase">{b.product?.name}</span>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">CAT: {b.product?.category || "Industrial Yield"}</span>
                              </div>
                           </td>
                           <td className="px-12 py-10 text-center">
                              <div className="flex flex-col items-center gap-2">
                                 <span className={`px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                    b.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    b.status === 'in_progress' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                 }`}>
                                    {b.status}
                                 </span>
                                 {b.status === 'in_progress' && <div className="w-24 h-1 bg-indigo-500 animate-pulse rounded-full"></div>}
                              </div>
                           </td>
                           <td className="px-12 py-10 text-center">
                              <div className="flex flex-col items-center">
                                 <span className="text-xl font-black text-slate-900 tracking-tightest tabular-nums text-glow">{b.quantity} <span className="text-[10px] uppercase opacity-40">{b.product?.unit}</span></span>
                                 <div className="flex items-center gap-1.5 mt-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    <span className="text-[8px] font-black uppercase text-slate-400">Yield Sync Active</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-12 py-10 text-right pr-20">
                              <div className="flex items-center justify-end gap-3 transition-opacity">
                                 {b.status === 'pending' && <button onClick={() => handleStart(b._id)} className="p-3 bg-indigo-600 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-indigo-200"><Activity className="w-5 h-5" /></button>}
                                 {b.status === 'in_progress' && <button onClick={() => { setCompleteBatch(b); setIsCompleteModalOpen(true); }} className="p-3 bg-emerald-500 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-200"><CheckCircle2 className="w-5 h-5" /></button>}
                                 <button onClick={() => handleDelete(b._id)} className="p-3 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              ) : (
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
                         <th className="px-12 py-8">Log Identity</th>
                         <th className="px-12 py-8">Source Node</th>
                         <th className="px-12 py-8 text-center">Magnitude</th>
                         <th className="px-12 py-8 text-right pr-20">Protocol Context</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredScrap.map(log => (
                        <tr key={log._id} className="group hover:bg-rose-50/50 transition-colors">
                           <td className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">{log._id.slice(-8).toUpperCase()}</td>
                           <td className="px-12 py-8 font-black text-slate-900 uppercase tracking-tightest italic">{log.material?.name || "Industrial Component"}</td>
                           <td className="px-12 py-8 text-center">
                              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-rose-50 rounded-2xl border border-rose-100">
                                 <Recycle className="w-4 h-4 text-rose-500" />
                                 <span className="text-base font-black text-rose-600">-{log.quantity} <span className="text-[10px] opacity-40">{log.material?.unit}</span></span>
                              </div>
                           </td>
                           <td className="px-12 py-8 text-right pr-20">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-40">{log.notes || "Production Fabrication Waste"}</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              )}
           </div>
        </div>

      </div>

      {/* Advanced Fabrication Modals */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initialize Fabrication Protocol">
        <form onSubmit={handleCreate} className="p-10 space-y-8">
           <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 mb-4 justify-center">
              <button type="button" onClick={() => setIsNewProduct(false)} className={`flex-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${!isNewProduct ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Existing Blueprint</button>
              <button type="button" onClick={() => setIsNewProduct(true)} className={`flex-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${isNewProduct ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>New Node Yield</button>
           </div>

           <div className="space-y-6">
              {isNewProduct ? (
                <div className="space-y-5 animate-in slide-in-from-top-4 duration-500">
                   <input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="IDENTIFY NEW FINISHED PRODUCT NAME..." className="erp-input !py-6 !bg-slate-50 focus:!bg-white" />
                   <div className="grid grid-cols-2 gap-4">
                      <input value={newHsn} onChange={e => setNewHsn(e.target.value)} placeholder="HSN CODE..." className="erp-input !py-5" />
                      <select value={newUnit} onChange={e => setNewUnit(e.target.value)} className="erp-input !py-5">
                         <option value="kg">KILOGRAM (KG)</option>
                         <option value="pcs">PIECES (PCS)</option>
                         <option value="dagina">DAGINA</option>
                      </select>
                      <div className="col-span-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1 italic text-indigo-600">Finished Unit Weight (Grams)</label>
                         <input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="WEIGHT IN GRAMS (PER UNIT)..." className="erp-input !py-5 !bg-indigo-50/20" />
                      </div>
                   </div>
                </div>
              ) : (
                <select required value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })} className="erp-input !py-5 !bg-slate-50 focus:!bg-white">
                   <option value="">Select Resource Blueprint...</option>
                   {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock} {p.unit})</option>)}
                </select>
              )}

              <div className="p-8 bg-indigo-50/50 rounded-[3rem] border border-indigo-100/50">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                       <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Resource Formula</h4>
                       <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Calculated per yield unit</p>
                    </div>
                    <button type="button" onClick={handleAddIngredient} className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm hover:scale-110 active:scale-90 transition-all border border-indigo-100"><Layers className="w-5 h-5" /></button>
                 </div>
                 <div className="space-y-3">
                    {localBom.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-50 shadow-sm animate-in slide-in-from-left duration-300">
                         <select required value={typeof item.material === 'string' ? item.material : item.material?._id} onChange={e => handleIngredientChange(idx, "material", e.target.value)} className="flex-1 bg-transparent border-none text-[11px] font-black outline-none italic uppercase">
                            <option value="">NODE...</option>
                            {rawMaterials.map(m => <option key={m._id} value={m._id}>{m.name.toUpperCase()}</option>)}
                         </select>
                         <input required type="number" step="0.001" value={item.quantity} onChange={e => handleIngredientChange(idx, "quantity", e.target.value)} className="w-20 bg-slate-50 px-3 py-2 rounded-xl text-xs font-black text-right outline-none" />
                         <span className="text-[10px] font-black text-slate-300 uppercase w-8">{rawMaterials.find(m => m._id === (typeof item.material === 'string' ? item.material : item.material?._id))?.unit || 'KG'}</span>
                         <button type="button" onClick={() => setLocalBom(localBom.filter((_, i) => i !== idx))} className="p-2 text-rose-200 hover:text-rose-500 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Cycle Magnitude</label>
                    <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} className="erp-input !py-5 !text-2xl font-black tabular-nums" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Custom Batch UID</label>
                    <input placeholder="OPTIONAL REF..." onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} className="erp-input !py-5 !text-2xl font-black uppercase placeholder:italic" />
                 </div>
              </div>
           </div>

           <div className="flex gap-4 pt-6">
              <button type="submit" disabled={formLoading} className="erp-button-primary flex-1 !py-6 !bg-slate-900 !text-white hover:!bg-black group">
                 <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                 {formLoading ? "Synchronizing Protocols..." : "Authorize Cycle"}
              </button>
           </div>
        </form>
      </Modal>

      <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Finalize Fabrication Cycle">
        <form onSubmit={handleComplete} className="p-10 space-y-8">
           <div className="p-10 bg-yellow-50 rounded-[3rem] border border-yellow-100 flex gap-6 items-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 shrink-0" />
              <p className="text-[11px] text-yellow-900 font-bold leading-relaxed uppercase italic">Warning: Cycle closure is permanent. Capture salvage magnitude before finalizing yield stock injection.</p>
           </div>
           
           <div className="space-y-6">
              <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                 <button type="button" onClick={() => setScrapCalcMode("mass")} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${scrapCalcMode === 'mass' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Direct Mass (KG)</button>
                 <button type="button" onClick={() => setScrapCalcMode("pieces")} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${scrapCalcMode === 'pieces' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Count Based (PCS)</button>
              </div>

              {scrapCalcMode === 'pieces' ? (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3 px-1">Defect Item Count (PCS)</label>
                      <input 
                        type="number" 
                        value={scrapPieces} 
                        onChange={e => {
                          const pcs = parseInt(e.target.value) || 0;
                          setScrapPieces(pcs);
                          const weight = completeBatch?.product?.unitWeightGrams || 0;
                          const calculatedMass = (pcs * weight) / 1000;
                          setScrapQuantity(calculatedMass);
                        }} 
                        className="erp-input !py-6 !text-4xl font-black !text-rose-500 tabular-nums" 
                        placeholder="0 PCS"
                      />
                   </div>
                   <div className="p-6 bg-rose-50/50 rounded-[2rem] border border-rose-100 border-dashed flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Activity className="w-5 h-5 text-rose-400" />
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Weight Synchronization</p>
                            <p className="text-[11px] font-black text-rose-600 uppercase italic">@ {completeBatch?.product?.unitWeightGrams || 0}g Per Unit</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Calculated Mass</p>
                         <p className="text-2xl font-black text-rose-600 tabular-nums italic">{scrapQuantity} KG</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="animate-in slide-in-from-top-4 duration-500">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3 px-1">Salvage Load (KG/Tons)</label>
                   <div className="relative">
                      <input 
                        type="number" 
                        step="0.01" 
                        value={scrapQuantity} 
                        onChange={e => setScrapQuantity(parseFloat(e.target.value) || 0)} 
                        className="erp-input !py-8 !text-5xl font-black !text-rose-500 tabular-nums" 
                      />
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-rose-200 italic uppercase">KG</span>
                   </div>
                </div>
              )}
           </div>

           <div className="flex gap-4 pt-4">
              <button type="submit" disabled={formLoading} className="erp-button-primary w-full !py-7 !bg-emerald-600 hover:!bg-emerald-700 !text-white group">
                 <ShieldCheck className="w-6 h-6 group-hover:animate-bounce" />
                 {formLoading ? "Injecting Inventory..." : "Complete & Synchronize Nodes"}
              </button>
           </div>
        </form>
      </Modal>

    </AppLayout>
  );
};

export default Production;
