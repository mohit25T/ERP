import { useState } from "react";
import { Truck, Calendar, Hash, FileCheck, ShieldCheck } from "lucide-react";
import Modal from "../common/Modal";

const EWayBillDataModal = ({ isOpen, onClose, invoice, onSubmit }) => {
  const [formData, setFormData] = useState({
    ewbNo: invoice?.ewayBill?.ewayBillNo || "",
    ewbDate: invoice?.ewayBill?.ewbDate ? new Date(invoice.ewayBill.ewbDate).toISOString().split('T')[0] : "",
    validityDate: invoice?.ewayBill?.validityDate ? new Date(invoice.ewayBill.validityDate).toISOString().split('T')[0] : "",
    vehicleNo: invoice?.ewayBill?.vehicleNo || ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(invoice._id, formData);
      onClose();
    } catch (err) {
      alert("Failed to update E-Way Bill details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="E-Way Bill Registration"
      size="2xl"
    >
      <div className="flex items-center gap-3 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
         <div className="p-3 bg-slate-900 rounded-lg shadow-xl">
            <Truck className="w-5 h-5 text-white" />
         </div>
         <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Logistics Compliance</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Government EWB Reference Node</p>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-Way Bill Number (12 Digits)</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="ewbNo"
                required
                placeholder="12 Digit Government Number"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black tracking-widest focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                value={formData.ewbNo}
                onChange={(e) => setFormData({ ...formData, ewbNo: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Issue Date</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="date"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                  value={formData.ewbDate}
                  onChange={(e) => setFormData({ ...formData, ewbDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Validity Date</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="date"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all"
                  value={formData.validityDate}
                  onChange={(e) => setFormData({ ...formData, validityDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vehicle Registration Number</label>
            <div className="relative group">
              <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="e.g. GJ-01-XX-0000"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black tracking-widest uppercase focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                value={formData.vehicleNo}
                onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value.toUpperCase() })}
              />
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
            className="flex-1 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3 group"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Save Logistics Data
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EWayBillDataModal;


