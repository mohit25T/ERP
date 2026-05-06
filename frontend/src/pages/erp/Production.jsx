import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { productApi, productionApi, bomApi, inventoryApi } from "../../api/erpApi";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import HammerLoader from "../../components/common/HammerLoader";
import unitsUtil from "../../utils/units";
import {
   Factory, Plus, TrendingUp, Activity, Search, Filter,
   Trash2, Edit3, Play, CheckCircle2, AlertTriangle,
   Layers, X, Info, PackageOpen, LayoutGrid, ArrowRight,
   Gauge, History, Recycle, Download, Zap, AlertCircle,
   ShieldCheck
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
   const [producedQty, setProducedQty] = useState(0);
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
   const [isEditing, setIsEditing] = useState(false);
   const [editId, setEditId] = useState(null);

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
               sku: `FG-${newName.toUpperCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`,
               type: "finished_good",
               unit: newUnit,
               unitWeightGrams: parseFloat(newWeight) || 0,

            });
            pId = newProdRes.data._id;
            if (localBom.length > 0) await bomApi.upsert(pId, { items: localBom });
         } else if (isEditingBom && localBom.length > 0) {
            await bomApi.upsert(pId, { items: localBom });
         }

         if (isEditing) {
            await productionApi.update(editId, { ...formData, productId: pId });
         } else {
            await productionApi.create({ ...formData, productId: pId });
         }

         fetchData();
         handleClose();
      } catch (err) {
         const errorMsg = err.response?.data?.msg || err.response?.data?.error || err.message;
         alert(`Manufacturing authorization failed:\n${errorMsg}`);
      } finally {
         setFormLoading(false);
      }
   };

   const handleStart = async (id) => {
      try {
         await productionApi.start(id);
         fetchData();
      } catch (err) {
         const errorMsg = err.response?.data?.msg || err.response?.data?.error || err.message;
         alert(`Batch initialization failed:\n${errorMsg}`);
      }
   };

   const handleComplete = async (e) => {
      e.preventDefault();
      if (!completeBatch) return;
      try {
         setFormLoading(true);
         await productionApi.complete(completeBatch._id, {
            scrapQuantity: scrapCalcMode === 'pieces' ? scrapPieces : scrapQuantity,
            scrapUnit: scrapCalcMode === 'pieces' ? 'pcs' : 'kg',
            outputQuantity: producedQty !== undefined ? producedQty : completeBatch.quantity
         });
         fetchData();
         setIsCompleteModalOpen(false);
         setCompleteBatch(null);
      } catch (err) {
         const errorMsg = err.response?.data?.msg || err.response?.data?.error || err.message;
         alert(`Batch completion failed:\n${errorMsg}`);
      } finally {
         setFormLoading(false);
      }
   };

   const handleClose = () => {
      setIsModalOpen(false);
      setIsCompleteModalOpen(false);
      setCompleteBatch(null);
      setIsEditing(false);
      setEditId(null);
      setFormData({ productId: "", quantity: 1, notes: "", batchNumber: undefined });
      setLocalBom([]);
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

   const handleEdit = (batch) => {
      setEditId(batch._id);
      setIsEditing(true);
      setFormData({
         productId: batch.product?._id || batch.product,
         quantity: batch.quantity,
         notes: batch.notes || "",
         batchNumber: batch.batchNumber
      });
      setIsNewProduct(false);
      setIsModalOpen(true);
   };

   const handleDelete = async (id) => {
      if (window.confirm("CRITICAL: Reverse production cycle?")) {
         try {
            await productionApi.delete(id);
            fetchData();
         } catch (err) {
            const errorMsg = err.response?.data?.msg || err.response?.data?.error || err.message;
            alert(`Rollback blocked:\n${errorMsg}`);
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
      <AppLayout fullWidth>
          <div className="space-y-4">

             <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-card rounded-md flex items-center justify-center shadow-sm border border-border">
                      <Factory className="w-6 h-6 text-primary" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Production Execution</h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Operational Yield Optimization & Batch Fabrication Management</p>
                   </div>
                </div>
               <button
                  onClick={() => setIsModalOpen(true)}
                  className="erp-button-primary !py-4"
               >
                  <Plus className="w-4 h-4 mr-2" />
                  Initialize Batch
               </button>
            </div>

            {/* Global Operational Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-card p-5 rounded-md border border-border shadow-sm flex flex-col justify-between group">
                  <div className="flex items-center justify-between mb-4">
                     <div className="p-2 bg-emerald-500/10 rounded text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                     </div>
                     <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Peak Yield</div>
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Yield (24H)</p>
                     <h3 className="text-2xl font-black text-foreground tracking-tighter tabular-nums">
                        {(insights?.summary?.readyAssets || 0).toLocaleString()} <span className="text-xs text-muted-foreground font-bold ml-1 uppercase">Units</span>
                     </h3>
                  </div>
               </div>

               <div className="bg-card p-5 rounded-md border border-border shadow-sm flex flex-col justify-between group">
                  <div className="flex items-center justify-between mb-4">
                     <div className="p-2 bg-primary/10 rounded text-primary">
                        <Activity className="w-4 h-4" />
                     </div>
                     <div className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-black uppercase tracking-widest border border-primary/20">Active Flow</div>
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Work In Progress</p>
                     <h3 className="text-2xl font-black text-foreground tracking-tighter tabular-nums">
                        {productions.filter(p => p.status === 'in_progress').length} <span className="text-xs text-muted-foreground font-bold ml-1 uppercase">Batches</span>
                     </h3>
                  </div>
               </div>

               <div className="bg-card p-5 rounded-md border border-border shadow-sm flex flex-col justify-between group">
                  <div className="flex items-center justify-between mb-4">
                     <div className="p-2 bg-amber-500/10 rounded text-amber-600 dark:text-amber-400">
                        <Recycle className="w-4 h-4" />
                     </div>
                     <div className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-[8px] font-black uppercase tracking-widest border border-amber-500/20">Loss Matrix</div>
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Wastage Index</p>
                     <h3 className="text-2xl font-black text-foreground tracking-tighter tabular-nums">
                        {(insights?.scrapEfficiency || 0).toFixed(1)}% <span className="text-xs text-muted-foreground font-bold ml-1 uppercase">Flux</span>
                     </h3>
                  </div>
               </div>
            </div>

            {/* Unified Command Container */}
            <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
               <div className="p-3 border-b border-border flex flex-col md:flex-row justify-between items-center gap-3 bg-muted/5">
                  <div className="flex bg-muted/30 p-1 rounded border border-border/50 shadow-inner">
                     <button onClick={() => setActiveView("batches")} className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'batches' ? 'bg-card text-primary shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>Active Batches</button>
                     <button onClick={() => setActiveView("scrap")} className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'scrap' ? 'bg-card text-destructive shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>Scrap Index</button>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                     <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                           placeholder="Search Registry..."
                           className="erp-input w-full pl-9"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                        />
                     </div>
                     <div className="flex items-center gap-2">
                        <button
                           onClick={() => setShowFilters(!showFilters)}
                           className={`p-2 border rounded-md transition-all ${showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
                        >
                           <Filter className="w-4 h-4" />
                        </button>
                        <button
                           onClick={activeView === 'batches' ? handleExportBatches : handleExportScrap}
                           className="p-2 border border-border bg-card rounded-md text-muted-foreground hover:text-foreground transition-all shadow-sm"
                        >
                           <Download className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  {loading ? (
                     <HammerLoader />
                  ) : activeView === "batches" ? (
                     <table className="erp-table">
                        <thead>
                           <tr>
                              <th>Batch Identifier</th>
                              <th>Asset Profile</th>
                              <th>Status</th>
                              <th>Target Yield</th>
                              <th>Salvage Loss</th>
                              <th className="text-right">Control</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                           <AnimatePresence mode="popLayout">
                              {filteredBatches.map((b, index) => (
                                 <motion.tr
                                    key={b._id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.01 }}
                                    className="erp-row-hover"
                                 >
                                    <td>
                                       <div className="flex flex-col">
                                          <span className="text-xs font-black text-foreground">BN-{b.batchNumber ? b.batchNumber.slice(-6).toUpperCase() : (b._id ? b._id.slice(-6).toUpperCase() : "VOID")}</span>
                                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{new Date(b.createdAt).toLocaleDateString()}</span>
                                       </div>
                                    </td>
                                    <td>
                                       <div className="flex flex-col">
                                          <span className="text-xs font-bold text-foreground">{b.product?.name || "Unknown"}</span>
                                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">{b.product?.category || "General"}</span>
                                       </div>
                                    </td>
                                    <td>
                                       <div className={`status-badge w-fit ${
                                          b.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                          b.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                                          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                       }`}>
                                          {b.status === 'in_progress' ? 'ACTIVE' : b.status === "completed" ? "CLOSED" : "QUEUED"}
                                       </div>
                                    </td>
                                    <td>
                                       <div className="flex flex-col">
                                          <span className="text-xs font-black text-foreground tabular-nums">
                                             {b.status === 'completed' ? (b.outputQuantity ?? b.quantity) : b.quantity}
                                             {b.status === 'completed' && <span className="text-[10px] text-muted-foreground font-bold ml-1">/ {b.quantity}</span>}
                                             <span className="text-[9px] font-bold text-muted-foreground ml-1 uppercase tracking-widest">{b.product?.unit}</span>
                                          </span>
                                       </div>
                                    </td>
                                    <td>
                                       {b.status === 'completed' && (b.scrapWeight > 0 || b.scrapQuantity > 0) ? (
                                          <div className="flex flex-col">
                                             <span className="text-xs font-black text-destructive tabular-nums">
                                                -{b.scrapQuantity} <span className="text-[9px] font-bold uppercase tracking-tighter">{b.scrapUnit || 'pcs'}</span>
                                             </span>
                                          </div>
                                       ) : (
                                          <span className="text-[10px] text-muted-foreground opacity-30">—</span>
                                       )}
                                    </td>
                                    <td className="text-right">
                                       <div className="flex items-center justify-end gap-1">
                                          {b.status === 'pending' && <button onClick={() => handleEdit(b)} className="p-1.5 border border-border bg-card hover:bg-muted text-primary rounded transition-colors" title="Modify"><Edit3 className="w-3.5 h-3.5" /></button>}
                                          {b.status === 'pending' && <button onClick={() => handleStart(b._id)} className="p-1.5 border border-border bg-card hover:bg-muted text-primary rounded transition-colors" title="Initialize"><Activity className="w-3.5 h-3.5" /></button>}
                                          {b.status === 'in_progress' && <button onClick={() => { setCompleteBatch(b); setProducedQty(b.quantity); setScrapQuantity(0); setScrapPieces(0); setIsCompleteModalOpen(true); }} className="p-1.5 border border-border bg-card hover:bg-muted text-emerald-600 rounded transition-colors" title="Finalize"><CheckCircle2 className="w-3.5 h-3.5" /></button>}
                                          <button onClick={() => handleDelete(b._id)} className="p-1.5 border border-border bg-card hover:bg-muted text-destructive rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                       </div>
                                    </td>
                                 </motion.tr>
                              ))}
                           </AnimatePresence>
                        </tbody>
                     </table>
                  ) : (
                     <table className="erp-table">
                        <thead>
                           <tr>
                              <th>Log Sequence</th>
                              <th>Material Node</th>
                              <th>Aggregate Loss</th>
                              <th>Audit Trail</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                           {filteredScrap.map(log => (
                              <tr key={log._id} className="erp-row-hover">
                                 <td className="text-[10px] font-black text-muted-foreground uppercase">{log._id.slice(-8)}</td>
                                 <td>
                                    <span className="text-xs font-bold text-foreground">{log.material?.name || "Raw Material"}</span>
                                 </td>
                                 <td>
                                    <span className="text-xs font-black text-destructive tabular-nums">-{log.quantity} {log.material?.unit}</span>
                                 </td>
                                 <td>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight opacity-70 italic">"{log.notes || "Wastage"}"</span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}
               </div>
            </div>

         </div>

         {/* Modals */}
         <Modal isOpen={isModalOpen} onClose={handleClose} title={isEditing ? "Modify Production Sequence" : "Authorize Batch Fabrication"}>
            <form onSubmit={handleCreate} className="p-6 space-y-6">
               <div className="flex bg-muted/30 p-1 rounded border border-border/50 shadow-inner">
                  <button type="button" onClick={() => setIsNewProduct(false)} className={`flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${!isNewProduct ? 'bg-card text-primary shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>Registry Item</button>
                  <button type="button" onClick={() => setIsNewProduct(true)} className={`flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${isNewProduct ? 'bg-card text-emerald-600 shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>New Prototype</button>
               </div>

               <div className="space-y-4">
                  {isNewProduct ? (
                     <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div>
                           <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 ml-1">Prototype Name</label>
                           <input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full identifier..." className="erp-input w-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">HSN Registry</label>
                              <input value={newHsn} onChange={e => setNewHsn(e.target.value)} placeholder="HSN..." className="erp-input w-full" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">Unit Index</label>
                              <select value={newUnit} onChange={e => setNewUnit(e.target.value)} className="erp-input w-full">
                                 <option value="kg">KILOGRAM (KG)</option>
                                 <option value="gram">GRAM (GM)</option>
                                 <option value="pcs">PIECES (PCS)</option>
                                 <option value="dagina">DAGINA</option>
                                 <option value="tons">TONS</option>
                              </select>
                           </div>
                           <div className="col-span-2 space-y-1.5">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">Net Unit Weight (Grams)</label>
                              <input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="Mass per unit..." className="erp-input w-full" />
                           </div>

                           {(() => {
                              const normalizedInputGrams = localBom.reduce((acc, item) => {
                                 const qty = parseFloat(item.quantity) || 0;
                                 const factor = unitsUtil.CONVERSIONS[item.unit?.toLowerCase()] || 1;
                                 return acc + (qty * factor * 1000);
                              }, 0);

                              const inputWeightGrams = normalizedInputGrams;
                              const outputWeightGrams = parseFloat(newWeight) || 0;
                              const lossGrams = inputWeightGrams - outputWeightGrams;

                              return (
                                 <div className="col-span-2 p-4 bg-muted/40 rounded border border-border space-y-4">
                                    <div className="flex items-center justify-between">
                                       <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Wastage Assessment</h4>
                                       <span className="text-[8px] font-black text-primary uppercase">Calculated</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                       <div className="flex flex-col">
                                          <span className="text-[8px] font-bold text-muted-foreground uppercase">Input</span>
                                          <span className="text-xs font-black text-foreground tabular-nums">{(inputWeightGrams / 1000).toFixed(3)}kg</span>
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-[8px] font-bold text-muted-foreground uppercase">Yield</span>
                                          <span className="text-xs font-black text-foreground tabular-nums">{(outputWeightGrams / 1000).toFixed(3)}kg</span>
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-[8px] font-bold text-muted-foreground uppercase">Loss</span>
                                          <span className="text-xs font-black text-destructive tabular-nums">{(lossGrams / 1000).toFixed(3)}kg</span>
                                       </div>
                                    </div>
                                 </div>
                              );
                           })()}
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">Registry Selection</label>
                        <select required value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })} className="erp-input w-full font-bold">
                           <option value="">Authorize identifier...</option>
                           {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.stock} {p.unit})</option>)}
                        </select>
                     </div>
                  )}

                  <div className="p-4 bg-muted/20 rounded border border-border">
                     <div className="flex items-center justify-between mb-4">
                        <div>
                           <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Resource Protocol (BOM)</h4>
                           <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">Material nodes required per yield unit</p>
                        </div>
                        <button type="button" onClick={handleAddIngredient} className="p-1.5 bg-card text-primary rounded border border-border hover:bg-muted shadow-sm transition-all"><Plus className="w-3.5 h-3.5" /></button>
                     </div>
                     <div className="space-y-2">
                        {localBom.map((item, idx) => (
                           <div key={idx} className="flex items-center gap-2 bg-card p-2 rounded border border-border shadow-sm">
                              <select required value={typeof item.material === 'string' ? item.material : item.material?._id} onChange={e => handleIngredientChange(idx, "material", e.target.value)} className="flex-1 bg-transparent border-none text-[11px] font-bold outline-none">
                                 <option value="">Material...</option>
                                 {rawMaterials.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                              </select>
                              <input required type="number" step="0.001" value={item.quantity} onChange={e => handleIngredientChange(idx, "quantity", e.target.value)} className="w-16 bg-muted/40 px-2 py-1 rounded text-[11px] font-black text-right outline-none border border-border" />
                              <button type="button" onClick={() => setLocalBom(localBom.filter((_, i) => i !== idx))} className="p-1 text-destructive opacity-40 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">Target Yield Quantity</label>
                        <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} className="erp-input w-full font-black" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">Batch Identifier (Optional)</label>
                        <input placeholder="BATCH-REF..." onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} className="erp-input w-full" />
                     </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-4 border-t border-border">
                  <button type="button" onClick={handleClose} className="erp-button-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={formLoading} className="erp-button-primary flex-[2]">
                     {formLoading ? "Authorizing..." : "Initialize Protocol"}
                  </button>
               </div>
            </form>
         </Modal>

         <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Finalize Fabrication Cycle">
            <form onSubmit={handleComplete} className="p-6 space-y-6">
               <div className="p-4 bg-amber-500/10 rounded border border-amber-500/20 flex gap-3 text-amber-600 text-[11px] font-bold uppercase tracking-tight">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>Finalizing this cycle will inject yielded assets into registry and commit identified wastage to scrap index.</p>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">Actual Yield Output ({completeBatch?.product?.unit})</label>
                  <input
                     required
                     type="number"
                     value={producedQty}
                     onChange={e => setProducedQty(parseInt(e.target.value) || 0)}
                     className="erp-input w-full font-black text-xl text-emerald-600"
                  />
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-50 ml-1">Target Protocol: {completeBatch?.quantity}</p>
               </div>

               <div className="space-y-4">
                  <div className="flex bg-muted/30 p-1 rounded border border-border/50 shadow-inner">
                     <button type="button" onClick={() => setScrapCalcMode("mass")} className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${scrapCalcMode === 'mass' ? 'bg-card text-destructive shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>Direct Mass (kg)</button>
                     <button type="button" onClick={() => setScrapCalcMode("pieces")} className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${scrapCalcMode === 'pieces' ? 'bg-card text-destructive shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>Unit Count</button>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">Wastage Identification</label>
                     <input
                        type="number"
                        step="0.001"
                        value={scrapCalcMode === 'pieces' ? scrapPieces : scrapQuantity}
                        onChange={e => {
                           const val = parseFloat(e.target.value) || 0;
                           if (scrapCalcMode === 'pieces') setScrapPieces(val);
                           else setScrapQuantity(val);
                        }}
                        className="erp-input w-full text-destructive font-black text-lg"
                        placeholder="0.000"
                     />
                  </div>
               </div>

               <div className="flex gap-4 pt-4 border-t border-border">
                  <button type="button" onClick={() => setIsCompleteModalOpen(false)} className="erp-button-secondary flex-1">Abort</button>
                  <button type="submit" disabled={formLoading} className="erp-button-primary flex-[2] !bg-emerald-600 border-emerald-500">
                     {formLoading ? "Processing..." : "Commit Fabrication"}
                  </button>
               </div>
            </form>
         </Modal>

      </AppLayout>
   );
};

export default Production;
