import { useState, useEffect } from "react";
import { customerApi, productApi, orderApi, invoiceApi } from "../../api/erpApi";
import {
  User, Package, Calendar, FileText, Plus, Trash2,
  IndianRupee, Percent, Calculator, ChevronDown, Save, Send,
  Truck, Hash, CreditCard, Clock, Tag, Box
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BillingForm = ({ onSubmit, onCancel, loading }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fetching, setFetching] = useState(true);

  // Dynamic options with "Create New" capability
  const [paymentModes, setPaymentModes] = useState(["Cash", "Bank Transfer", "UPI", "Cheque"]);
  const [paymentTermsOptions, setPaymentTermsOptions] = useState(["Immediate", "Net 30", "Net 45", "Net 60"]);
  const [unitsOptions, setUnitsOptions] = useState(["kg", "pcs", "mtr", "box", "set"]);

  const [formData, setFormData] = useState({
    customer: "",
    billToCustomer: "",
    shipToCustomer: "",
    billToAddress: null,
    shipToAddress: null,
    invoiceNumber: "",
    billSeries: "INV/24-25/",
    poNo: "",
    isIgst: false,
    paymentMode: "Bank Transfer",
    paymentTerms: "Net 30",
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: "",
    items: [
      {
        product: "",
        name: "",
        quantity: 1,
        price: 0,
        unit: "pcs",
        gstRate: 18,
        taxableAmount: 0,
        gstAmount: 0,
        totalAmount: 0
      }
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes, ordRes, invNumRes] = await Promise.all([
          customerApi.getAll(),
          productApi.getAll(),
          orderApi.getAll(),
          invoiceApi.getNextNumber()
        ]);
        setCustomers(custRes.data || []);
        setProducts(prodRes.data || []);

        // Only keep orders that have unbilled quantity
        const billableOrders = (ordRes.data || []).filter(o => 
          !['cancelled'].includes(o.status) &&
          (o.invoicedQty || 0) < (o.orderedQty || o.quantity || 0)
        );
        setOrders(billableOrders);

        // Auto-fill the next invoice number
        if (invNumRes.data?.nextNumber) {
          setFormData(prev => ({ ...prev, invoiceNumber: invNumRes.data.nextNumber }));
        }
      } catch (err) {
        console.error("Error fetching form data", err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleOrderSelect = (orderId) => {
    if (!orderId) return;
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    const unbilledQty = (order.orderedQty || order.quantity || 0) - (order.invoicedQty || 0);
    const unitPrice = order.unitPrice || (order.product?.price || 0);

    setFormData(prev => ({
      ...prev,
      order: order._id,
      customer: order.customer?._id || order.billToCustomer?._id || prev.customer,
      billToCustomer: order.billToCustomer?._id || order.customer?._id || prev.customer,
      shipToCustomer: order.shipToCustomer?._id || order.customer?._id || prev.customer,
      billToAddress: order.billToAddress || null,
      shipToAddress: order.shipToAddress || null,
      poNo: order.poNumber || prev.poNo,
      items: [{
        product: order.product?._id || "",
        name: order.product?.name || "",
        quantity: unbilledQty,
        price: unitPrice,
        unit: order.unit || "pcs",
        gstRate: order.product?.gstRate || 18,
        taxableAmount: unbilledQty * unitPrice,
        gstAmount: (unbilledQty * unitPrice) * ((order.product?.gstRate || 18) / 100),
        totalAmount: (unbilledQty * unitPrice) * (1 + (order.product?.gstRate || 18) / 100)
      }]
    }));
  };

  const calculateItem = (item) => {
    const taxableAmount = (item.quantity || 0) * (item.price || 0);
    const gstAmount = taxableAmount * ((item.gstRate || 0) / 100);
    const totalAmount = taxableAmount + gstAmount;
    return { ...item, taxableAmount, gstAmount, totalAmount };
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product: "",
        name: "",
        quantity: 1,
        price: 0,
        unit: "pcs",
        gstRate: 18,
        taxableAmount: 0,
        gstAmount: 0,
        totalAmount: 0
      }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];

    // Handle "Add New Unit"
    if (field === "unit" && value === "ADD_NEW") {
      const newUnit = prompt("Enter new Unit name (e.g. bundle, drum):");
      if (newUnit) {
        setUnitsOptions(prev => [...new Set([...prev, newUnit])]);
        value = newUnit;
      } else {
        return; // User cancelled
      }
    }

    let item = { ...newItems[index], [field]: value };

    if (field === "product") {
      const prod = products.find(p => p._id === value);
      if (prod) {
        item.name = prod.name;
        item.price = prod.price || 0;
        item.unit = prod.unit || "pcs";
        item.gstRate = prod.gstRate || 18;
      }
    }

    newItems[index] = calculateItem(item);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  // Helper for "Add New" dropdowns
  const handleSelectOrCreate = (field, value, options, setOptions) => {
    if (value === "ADD_NEW") {
      const newVal = prompt(`Enter new ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}:`);
      if (newVal) {
        setOptions(prev => [...new Set([...prev, newVal])]);
        setFormData(prev => ({ ...prev, [field]: newVal }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const totals = formData.items.reduce((acc, item) => ({
    taxable: acc.taxable + (item.taxableAmount || 0),
    gst: acc.gst + (item.gstAmount || 0),
    grand: acc.grand + (item.totalAmount || 0)
  }), { taxable: 0, gst: 0, grand: 0 });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customer) return alert("Please select a customer");
    if (formData.items.some(item => !item.product)) return alert("Please select a product for all items");
    onSubmit(formData);
  };

  if (fetching) return <div className="p-6 text-center text-sm font-medium text-slate-500 animate-pulse">Initializing Billing Engine...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full p-1 bg-transparent">

      {/* Auto-Fill from Order */}
      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Auto-Fill from Order</h4>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Select an active production order to auto-fill Customer, PO, and Asset details.</p>
          </div>
        </div>
        <select
          className={`erp-input w-72 h-10 bg-white border-indigo-200 text-indigo-900 font-bold focus:border-indigo-500 transition-all text-xs ${orders.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onChange={(e) => handleOrderSelect(e.target.value)}
          defaultValue=""
          disabled={orders.length === 0}
        >
          {orders.length === 0 ? (
            <option value="" disabled>-- No Active Orders Available --</option>
          ) : (
            <>
              <option value="" disabled>-- Select Active Order --</option>
              {orders.map(o => (
                <option key={o._id} value={o._id}>#{o._id.substring(o._id.length - 6).toUpperCase()} - {o.customer?.company || o.customer?.name}</option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* 3-Column Professional Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-xl border border-border">

        {/* Column 1: Client Info */}
        <div className="space-y-4 border-r border-border/50 pr-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <User className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Billing Info</h3>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Bill To (Customer)</label>
            <select
              required
              className="erp-input h-10 bg-white border-slate-200 focus:border-indigo-500 transition-all text-[11px] font-semibold uppercase"
              value={formData.billToCustomer}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  billToCustomer: val,
                  customer: val,
                  billToAddress: null
                }));
              }}
            >
              <option value="">Select Billing Client...</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.company || c.name} ({c.type || "Retail"})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Billing Address</label>
            <select
              className="erp-input h-10 bg-white border-slate-200 focus:border-indigo-500 transition-all text-[11px] font-semibold uppercase"
              value={formData.billToAddress ? JSON.stringify(formData.billToAddress) : ""}
              onChange={(e) => {
                const val = e.target.value ? JSON.parse(e.target.value) : null;
                setFormData(prev => ({ ...prev, billToAddress: val }));
              }}
            >
              <option value="">-- SELECT ADDRESS --</option>
              {(() => {
                const selectedCust = customers.find(c => c._id.toString() === formData.billToCustomer?.toString());
                if (!selectedCust) return null;

                return (
                  <>
                    {(selectedCust.address || selectedCust.gstin) && (
                      <option value={JSON.stringify({
                        label: "Primary Registry",
                        companyName: selectedCust.company || selectedCust.name,
                        address: selectedCust.address,
                        state: selectedCust.state,
                        pincode: selectedCust.pincode,
                        gstin: selectedCust.gstin
                      })}>
                        {selectedCust.address?.substring(0, 30)}... (PRIMARY)
                      </option>
                    )}
                    {selectedCust.addresses?.filter(a => a.type === 'billing' || a.type === 'both').map((addr, idx) => (
                      <option key={idx} value={JSON.stringify(addr)}>
                        {addr.address?.substring(0, 30)}... ({addr.companyName || selectedCust.company})
                      </option>
                    ))}
                  </>
                );
              })()}
            </select>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Ship To (Customer)</label>
            <select
              className="erp-input h-10 bg-white border-slate-200 focus:border-indigo-500 transition-all text-[11px] font-semibold uppercase"
              value={formData.shipToCustomer}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  shipToCustomer: val,
                  shipToAddress: null
                }));
              }}
            >
              <option value="">Same as Billing...</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.company || c.name} ({c.type || "Retail"})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Shipping Address</label>
            <select
              className="erp-input h-10 bg-white border-slate-200 focus:border-indigo-500 transition-all text-[11px] font-semibold uppercase"
              value={formData.shipToAddress ? JSON.stringify(formData.shipToAddress) : ""}
              onChange={(e) => {
                const val = e.target.value ? JSON.parse(e.target.value) : null;
                setFormData(prev => ({ ...prev, shipToAddress: val }));
              }}
            >
              <option value="">-- SELECT ADDRESS --</option>
              {(() => {
                const targetId = formData.shipToCustomer || formData.billToCustomer;
                const selectedCust = customers.find(c => c._id.toString() === targetId?.toString());
                if (!selectedCust) return null;

                return (
                  <>
                    {(selectedCust.address || selectedCust.gstin) && (
                      <option value={JSON.stringify({
                        label: "Primary Registry",
                        companyName: selectedCust.company || selectedCust.name,
                        address: selectedCust.address,
                        state: selectedCust.state,
                        pincode: selectedCust.pincode,
                        gstin: selectedCust.gstin
                      })}>
                        {selectedCust.address?.substring(0, 30)}... (PRIMARY)
                      </option>
                    )}
                    {selectedCust.addresses?.filter(a => a.type === 'shipping' || a.type === 'both').map((addr, idx) => (
                      <option key={idx} value={JSON.stringify(addr)}>
                        {addr.address?.substring(0, 30)}... ({addr.companyName || selectedCust.company})
                      </option>
                    ))}
                  </>
                );
              })()}
            </select>
          </div>
        </div>

        {/* Column 2: Bill Meta */}
        <div className="space-y-4 border-r border-border/50 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-md">
              <Hash className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Reference Details</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Bill No</label>
              <input
                className="erp-input h-10 bg-white border-slate-200 font-bold text-xs"
                placeholder="Auto-Generated"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Bill Series</label>
              <input
                className="erp-input h-10 bg-white border-slate-200 font-bold text-xs text-indigo-600"
                value={formData.billSeries}
                onChange={(e) => setFormData(prev => ({ ...prev, billSeries: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Bill Date</label>
              <input
                type="date"
                className="erp-input h-10 bg-white border-slate-200 text-xs"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">PO Number</label>
              <input
                className="erp-input h-10 bg-white border-slate-200 text-xs"
                placeholder="Reference PO#"
                value={formData.poNo}
                onChange={(e) => setFormData(prev => ({ ...prev, poNo: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Column 3: Payment Terms */}
        <div className="space-y-4 pl-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Financial Terms</h3>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Mode of Payment</label>
            <select
              className="erp-input h-10 bg-white border-slate-200 text-xs font-bold"
              value={formData.paymentMode}
              onChange={(e) => handleSelectOrCreate("paymentMode", e.target.value, paymentModes, setPaymentModes)}
            >
              {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
              <option value="ADD_NEW" className="text-indigo-600 font-black">+ Create New Mode</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Payment Terms</label>
            <select
              className="erp-input h-10 bg-white border-slate-200 text-xs font-bold"
              value={formData.paymentTerms}
              onChange={(e) => handleSelectOrCreate("paymentTerms", e.target.value, paymentTermsOptions, setPaymentTermsOptions)}
            >
              {paymentTermsOptions.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="ADD_NEW" className="text-indigo-600 font-black">+ Create New Terms</option>
            </select>
          </div>

          <div className="pt-2 mt-2 border-t border-border/50">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${formData.isIgst ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>
                {formData.isIgst && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={formData.isIgst}
                onChange={(e) => setFormData(prev => ({ ...prev, isIgst: e.target.checked }))}
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Inter-State Sale (Apply IGST)</span>
            </label>
            <p className="text-[9px] text-slate-500 font-bold ml-6 mt-0.5">Toggle to apply IGST instead of CGST + SGST</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Actual Due Date</label>
            <input
              type="date"
              className="erp-input h-10 bg-white border-slate-200 text-xs"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-secondary px-4 py-3 flex justify-between items-center">
          <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] ">Line Items Specification</h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-2 text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-4 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Product / Asset</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest w-24">Qty</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest w-32">Unit</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest w-32">Price</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest w-20">GST%</th>
                <th className="px-4 py-4 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest w-40">Total</th>
                <th className="px-4 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence initial={false}>
                {formData.items.map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <select
                        required
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 uppercase tracking-tight"
                        value={item.product}
                        onChange={(e) => handleItemChange(index, "product", e.target.value)}
                      >
                        <option value="">Select Asset...</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                      <div className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest px-1">SKU: {products.find(p => p._id === item.product)?.sku || "PENDING"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        className="w-full bg-slate-100 border-none rounded px-2 py-1.5 text-center text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <select
                        className="w-full bg-slate-50 border-none rounded px-2 py-1.5 text-center text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                      >
                        {unitsOptions.map(u => <option key={u} value={u}>{u}</option>)}
                        <option value="ADD_NEW" className="text-indigo-600">+ New</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">₹</span>
                        <input
                          type="number"
                          className="w-full bg-slate-100 border-none rounded pl-3 pr-2 py-1.5 text-center text-sm font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, "price", e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        className="w-12 bg-transparent border-none text-center text-xs font-bold text-slate-600 focus:ring-0"
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(index, "gstRate", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-black text-slate-900 tabular-nums">₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button type="button" onClick={() => handleRemoveItem(index)} className="text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Notes & T&C</h3>
          </div>
          <textarea
            className="erp-input min-h-[100px] bg-muted/10 border-border focus:bg-card text-xs p-4 resize-none"
            placeholder="Add any specific instructions or terms..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        <div className="md:col-span-5">
          <div className="bg-secondary rounded-xl p-4 text-foreground space-y-4 shadow-xl border border-border/50">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-border/10">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Subtotal</span>
                <span className="text-xs font-black tabular-nums">₹{totals.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/10">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tax (GST)</span>
                <span className="text-xs font-black text-emerald-500 tabular-nums">+₹{totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Grand Total</span>
                <div className="text-2xl font-black  tracking-tighter tabular-nums text-foreground">
                  <span className="text-sm font-normal not- text-indigo-500 mr-1">₹</span>
                  {totals.grand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Controls */}
      <div className="flex gap-4 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border rounded-lg"
        >
          Discard
        </button>
        <div className="flex-1"></div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-3 bg-secondary text-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-muted active:scale-95 transition-all flex items-center gap-3 shadow-lg border border-border"
        >
          {loading ? "..." : <><Save className="w-3.5 h-3.5" /> Save Draft</>}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-10 py-3 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3 shadow-lg shadow-indigo-500/20"
        >
          {loading ? "..." : <><Send className="w-3.5 h-3.5" /> Finalize</>}
        </button>
      </div>
    </form>
  );
};

export default BillingForm;

