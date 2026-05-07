import { useState } from "react";
import { ShieldCheck, Hash, Link as LinkIcon, Save } from "lucide-react";
import Modal from "../common/Modal";

const EInvoiceDataModal = ({ isOpen, onClose, invoice, onSubmit }) => {
  const [formData, setFormData] = useState({
    irn: invoice?.einvoice?.irn || "",
    ackNo: invoice?.einvoice?.ackNo || "",
    qrCodeUrl: invoice?.einvoice?.qrCodeUrl || ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(invoice._id, formData);
      onClose();
    } catch (err) {
      alert("Failed to update E-Invoice details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="E-Invoice Registration"
      size="2xl"
    >
      <div className="flex items-center gap-4 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
         <div className="p-2.5 bg-indigo-600 rounded-lg shadow-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
         </div>
         <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Digital Tax Compliance</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Government Registration Portal</p>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">64-Digit IRN Number</label>
            <div className="relative group">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-mono"
                placeholder="Enter 64-digit IRN"
                value={formData.irn}
                onChange={(e) => setFormData({...formData, irn: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ack. Number</label>
              <input 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                placeholder="Acknowledgement No."
                value={formData.ackNo}
                onChange={(e) => setFormData({...formData, ackNo: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">QR Reference</label>
              <div className="relative group">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                  placeholder="URL or QR Ref"
                  value={formData.qrCodeUrl}
                  onChange={(e) => setFormData({...formData, qrCodeUrl: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-lg hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2 group"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            {loading ? "Saving..." : "Save E-Invoice Details"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EInvoiceDataModal;


