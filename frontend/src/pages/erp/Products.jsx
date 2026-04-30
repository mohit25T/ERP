import { useState, useEffect } from "react";
import { productApi, bomApi } from "../../api/erpApi";
import unitsUtil from "../../utils/units";
import AppLayout from "../../components/layout/AppLayout";
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
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                     <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                     <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Inventory Management</h2>
                     <p className="text-sm font-medium text-slate-500">Manage products, raw materials, and stock levels</p>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                     {[
                        { id: 'all', label: 'All Items', icon: Archive },
                        { id: 'finished', label: 'Finished Goods', icon: Layers },
                        { id: 'raw', label: 'Raw Materials', icon: Box },
                        { id: 'scrap', label: 'Scrap', icon: Hammer }
                     ].map((tab) => (
                        <button
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id)}
                           className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                              ? 'bg-slate-100 text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                              }`}
                        >
                           <tab.icon className="w-4 h-4" />
                           {tab.label}
                           <span className={`px-2 py-0.5 rounded-md text-xs border ${activeTab === tab.id ? 'bg-white border-slate-200 text-slate-700' : 'bg-transparent border-transparent text-slate-400'}`}>
                              {counts[tab.id]}
                           </span>
                        </button>
                     ))}
                  </div>
               </div>
            </div>

            {/* Filters */}
            {showFilters && (
               <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-6 items-end animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                     <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Level Filter</p>
                     <div className="flex flex-wrap gap-2">
                        {[
                           { id: 'all', label: 'All Levels' },
                           { id: 'optimal', label: 'Optimal Stock' },
                           { id: 'low', label: 'Low Stock' },
                           { id: 'out', label: 'Out of Stock' }
                        ].map(stock => (
                           <button
                              key={stock.id}
                              onClick={() => setFilterStock(stock.id)}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${filterStock === stock.id ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                           >
                              {stock.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex-1 flex justify-end">
                     <button
                        onClick={() => { setFilterStock("all"); setSearchTerm(""); setActiveTab("all"); }}
                        className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2"
                     >
                        <Trash2 className="w-4 h-4" /> Clear Filters
                     </button>
                  </div>
               </div>
            )}

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-sm font-semibold text-slate-500">Total Value</p>
                     <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Database className="w-4 h-4" />
                     </div>
                  </div>
                  <div>
                     <h3 className="text-2xl font-bold text-slate-900">₹{(products.reduce((acc, p) => acc + (p.stock * p.price), 0) / 100000).toFixed(1)}L</h3>
                     <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Based on current stock
                     </p>
                  </div>
               </div>

               <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-sm font-semibold text-slate-500">Low Stock</p>
                     <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                     </div>
                  </div>
                  <div>
                     <h3 className="text-2xl font-bold text-slate-900">{products.filter(p => p.stock < (p.minStock || 10)).length} Items</h3>
                     <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
                        Below minimum threshold
                     </p>
                  </div>
               </div>

               <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-sm font-semibold text-slate-500">Scrap Volume</p>
                     <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                        <Trash2 className="w-4 h-4" />
                     </div>
                  </div>
                  <div>
                     <h3 className="text-2xl font-bold text-slate-900">
                        {(products.reduce((acc, p) => {
                           const weightPerPiece = p.unitWeightGrams || 0;
                           const scrapQty = p.scrapStock || 0;
                           // If it's already a scrap product (type='scrap'), its totalStock is the mass in kg
                           const massKg = p.type === 'scrap' ? p.stock : (scrapQty * weightPerPiece) / 1000;
                           return acc + massKg;
                        }, 0) / 1000).toFixed(2)}T
                     </h3>
                     <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                        Pending disposal (Actual Mass)
                     </p>
                  </div>
               </div>

               <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-sm font-semibold text-primary">Catalog Size</p>
                     <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        <PackageOpen className="w-4 h-4" />
                     </div>
                  </div>
                  <div>
                     <h3 className="text-2xl font-bold text-slate-900">{products.length}</h3>
                     <p className="text-xs font-medium text-primary/80 mt-1 flex items-center gap-1">
                        Total tracked nodes
                     </p>
                  </div>
               </div>
            </div>

            {/* Data Table Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-20">
               <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="relative w-full max-w-sm">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        className="erp-input w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                     <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-lg border transition-colors ${showFilters ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        title="Filters"
                     >
                        <Filter className="w-4 h-4" />
                     </button>
                     <button className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors" title="Export">
                        <Download className="w-4 h-4" />
                     </button>
                     <div className="h-8 w-px bg-slate-200 mx-2"></div>
                     <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="erp-button-primary w-full sm:w-auto whitespace-nowrap">
                        <Plus className="w-4 h-4 mr-2" />
                        New Item
                     </button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  {loading ? (
                     <div className="p-12 pl-24 text-center">
                        <div className="inline-flex items-center justify-center p-4 bg-slate-50 rounded-full mb-4">
                           <Activity className="w-6 h-6 text-slate-400 animate-spin" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">Loading inventory data...</p>
                     </div>
                  ) : filteredProducts.length === 0 ? (
                     <div className="p-20 flex flex-col items-center justify-center text-slate-500">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                           <Archive className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No items found</h3>
                        <p className="text-sm font-medium">Adjust your search or filters to find what you're looking for.</p>
                     </div>
                  ) : (
                     <table className="erp-table">
                        <thead>
                           <tr>
                              <th>SKU</th>
                              <th>Product Details</th>
                              <th className="text-right">Price</th>
                              <th className="text-center">Stock</th>
                              <th className="text-center">Scrap</th>
                              <th className="text-center">Actions</th>
                           </tr>
                        </thead>
                        <tbody>
                           {filteredProducts.map((p) => {
                              const isStockWarning = p.stock < (p.minStock || 10);

                              // Unit-aware conversions for high-fidelity display
                              const displayStock = unitsUtil.convertFromPieces(p.stock, p.unit);
                              const displayScrap = unitsUtil.convertFromPieces(p.scrapStock || 0, p.unit);
                              const displayPrice = p.price * (unitsUtil.CONVERSIONS[p.unit?.toLowerCase()] || 1);

                              return (
                                 <tr key={p._id}>
                                    <td>
                                       <div className="flex flex-col gap-1.5">
                                          {p.sku && p.sku.trim() !== "" ? (
                                             <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 w-fit">
                                                {p.sku}
                                             </span>
                                          ) : (
                                             <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 w-fit flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                No SKU
                                             </span>
                                          )}
                                          <div className="flex items-center gap-1.5 mt-1">
                                             <div className={`w-2 h-2 rounded-full ${p.type === 'raw_material' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                                             <span className="text-xs font-medium text-slate-500">HSN: {p.hsnCode || "—"}</span>
                                          </div>
                                       </div>
                                    </td>
                                    <td>
                                       <div className="flex flex-col">
                                          <span className="text-sm font-bold text-slate-900">{p.name}</span>
                                          <span className="text-xs font-medium text-slate-500 mt-1">{p.category || "Uncategorized"}</span>
                                       </div>
                                    </td>
                                    <td className="text-right">
                                       <div className="flex flex-col items-end gap-1">
                                          <span className="text-base font-bold text-slate-900">₹{displayPrice?.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</span>
                                          <span className="text-xs font-medium text-slate-500">{p.gstRate || 18}% GST</span>
                                       </div>
                                    </td>
                                    <td className="text-center">
                                       <div className="flex flex-col items-center gap-1.5">
                                          <div className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${isStockWarning ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
                                             {isStockWarning ? <ArrowDown className="w-3.5 h-3.5" /> : <Box className="w-3.5 h-3.5 opacity-50" />}
                                             {displayStock.toLocaleString()} <span className="opacity-60 text-xs font-medium">{p.unit || 'KG'}</span>
                                          </div>
                                          {isStockWarning && <span className="text-[10px] font-semibold text-rose-500">Low Stock</span>}
                                       </div>
                                    </td>
                                    <td className="text-center">
                                       <div className="flex flex-col items-center gap-1">
                                          <div className={`${displayScrap > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'text-slate-400'} px-2.5 py-1 rounded-md text-sm font-bold flex items-center gap-1`}>
                                             {displayScrap.toLocaleString()} <span className="opacity-60 text-[10px] uppercase">{p.unit || 'KG'}</span>
                                          </div>
                                          {p.unit !== 'kg' && p.unit !== 'gram' && (p.unitWeightGrams > 0) && (
                                             <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px]">
                                                <span>≈ {((p.scrapStock * p.unitWeightGrams) / 1000).toFixed(3)}</span>
                                                <span className="opacity-60 text-[9px] uppercase">KG</span>
                                             </div>
                                          )}
                                       </div>
                                    </td>
                                    <td className="text-center">
                                       <div className="flex items-center justify-center gap-1">
                                          <button onClick={() => { setSelectedProduct(p); setHistoryModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="History">
                                             <History className="w-4 h-4" />
                                          </button>
                                          {boms.some(b => b.product?._id === p._id || b.product === p._id) && (
                                             <button onClick={() => handleOpenBOM(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="BOM / Recipe">
                                                <Layers className="w-4 h-4" />
                                             </button>
                                          )}
                                          <button onClick={() => handleOpenEdit(p)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                                             <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => handleDelete(p._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                                             <Trash2 className="w-4 h-4" />
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

         {/* Modals */}
         <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Edit Product" : "New Product"}>
            <div className="p-6">
               <ProductForm initialData={editingProduct} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} loading={formLoading} />
            </div>
         </Modal>

         <Modal isOpen={isBOMModalOpen} onClose={() => setIsBOMModalOpen(false)} title="Calculate Requirement (BOM)">
            <div className="p-6 space-y-6">
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div>
                        <p className="text-sm font-semibold text-slate-500 mb-1">Target Product</p>
                        <p className="text-lg font-bold text-slate-900">{viewingBOMProduct?.name}</p>
                     </div>
                     <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Quantity To Produce</label>
                        <input
                           type="number"
                           min="1"
                           className="erp-input w-32 text-center text-lg font-bold"
                           value={prodQuantity}
                           onChange={(e) => setProdQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Required Materials</h4>
                  {!selectedProductBom ? (
                     <div className="p-12 bg-slate-50 rounded-xl text-center border border-slate-200">
                        <PackageOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-500">No BOM defined for this product.</p>
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
                              <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm gap-4">
                                 <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isShortfall ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                       {isShortfall ? <ArrowDown className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-sm font-bold text-slate-900">{item.material?.name || 'Unknown Material'}</span>
                                       <span className="text-xs font-medium text-slate-500 mt-0.5">
                                          Base Ratio: {item.quantity} {itemUnit}
                                       </span>
                                    </div>
                                 </div>
                                 <div className="text-left sm:text-right w-full sm:w-auto bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                                    <p className="text-sm font-bold text-slate-900 mb-1">Need {required.toFixed(2)} {materialUnit}</p>
                                    <p className={`text-xs font-semibold ${isShortfall ? 'text-rose-600' : 'text-emerald-600'}`}>
                                       {isShortfall ? `Shortfall: ${(required - available).toFixed(2)} ${materialUnit}` : `Available: ${available.toFixed(2)} ${materialUnit}`}
                                    </p>
                                 </div>
                              </div>
                           )
                        })}
                     </div>
                  )}
               </div>

               <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button onClick={() => setIsBOMModalOpen(false)} className="erp-button-secondary">Close</button>
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
