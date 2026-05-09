import { useState, useEffect } from "react";
import { inventoryApi } from "../../api/erpApi";
import unitsUtil from "../../utils/units";
import Modal from "../common/Modal";
import { Package, History, Receipt } from "lucide-react";

const InventoryHistory = ({ isOpen, onClose, product }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && product?._id) {
      fetchLogs();
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const displayStock = unitsUtil.convertFromPieces(product.stock || 0, product.unit);
  const displayScrap = unitsUtil.convertFromPieces(product.scrapStock || 0, product.unit);

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


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Stock History: ${product.name}`}>
      <div className="space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-blue-500/5 rounded-md border border-blue-500/10">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-card rounded shadow-sm border border-border">
                     <Package className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">Ready Items</p>
                     <h4 className="text-xl font-black text-foreground tabular-nums">{displayStock.toLocaleString()} {product.unit?.toUpperCase()}</h4>
                  </div>
               </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-500/5 rounded-md border border-amber-500/10">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-card rounded shadow-sm border border-border">
                     <History className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest">Scrap</p>
                     <h4 className="text-xl font-black text-foreground tabular-nums">{displayScrap.toLocaleString()} {product.unit?.toUpperCase()}</h4>
                  </div>
               </div>
            </div>
         </div>

         <div className="overflow-hidden rounded-md border border-border bg-card">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                     <th className="px-4 py-4">Date / Ref</th>
                     <th className="px-4 py-4">Action</th>
                     <th className="px-4 py-4">Type</th>
                     <th className="px-4 py-4 text-center">Change</th>
                     <th className="px-4 py-4 text-right pr-4">Stock After</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border/50">
                  {loading ? (
                     <tr><td colSpan="5" className="p-6 text-center  text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Loading history...</td></tr>
                  ) : logs.length === 0 ? (
                     <tr><td colSpan="5" className="p-6 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-widest">No history found for this item.</td></tr>
                  ) : logs.map((log) => (
                     <tr key={log._id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-4">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black text-foreground">{formatDate(log.date)}</span>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight opacity-60">#{log.referenceId?.substring(log.referenceId.length - 8).toUpperCase()}</span>
                           </div>
                        </td>
                        <td className="px-4 py-4">
                           <div className="flex items-center gap-2">
                              {log.action === 'Invoice' ? <Receipt className="w-3.5 h-3.5 text-blue-500" /> : <Package className="w-3.5 h-3.5 text-emerald-500" />}
                              <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{log.action}</span>
                           </div>
                        </td>
                        <td className="px-4 py-4">
                           <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${log.targetField === 'scrapStock' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
                              {log.targetField === 'scrapStock' ? 'Scrap' : 'Ready'}
                           </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-black tabular-nums border ${log.change > 0 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                              {log.change > 0 ? '+' : ''}{unitsUtil.convertFromPieces(log.change, product.unit).toLocaleString()}
                           </span>
                        </td>
                        <td className="px-4 py-4 text-right pr-4">
                           <span className="text-xs font-black text-foreground tabular-nums">{unitsUtil.convertFromPieces(log.finalStock, product.unit).toLocaleString()}</span>
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
