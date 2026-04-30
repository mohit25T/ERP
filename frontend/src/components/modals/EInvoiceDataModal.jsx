import { useState } from "react";

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 scale-in-center">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Record Govt IRN</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manual E-Invoice Registration</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">64-Digit IRN Number</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
                  placeholder="Enter 64-digit IRN"
                  value={formData.irn}
                  onChange={(e) => setFormData({...formData, irn: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ack. Number</label>
                <input 
                  required
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                  placeholder="Acknowledgement Number"
                  value={formData.ackNo}
                  onChange={(e) => setFormData({...formData, ackNo: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">QR Code Link / path</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                    placeholder="URL or QR Ref"
                    value={formData.qrCodeUrl}
                    onChange={(e) => setFormData({...formData, qrCodeUrl: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-50">
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? "Recording..." : "Save Govt Records"}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-4 bg-white text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all focus:outline-none"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EInvoiceDataModal;
