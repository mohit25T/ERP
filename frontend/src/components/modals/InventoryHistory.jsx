import { useState, useEffect } from "react";
import { inventoryApi } from "../../api/erpApi";



const InventoryHistory = ({ isOpen, onClose, product }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && product?._id) {
      fetchLogs();
    }
  }, [isOpen, product]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getLogs(product._id);
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch inventory logs", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Stock Ledger: ${product.name}`}>
      <div className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-6 bg-blue-50 rounded-3xl border border-blue-100">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm">
                     <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Marketable Yield</p>
                     <h4 className="text-xl font-black text-blue-900 tabular-nums">{product.stock} {product.unit}</h4>
                  </div>
               </div>
            </div>
            <div className="flex items-center justify-between p-6 bg-amber-50 rounded-3xl border border-amber-100">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm">
                     <History className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Scrap / Waste</p>
                     <h4 className="text-xl font-black text-amber-900 tabular-nums">{product.scrapStock || 0} {product.unit}</h4>
                  </div>
               </div>
            </div>
         </div>

         <div className="overflow-hidden rounded-3xl border border-gray-100">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                     <th className="px-6 py-4">Date / Ref</th>
                     <th className="px-6 py-4">Action</th>
                     <th className="px-6 py-4">Target</th>
                     <th className="px-6 py-4 text-center">Change</th>
                     <th className="px-6 py-4 text-right pr-8">Balance</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {loading ? (
                     <tr><td colSpan="5" className="p-12 text-center animate-pulse italic text-gray-400 font-bold uppercase tracking-widest text-xs">Authenticating Stock Ledger...</td></tr>
                  ) : logs.length === 0 ? (
                     <tr><td colSpan="5" className="p-12 text-center text-gray-400 italic font-bold text-xs uppercase tracking-widest">No stock movements recorded yet.</td></tr>
                  ) : logs.map((log) => (
                     <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-900">{new Date(log.date).toLocaleDateString()}</span>
                              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">#{log.referenceId?.substring(log.referenceId.length - 6)}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              {log.action === 'Invoice' ? <Receipt className="w-3 h-3 text-blue-500" /> : <Package className="w-3 h-3 text-green-500" />}
                              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{log.action}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${log.targetField === 'scrapStock' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                              {log.targetField === 'scrapStock' ? 'Scrap' : 'Yield'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black tabular-nums ${log.change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {log.change > 0 ? '+' : ''}{log.change}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right pr-8">
                           <span className="text-xs font-black text-gray-900 tabular-nums">{log.finalStock}</span>
                        </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </Modal>
  );
};

export default InventoryHistory;
