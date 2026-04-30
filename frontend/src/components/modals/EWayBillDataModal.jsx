import { useState } from "react";

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
      <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-3xl shadow-slate-900/20 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Elite Header Node */}
        <div className="px-10 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-5">
             <div className="p-4 bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-900/10">
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
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all shadow-inner active:scale-90">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
          
          <div className="space-y-8">
            {/* EWB NUMBER - PRIMARY KEY */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Official E-Way Bill Identifier</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                   <Tag className="w-5 h-5" />
                </div>
                <input 
                  required
                  className="erp-input !py-6 !pl-16 !text-lg !font-mono !tracking-[0.2em] !bg-slate-50 focus:!bg-white"
                  placeholder="0000 0000 0000"
                  value={formData.ewbNo}
                  onChange={(e) => setFormData({...formData, ewbNo: e.target.value})}
                />
              </div>
            </div>

            {/* TEMPORAL GRID */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Generation Timestamp</label>
                <div className="relative group">
                   <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                      <Calendar className="w-5 h-5" />
                   </div>
                   <input 
                    type="date"
                    required
                    className="erp-input !py-6 !pl-16"
                    value={formData.ewbDate}
                    onChange={(e) => setFormData({...formData, ewbDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Protocol Validity (Expiry)</label>
                <div className="relative group">
                   <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-600 transition-colors">
                      <Timer className="w-5 h-5" />
                   </div>
                   <input 
                    type="date"
                    required
                    className="erp-input !py-6 !pl-16 !border-rose-100 focus:!border-rose-500"
                    value={formData.validityDate}
                    onChange={(e) => setFormData({...formData, validityDate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* VEHICLE NO - HIGH PRIORITY TELEMETRY */}
            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between px-2">
                 <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    Crucial Transport Telemetry
                 </label>
                 <span className="text-[9px] font-black text-slate-300 uppercase italic">Vehicle Asset ID</span>
              </div>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-600 group-focus-within:scale-125 transition-transform">
                   <Truck className="w-6 h-6" />
                </div>
                <input 
                  required
                  className="erp-input !py-3 !pl-20 !text-3xl !font-black !tracking-tighter !text-slate-900 !bg-indigo-50/30 border-indigo-100 focus:!border-indigo-600 focus:!bg-white uppercase placeholder:text-slate-200"
                  placeholder="GJ-03-XX-0000"
                  value={formData.vehicleNo}
                  onChange={(e) => setFormData({...formData, vehicleNo: e.target.value.toUpperCase()})}
                />
              </div>
              <p className="text-[9px] font-black text-slate-400 text-center uppercase tracking-[0.2em] opacity-40 italic mt-2">Verified road transport asset for government compliance</p>
            </div>
          </div>

          <div className="flex gap-6 pt-6 border-t border-slate-50">
            <button 
              type="submit"
              disabled={loading}
              className="erp-button-primary flex-1 !py-7 group"
            >
              <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {loading ? "Synchronizing..." : "Commit Logistics Entry"}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="erp-button-secondary !px-12"
            >
              Abort
            </button>
          </div>
        </form>

        {/* Security Badge Footer */}
        <div className="px-10 pb-8 flex items-center justify-center gap-3 opacity-20">
           <ShieldCheck className="w-3 h-3 text-slate-400" />
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Authorized Regulatory Node V2.0</span>
        </div>
      </div>
    </div>
  );
};

export default EWayBillDataModal;
