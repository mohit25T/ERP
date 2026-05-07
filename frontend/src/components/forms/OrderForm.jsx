import { useState, useEffect } from "react";
import { customerApi, productApi, distanceApi } from "../../api/erpApi";
import unitsUtil from "../../utils/units";
import { useAuth } from "../../context/AuthContext";
import {
  User, Search, Zap, Package, Hash, IndianRupee,
  ShoppingCart, Truck, Loader2, MapPin, Activity, ShieldCheck
} from "lucide-react";


/**
 * OrderForm: The Fulfillment Intelligence Terminal
 * High-fidelity interaction node for single-asset enterprise sales and logistics.
 */
const OrderForm = ({ onSubmit, onCancel, loading, initialData }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    customer: initialData?.customer?._id || initialData?.customer || "",
    billToCustomer: initialData?.billToCustomer?._id || initialData?.customer?._id || initialData?.customer || "",
    shipToCustomer: initialData?.shipToCustomer?._id || initialData?.customer?._id || initialData?.customer || "",
    product: initialData?.product?._id || initialData?.product || "",
    quantity: initialData?.quantity || 1,
    scrapPieces: initialData?.scrapPieces || 0,
    unit: initialData?.unit || "kg",
    price: initialData?.unitPrice || initialData?.price || 0,
    saleType: initialData?.saleType || "yield",
    ewayBillData: initialData?.ewayBillData || {
      active: false,
      distance: 0,
      transporterId: "",
      vehicleNo: "",
      mode: "road",
      transport: "",
      lrNo: "",
      lrDate: ""
    },
    poNumber: initialData?.poNumber || "",
    billToAddress: initialData?.billToAddress || null,
    shipToAddress: initialData?.shipToAddress || null
  });

  const { user } = useAuth();
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Logic to auto-equip E-Way Bill if amount > 50,000 (Mandatory Legal Requirement)
  useEffect(() => {
    if (selectedProduct) {
      const price = formData.price || 0;
      const qty = formData.quantity || 1;
      const gst = selectedProduct.gstRate || 18;
      const total = (price * qty) * (1 + gst / 100);

      // Auto-enable e-way bill if threshold exceeds 50k
      if (total > 50000 && !formData.ewayBillData.active) {
        setFormData(prev => ({
          ...prev,
          ewayBillData: { ...prev.ewayBillData, active: true }
        }));
      }
    }
  }, [selectedProduct, formData.quantity, formData.price, formData.ewayBillData.active]);

  // Automatic Scrap Mass Calculation (Kg/Tons)
  useEffect(() => {
    if (formData.saleType === 'scrap' && selectedProduct?.unitWeightGrams && formData.scrapPieces > 0) {
      const totalWeightGrams = formData.scrapPieces * selectedProduct.unitWeightGrams;
      let calculatedWeight = totalWeightGrams / 1000; // Default to Kg

      // Handle Ton/Mts conversion if unit is tons/mts
      if (formData.unit === 'tons' || formData.unit === 'mts') {
        calculatedWeight = totalWeightGrams / 1000000;
      }

      setFormData(prev => ({ ...prev, quantity: parseFloat(calculatedWeight.toFixed(3)) }));
    }
  }, [formData.scrapPieces, formData.saleType, selectedProduct, formData.unit]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [custRes, prodRes] = await Promise.all([
          customerApi.getAll(),
          productApi.getAll()
        ]);
        setCustomers(custRes.data || []);
        setProducts(prodRes.data || []);
      } catch (err) {
        console.error("Error fetching form data", err);
        setError(err.response?.data?.error || err.message || "Failed to load master data from server");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        customer: initialData.customer?._id || initialData.customer || "",
        product: initialData.product?._id || initialData.product || "",
        quantity: initialData.quantity || 1,
        scrapPieces: initialData.scrapPieces || 0,
        unit: initialData.unit || "kg",
        price: initialData.unitPrice || initialData.price || 0,
        saleType: initialData.saleType || "yield",
        ewayBillData: initialData.ewayBillData || {
          active: false,
          distance: 0,
          transporterId: "",
          vehicleNo: "",
          mode: "road",
          transport: "",
          lrNo: "",
          lrDate: ""
        },
        poNumber: initialData.poNumber || "",
        billToAddress: initialData.billToAddress || null,
        shipToAddress: initialData.shipToAddress || null
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (products.length > 0 && formData.product) {
      const prod = products.find(p => p._id === formData.product);
      if (prod) setSelectedProduct(prod);
    }
  }, [products, formData.product]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "product") {
      const prod = products.find(p => p._id === value);
      setSelectedProduct(prod);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        price: prod?.price || 0,
        unit: prod?.unit || prev.unit
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: (name === "quantity" || name === "price" || name === "scrapPieces") ? parseFloat(value) : value
      }));
    }
  };

  const handleEwayChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      ewayBillData: {
        ...prev.ewayBillData,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleFetchDistance = async () => {
    const shipToCust = customers.find(c => c._id.toString() === formData.shipToCustomer?.toString());
    const getBestAddress = (entity, selectedAddress) => {
      if (selectedAddress?.address?.trim()) return selectedAddress.address;
      if (entity?.address?.trim()) return entity.address;
      if (entity?.pincode && entity?.state) return `${entity.pincode}, ${entity.state}`;
      return null;
    };

    const fromAddr = getBestAddress(user);
    const toAddr = getBestAddress(shipToCust, formData.shipToAddress);

    if (!fromAddr || !toAddr) {
      alert("Missing address data for calculation. Please ensure both Company and Customer profiles have address/pincode records.");
      return;
    }

    try {
      setDistanceLoading(true);
      const res = await distanceApi.fetch(fromAddr, toAddr);
      setFormData(prev => ({
        ...prev,
        ewayBillData: { ...prev.ewayBillData, distance: res.data.distance }
      }));
    } catch (err) {
      alert("Distance calculation synchronization failed.");
    } finally {
      setDistanceLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customer || !formData.product) {
      alert("Identity and Asset nodes must be authorized before submission.");
      return;
    }
    onSubmit(formData);
  };

  if (fetching) return <div className="p-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ">Syncing master data nodes...</div>;

  const normalizedQty = unitsUtil.normalizeToPieces(formData.quantity, formData.unit);
  const totalBeforeTax = formData.price * normalizedQty;
  const gstRate = selectedProduct?.gstRate || 0;
  const grandTotal = totalBeforeTax * (1 + gstRate / 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in zoom-in-95 duration-700">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* BILLING ENTITY SECTION */}
        <div className="space-y-4 p-4 bg-slate-50/30 rounded-3xl border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Billing Party</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Customer</label>
              <select
                name="billToCustomer"
                required
                className="erp-input !bg-white uppercase font-black"
                value={formData.billToCustomer}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    billToCustomer: val,
                    customer: val, // Main customer reference
                    billToAddress: null // Reset address on customer change
                  }));
                }}
              >
                <option value="">-- SEARCH BILLING ENTITY --</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.company?.toUpperCase() || c.name?.toUpperCase()} ({c.type})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Billing Address</label>
              <select
                name="billToAddress"
                className="erp-input !bg-white uppercase font-black text-[11px]"
                value={formData.billToAddress ? JSON.stringify(formData.billToAddress) : ""}
                onChange={(e) => {
                  const val = e.target.value ? JSON.parse(e.target.value) : null;
                  setFormData(prev => ({ ...prev, billToAddress: val }));
                }}
              >
                <option value="">-- SELECT BILLING ADDRESS --</option>
                {(() => {
                  const selectedCust = customers.find(c => c._id.toString() === formData.billToCustomer?.toString());
                  if (!selectedCust) return null;

                  return (
                    <>
                      {/* Primary Registry Address */}
                      {(selectedCust.address || selectedCust.gstin) && (
                        <option value={JSON.stringify({
                          label: "Primary Registry",
                          companyName: selectedCust.company || selectedCust.name,
                          address: selectedCust.address,
                          state: selectedCust.state,
                          pincode: selectedCust.pincode,
                          gstin: selectedCust.gstin
                        })}>
                          {selectedCust.address?.toUpperCase()} ({selectedCust.company?.toUpperCase() || "PRIMARY"})
                        </option>
                      )}
                      {/* Additional Nodes/Sub-entities */}
                      {selectedCust.addresses?.filter(a => a.type === 'billing' || a.type === 'both').map((addr, idx) => (
                        <option key={idx} value={JSON.stringify(addr)}>
                          {addr.address?.toUpperCase()} ({addr.companyName?.toUpperCase() || selectedCust.company?.toUpperCase()})
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </div>
          </div>
        </div>

        {/* SHIPPING DESTINATION SECTION */}
        <div className="space-y-4 p-4 bg-indigo-50/20 rounded-3xl border border-indigo-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-indigo-700 uppercase tracking-wider">Shipping Destination</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Consignee</label>
              <select
                name="shipToCustomer"
                required
                className="erp-input !bg-white uppercase font-black"
                value={formData.shipToCustomer}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    shipToCustomer: val,
                    shipToAddress: null // Reset address on customer change
                  }));
                }}
              >
                <option value="">-- SEARCH SHIPPING TARGET --</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.company?.toUpperCase() || c.name?.toUpperCase()} ({c.type})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shipping Address</label>
              <select
                name="shipToAddress"
                className="erp-input !bg-white uppercase font-black text-[11px]"
                value={formData.shipToAddress ? JSON.stringify(formData.shipToAddress) : ""}
                onChange={(e) => {
                  const val = e.target.value ? JSON.parse(e.target.value) : null;
                  setFormData(prev => ({ ...prev, shipToAddress: val }));
                }}
              >
                <option value="">-- SELECT SHIPPING ADDRESS --</option>
                {(() => {
                  const selectedCust = customers.find(c => c._id.toString() === formData.shipToCustomer?.toString());
                  if (!selectedCust) return null;

                  return (
                    <>
                      {/* Primary Registry Address */}
                      {(selectedCust.address || selectedCust.gstin) && (
                        <option value={JSON.stringify({
                          label: "Primary Registry",
                          companyName: selectedCust.company || selectedCust.name,
                          address: selectedCust.address,
                          state: selectedCust.state,
                          pincode: selectedCust.pincode,
                          gstin: selectedCust.gstin
                        })}>
                          {selectedCust.address?.toUpperCase()} ({selectedCust.company?.toUpperCase() || "PRIMARY"})
                        </option>
                      )}
                      {/* Additional Nodes/Sub-entities */}
                      {selectedCust.addresses?.filter(a => a.type === 'shipping' || a.type === 'both').map((addr, idx) => (
                        <option key={idx} value={JSON.stringify(addr)}>
                          {addr.address?.toUpperCase()} ({addr.companyName?.toUpperCase() || selectedCust.company?.toUpperCase()})
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* PO NUMBER ROW */}
      <div className="space-y-3 pt-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1  flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Purchase Order Details
        </label>
        <div className="relative group">
          <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
          <input
            name="poNumber"
            className="erp-input !pl-14 !bg-slate-50/50 focus:!bg-white uppercase font-black"
            placeholder="PO NUMBER (E.G. PO-2024-001)"
            value={formData.poNumber}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ASSET SPECIFICATION */}
      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1  flex items-center gap-2">
            <Package className="w-3.5 h-3.5" />
            Master Asset Target
          </label>
          <select
            name="product"
            required
            className="erp-input !bg-slate-50/50 focus:!bg-white uppercase font-black"
            value={formData.product}
            onChange={handleChange}
          >
            <option value="">-- SELECT ASSET --</option>
            {products
              .filter(p => formData.saleType === 'scrap' || p.type !== 'raw_material')
              .map(p => {
                const displayStock = unitsUtil.convertFromPieces(p.totalStock || 0, p.unit);
                const displayScrap = unitsUtil.convertFromPieces(p.scrapStock || 0, p.unit);
                const scrapMassKg = p.type === 'raw_material' ? (p.scrapStock || 0) : ((p.scrapStock || 0) * (p.unitWeightGrams || 0)) / 1000;

                const avlText = formData.saleType === 'scrap'
                  ? `${displayScrap.toLocaleString(undefined, { minimumFractionDigits: 3 })} ${p.unit?.toUpperCase() || 'KG'}${p.unit !== 'kg' && scrapMassKg > 0 ? ` (≈${scrapMassKg.toLocaleString(undefined, { minimumFractionDigits: 2 })} KG)` : ''}`
                  : `${displayStock.toLocaleString()} ${p.unit?.toUpperCase() || 'KG'}`;
                return (
                  <option key={p._id} value={p._id}>
                    {p.name.toUpperCase()} (AVL: {avlText})
                  </option>
                );
              })}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.saleType === 'scrap' && (
            <div className="space-y-3 animate-in slide-in-from-left-4 duration-500">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1  flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" />
                Salvage Pieces
              </label>
              <input
                name="scrapPieces"
                type="number"
                placeholder="Count..."
                className="erp-input !bg-slate-50/50 focus:!bg-slate-900 focus:!text-white !font-black !text-left !pl-4 !text-lg transition-all"
                value={formData.scrapPieces}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 ">Authorized Qty (Weight)</label>
            <div className="relative group">
              <input
                name="quantity"
                type="number"
                required
                className="erp-input !bg-slate-50/50 focus:!bg-slate-900 focus:!text-white !font-black !text-left !pl-4 !text-lg transition-all"
                value={formData.quantity}
                onChange={handleChange}
              />
              <div className="absolute right-0 top-0 bottom-0 flex items-center px-4 border-l border-slate-200 group-focus-within:border-slate-700 transition-colors pointer-events-auto">
                {formData.product && formData.saleType !== 'scrap' ? (
                  <span className="text-slate-400 group-focus-within:text-indigo-400 font-black uppercase tracking-widest text-[9px] cursor-default">
                    {formData.unit || 'unit'}
                  </span>
                ) : (
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="bg-transparent border-none outline-none text-right cursor-pointer text-slate-400 group-focus-within:text-indigo-400 font-black uppercase tracking-widest transition-colors text-[9px]"
                  >
                    <option value="kg">KG</option>
                    <option value="mts">MTS</option>
                    <option value="dagina">DAGINA</option>
                    <option value="pcs">PCS</option>
                  </select>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 ">Unit Valuation</label>
            <div className="relative group">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input
                name="price"
                type="number"
                required
                className="erp-input !pl-10 !bg-slate-50/50 focus:!bg-white !font-black !text-emerald-600 !text-lg"
                value={formData.price}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>


      {/* DYNAMIC VALUATION NODE */}
      <div className="bg-[#0f172a] rounded-md p-4 flex flex-col md:flex-row items-center justify-between border border-slate-800 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 -right-8 p-6 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000">
          <ShoppingCart className="w-32 h-32 text-white" />
        </div>
        <div className="flex flex-col gap-1 relative z-10">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-3 block">Aggregate Settlement Specification</span>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Taxable Payload</label>
              <p className="text-white text-2xl font-black ">₹ {totalBeforeTax.toLocaleString()}</p>
            </div>
            <div className="w-px h-10 bg-slate-800 mx-2"></div>
            <div>
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Statutory GST ({gstRate}%)</label>
              <p className="text-emerald-400 text-2xl font-black ">₹ {(grandTotal - totalBeforeTax).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="text-right relative z-10 mt-4 md:mt-0">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2">Final Fulfillment Value</span>
          <div className="text-6xl font-black text-white tracking-tighter flex items-baseline justify-end gap-3  group-hover:scale-[1.02] transition-transform duration-700">
            <span className="text-2xl text-indigo-500 font-normal not-">₹</span>
            {grandTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* LOGISTICS TELEMETRY (E-WAY BILL) */}
      <div className={`transition-all duration-700 ${formData.ewayBillData.active ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-100'} p-4 rounded-md border space-y-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-4 rounded-md shadow-xl transition-all duration-500 ${formData.ewayBillData.active ? 'bg-indigo-600 text-white scale-110 shadow-indigo-200' : 'bg-slate-200 text-slate-400'}`}>
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className={`text-xl font-black uppercase tracking-tighter  leading-none mb-1 ${formData.ewayBillData.active ? 'text-slate-900' : 'text-slate-400'}`}>Logistics <span className="text-slate-400 not-">Node</span></h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Government E-Way Bill Telemetry & Registration</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer scale-110 mr-2">
            <input
              type="checkbox"
              name="active"
              className="sr-only peer"
              checked={formData.ewayBillData.active}
              onChange={handleEwayChange}
            />
            <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {formData.ewayBillData.active && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ">KM Displacement</label>
                    <button type="button" onClick={handleFetchDistance} disabled={distanceLoading} className="text-[8px] font-black text-indigo-600 uppercase hover:text-indigo-800 transition-all flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-md">
                      {distanceLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />} AUTO SYNC
                    </button>
                  </div>
                  <input name="distance" type="number" className="erp-input !bg-white focus:!ring-indigo-500/10" value={formData.ewayBillData.distance} onChange={handleEwayChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2 ">Transport Matrix</label>
                  <select name="mode" className="erp-input !bg-white" value={formData.ewayBillData.mode} onChange={handleEwayChange}>
                    <option value="road">ROAD EXPEDITED</option>
                    <option value="rail">RAIL FREIGHT</option>
                    <option value="air">AIR CARGO</option>
                    <option value="ship">MARITIME SHIPMENT</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2 ">Transporter Agency</label>
                  <input name="transport" className="erp-input !bg-white uppercase placeholder:" placeholder="CARRIER NAME" value={formData.ewayBillData.transport} onChange={handleEwayChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2 ">Transporter Master ID</label>
                  <input name="transporterId" className="erp-input !bg-white uppercase placeholder:" placeholder="TRNP-0000" value={formData.ewayBillData.transporterId} onChange={handleEwayChange} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-indigo-600/5 rounded-md p-4 border border-indigo-100 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] ">High-Priority Telemetry</span>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Vehicle Asset ID</label>
                <input
                  name="vehicleNo"
                  required
                  className="erp-input !bg-white !text-xl !font-black !tracking-tighter !py-4 !border-indigo-100 focus:!border-indigo-600 uppercase text-center placeholder:text-slate-200"
                  placeholder="GJ-03-XX-0000"
                  value={formData.ewayBillData.vehicleNo}
                  onChange={handleEwayChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">L.R. Node</label>
                  <input name="lrNo" className="erp-input !bg-white !py-2.5 !text-[11px] !rounded-lg" placeholder="REF-000" value={formData.ewayBillData.lrNo} onChange={handleEwayChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">L.R. TS</label>
                  <input name="lrDate" className="erp-input !bg-white !py-2.5 !text-[11px] !rounded-lg" placeholder="DD/MM/YY" value={formData.ewayBillData.lrDate} onChange={handleEwayChange} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-10 border-t border-slate-50">
        <button type="button" onClick={onCancel} className="erp-button-secondary !px-20">Abort</button>
        <button type="submit" disabled={loading} className="erp-button-primary flex-1 group shadow-primary/10">
          {loading ? "Authorizing dispatch..." : initialData ? "Commit Manifest Update" : "Authorize Order Execution"}
          <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </form>
  );
}

export default OrderForm;
