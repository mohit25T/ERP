import React, { useState, useEffect } from "react";
import { inventoryApi } from "../../api/erpApi";
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Receipt,
  Package,
  X 
} from "lucide-react";
import Modal from "../common/Modal";

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
        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                 <Package className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Inventory</p>
                 <h4 className="text-2xl font-black text-gray-900 tabular-nums">{product.stock} {product.unit}</h4>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valuation Rate</p>
              <p className="text-lg font-black text-blue-600 italic">₹{product.price?.toLocaleString()}</p>
           </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-100">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <th className="px-6 py-4">Date / Source</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4 text-center">Change</th>
                    <th className="px-6 py-4 text-right pr-8">Final Balance</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {loading ? (
                    <tr><td colSpan="4" className="p-12 text-center animate-pulse italic text-gray-400 font-bold uppercase tracking-widest text-xs">Authenticating Stock Ledger...</td></tr>
                 ) : logs.length === 0 ? (
                    <tr><td colSpan="4" className="p-12 text-center text-gray-400 italic font-bold text-xs uppercase tracking-widest">No stock movements recorded yet.</td></tr>
                 ) : logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-gray-900">{new Date(log.date).toLocaleDateString()}</span>
                             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Ref: {log.referenceId?.substring(log.referenceId.length - 6)}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             {log.action === 'Invoice' ? <Receipt className="w-3 h-3 text-blue-500" /> : <Package className="w-3 h-3 text-green-500" />}
                             <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{log.action}</span>
                          </div>
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
