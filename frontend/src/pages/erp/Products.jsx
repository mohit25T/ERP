import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { productApi, bomApi, inventoryApi } from "../../api/erpApi";
import unitsUtil from "../../utils/units";
import AppLayout from "../../components/layout/AppLayout";
import HammerLoader from "../../components/common/HammerLoader";
import Modal from "../../components/common/Modal";
import ProductForm from "../../components/forms/ProductForm";
import InventoryHistory from "../../components/modals/InventoryHistory";
import {
   Layers, Box, Archive, Search, Filter, Plus,
   Download, Trash2, Edit2, Package, PackageOpen, Edit3,
   TrendingUp, Activity, AlertCircle, Database, History, ArrowDown,
   Hammer
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
   const [scrapView, setScrapView] = useState("total"); // total | batch
   const [scrapLogs, setScrapLogs] = useState([]);
   const [scrapLogsLoading, setScrapLogsLoading] = useState(false);

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

   const fetchScrapLogs = async () => {
      try {
         setScrapLogsLoading(true);
         const res = await inventoryApi.getScrapLogs();
         setScrapLogs(res.data);
      } catch (err) {
         console.error("Failed to fetch scrap logs", err);
      } finally {
         setScrapLogsLoading(false);
      }
   };

   useEffect(() => {
      fetchProducts();
   }, []);

   useEffect(() => {
      if (activeTab === 'scrap' && scrapView === 'batch') {
         fetchScrapLogs();
      }
   }, [activeTab, scrapView]);

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
      scrap: products.filter(p => (p.scrapStock || 0) > 0 || p.type === 'scrap').length
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
         <div className="space-y-6 pb-20">

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-card rounded-md flex items-center justify-center shadow-sm border border-border">
                     <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Asset Registry</h2>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inventory Ledger & Material Master Records</p>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <div className="flex bg-muted/30 p-1 rounded border border-border/50 shadow-inner">
                     {[
                        { id: 'all', label: 'All Items', icon: Archive },
                        { id: 'finished', label: 'Yield', icon: Layers },
                        { id: 'raw', label: 'Raw', icon: Box },
                        { id: 'scrap', label: 'Scrap', icon: Hammer }
                     ].map((tab) => (
                        <button
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id)}
                           className={`flex items-center gap-2 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${activeTab === tab.id
                              ? 'bg-card text-primary shadow-sm border border-border/50'
                              : 'text-muted-foreground hover:text-foreground'
                              }`}
                        >
                           <tab.icon className="w-3.5 h-3.5" />
                           {tab.label}
                           <span className={`px-1.5 py-0.5 rounded text-[9px] border ${activeTab === tab.id ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-transparent border-transparent text-muted-foreground/50'}`}>
                              {counts[tab.id]}
                           </span>
                        </button>
                     ))}
                  </div>
               </div>
            </div>

            {/* Filters */}
            {showFilters && (
               <div className="p-4 bg-muted/10 rounded-md border border-border shadow-inner flex flex-wrap gap-6 items-end animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                     <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Stock Level Threshold</p>
                     <div className="flex flex-wrap gap-2">
                        {[
                           { id: 'all', label: 'All Levels' },
                           { id: 'optimal', label: 'Optimal' },
                           { id: 'low', label: 'Low Stock' },
                           { id: 'out', label: 'Depleted' }
                        ].map(stock => (
                           <button
                              key={stock.id}
                              onClick={() => setFilterStock(stock.id)}
                              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all border ${filterStock === stock.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'}`}
                           >
                              {stock.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex-1 flex justify-end">
                     <button
                        onClick={() => { setFilterStock("all"); setSearchTerm(""); setActiveTab("all"); }}
                        className="text-[9px] font-bold text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2 uppercase tracking-widest"
                     >
                        <Trash2 className="w-3.5 h-3.5" /> Reset Protocol
                     </button>
                  </div>
               </div>
            )}

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="p-5 bg-card rounded-md border border-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Asset Valuation</p>
                     <div className="p-2 bg-primary/10 rounded text-primary">
                        <Database className="w-4 h-4" />
                     </div>
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-foreground tracking-tighter">₹{(products.reduce((acc, p) => acc + (p.stock * p.price), 0) / 100000).toFixed(1)}L</h3>
                     <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase tracking-widest flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Market-Linked Value
                     </p>
                  </div>
               </div>

               <div className="p-5 bg-card rounded-md border border-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Critical Shortfall</p>
                     <div className="p-2 bg-amber-500/10 rounded text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                     </div>
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-foreground tracking-tighter">{products.filter(p => p.stock < (p.minStock || 10)).length} Nodes</h3>
                     <p className="text-[9px] font-bold text-amber-600 mt-1 uppercase tracking-widest flex items-center gap-1">
                        Below minimum reserve
                     </p>
                  </div>
               </div>

               <div className="p-5 bg-card rounded-md border border-border shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scrap Aggregate</p>
                     <div className="p-2 bg-rose-500/10 rounded text-rose-600">
                        <Trash2 className="w-4 h-4" />
                     </div>
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-foreground tracking-tighter">
                        {(products.reduce((acc, p) => {
                           const weightPerPiece = p.unitWeightGrams || 0;
                           const scrapQty = p.scrapStock || 0;
                           const isWeightBased = ['kg', 'gram', 'mts', 'dagina', 'ton', 'tons'].includes(p.unit?.toLowerCase());

                           if (p.type === 'scrap') return acc + (p.stock || 0);
                           if (isWeightBased) return acc + scrapQty;

                           const massKg = (scrapQty * weightPerPiece) / 1000;
                           return acc + massKg;
                        }, 0) / 1000).toFixed(2)}T
                     </h3>
                     <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-widest flex items-center gap-1">
                        Pending salvage protocol
                     </p>
                  </div>
               </div>

               <div className="p-5 bg-primary/5 rounded-md border border-primary/20 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Catalog Nodes</p>
                     <div className="p-2 bg-primary/20 rounded text-primary">
                        <PackageOpen className="w-4 h-4" />
                     </div>
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-foreground tracking-tighter">{products.length}</h3>
                     <p className="text-[9px] font-bold text-primary mt-1 uppercase tracking-widest">
                        Validated identifiers
                     </p>
                  </div>
               </div>
            </div>

            {/* Data Table Section */}
            <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden mb-20">
               <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/5">
                  <div className="relative w-full max-w-sm group">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <input
                        type="text"
                        placeholder="Search registry..."
                        className="erp-input w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                     {activeTab === 'scrap' && (
                        <div className="flex bg-muted/30 p-1 rounded border border-border/50 mr-2 shadow-inner">
                           <button
                              onClick={() => setScrapView("total")}
                              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${scrapView === 'total' ? 'bg-card text-primary shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
                           >
                              Aggregate
                           </button>
                           <button
                              onClick={() => setScrapView("batch")}
                              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${scrapView === 'batch' ? 'bg-card text-primary shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
                           >
                              Timeline
                           </button>
                        </div>
                     )}
                     <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 border rounded-md transition-all ${showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
                        title="Filters"
                     >
                        <Filter className="w-4 h-4" />
                     </button>
                     <button className="p-2 border border-border bg-card rounded-md text-muted-foreground hover:text-foreground transition-all shadow-sm" title="Export">
                        <Download className="w-4 h-4" />
                     </button>
                     <div className="h-6 w-px bg-border mx-2"></div>
                     <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="erp-button-primary w-full sm:w-auto whitespace-nowrap">
                        <Plus className="w-4 h-4 mr-2" />
                        Authorize Entry
                     </button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  {loading || (activeTab === 'scrap' && scrapView === 'batch' && scrapLogsLoading) ? (
                     <HammerLoader />
                  ) : activeTab === 'scrap' && scrapView === 'batch' ? (
                     <table className="erp-table">
                        <thead>
                           <tr>
                              <th>Date / Sequence</th>
                              <th>Material Node</th>
                              <th>Audit Reason</th>
                              <th className="text-center">Scrap Flux</th>
                              <th>Protocol Ref</th>
                           </tr>
                        </thead>
                        <tbody>
                           <AnimatePresence mode="popLayout">
                              {scrapLogs.map((log, idx) => (
                                 <motion.tr
                                    key={log._id || idx}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: idx * 0.01 }}
                                 >
                                    <td>
                                       <div className="flex flex-col">
                                          <span className="text-xs font-bold text-foreground">{new Date(log.createdAt).toLocaleDateString()}</span>
                                          <span className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">
                                             {log.batchReference?.batchNumber || "AD-HOC ADJUSTMENT"}
                                          </span>
                                       </div>
                                    </td>
                                    <td>
                                       <div className="flex flex-col">
                                          <span className="text-xs font-bold text-foreground">{log.material?.name}</span>
                                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">System ID: {log.material?.sku || "—"}</span>
                                       </div>
                                    </td>
                                    <td>
                                       <span className="text-[10px] font-bold text-muted-foreground italic uppercase tracking-tight opacity-70">"{log.reason}"</span>
                                    </td>
                                    <td className="text-center">
                                       <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded border border-amber-500/20 font-black tabular-nums text-xs">
                                          +{log.quantity} <span className="text-[9px] opacity-60">KG</span>
                                       </div>
                                    </td>
                                    <td>
                                       <div className="flex items-center gap-2">
                                          <div className={`w-1.5 h-1.5 rounded-full ${log.batchReference ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}></div>
                                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                             {log.batchReference?.status || "LEGACY"}
                                          </span>
                                       </div>
                                    </td>
                                 </motion.tr>
                              ))}
                           </AnimatePresence>
                        </tbody>
                     </table>
                  ) : filteredProducts.length === 0 ? (
                     <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
                        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4 border border-border">
                           <Archive className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-1">No identifiers detected</h3>
                        <p className="text-[10px] font-medium uppercase tracking-tighter">Adjust filters or protocol search</p>
                     </div>
                  ) : (
                     <table className="erp-table">
                        <thead>
                           <tr>
                              <th>Product SKU</th>
                              {activeTab !== 'scrap' && (
                                 <>
                                    <th>Asset Profile</th>
                                    <th className="text-right">Unit Value</th>
                                    <th className="text-center">Reserve</th>
                                 </>
                              )}
                              <th className="text-center">Salvage</th>
                              {activeTab !== 'scrap' && <th className="text-center">Control</th>}
                           </tr>
                        </thead>
                        <tbody>
                           <AnimatePresence mode="popLayout">
                              {filteredProducts.map((p, index) => {
                                 const isStockWarning = p.stock < (p.minStock || 10);

                                 const displayStock = unitsUtil.convertFromPieces(p.stock, p.unit);
                                 const displayScrap = unitsUtil.convertFromPieces(p.scrapStock || 0, p.unit);
                                 const displayPrice = p.price * (unitsUtil.CONVERSIONS[p.unit?.toLowerCase()] || 1);

                                 const scrapQty = p.scrapStock || 0;
                                 let scrapMassKg = 0;

                                 if (p.type === 'scrap') {
                                    scrapMassKg = (p.stock || 0);
                                 } else if (p.type === 'raw_material' || p.unit?.toLowerCase() === 'dagina' || p.unit?.toLowerCase() === 'kg') {
                                    scrapMassKg = scrapQty;
                                 } else {
                                    const weightPerPiece = p.unitWeightGrams || 0;
                                    scrapMassKg = (scrapQty * weightPerPiece) / 1000;
                                 }

                                 return (
                                    <motion.tr
                                       key={p._id}
                                       initial={{ opacity: 0, y: 4 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       transition={{ duration: 0.2, delay: index * 0.01 }}
                                    >
                                       <td>
                                          <div className="flex flex-col gap-1.5">
                                             {p.sku && p.sku.trim() !== "" ? (
                                                <span className="text-[10px] font-black text-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/50 w-fit uppercase tracking-wider">
                                                   {p.sku}
                                                </span>
                                             ) : (
                                                <span className="text-[10px] font-black text-destructive bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20 w-fit flex items-center gap-1 uppercase tracking-widest">
                                                   <AlertCircle className="w-2.5 h-2.5" />
                                                   N/A
                                                </span>
                                             )}
                                             {activeTab !== 'scrap' && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                   <div className={`w-1.5 h-1.5 rounded-full ${p.type === 'raw_material' ? 'bg-primary' : 'bg-emerald-500'}`}></div>
                                                   <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">HSN: {p.hsnCode || "—"}</span>
                                                </div>
                                             )}
                                          </div>
                                       </td>
                                       {activeTab !== 'scrap' && (
                                          <>
                                             <td>
                                                <div className="flex flex-col">
                                                   <span className="text-xs font-bold text-foreground">{p.name}</span>
                                                   <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-70">{p.category || "General"}</span>
                                                </div>
                                             </td>
                                             <td className="text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                   <span className="text-xs font-black text-foreground tabular-nums">₹{displayPrice?.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</span>
                                                   <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{p.gstRate || 18}% GST</span>
                                                </div>
                                             </td>
                                             <td className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                   <div className={`px-3 py-1 rounded text-xs font-black flex items-center gap-1.5 tabular-nums border ${isStockWarning ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-muted/40 text-foreground border-border/50'}`}>
                                                      {isStockWarning ? <ArrowDown className="w-3 h-3" /> : <Box className="w-3 h-3 opacity-30" />}
                                                      {displayStock.toLocaleString()} <span className="opacity-60 text-[9px] font-bold uppercase">{p.unit?.toUpperCase() || 'PCS'}</span>
                                                   </div>
                                                   {isStockWarning && <span className="text-[8px] font-black text-destructive uppercase tracking-[0.2em]">Depletion Risk</span>}
                                                </div>
                                             </td>
                                          </>
                                       )}
                                       <td className="text-center">
                                          <div className="flex flex-col items-center gap-1">
                                             {activeTab === 'scrap' ? (
                                                <>
                                                   <div className={`${scrapMassKg > 0 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'text-muted-foreground/40'} px-3 py-1 rounded text-xs font-black flex items-center gap-1 tabular-nums`}>
                                                      {scrapMassKg.toLocaleString(undefined, { minimumFractionDigits: 3 })} <span className="opacity-60 text-[9px] uppercase font-bold">KG</span>
                                                   </div>
                                                   <div className="flex items-center gap-1 text-muted-foreground/60 font-bold text-[9px] mt-0.5 tabular-nums">
                                                      <span>{displayScrap.toLocaleString()}</span>
                                                      <span className="opacity-60 text-[8px] uppercase">{p.unit?.toUpperCase() || 'PCS'}</span>
                                                   </div>
                                                </>
                                             ) : (
                                                <>
                                                   <div className={`${displayScrap > 0 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'text-muted-foreground/30'} px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 tabular-nums`}>
                                                      {displayScrap.toLocaleString()} <span className="opacity-60 text-[8px] uppercase">{p.unit?.toUpperCase() || 'PCS'}</span>
                                                   </div>
                                                   {scrapMassKg > 0 && p.unit?.toLowerCase() !== 'kg' && (
                                                      <div className="flex items-center gap-1 text-muted-foreground/40 font-bold text-[8px] tabular-nums uppercase">
                                                         <span>≈ {scrapMassKg.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                                                         <span>KG</span>
                                                      </div>
                                                   )}
                                                </>
                                             )}
                                          </div>
                                       </td>
                                       {activeTab !== 'scrap' && (
                                          <td className="text-center">
                                             <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => { setSelectedProduct(p); setHistoryModalOpen(true); }} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded transition-colors" title="Audit History">
                                                   <History className="w-3.5 h-3.5" />
                                                </button>
                                                {boms.some(b => b.product?._id === p._id || b.product === p._id) && (
                                                   <button onClick={() => handleOpenBOM(p)} className="p-1.5 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-50 rounded transition-colors" title="BOM / Recipe">
                                                      <Layers className="w-3.5 h-3.5" />
                                                   </button>
                                                )}
                                                <button onClick={() => handleOpenEdit(p)} className="p-1.5 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Modify Record">
                                                   <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDelete(p._id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors" title="Decommission">
                                                   <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                             </div>
                                          </td>
                                       )}
                                    </motion.tr>
                                 );
                              })}
                           </AnimatePresence>
                        </tbody>
                     </table>
                  )}
               </div>
            </div>
         </div>

         {/* Modals */}
         <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Modify Registry Entry" : "New Registry Node"}>
            <div className="p-6">
               <ProductForm initialData={editingProduct} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} loading={formLoading} />
            </div>
         </Modal>

         <Modal isOpen={isBOMModalOpen} onClose={() => setIsBOMModalOpen(false)} title="Operational Requirement Assessment">
            <div className="p-6 space-y-6">
               <div className="bg-muted/30 p-6 rounded border border-border shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div>
                        <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">Protocol Target</p>
                        <p className="text-lg font-black text-foreground tracking-tight">{viewingBOMProduct?.name}</p>
                     </div>
                     <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Target Flux (Units)</label>
                        <input
                           type="number"
                           min="1"
                           className="erp-input w-32 text-center text-lg font-black"
                           value={prodQuantity}
                           onChange={(e) => setProdQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-foreground pb-2 border-b border-border uppercase tracking-widest">Resource Matrix</h4>
                  {!selectedProductBom ? (
                     <div className="p-12 bg-muted/10 rounded text-center border border-dashed border-border">
                        <PackageOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No BOM Protocol Defined</p>
                     </div>
                  ) : (
                     <div className="grid gap-3">
                        {selectedProductBom.items.map((item, idx) => {
                           const itemUnit = item.unit || item.material?.unit || 'pcs';
                           const materialUnit = item.material?.unit || 'pcs';

                           const requiredPieces = unitsUtil.normalizeToPieces(item.quantity * prodQuantity, itemUnit);
                           const required = unitsUtil.convertFromPieces(requiredPieces, materialUnit);

                           const availablePieces = item.material?.stock || 0;
                           const available = unitsUtil.convertFromPieces(availablePieces, materialUnit);

                           const isShortfall = availablePieces < requiredPieces;
                           return (
                              <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card rounded border border-border shadow-sm gap-4">
                                 <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded flex items-center justify-center border ${isShortfall ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                                       {isShortfall ? <ArrowDown className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-xs font-bold text-foreground">{item.material?.name || 'Unknown Node'}</span>
                                       <span className="text-[9px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest">
                                          Ratio: {item.quantity} {itemUnit}
                                       </span>
                                    </div>
                                 </div>
                                 <div className="text-left sm:text-right w-full sm:w-auto p-3 sm:p-0">
                                    <p className="text-sm font-black text-foreground mb-1 tabular-nums">Need {required.toFixed(2)} {materialUnit}</p>
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${isShortfall ? 'text-destructive' : 'text-emerald-600'}`}>
                                       {isShortfall ? `Shortfall: ${(required - available).toFixed(2)} ${materialUnit}` : `Available: ${available.toFixed(2)} ${materialUnit}`}
                                    </p>
                                 </div>
                              </div>
                           )
                        })}
                     </div>
                  )}
               </div>

               <div className="flex justify-end pt-4 border-t border-border">
                  <button onClick={() => setIsBOMModalOpen(false)} className="erp-button-secondary">Close Matrix</button>
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
