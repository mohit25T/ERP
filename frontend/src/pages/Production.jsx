import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/common/Modal";
import { productApi, productionApi } from "../api/erpApi";
import { Hammer, History, Plus, Layers, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";

const Production = () => {
  const [productions, setProductions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    productId: "",
    quantity: 1,
    notes: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, itemRes] = await Promise.all([
        productionApi.getAll(),
        productApi.getAll()
      ]);
      setProductions(prodRes.data);
      // Only keep products that are 'finished_good' and have a BOM defined
      setProducts(itemRes.data.filter(p => p.type === 'finished_good' && p.bom?.length > 0));
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
      await productionApi.create(formData);
      fetchData();
      setIsModalOpen(false);
      setFormData({ productId: "", quantity: 1, notes: "" });
    } catch (err) {
      alert("Production Failed: " + (err.response?.data?.msg || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Reverse this production? This will restore raw materials to stock and deduct the finished goods from inventory.")) {
      try {
        await productionApi.delete(id);
        fetchData();
      } catch (err) {
        alert("Failed to reverse: " + (err.response?.data?.msg || err.message));
      }
    }
  };

  const getConversionFactor = (unit) => {
    const units = {
      "dagina": 50,
      "kg": 1,
      "gram": 0.001,
      "unit": 1,
      "amount": 1
    };
    return units[unit?.toLowerCase()] || 1;
  };

  const selectedProduct = products.find(p => p._id === formData.productId);

  return (
    <AppLayout>
      <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl shadow-xl shadow-indigo-500/20 -rotate-2 hover:rotate-0 transition-transform duration-500">
              <Hammer className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Manufacturing</h2>
              <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                Workshop & Assembly Batches
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative px-8 py-4 bg-gray-900 rounded-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl hover:shadow-indigo-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Plus className="w-5 h-5 text-white relative z-10" />
            <span className="text-white font-black text-sm relative z-10">Start Production Batch</span>
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100/50 backdrop-blur-xl">
           <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-gray-50/50 to-white">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Batches</span>
                  <span className="text-2xl font-black text-gray-900 tabular-nums">{productions.length}</span>
                </div>
              </div>
           </div>

           <div className="overflow-x-auto">
             {loading ? (
                <div className="p-20 text-center text-gray-400 italic font-bold uppercase text-[10px] tracking-widest">Accessing blueprints...</div>
             ) : productions.length === 0 ? (
                <div className="p-20 text-center space-y-4">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Layers className="w-10 h-10 text-gray-300" />
                   </div>
                   <p className="text-gray-900 font-black text-xl italic uppercase tracking-tighter">No Manufacturing History</p>
                   <p className="text-gray-400 text-sm max-w-xs mx-auto font-medium">Capture production logs to convert raw assets into market-ready inventory.</p>
                </div>
             ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                      <th className="px-10 py-4">Batch ID / Product</th>
                      <th className="px-10 py-4 text-center">Output Yield</th>
                      <th className="px-10 py-4">Resource Consumption</th>
                      <th className="px-10 py-4 text-right pr-12">Flow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productions.map(b => (
                      <tr key={b._id} className="hover:bg-gray-50/80 transition-all group">
                        <td className="px-10 py-6">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{b.batchNumber}</span>
                              <span className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tighter">{b.product?.name}</span>
                              <span className="text-[9px] font-bold text-gray-400 mt-0.5">{new Date(b.createdAt).toLocaleString()}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-center">
                           <div className="inline-flex flex-col items-center">
                              <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-2xl text-xs font-black border border-green-200 shadow-sm">
                                 +{b.quantity} <span className="opacity-60 uppercase text-[8px] ml-0.5">{b.product?.unit}</span>
                              </span>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex flex-wrap gap-2 max-w-md">
                             {b.consumedMaterials.map((m, idx) => (
                               <span key={idx} className="px-3 py-1.5 bg-indigo-50/50 rounded-xl text-[9px] font-black text-indigo-600 border border-indigo-100 uppercase tracking-tighter">
                                  -{(m.quantity).toFixed(1)} {m.material?.name}
                               </span>
                             ))}
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right pr-12">
                           <button 
                              onClick={() => handleDelete(b._id)}
                              className="p-3 bg-red-50 text-red-400 hover:text-red-600 rounded-2xl transition-all border border-red-100 shadow-sm hover:shadow-red-500/10"
                              title="Reverse Batch"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             )}
           </div>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Document Production Output">
           <form onSubmit={handleCreate} className="space-y-6 pt-4">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Select Finished Blueprint</label>
                  <select 
                    required
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  >
                    <option value="">Choose item to manufacture...</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock} {p.unit})</option>
                    ))}
                  </select>
                </div>

                {selectedProduct && (
                   <div className="animate-in fade-in slide-in-from-top-2">
                      <div className="bg-indigo-50 rounded-3xl p-6 border-2 border-indigo-100/50">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                               <Layers className="w-4 h-4 text-indigo-600" />
                               <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Resource Forecast (BOM)</span>
                            </div>
                            <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded uppercase tracking-widest">Real-time Check</span>
                         </div>
                         <div className="space-y-3">
                            {selectedProduct.bom.map((item, idx) => {
                               const itemUnit = item.unit || item.material?.unit || 'kg';
                               const neededRaw = (item.quantity * formData.quantity).toFixed(2);
                               const neededBase = Number(neededRaw) * getConversionFactor(itemUnit);
                               const availableNative = item.material?.stock || 0;
                               const availableBase = availableNative; // Stock is stored as KG/Weight
                               const isMissing = availableBase < (neededBase - 0.0001); 

                               const showBags = item.material?.unit === 'dagina';
                               const primaryStock = showBags ? (availableNative / 50).toLocaleString() : availableNative.toLocaleString();
                               const primaryUnit = item.material?.unit || 'kg';

                               return (
                                  <div key={idx} className="flex justify-between items-center bg-white/60 p-4 rounded-2xl border border-white">
                                     <div>
                                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-tighter">{item.material?.name}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{item.quantity} {itemUnit} / unit</p>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-sm font-black text-gray-900 italic tracking-tighter">Need {neededRaw} {itemUnit}</p>
                                        <p className={`text-[9px] font-black uppercase ${isMissing ? 'text-red-500 animate-pulse underline decoration-2' : 'text-green-600'}`}>
                                           {isMissing ? `Deficit: ${(neededBase - availableBase).toFixed(2)} kg` : `Warehouse Stock: ${primaryStock} ${primaryUnit}`}
                                           {showBags && !isMissing && <span className="block opacity-60">(≈ {availableNative.toLocaleString()} KG TOTAL)</span>}
                                        </p>
                                     </div>
                                  </div>
                               )
                            })}
                         </div>
                      </div>
                   </div>
                )}

                <div className="grid grid-cols-2 gap-5">
                   <div className="col-span-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Production Batch Qty</label>
                      <input 
                        type="number"
                        min="1"
                        required
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-xl font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 0) })}
                      />
                   </div>
                   <div className="col-span-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Custom Batch ID (Optional)</label>
                      <input 
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-xl font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono uppercase placeholder:text-gray-300"
                        placeholder="LOT-X"
                        onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value ? `BN-${e.target.value.toUpperCase()}-${Date.now().toString().slice(-4)}` : undefined })}
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Workshop Entry Note</label>
                   <textarea 
                     className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold text-gray-900 outline-none h-20 resize-none placeholder:text-gray-300 focus:bg-white focus:ring-1 focus:ring-gray-100"
                     placeholder="Reference labor details or machine ID..."
                     value={formData.notes}
                     onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                   />
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-50">
                 <button
                   type="button"
                   onClick={() => setIsModalOpen(false)}
                   className="flex-1 py-4 bg-white text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all"
                 >Discard Batch</button>
                 <button
                   type="submit"
                   disabled={formLoading || !formData.productId}
                   className="flex-[2] py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-400/20 hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   {formLoading ? "Capturing Progress..." : (
                     <>
                       <Hammer className="w-4 h-4" />
                       Confirm Manufacturing
                     </>
                   )}
                 </button>
              </div>
           </form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Production;
