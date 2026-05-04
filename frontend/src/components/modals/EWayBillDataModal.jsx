import { useState } from "react";
import { Truck, Activity, X, Calendar, Hash, FileCheck, ShieldCheck } from "lucide-react";

/**
 * EWayBillDataModal: The Logistics Interaction Node
 * Designed for elite manual registration of government e-way bill datasets.
 */
const EWayBillDataModal = ({ isOpen, onClose, invoice, onUpdate }) => {
  const [formData, setFormData] = useState({
    ewbNo: invoice?.ewayBill?.ewayBillNo || "",
    ewbDate: invoice?.ewayBill?.ewbDate ? new Date(invoice.ewayBill.ewbDate).toISOString().split('T')[0] : "",
    validityDate: invoice?.ewayBill?.validityDate ? new Date(invoice.ewayBill.validityDate).toISOString().split('T')[0] : "",
    vehicleNo: invoice?.ewayBill?.vehicleNo || ""
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate(invoice._id, formData);
      onClose();
    } catch (err) {
      alert("Failed to update E-Way Bill details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-xl rounded-md shadow-3xl shadow-slate-900/20 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Elite Header Node */}
        <div className="px-10 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-5">
             <div className="p-4 bg-slate-900 rounded-md shadow-xl shadow-slate-900/10">
                <Truck className="w-6 h-6 text-white" />
             </div>
             <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tightest uppercase italic leading-none mb-1">Logistics <span className="text-slate-400 not-italic">Node</span></h3>
                <div className="flex items-center gap-2">
                   <Activity className="w-3 h-3 text-indigo-500 animate-pulse" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Record Statutory Govt EWB Reference</p>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-md transition-all shadow-inner active:scale-90">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
          
          <div className="space-y-8">
            {/* EWB NUMBER - PRIMARY KEY */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Official E-Way Bill Identifier</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                  <Hash className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="ewbNo"
                  required
                  placeholder="12 Digit Stat Number"
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-md text-xs font-black tracking-[0.2em] uppercase focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 outline-none transition-all placeholder:text-slate-200"
                  value={formData.ewbNo}
                  onChange={(e) => setFormData({ ...formData, ewbNo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Generation Date</label>
                <div className="relative group">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="date"
                    required
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-md text-xs font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 outline-none transition-all"
                    value={formData.ewbDate}
                    onChange={(e) => setFormData({ ...formData, ewbDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Validity Horizon</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="date"
                    required
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-md text-xs font-bold focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-200 outline-none transition-all"
                    value={formData.validityDate}
                    onChange={(e) => setFormData({ ...formData, validityDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Assigned Fleet Identifier</label>
              <div className="relative group">
                <Truck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="GJ-03-XX-0000"
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-md text-xs font-black tracking-widest uppercase focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all placeholder:text-slate-200"
                  value={formData.vehicleNo}
                  onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50">
             <button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-slate-900 text-white rounded-md text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/30 hover:bg-primary transition-all flex items-center justify-center gap-4 group"
             >
                {loading ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                   <>
                      <FileCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      Commit Compliance Data
                   </>
                )}
             </button>
             <p className="text-center text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-6 italic">Secure Statutory Record Transmission Node v2.0</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EWayBillDataModal;
