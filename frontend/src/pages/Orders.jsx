import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/common/Modal";
import OrderForm from "../components/forms/OrderForm";
import { orderApi, paymentApi } from "../api/erpApi";
import { useAuth } from "../context/AuthContext";
import { Plus, Clock, Search, CheckCircle, PackageSearch, ShoppingCart, TrendingUp, X, Wallet, CreditCard, AlertCircle, History, Trash2 } from "lucide-react";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentPercent, setPaymentPercent] = useState("");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getAll();
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSubmit = async (data) => {
    try {
      setFormLoading(true);
      await orderApi.create(data);
      setIsModalOpen(false);
      fetchOrders();
    } catch (err) {
      alert("Error creating order: " + (err.response?.data?.msg || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    try {
      const outstanding = selectedOrder.totalAmount - selectedOrder.amountPaid;
      if (Number(paymentAmount) > outstanding) {
        alert(`Error: Amount (₹${paymentAmount}) exceeds the outstanding balance (₹${outstanding}).`);
        return;
      }
      setFormLoading(true);
      await paymentApi.addOrderPayment(selectedOrder._id, {
        amount: Number(paymentAmount),
        date: paymentDate,
        description: paymentNote
      });
      setIsPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentPercent("");
      setPaymentNote("");
      fetchOrders();
    } catch (err) {
      alert("Payment failed: " + (err.response?.data?.msg || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const fetchPaymentHistory = async (orderId) => {
    try {
      setFormLoading(true);
      const res = await paymentApi.getHistory("order", orderId);
      const order = orders.find(o => o._id === orderId);
      
      // Build Unified Journey Timeline
      const events = [
        // 1. Birth: Order Placed
        { 
          _id: "birth", 
          date: order.createdAt, 
          type: 'milestone', 
          amount: order.totalAmount,
          description: "Order Placed - Commercial Journey Initialized" 
        },
        // 2. Pulse: Payments
        ...res.data.map(p => ({ ...p, type: 'payment' }))
      ];

      // 3. Seal: Fulfillment (if complete)
      if (order.status === 'completed') {
        events.push({
          _id: "completion",
          date: order.updatedAt,
          type: 'milestone',
          amount: 0,
          description: "Full Fulfillment - Logistics Closed"
        });
      }

      // Sort Chronologically
      events.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setPaymentHistory(events);
      setIsHistoryModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch transaction timeline");
    } finally {
      setFormLoading(false);
    }
  };

  const handlePercentChange = (percent) => {
    setPaymentPercent(percent);
    if (selectedOrder && percent) {
      const outstanding = selectedOrder.totalAmount - (selectedOrder.amountPaid || 0);
      const amount = (outstanding * (Number(percent) / 100)).toFixed(2);
      setPaymentAmount(amount);
    }
  };

  const { user } = useAuth();

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await orderApi.updateStatus(id, newStatus);
      fetchOrders();
    } catch (err) {
      alert("Status update failed: " + (err.response?.data?.msg || err.message));
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm("CRITICAL: Delete this order permanently? This will restore product stock if the order was active.")) {
      try {
        await orderApi.delete(id);
        fetchOrders();
      } catch (err) {
        alert("Deletion Blocked: " + (err.response?.data?.msg || err.message));
      }
    }
  };

  const handlePrintInvoice = (order) => {
    const printWindow = window.open("", "_blank");
    const date = new Date(order.createdAt).toLocaleDateString();

    const settings = user?.invoiceSettings?.columns || {};
    const legacy = user?.invoiceSettings?.headers || {};
    
    // Helper to safely get visibility and label
    const getCol = (key, legacyHeader, defaultLabel) => ({
      show: settings[key]?.show ?? true,
      label: settings[key]?.label || legacy[key] || defaultLabel
    });

    const cProduct = getCol('product', legacy.product, 'Product Details / HSN');
    const cPrice = getCol('price', legacy.price, 'Unit Price');
    const cQty = getCol('quantity', legacy.quantity, 'Qty');
    const cTaxable = getCol('taxable', legacy.taxable, 'Taxable Val.');
    const cAmount = getCol('amount', legacy.amount, 'Net Amount');
    
    const html = `
      <html>
        <head>
          <title>Tax Invoice - ${order._id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: auto;  margin: 0mm; }
            @media print {
              .no-print { display: none !important; }
              html, body { height: 100%; margin: 0 !important; padding: 0 !important; overflow: hidden; }
              body { padding: 1cm !important; }
            }
          </style>
        </head>
        <body class="p-6 font-sans tracking-tight">
          <div class="max-w-4xl mx-auto border-2 border-gray-100 p-8 rounded-3xl shadow-sm bg-white" style="page-break-inside: avoid;">
            <div class="flex justify-between items-start mb-6 border-b border-gray-50 pb-6">
              <div>
                <h1 class="text-3xl font-black text-blue-600 mb-1 uppercase italic">${user?.companyName || 'NEXUS ERP SYSTEMS'}</h1>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Registered Address:</p>
                <p class="text-[10px] font-bold text-gray-600 max-w-xs uppercase leading-normal">${user?.address || 'Corporate Park, Phase II, New Delhi'}</p>
                <div class="mt-2 inline-block px-2 py-0.5 bg-blue-50 rounded-lg">
                   <p class="text-[9px] font-black text-blue-600 uppercase tracking-tighter">GSTIN: ${user?.gstin || 'NOT REGISTERED'}</p>
                </div>
              </div>
              <div class="text-right">
                <h2 class="text-2xl font-black text-gray-900 mb-1 underline decoration-blue-600 underline-offset-4 decoration-4">TAX INVOICE</h2>
                <div class="space-y-0.5">
                   <p class="text-gray-400 text-[9px] font-black uppercase">Invoice Reference</p>
                   <p class="text-gray-900 font-black text-base">#ORD-${order._id.substring(order._id.length - 6).toUpperCase()}</p>
                </div>
                <p class="text-gray-500 font-bold text-xs mt-1">${date}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <div>
                <p class="text-[9px] font-black uppercase text-blue-400 mb-2 tracking-widest">Billed To</p>
                <p class="font-black text-gray-900 text-lg">${order.customer?.name}</p>
                <p class="text-gray-500 font-semibold text-xs mb-0.5">${order.customer?.company || 'Personal Account'}</p>
                <p class="text-gray-400 text-[10px] font-bold uppercase">${order.customer?.state || 'Unknown State'}</p>
                ${order.customerGstin ? `<p class="text-[9px] font-black text-blue-600 mt-1 uppercase">GSTIN: ${order.customerGstin}</p>` : ''}
              </div>
              <div class="text-right">
                   <p class="text-[9px] font-black uppercase text-blue-400 mb-2 tracking-widest">Fulfillment Status</p>
                   <p class="font-black text-blue-600 uppercase text-xs italic tracking-widest">${order.status.toUpperCase()}</p>
              </div>
            </div>

            <table class="w-full mb-6 relative">
              <thead>
                <tr class="border-b-2 border-gray-900 text-left text-[9px] font-black uppercase text-gray-900 tracking-widest">
                  ${cProduct.show ? `<th class="pb-3">${cProduct.label}</th>` : ''}
                  ${cPrice.show ? `<th class="pb-3 text-center">${cPrice.label}</th>` : ''}
                  ${cQty.show ? `<th class="pb-3 text-center">${cQty.label}</th>` : ''}
                  ${cTaxable.show ? `<th class="pb-3 text-center">${cTaxable.label}</th>` : ''}
                  ${cAmount.show ? `<th class="pb-3 text-right">${cAmount.label}</th>` : ''}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 italic font-medium">
                <tr>
                  ${cProduct.show ? `
                  <td class="py-4">
                     <p class="font-black text-gray-900 text-sm">${order.product?.name}</p>
                     <p class="text-[9px] text-gray-400 font-bold uppercase mt-0.5">HSN: ${order.hsnCode || 'N/A'}</p>
                  </td>` : ''}
                  ${cPrice.show ? `<td class="py-4 text-center text-gray-600 font-bold text-xs">₹${order.product?.price?.toFixed(2)}</td>` : ''}
                  ${cQty.show ? `<td class="py-4 text-center text-gray-900 font-black text-xs">${order.quantity}</td>` : ''}
                  ${cTaxable.show ? `<td class="py-4 text-center text-gray-600 font-bold text-xs">₹${order.taxableAmount?.toFixed(2)}</td>` : ''}
                  ${cAmount.show ? `<td class="py-4 text-right font-black text-gray-900 text-base">₹${order.totalAmount?.toFixed(2)}</td>` : ''}
                </tr>
              </tbody>
            </table>

            <div class="flex flex-col items-end border-t-2 border-gray-900 pt-4">
              <div class="w-full max-w-[240px] space-y-2">
                <div class="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span>Gross Taxable Value</span>
                  <span>₹${order.taxableAmount?.toFixed(2)}</span>
                </div>
                
                ${order.cgst > 0 ? `
                <div class="flex justify-between text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  <span>CGST Output</span>
                  <span>₹${order.cgst?.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  <span>SGST Output</span>
                  <span>₹${order.sgst?.toFixed(2)}</span>
                </div>
                ` : `
                <div class="flex justify-between text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                  <span>IGST Output</span>
                  <span>₹${order.igst?.toFixed(2)}</span>
                </div>
                `}

                <div class="flex justify-between text-xl font-black pt-4 border-t-2 border-gray-100 mt-2">
                  <span class="text-gray-900 uppercase italic text-2xl tracking-tighter">Grand Total</span>
                  <span class="text-blue-700 text-2xl">₹${order.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="mt-12 pt-6 border-t border-gray-100 flex justify-between items-end">
               <div class="text-left space-y-2 max-w-sm">
                  <p class="text-[8px] font-black text-gray-300 uppercase leading-tight tracking-tighter">${user?.invoiceSettings?.footerText || 'Certified that the particulars given above are true and correct. Taxes shown above are extra as applicable.'}</p>
                  <p class="text-[10px] font-bold text-gray-800 uppercase italic">Authorized Tax Invoice (Computer Generated)</p>
               </div>
               <div class="text-right">
                  <p class="text-[9px] font-black text-blue-600 uppercase mb-6">For ${user?.companyName || 'NEXUS ERP'}</p>
                  <p class="text-[8px] font-black uppercase text-gray-400">Authorized Signatory</p>
               </div>
            </div>
          </div>
          <div class="fixed bottom-10 right-10 no-print flex gap-4">
            <button onclick="window.print()" class="bg-blue-600 text-white px-10 py-3.5 rounded-2xl font-black shadow-2xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all uppercase text-xs tracking-widest">
              Print GST Bill (₹)
            </button>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const getStatusBadgeOptions = (status) => {
    switch (status) {
      case "pending":
        return { color: "bg-yellow-100 text-yellow-800", label: "Pending", icon: <Clock className="w-3 h-3 mr-1" /> };
      case "in_progress":
        return { color: "bg-blue-100 text-blue-800", label: "In Progress", icon: <PackageSearch className="w-3 h-3 mr-1" /> };
      case "shipped":
        return { color: "bg-indigo-100 text-indigo-800", label: "Shipped", icon: <TrendingUp className="w-3 h-3 mr-1" /> };
      case "completed":
        return { color: "bg-green-100 text-green-800", label: "Completed", icon: <CheckCircle className="w-3 h-3 mr-1" /> };
      case "cancelled":
        return { color: "bg-red-100 text-red-800", label: "Cancelled", icon: null };
      case "refunded":
        return { color: "bg-gray-100 text-gray-800", label: "Refunded", icon: null };
      default:
        return { color: "bg-gray-100 text-gray-800", label: "Unknown", icon: null };
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tighter italic">Order Management</h2>
          <p className="text-sm text-gray-500 mt-1">Track orders, manage fulfillment statuses, and generate invoices.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Order
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Order"
      >
        <OrderForm 
          onSubmit={handleSubmit} 
          onCancel={() => setIsModalOpen(false)} 
          loading={formLoading} 
        />
      </Modal>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-10 w-full max-w-full">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center w-full">
             <div className="relative w-full max-w-sm">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input
                     type="text"
                     placeholder="Search order ID or customer..."
                     className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                 />
             </div>
        </div>
        
        <div className="overflow-x-auto w-full max-w-full">
          {loading ? (
             <div className="p-12 text-center text-gray-400 italic">Processing orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart className="w-16 h-16 opacity-20 mb-4" />
              <p className="font-medium">No system orders found.</p>
            </div>
          ) : (
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                  <th className="px-8 py-4">Ref ID</th>
                  <th className="px-8 py-4">Customer</th>
                  <th className="px-8 py-4">Logistics</th>
                  <th className="px-8 py-4 ">Financials</th>
                  <th className="px-8 py-4 text-center">Payment</th>
                  <th className="px-8 py-4 text-center">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => {
                  const statusOpts = getStatusBadgeOptions(o.status);
                  return (
                    <tr key={o._id} className="hover:bg-gray-50/80 transition-all group">
                      <td className="px-8 py-6">
                         <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            #{o._id.substring(o._id.length - 6).toUpperCase()}
                         </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-gray-900">{o.customer?.name || "Unassigned"}</span>
                           <span className="text-[10px] text-gray-400 font-medium uppercase">{o.customer?.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-medium text-gray-600 text-sm">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                           {o.product?.name} (x{o.quantity})
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-900 tracking-tight">₹{o.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">Paid: ₹{o.amountPaid?.toLocaleString('en-IN')}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                          o.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 
                          o.paymentStatus === 'partial' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {o.paymentStatus}
                        </span>
                        <div className="w-16 h-1 bg-gray-100 rounded-full mt-2 mx-auto overflow-hidden">
                           <div 
                             className="h-full bg-blue-500 transition-all duration-500" 
                             style={{ width: `${Math.min((o.amountPaid / o.totalAmount) * 100, 100)}%` }}
                           ></div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${statusOpts.color}`}>
                          {statusOpts.icon && <span className="mr-1.5 opacity-70">{statusOpts.icon}</span>}
                          {statusOpts.label}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex justify-end gap-2">
                            {o.paymentStatus !== 'paid' && !['cancelled', 'refunded'].includes(o.status) && (
                              <button 
                                onClick={() => { setSelectedOrder(o); setIsPaymentModalOpen(true); }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition" 
                                title="Add Payment"
                              >
                                 <Wallet className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                               onClick={() => fetchPaymentHistory(o._id)}
                               className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition" 
                               title="Payment History"
                             >
                                <History className="w-4 h-4" />
                             </button>
                            {o.status === 'pending' && (
                              <button onClick={() => handleStatusUpdate(o._id, 'in_progress')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition" title="Start Progress">
                                 <PackageSearch className="w-4 h-4" />
                              </button>
                            )}
                            {o.status === 'in_progress' && (
                              <button onClick={() => handleStatusUpdate(o._id, 'shipped')} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition" title="Mark Shipped">
                                 <TrendingUp className="w-4 h-4" />
                              </button>
                            )}
                            {(o.status === 'in_progress' || o.status === 'shipped') && (
                              <button onClick={() => handleStatusUpdate(o._id, 'completed')} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition" title="Mark Completed">
                                 <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {!['completed', 'cancelled', 'refunded'].includes(o.status) && (
                              <button onClick={() => handleStatusUpdate(o._id, 'cancelled')} className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-xl transition" title="Cancel">
                                 <X className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleDeleteOrder(o._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition" title="Delete Order">
                               <Trash2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handlePrintInvoice(o)} className="px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-[10px] font-bold uppercase transition">
                               Invoice
                            </button>
                         </div>
                       </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modern Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentAmount("");
          setPaymentPercent("");
          setPaymentNote("");
        }}
        title="Record Customer Receipt"
      >
        <div className="p-6">
           {selectedOrder && (
             <div className="space-y-6">
                <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
                   <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2 text-center">Outstanding Balance</p>
                   <p className="text-4xl font-black text-gray-900 text-center tracking-tighter italic">₹{(selectedOrder.totalAmount - selectedOrder.amountPaid).toLocaleString('en-IN')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Amount (₹)</label>
                    <input 
                      type="number"
                      max={selectedOrder ? selectedOrder.totalAmount - selectedOrder.amountPaid : undefined}
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-lg font-black text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        const outstanding = selectedOrder.totalAmount - selectedOrder.amountPaid;
                        if (Number(val) > outstanding) {
                           setPaymentAmount(outstanding.toFixed(2));
                           setPaymentPercent("100");
                        } else {
                           setPaymentAmount(val);
                           setPaymentPercent("");
                        }
                      }}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Percent (%)</label>
                    <input 
                      type="number"
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-lg font-black text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
                      placeholder="%"
                      value={paymentPercent}
                      onChange={(e) => handlePercentChange(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Receipt Date</label>
                   <input 
                     type="date"
                     className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-xs font-black text-gray-900 outline-none hover:bg-gray-100 transition-colors"
                     value={paymentDate}
                     onChange={(e) => setPaymentDate(e.target.value)}
                   />
                </div>

                <div>
                   <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Internal Note</label>
                   <textarea 
                     className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold text-gray-900 outline-none h-20 resize-none placeholder:text-gray-300 focus:bg-white focus:ring-1 focus:ring-gray-100"
                     placeholder="e.g., Cash received / Bank ref #..."
                     value={paymentNote}
                     onChange={(e) => setPaymentNote(e.target.value)}
                   />
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                     onClick={() => setIsPaymentModalOpen(false)}
                     className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all font-bold"
                   >
                      Cancel
                   </button>
                   <button 
                     onClick={handleRecordPayment}
                     disabled={formLoading || !paymentAmount}
                     className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                      {formLoading ? "Saving..." : `Confirm ₹${Number(paymentAmount).toLocaleString()}`}
                   </button>
                </div>
             </div>
           )}
        </div>
      </Modal>

      {/* Payment History Modal */}
      <Modal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        title="Transaction Timeline"
      >
        <div className="p-8">
           {paymentHistory.length === 0 ? (
             <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No transaction history found</p>
             </div>
           ) : (
             <div className="relative border-l-4 border-gray-100 ml-6 space-y-10 py-2">
                {paymentHistory.map((item, idx) => {
                   const isMilestone = item.type === 'milestone';
                   return (
                      <div key={item._id} className="relative pl-10 group animate-in fade-in slide-in-from-left duration-300">
                         <div className={`absolute -left-[14px] top-0 w-6 h-6 bg-white border-4 rounded-full group-hover:scale-125 transition-transform shadow-sm ${isMilestone ? "border-indigo-600" : "border-emerald-500"}`}></div>
                         <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isMilestone ? "text-indigo-600" : "text-emerald-500"}`}>
                               {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} — {isMilestone ? 'Milestone' : 'Receipt'}
                            </p>
                            {isMilestone ? (
                               <h4 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">{item.description}</h4>
                            ) : (
                               <h4 className="text-2xl font-black text-gray-900 tracking-tighter tabular-nums">₹{item.amount.toLocaleString()}</h4>
                            )}
                            {!isMilestone && <p className="text-xs font-bold text-gray-400 mt-1 italic leading-relaxed">"{item.description || 'No notes provided'}"</p>}
                         </div>
                      </div>
                   );
                })}
             </div>
           )}
           <button 
             onClick={() => setIsHistoryModalOpen(false)}
             className="w-full mt-12 py-5 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black active:scale-95 transition-all shadow-xl shadow-gray-200"
           >Close History</button>
        </div>
      </Modal>
    </AppLayout>
  );
};

export default Orders;
