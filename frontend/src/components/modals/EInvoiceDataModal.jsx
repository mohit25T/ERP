import { useState } from "react";
import { ShieldCheck, X, Hash, Link as LinkIcon, Save } from "lucide-react";

const EInvoiceDataModal = ({ isOpen, onClose, invoice, onUpdate }) => {
  const [formData, setFormData] = useState({
    irn: invoice?.einvoice?.irn || "",
    ackNo: invoice?.einvoice?.ackNo || "",
    qrCodeUrl: invoice?.einvoice?.qrCodeUrl || ""
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
      alert("Failed to update E-Invoice details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-lg rounded-md shadow-3xl shadow-slate-900/20 overflow-hidden border border-slate-100 flex flex-col scale-in-center">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-600 rounded-md shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-1">Record Govt IRN</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Manual E-Invoice Registration</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white border border-transparent hover:border-slate-100 rounded-md transition-all active:scale-90 shadow-sm">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">64-Digit IRN Number</label>
              <div className="relative group">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-md text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all font-mono"
                  placeholder="Enter 64-digit IRN"
                  value={formData.irn}
                  onChange={(e) => setFormData({...formData, irn: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ack. Number</label>
                <input 
                  required
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-md text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all"
                  placeholder="Acknowledgement Number"
                  value={formData.ackNo}
                  onChange={(e) => setFormData({...formData, ackNo: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">QR Code Link / path</label>
                <div className="relative group">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-md text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all"
                    placeholder="URL or QR Ref"
                    value={formData.qrCodeUrl}
                    onChange={(e) => setFormData({...formData, qrCodeUrl: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-50">
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-md shadow-xl shadow-slate-900/20 hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              <Save className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              {loading ? "Recording Flux..." : "Commit Govt Records"}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-4 bg-white text-slate-400 font-black text-xs uppercase tracking-widest rounded-md border border-slate-100 hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none shadow-sm active:scale-95"
            >
              Cancel
            </button>
          </div>
          <p className="text-center text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">Encrypted Statutory Reference Node v2.1</p>
        </form>
      </div>
    </div>
  );
};

export default EInvoiceDataModal;
