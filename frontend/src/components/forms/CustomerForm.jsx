import { useState, useEffect } from "react";
import { validateGSTIN } from "../../utils/gstValidator";
import { gstApi } from "../../api/erpApi";
import {
  Zap, ShieldCheck, Activity, User, Mail, 
  Building2, Hash, Search, Loader2, CheckCircle2, 
  XCircle, AlertCircle, Phone, MapPin
} from "lucide-react";

/**
 * CustomerForm: The Corporate Identity Node
 * High-fidelity data entry for enterprise client relationship management.
 */
const CustomerForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    company: initialData?.company || "",
    state: initialData?.state || "",
    gstin: initialData?.gstin || "",
    address: initialData?.address || "",
    pincode: initialData?.pincode || "",
    type: initialData?.type || "regular",
  });

  const [gstValidation, setGstValidation] = useState({ isValid: true, message: "" });
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    if (formData.gstin) {
      const result = validateGSTIN(formData.gstin);
      setGstValidation(result);
    } else {
      setGstValidation({ isValid: true, message: "" });
    }
  }, [formData.gstin]);

  const handleFetchDetails = async () => {
    if (!gstValidation.isValid || !formData.gstin) return;
    
    try {
      setFetchLoading(true);
      const res = await gstApi.lookup(formData.gstin);
      const data = res.data;
      
      setFormData(prev => ({
        ...prev,
        company: data.companyName || prev.company,
        address: data.address || prev.address,
        state: data.state || prev.state,
        pincode: data.pincode || prev.pincode
      }));
    } catch (err) {
      console.error("Failed to fetch GST details", err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "gstin") {
      finalValue = value.replace(/\s+/g, "").toUpperCase();
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
      
      {/* Classification Protocol */}
      <div className="space-y-4">
         <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-indigo-500" />
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Client Classification Protocol</label>
         </div>
         <div className="flex bg-slate-100/50 p-1.5 rounded-[1.5rem] border border-slate-200/50">
           <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, type: 'regular' }))}
              className={`flex-1 py-4 px-6 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2 ${formData.type === 'regular' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200/50 scale-[1.02] z-10' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <ShieldCheck className={`w-3.5 h-3.5 ${formData.type === 'regular' ? 'text-indigo-600' : 'text-slate-300'}`} />
              Regular Enterprise
           </button>
           <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, type: 'scrap_buyer' }))}
              className={`flex-1 py-4 px-6 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2 ${formData.type === 'scrap_buyer' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-[1.02] z-10' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <Activity className={`w-3.5 h-3.5 ${formData.type === 'scrap_buyer' ? 'text-rose-400' : 'text-slate-300'}`} />
              Scrap Material Salvager
           </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* IDENTITY SECTION */}
        <div className="space-y-6 md:col-span-2">
           <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] pl-3 border-l-4 border-indigo-600">Identity Core</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Legal Representative</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    name="name"
                    required
                    className="erp-input !pl-14 !bg-slate-50/50 focus:!bg-white"
                    placeholder="FULL LEGAL NAME"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Contact Relay (Email)</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    name="email"
                    type="email"
                    required
                    className="erp-input !pl-14 !bg-slate-50/50 focus:!bg-white"
                    placeholder="SECURE@EMAIL.COM"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
           </div>
        </div>

        {/* LOGISTICS & FISCAL SECTION */}
        <div className="space-y-6 md:col-span-2">
           <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] pl-3 border-l-4 border-emerald-500">Logistics & Fiscal Node</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Registered Business Name</label>
                 <div className="relative group">
                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      name="company"
                      className="erp-input !pl-14 !bg-slate-50/50 focus:!bg-white uppercase"
                      placeholder="ACME SOLUTIONS PVT LTD"
                      value={formData.company}
                      onChange={handleChange}
                    />
                 </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between mb-0.5">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">GSTIN Master UID</label>
                </div>
                <div className="relative group">
                  <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    name="gstin"
                    className={`erp-input !pl-14 !pr-16 !font-mono !tracking-[0.2em] !bg-indigo-50/30 uppercase ${
                      formData.gstin 
                        ? (gstValidation.isValid ? 'border-emerald-200 !text-emerald-700' : 'border-rose-200 !text-rose-600')
                        : 'border-slate-200 !text-indigo-600'
                    }`}
                    placeholder="27XXXXX0000X"
                    value={formData.gstin}
                    onChange={handleChange}
                  />
                  <button
                     type="button"
                     onClick={handleFetchDetails}
                     disabled={fetchLoading || !gstValidation.isValid || !formData.gstin}
                     className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                     {fetchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                  {formData.gstin && (
                    <div className="absolute right-14 top-1/2 -translate-y-1/2">
                      {gstValidation.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                  )}
                </div>
                {formData.gstin && !gstValidation.isValid && (
                   <p className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-rose-500 uppercase tracking-tight italic">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {gstValidation.message}
                   </p>
                )}
              </div>
           </div>
        </div>

        <div className="space-y-2.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Telecom Protocol (Phone)</label>
          <div className="relative group">
            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input
              name="phone"
              className="erp-input !pl-14 !bg-slate-50/50 focus:!bg-white"
              placeholder="+91 XXXXX XXXXX"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2.5">
           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Primary Fiscal State</label>
           <div className="relative group">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <input
                name="state"
                required
                className="erp-input !pl-14 !bg-slate-50/50 focus:!bg-white uppercase !font-black !tracking-widest"
                placeholder="STATE REGION"
                value={formData.state}
                onChange={handleChange}
              />
           </div>
        </div>

        <div className="md:col-span-2 space-y-2.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Physical Operational Hub (Full Address)</label>
          <textarea
            name="address"
            rows="3"
            className="erp-input !py-5 resize-none h-28 !bg-slate-50/50 focus:!bg-white"
            placeholder="STREET, SECTOR, LANDMARK..."
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="md:col-span-1 space-y-2.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Registry Pincode</label>
          <input
            name="pincode"
            required
            className="erp-input !bg-slate-50/50 focus:!bg-white !font-black !tracking-[0.5em]"
            placeholder="000000"
            maxLength="6"
            value={formData.pincode}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex gap-6 pt-10 border-t border-slate-50">
        <button
          type="button"
          onClick={onCancel}
          className="erp-button-secondary flex-1"
        >
          Abort Entry
        </button>
        <button
          type="submit"
          disabled={loading}
          className="erp-button-primary flex-1 group shadow-indigo-500/10"
        >
          {loading ? "Synchronizing..." : initialData ? "Commit Data Update" : "Authorize New Entry"}
          <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
