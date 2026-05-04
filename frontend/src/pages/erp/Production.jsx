import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { productApi, productionApi, bomApi, inventoryApi } from "../../api/erpApi";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import HammerLoader from "../../components/common/HammerLoader";
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
      if (window.confirm("CRITICAL: Reverse production cycle? Stock levels will be rolled back across all nodes.")) {
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
      <AppLayout>
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
               <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                     <Factory className="w-6 h-6 text-indigo-600" /> Production
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">Manage manufacturing batches, BOMs, and yield.</p>
               </div>
               <button onClick={() => setIsModalOpen(true)} className="erp-button-primary">
                  <Plus className="w-4 h-4 mr-2" /> New Batch
               </button>
            </div>

            {/* Global Operational Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white rounded-md border border-slate-100 p-5 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Output Yield (24H)</h3>
                     <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">
                        <TrendingUp className="w-5 h-5" />
                     </div>
                  </div>
                  <div className="mt-auto">
                     <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{(insights?.summary?.readyAssets || 0).toLocaleString()} <span className="text-sm text-slate-400 font-medium">Units</span></h3>
                     <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">Optimal Yield Efficiency</p>
                  </div>
               </div>

               <div className="bg-white rounded-md border border-slate-100 p-5 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Batches (WIP)</h3>
                     <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">
                        <Activity className="w-5 h-5" />
                     </div>
                  </div>
                  <div className="mt-auto">
                     <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{productions.filter(p => p.status === 'in_progress').length} <span className="text-sm text-slate-400 font-medium">Batches</span></h3>
                     <p className="text-xs text-indigo-600 font-semibold mt-2 flex items-center gap-1">In Fabrication</p>
                  </div>
               </div>

               <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Avg Scrap Rate</h3>
                     <div className="p-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg">
                        <Recycle className="w-5 h-5" />
                     </div>
                  </div>
                  <div className="mt-auto">
                     <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{(insights?.scrapEfficiency || 0).toFixed(1)}%</h3>
                     <p className="text-xs text-amber-600 font-semibold mt-2 flex items-center gap-1">Verified Output</p>
                  </div>
               </div>
            </div>

            {/* Unified Command Container */}
            <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden mb-8">
               <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                     <button onClick={() => setActiveView("batches")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeView === 'batches' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Production Batches</button>
                     <button onClick={() => setActiveView("scrap")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeView === 'scrap' ? 'bg-white text-rose-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-rose-600'}`}>Scrap Logs</button>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                     <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                           placeholder="Search batches..."
                           className="erp-input w-full pl-9"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                        />
                     </div>
                     <div className="flex items-center gap-2">
                        <button
                           onClick={() => setShowFilters(!showFilters)}
                           className="p-2 border border-slate-200 bg-white rounded-md text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
                        >
                           <Filter className="w-4 h-4" />
                        </button>
                        <button
                           onClick={activeView === 'batches' ? handleExportBatches : handleExportScrap}
                           className="p-2 border border-slate-200 bg-white rounded-md text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
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
                              <th>Batch ID</th>
                              <th>Product</th>
                              <th>Status</th>
                              <th>Quantity (Yield)</th>
                              <th>Scrap</th>
                              <th className="text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           <AnimatePresence mode="popLayout">
                             {filteredBatches.map((b, index) => (
                                <motion.tr 
                                  key={b._id} 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2, delay: index * 0.03 }}
                                  className="erp-row-hover transition-colors"
                                >
                                   <td>
                                      <div className="flex flex-col">
                                         <span className="text-sm font-semibold text-slate-900">BN-{b.batchNumber ? b.batchNumber.slice(-6).toUpperCase() : (b._id ? b._id.slice(-6).toUpperCase() : "VOID")}</span>
                                         <span className="text-xs text-slate-500">{new Date(b.createdAt).toLocaleDateString()}</span>
                                      </div>
                                   </td>
                                   <td>
                                      <div className="flex flex-col">
                                         <span className="text-sm font-semibold text-slate-900">{b.product?.name || "Unknown Product"}</span>
                                         <span className="text-xs text-slate-500">{b.product?.category || "Uncategorized"}</span>
                                      </div>
                                   </td>
                                   <td>
                                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${b.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                         b.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-amber-50 text-amber-700 border-amber-200'
                                         }`}>
                                         {b.status === 'in_progress' ? 'IN FABRICATION' : b.status === "completed" ? "CLOSED" : "PENDING"}
                                      </span>
                                   </td>
                                   <td>
                                      <div className="flex flex-col">
                                         <span className="text-sm font-semibold text-slate-900">
                                            {b.status === 'completed' ? (b.outputQuantity ?? b.quantity) : b.quantity}
                                            {b.status === 'completed' && <span className="text-[10px] text-slate-400 font-medium ml-1">/ {b.quantity}</span>}
                                            <span className="text-xs font-normal text-slate-500 ml-1">{b.product?.unit}</span>
                                         </span>
                                      </div>
                                   </td>
                                   <td>
                                      {b.status === 'completed' && (b.scrapWeight > 0 || b.scrapQuantity > 0) ? (
                                         <div className="flex flex-col">
                                            <span className="text-sm font-bold text-rose-600">
                                               -{b.scrapQuantity} <span className="text-[10px] font-medium uppercase tracking-tighter">{b.scrapUnit || 'pcs'} loss</span>
                                            </span>
                                             {b.scrapUnit === 'pcs' && (b.product?.unitWeightGrams > 0) && (
                                                <>
                                                   <span className="text-[10px] font-medium text-rose-400">
                                                      ({((b.scrapQuantity * b.product.unitWeightGrams) / 1000).toFixed(2)} kg mass)
                                                   </span>
                                                   {b.scrapWeight > ((b.scrapQuantity * b.product.unitWeightGrams) / 1000 + 0.01) && (
                                                      <span className="text-[9px] font-medium text-rose-300 italic">
                                                         (+{(b.scrapWeight - (b.scrapQuantity * b.product.unitWeightGrams) / 1000).toFixed(2)}kg process loss)
                                                      </span>
                                                   )}
                                                </>
                                             )}
                                             {b.scrapUnit === 'kg' && b.scrapWeight > b.scrapQuantity && (
                                                <span className="text-[10px] font-medium text-rose-400">
                                                   (+{(b.scrapWeight - b.scrapQuantity).toFixed(2)} kg yield loss)
                                                </span>
                                             )}
                                         </div>
                                      ) : (
                                         <span className="text-xs text-slate-300">—</span>
                                      )}
                                   </td>
                                   <td className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                         {b.status === 'pending' && <button onClick={() => handleEdit(b)} className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 rounded-md transition-colors" title="Edit Batch"><Edit3 className="w-4 h-4" /></button>}
                                         {b.status === 'pending' && <button onClick={() => handleStart(b._id)} className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 rounded-md transition-colors" title="Start Production"><Activity className="w-4 h-4" /></button>}
                                         {b.status === 'in_progress' && <button onClick={() => { setCompleteBatch(b); setProducedQty(b.quantity); setScrapQuantity(0); setScrapPieces(0); setIsCompleteModalOpen(true); }} className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-emerald-600 rounded-md transition-colors" title="Complete Batch"><CheckCircle2 className="w-4 h-4" /></button>}
                                         <button onClick={() => handleDelete(b._id)} className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-rose-500 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                      </div>
                                   </td>
                                </motion.tr>
                             ))}
                           </AnimatePresence>
                           {filteredBatches.length === 0 && (
                               <tr>
                                  <td colSpan="6" className="py-8 text-center text-sm text-slate-500 uppercase font-black tracking-widest opacity-50">No Active Data Stream</td>
                               </tr>
                           )}
                        </tbody>
                     </table>
                  ) : (
                     <table className="erp-table">
                        <thead>
                           <tr>
                              <th>Log ID</th>
                              <th>Material</th>
                              <th>Quantity</th>
                              <th>Notes</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {filteredScrap.map(log => (
                              <tr key={log._id} className="erp-row-hover transition-colors">
                                 <td className="text-xs text-slate-500 font-mono">{log._id.slice(-8).toUpperCase()}</td>
                                 <td className="text-sm font-semibold text-slate-900">{log.material?.name || "Raw Material"}</td>
                                 <td>
                                    <span className="text-sm font-bold text-rose-600">-{log.quantity} {log.material?.unit}</span>
                                 </td>
                                 <td>
                                    <span className="text-sm text-slate-500">{log.notes || "Waste"}</span>
                                 </td>
                              </tr>
                           ))}
                           {filteredScrap.length === 0 && (
                              <tr>
                                 <td colSpan="4" className="py-8 text-center text-sm text-slate-500">No scrap logs available.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  )}
               </div>
            </div>

         </div>

         {/* Advanced Fabrication Modals */}
         <Modal isOpen={isModalOpen} onClose={handleClose} title={isEditing ? "Edit Production Batch" : "Initialize New Batch"}>
            <form onSubmit={handleCreate} className="p-4 space-y-6">
               <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100 mb-4 justify-center">
                  <button type="button" onClick={() => setIsNewProduct(false)} className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${!isNewProduct ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Existing Product</button>
                  <button type="button" onClick={() => setIsNewProduct(true)} className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${isNewProduct ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>New Product</button>
               </div>

               <div className="space-y-4">
                  {isNewProduct ? (
                     <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div>
                           <label className="text-sm font-semibold text-slate-700 block mb-1">Product Name</label>
                           <input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Premium Widget" className="erp-input w-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-sm font-semibold text-slate-700 block mb-1">HSN Code</label>
                              <input value={newHsn} onChange={e => setNewHsn(e.target.value)} placeholder="HSN..." className="erp-input w-full" />
                           </div>
                           <div>
                              <label className="text-sm font-semibold text-slate-700 block mb-1">Unit</label>
                              <select value={newUnit} onChange={e => setNewUnit(e.target.value)} className="erp-input w-full">
                                 <option value="kg">KILOGRAM (KG)</option>
                                 <option value="gram">GRAM (GM)</option>
                                 <option value="pcs">PIECES (PCS)</option>
                                 <option value="dagina">DAGINA (BAG/UNIT)</option>
                                 <option value="meters">METERS (MTR)</option>
                                 <option value="tons">TONS (TON)</option>
                                 <option value="mts">MTS</option>
                              </select>
                           </div>
                           <div className="col-span-2">
                              <label className="text-sm font-semibold text-slate-700 block mb-1">Finished Unit Weight (Grams)</label>
                              <input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="Weight in grams per unit..." className="erp-input w-full" />
                           </div>

                           {/* Automated Scrap Analysis */}
                           {(() => {
                              const normalizedInputGrams = localBom.reduce((acc, item) => {
                                 const qty = parseFloat(item.quantity) || 0;
                                 const factor = unitsUtil.CONVERSIONS[item.unit?.toLowerCase()] || 1;
                                 return acc + (qty * factor * 1000);
                              }, 0);
                              
                              const inputWeightGrams = normalizedInputGrams;
                              const outputWeightGrams = parseFloat(newWeight) || 0;
                              const lossGrams = inputWeightGrams - outputWeightGrams;

                              // Align analysis unit strictly with BOM settings
                              const primaryBomUnit = localBom.length > 0 ? localBom[0].unit : (newUnit === 'gram' ? 'gram' : 'kg');
                              const useGrams = primaryBomUnit === 'gram';
                              const unitLabel = useGrams ? 'g' : 'kg';
                              const divisor = useGrams ? 1 : 1000;
                              const precision = useGrams ? 2 : 3;

                              return (
                                 <div className="col-span-2 p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-4 shadow-xl">
                                    <div className="flex items-center justify-between">
                                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                          <Recycle className="w-3 h-3 text-emerald-400" /> Automated Scrap Analysis
                                       </h4>
                                       <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Active Intelligence</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                       <div className="space-y-1">
                                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Input (BOM)</p>
                                          <p className="text-sm font-black text-white italic tracking-tight">
                                             {(normalizedInputGrams / divisor).toFixed(precision)} {unitLabel}
                                          </p>
                                       </div>
                                       <div className="space-y-1">
                                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Output (Net)</p>
                                          <p className="text-sm font-black text-white italic tracking-tight">
                                             {(outputWeightGrams / divisor).toFixed(precision)} {unitLabel}
                                          </p>
                                       </div>
                                       <div className="space-y-1">
                                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Loss (Scrap)</p>
                                          <p className="text-sm font-black text-rose-400 italic tracking-tight">
                                             {(lossGrams / divisor).toFixed(precision)} {unitLabel}
                                          </p>
                                       </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Efficiency Protocol</p>
                                       <p className="text-[10px] font-black text-emerald-400 italic">
                                          {inputWeightGrams > 0 ? ((outputWeightGrams / inputWeightGrams) * 100).toFixed(1) + "%" : "0.0%"}
                                       </p>
                                    </div>
                                 </div>
                              );
                           })()}
                        </div>
                     </div>
                  ) : (
                     <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Select Product</label>
                        <select required value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })} className="erp-input w-full">
                           <option value="">Select a product...</option>
                           {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock} {p.unit})</option>)}
                        </select>
                     </div>
                  )}

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                     <div className="flex items-center justify-between mb-4">
                        <div>
                           <h4 className="text-sm font-semibold text-slate-900">Bill of Materials</h4>
                           <p className="text-xs text-slate-500 mt-1">Raw materials required per unit</p>
                        </div>
                        <button type="button" onClick={handleAddIngredient} className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"><Plus className="w-4 h-4" /></button>
                     </div>
                     <div className="space-y-3">
                        {localBom.map((item, idx) => (
                           <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                              <select required value={typeof item.material === 'string' ? item.material : item.material?._id} onChange={e => handleIngredientChange(idx, "material", e.target.value)} className="flex-1 bg-transparent border-none text-sm font-medium outline-none">
                                 <option value="">Select Material...</option>
                                 {rawMaterials.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                              </select>
                              <input required type="number" step="0.001" value={item.quantity} onChange={e => handleIngredientChange(idx, "quantity", e.target.value)} className="w-20 bg-slate-50 px-3 py-1.5 rounded-md text-sm font-medium text-right outline-none border border-slate-200" />
                              <select
                                 className="bg-slate-50 px-2 py-1.5 rounded-md text-[10px] font-bold text-slate-500 outline-none border border-slate-200 cursor-pointer hover:bg-white transition-colors uppercase"
                                 value={item.unit || rawMaterials.find(m => m._id === (typeof item.material === 'string' ? item.material : item.material?._id))?.unit || 'kg'}
                                 onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                              >
                                 {["kg", "gram", "dagina", "pcs", "meters", "tons", "mts", "amount"].map(u => (
                                    <option key={u} value={u}>{u.toUpperCase()}</option>
                                 ))}
                              </select>
                              <button type="button" onClick={() => setLocalBom(localBom.filter((_, i) => i !== idx))} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                           </div>
                        ))}
                        {localBom.length === 0 && (
                           <p className="text-xs text-slate-500 text-center py-2">No materials added to BOM yet.</p>
                        )}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Batch Quantity</label>
                        <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} className="erp-input w-full" />
                     </div>
                     <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Custom Batch Ref</label>
                        <input placeholder="(Optional)" onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} className="erp-input w-full" />
                     </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                     Cancel
                  </button>
                  <button type="submit" disabled={formLoading} className="erp-button-primary flex-1">
                     {formLoading ? "Creating..." : "Create Batch"}
                  </button>
               </div>
            </form>
         </Modal>

         <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Complete Batch">
            <form onSubmit={handleComplete} className="p-4 space-y-6">
               <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 text-amber-800 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                  <p>Completing this batch will permanently inject the yielded stock and register any identified scrap.</p>
               </div>

               <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Actual Produced ({completeBatch?.product?.unit || 'pcs'})</label>
                  <input
                     required
                     type="number"
                     value={producedQty}
                     onChange={e => setProducedQty(parseInt(e.target.value) || 0)}
                     className="erp-input w-full font-bold text-emerald-600"
                     placeholder="0"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Planned: {completeBatch?.quantity} {completeBatch?.product?.unit}</p>
               </div>

               <div className="space-y-4">
                  <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                     <button type="button" onClick={() => setScrapCalcMode("mass")} className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${scrapCalcMode === 'mass' ? 'bg-white text-rose-600 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Direct Mass (kg)</button>
                     <button type="button" onClick={() => setScrapCalcMode("pieces")} className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${scrapCalcMode === 'pieces' ? 'bg-white text-rose-600 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Count (pcs)</button>
                  </div>

                  {scrapCalcMode === 'pieces' ? (
                     <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div>
                           <label className="text-sm font-semibold text-slate-700 block mb-1">Defect Item Count (pcs)</label>
                           <input
                              type="number"
                              value={scrapPieces}
                              onChange={e => {
                                 const pcs = parseInt(e.target.value) || 0;
                                 setScrapPieces(pcs);
                                 const weight = completeBatch?.product?.unitWeightGrams || 0;
                                 const calculatedMass = (pcs * weight) / 1000;
                                 setScrapQuantity(calculatedMass);
                                 // Auto-deduct good pieces from planned
                                 setProducedQty((completeBatch?.quantity || 0) - pcs);
                              }}
                              className="erp-input w-full text-rose-600 font-bold"
                              placeholder="0"
                           />
                        </div>
                        <div className="p-4 bg-rose-50 rounded-lg border border-rose-100 flex items-center justify-between">
                           <div>
                              <p className="text-sm font-semibold text-slate-700">Calculated Mass</p>
                              <p className="text-xs text-slate-500">Based on {completeBatch?.product?.unitWeightGrams || 0}g per unit</p>
                           </div>
                           <p className="text-xl font-bold text-rose-600">{scrapQuantity} kg</p>
                        </div>
                     </div>
                  ) : (
                     <div className="animate-in slide-in-from-top-4 duration-300">
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Scrap Generated ({completeBatch?.product?.unit || 'kg'})</label>
                        <input
                           type="number"
                           step="0.01"
                           value={scrapQuantity}
                           onChange={e => {
                              const mass = parseFloat(e.target.value) || 0;
                              setScrapQuantity(mass);
                              // Also auto-deduct pieces based on mass if unit weight is known
                              const unitWeight = completeBatch?.product?.unitWeightGrams || 0;
                              if (unitWeight > 0) {
                                 const inferredPcs = Math.round((mass * 1000) / unitWeight);
                                 setProducedQty((completeBatch?.quantity || 0) - inferredPcs);
                              }
                           }}
                           className="erp-input w-full text-rose-600 font-bold"
                           placeholder="0.00"
                        />
                     </div>
                  )}
               </div>

               <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsCompleteModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                     Cancel
                  </button>
                  <button type="submit" disabled={formLoading} className="erp-button-primary flex-1 !bg-emerald-600 hover:!bg-emerald-700 justify-center">
                     {formLoading ? "Processing..." : "Complete Batch"}
                  </button>
               </div>
            </form>
         </Modal>

      </AppLayout>
   );
};

export default Production;
