import React, { useState, useEffect } from "react";
import { validateGSTIN } from "../../utils/gstValidator";
import { CheckCircle2, XCircle, AlertCircle, Search, Loader2 } from "lucide-react";
import { gstApi } from "../../api/erpApi";

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
      alert("Customer details successfully fetched!");
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            name="name"
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition font-bold text-gray-900"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            name="email"
            type="email"
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Primary State (GST)</label>
           <input
             name="state"
             required
             className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition uppercase text-blue-600 font-black"
             placeholder="e.g. MAHARASHTRA"
             value={formData.state}
             onChange={handleChange}
           />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            name="phone"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            placeholder="+91 XXXXX XXXXX"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name (Company)</label>
          <input
            name="company"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            placeholder="Acme Systems Pvt Ltd"
            value={formData.company}
            onChange={handleChange}
          />
        </div>

        <div className="col-span-1">
          <div className="flex items-center justify-between mb-1">
             <label className="block text-sm font-medium text-gray-700">Customer GSTIN</label>
          </div>
          <div className="relative group">
            <input
              name="gstin"
              className={`w-full pl-4 pr-14 py-2 border rounded-xl bg-gray-50 focus:ring-2 outline-none transition uppercase font-black tracking-tight ${
                formData.gstin 
                  ? (gstValidation.isValid ? 'border-green-200 focus:ring-green-500/20 text-green-700' : 'border-red-200 focus:ring-red-500/20 text-red-600')
                  : 'border-gray-200 focus:ring-blue-500/20 text-blue-600'
              }`}
              placeholder="27XXXXX0000X1Z5"
              value={formData.gstin}
              onChange={handleChange}
            />
            <button
               type="button"
               onClick={handleFetchDetails}
               disabled={fetchLoading || !gstValidation.isValid || !formData.gstin}
               className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
               title="Auto-fetch from GST Network"
            >
               {fetchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            </button>
            {formData.gstin && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2">
                {gstValidation.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            )}
          </div>
          {formData.gstin && !gstValidation.isValid && (
             <p className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-tight">
                <AlertCircle className="w-3 h-3" />
                {gstValidation.message}
             </p>
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Address</label>
          <textarea
            name="address"
            rows="2"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-none"
            placeholder="Plot No, Street, Landmark..."
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Pincode</label>
          <input
            name="pincode"
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition font-bold"
            placeholder="400001"
            maxLength="6"
            value={formData.pincode}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
        >
          {loading ? "Saving..." : initialData ? "Update Customer" : "Add Customer"}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
