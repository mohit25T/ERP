import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/common/Modal";
import OrderForm from "../components/forms/OrderForm";
import { orderApi, paymentApi } from "../api/erpApi";
import { useAuth } from "../context/AuthContext";
import { Plus, Clock, Search, CheckCircle, PackageSearch, ShoppingCart, TrendingUp, X, Wallet, CreditCard, AlertCircle, History, Trash2 } from "lucide-react";

// 🏦 NUMBER TO WORDS UTILITY (Indian Number System)
const numberToWords = (num) => {
  if (num === 0) return "Zero Only";
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? "and " + convert(n % 100) : "");
    return "";
  };

  const formatAmount = (n) => {
    let str = "";
    if (n >= 10000000) {
      str += convert(Math.floor(n / 10000000)) + "Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      str += convert(Math.floor(n / 100000)) + "Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      str += convert(Math.floor(n / 1000)) + "Thousand ";
      n %= 1000;
    }
    str += convert(n);
    return str;
  };

  const whole = Math.floor(num);
  const fraction = Math.round((num - whole) * 100);
  
  let result = formatAmount(whole) + "Rupees ";
  if (fraction > 0) {
    result += "and " + formatAmount(fraction) + "Paise ";
  }
  return result + "Only";
};

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

    const gstPercent = order.taxableAmount > 0 ? Math.round((order.gstAmount / order.taxableAmount) * 100) : 18;
    const totalInWords = numberToWords(order.totalAmount);
    const gstInWords = numberToWords(order.gstAmount);

    const html = `
      <html>
        <head>
          <title>Tax Invoice - ${order._id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 10mm; }
            @media print {
              .no-print { display: none !important; }
              body { -webkit-print-color-adjust: exact; }
            }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #000; background: #fff; }
            .miracle-font { font-family: 'Crimson Pro', serif; }
            .bordered { border: 1px solid #000; }
            .border-b { border-bottom: 1px solid #000; }
            .border-t { border-top: 1px solid #000; }
            .border-r { border-right: 1px solid #000; }
            .border-l { border-left: 1px solid #000; }
            .bg-grey { background-color: #f2f2f2 !important; }
            table { border-collapse: collapse; }
            th, td { border: 1px solid #000; }
          </style>
        </head>
        <body class="p-2">
          <div class="max-w-[800px] mx-auto bordered">
            
            <!-- HEADER -->
            <div class="text-center p-2 border-b">
               <h1 class="text-3xl font-black miracle-font uppercase tracking-tight">${user?.companyName || 'BAJRANG INDUSTRIES'}</h1>
               <p class="text-[11px] font-bold leading-tight miracle-font">
                 ${user?.address || 'Kabirvan Society Main Road, Sadguru Society, Nr. Manek Para, Rajkot 360 003'}<br/>
                 PH: ${user?.phone || '0281 2706086'}, MO. ${user?.mobile || '+91 94262 47805'} Email ID: ${user?.email || 'bajrangindustries1805@gmail.com'}
               </p>
            </div>

            <!-- IRN INFORMATION GRID -->
            <div class="grid grid-cols-12 border-b text-[10px] min-h-[50px]">
               <div class="col-span-10 border-r">
                  <div class="grid grid-rows-3 h-full">
                     <div class="p-1 border-b flex items-center gap-2">
                        <span class="font-bold w-20">IRN No.:</span>
                        <span class="font-medium"></span>
                     </div>
                     <div class="p-1 border-b flex items-center gap-2">
                        <span class="font-bold w-20">Ack No.:</span>
                        <span class="font-medium"></span>
                     </div>
                     <div class="p-1 flex items-center gap-2">
                        <span class="font-bold w-20">Ack Date:</span>
                        <span class="font-medium">/ / &nbsp;&nbsp;&nbsp;&nbsp; : &nbsp;&nbsp; AM</span>
                     </div>
                  </div>
               </div>
               <div class="col-span-2"></div>
            </div>

            <!-- DOCUMENT TITLE -->
            <div class="grid grid-cols-12 border-b text-[11px] font-bold text-center bg-grey uppercase py-0.5">
               <div class="col-span-3 text-left pl-2 italic">Debit Memo</div>
               <div class="col-span-6 text-base font-black miracle-font tracking-widest">TAX INVOICE</div>
               <div class="col-span-3 text-right pr-2 italic">Original</div>
            </div>

            <!-- PARTY & INVOICE DETAILS SPLIT -->
            <div class="grid grid-cols-2 border-b min-h-[160px]">
               <!-- LEFT: RECIPIENT -->
               <div class="p-2 border-r space-y-1">
                  <div class="flex items-start gap-1">
                     <span class="text-[11px] font-bold miracle-font">M/s. :</span>
                     <div class="flex-1">
                        <h2 class="text-sm font-black miracle-font uppercase leading-tight">${order.customer?.company || order.customer?.name}</h2>
                        <p class="text-[10px] font-bold uppercase leading-tight mt-1">
                           ${order.customer?.address || ''}<br/>
                           ${order.customer?.city || ''} ${order.customer?.state || ''}
                        </p>
                     </div>
                  </div>
                  <div class="pt-4 space-y-1 text-[11px] uppercase">
                     <div class="flex font-black italic"><span class="w-32">RAJKOT - ${order.customer?.pincode || '360021'}</span></div>
                     <div class="flex font-bold"><span class="w-32">Place of Supply :</span><span>${order.customer?.state || '24-Gujarat'}</span></div>
                     <div class="flex font-black"><span class="w-32">GSTIN No. :</span><span>${order.customerGstin || '----------------'}</span></div>
                  </div>
               </div>
               <!-- RIGHT: INVOICE META -->
               <div class="grid grid-cols-1 divide-y">
                  <div class="grid grid-cols-2 divide-x">
                     <div class="p-2">
                        <p class="text-[9px] font-bold text-gray-500 uppercase">Invoice No. :</p>
                        <p class="text-xs font-black miracle-font tracking-wider">BT/${order._id.substring(order._id.length - 4).toUpperCase()}</p>
                     </div>
                     <div class="p-2">
                        <p class="text-[9px] font-bold text-gray-500 uppercase">Date :</p>
                        <p class="text-xs font-black miracle-font tracking-wider">${new Date(order.createdAt).toLocaleDateString('en-GB')}</p>
                     </div>
                  </div>
                  <div class="p-2 text-[10px] font-bold uppercase space-y-1 italic">
                     <div class="grid grid-cols-[80px,1fr]"><span>Transport</span><span>: ${order.ewayBillData?.transport || '.'}</span></div>
                     <div class="grid grid-cols-[80px,1fr]"><span>L.R. No.</span><span>: ${order.ewayBillData?.lrNo || '.'}</span></div>
                     <div class="grid grid-cols-[80px,1fr]"><span>L.R. Date</span><span>: ${order.ewayBillData?.lrDate || '/ /'}</span></div>
                     <div class="grid grid-cols-[80px,1fr]"><span>Vehicle No.</span><span>: ${order.ewayBillData?.vehicleNo || ''}</span></div>
                  </div>
               </div>
            </div>

            <!-- PRODUCT GRID -->
            <div class="min-h-[480px]">
               <table class="w-full text-center border-none">
                  <thead class="bg-grey text-[10px] font-black uppercase">
                     <tr>
                        <th class="py-1.5 w-10">SrNo</th>
                        <th class="py-1.5 text-left px-4">Description</th>
                        <th class="py-1.5 w-16">HSN/SAC</th>
                        <th class="py-1.5 w-20">Qty</th>
                        <th class="py-1.5 w-12">Unit</th>
                        <th class="py-1.5 w-20">Rate</th>
                        <th class="py-1.5 w-14">GST %</th>
                        <th class="py-1.5 w-24">Amount</th>
                     </tr>
                  </thead>
                  <tbody class="text-[11px] font-black uppercase miracle-font">
                     <tr class="align-top h-[450px]">
                        <td class="pt-2 italic">1</td>
                        <td class="pt-2 text-left px-4 border-l-0">
                           <div class="font-black italic text-sm mb-1">${order.product?.name}</div>
                        </td>
                        <td class="pt-2">${order.hsnCode || '7204'}</td>
                        <td class="pt-2">${order.quantity?.toFixed(3)}</td>
                        <td class="pt-2 italic">${order.unit || order.product?.unit || 'kg'}</td>
                        <td class="pt-2">${order.product?.price?.toFixed(2)}</td>
                        <td class="pt-2">${gstPercent?.toFixed(2)}</td>
                        <td class="pt-2 text-right pr-2">${order.taxableAmount?.toFixed(2)}</td>
                     </tr>
                  </tbody>
               </table>
            </div>

            <!-- TOTAL SUMMARY BAR -->
            <div class="grid grid-cols-[1fr,240px] border-t bg-grey text-[11px] font-black uppercase py-0.5">
               <div class="flex justify-between px-4 border-r">
                  <span>GSTIN No.: ${user?.gstin || '24AEMPT6309K1Z1'}</span>
                  <span class="italic">${order.quantity?.toFixed(3)}</span>
               </div>
               <div class="flex justify-between px-4">
                  <span class="italic">Sub Total</span>
                  <span class="text-right">${order.taxableAmount?.toFixed(2)}</span>
               </div>
            </div>

            <!-- FOOTER: BANK & FINANCIALS -->
            <div class="grid grid-cols-[1.2fr,1fr] text-[10px] border-t">
               <!-- LEFT SECTION -->
               <div class="p-2 border-r space-y-4">
                  <div class="grid grid-cols-[100px,1fr] font-bold uppercase gap-y-0.5">
                     <span class="text-gray-500">Bank Name</span><span class="font-black">: ${user?.bankDetails?.bankName || 'ICICI BANK'}</span>
                     <span class="text-gray-500">Branch Name</span><span class="font-black">: ${user?.bankDetails?.branchName || 'PEDAK ROAD NR.PANI NO GHODO'}</span>
                     <span class="text-gray-500">Bank A/c. No.</span><span class="font-black">: ${user?.bankDetails?.accountNumber || '239605501476'}</span>
                     <span class="text-gray-500">RTGS/IFSC Code</span><span class="font-black">: ${user?.bankDetails?.ifscCode || 'ICIC0002396'}</span>
                  </div>

                  <div class="space-y-2 border-t pt-2">
                     <div class="flex items-start gap-2 italic">
                        <span class="font-black min-w-[100px] uppercase">Total GST :</span>
                        <span class="font-black uppercase tracking-tighter">${gstInWords}</span>
                     </div>
                     <div class="flex items-start gap-2 italic">
                        <span class="font-black min-w-[100px] uppercase">Bill Amount :</span>
                        <span class="font-black uppercase tracking-tighter">${totalInWords}</span>
                     </div>
                  </div>

                  <div class="space-y-1 text-[9px] font-bold uppercase italic mt-4">
                     <p class="font-black border-b w-fit mb-1">Note :</p>
                     <p class="font-black border-b w-fit mb-4">Terms & Condition :</p>
                     <ol class="list-decimal pl-4 space-y-0.5">
                        <li>Goods once sold will not be taken back.</li>
                        <li>Interest @18% p.a. will be charged if payment is not made within due date.</li>
                        <li>Our risk and responsibility ceases as soon as the goods leave our premises.</li>
                        <li>"Subject to Rajkot" Jurisdiction only. E.&O.E.</li>
                     </ol>
                  </div>
               </div>

               <!-- RIGHT SECTION -->
               <div class="p-2 flex flex-col justify-between">
                  <div class="space-y-1 border-b pb-2">
                     <div class="flex justify-between text-[11px] font-black miracle-font italic">
                        <span>Taxable Amount</span>
                        <span>${order.taxableAmount?.toFixed(2)}</span>
                     </div>
                     ${order.cgst > 0 ? `
                        <div class="flex justify-between text-gray-500 font-bold">
                           <span>CGST (${(gstPercent / 2).toFixed(2)}%)</span>
                           <span>${order.cgst?.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between text-gray-500 font-bold">
                           <span>SGST (${(gstPercent / 2).toFixed(2)}%)</span>
                           <span>${order.sgst?.toFixed(2)}</span>
                        </div>
                     ` : `
                        <div class="flex justify-between text-gray-500 font-bold">
                           <span>IGST (${gstPercent?.toFixed(2)}%)</span>
                           <span>${order.igst?.toFixed(2)}</span>
                        </div>
                     `}
                  </div>

                  <div class="flex justify-between items-center bg-grey p-2 border border-black mt-2">
                     <span class="text-sm font-black italic uppercase miracle-font">Grand Total</span>
                     <span class="text-xl font-black miracle-font">${order.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div class="mt-8 text-center space-y-6">
                     <p class="text-[10px] font-black uppercase italic miracle-font">For, ${user?.companyName || 'BAJRANG INDUSTRIES'}</p>
                     <div class="h-10"></div>
                     <p class="text-[9px] font-bold uppercase tracking-widest">(Authorised Signatory)</p>
                  </div>
               </div>
            </div>
          </div>

          <div class="fixed bottom-10 right-10 no-print">
            <button onclick="window.print()" class="bg-black text-white px-10 py-3.5 rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase text-xs tracking-widest">
              Generated System Invoice
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
      case "invoiced":
        return { color: "bg-purple-100 text-purple-800", label: "Invoiced", icon: <FileText className="w-3 h-3 mr-1" /> };
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

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-10 w-full max-w-full">
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
                  <th className="px-4 py-3">Ref ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Logistics</th>
                  <th className="px-4 py-3 ">Financials</th>
                  <th className="px-4 py-3 text-center">Payment</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => {
                  const statusOpts = getStatusBadgeOptions(o.status);
                  return (
                    <tr key={o._id} className="hover:bg-gray-50/80 transition-all group">
                      <td className="px-4 py-4">
                        <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          #{o._id.substring(o._id.length - 6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{o.customer?.name || "Unassigned"}</span>
                          <span className="text-[10px] text-gray-400 font-medium uppercase">{o.customer?.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-600 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          {o.product?.name} (x{o.quantity})
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 tracking-tight">₹{o.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          <div className="flex justify-between items-center mt-1">
                             <span className="text-[10px] text-gray-400 font-bold uppercase">Paid: ₹{o.amountPaid?.toLocaleString('en-IN')}</span>
                             <span className="text-[9px] text-blue-500 font-black uppercase ml-2 tracking-tighter">GST: ₹{o.gstAmount?.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${o.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
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
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${statusOpts.color}`}>
                          {statusOpts.icon && <span className="mr-1.5 opacity-70">{statusOpts.icon}</span>}
                          {statusOpts.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-nowrap justify-end gap-2 whitespace-nowrap">
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
                            <button onClick={() => handleStatusUpdate(o._id, 'invoiced')} className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition" title="Generate Invoice">
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          {o.status === 'invoiced' && (
                            <button onClick={() => handleStatusUpdate(o._id, 'shipped')} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition" title="Mark Shipped">
                              <TrendingUp className="w-4 h-4" />
                            </button>
                          )}
                          {(o.status === 'in_progress' || o.status === 'invoiced' || o.status === 'shipped') && (
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
