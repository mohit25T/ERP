import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import { orderApi } from "../api/erpApi";
import { useAuth } from "../context/AuthContext";
import { 
  FileText, 
  Search, 
  Printer, 
  Download, 
  Filter, 
  Calendar, 
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Receipt
} from "lucide-react";

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

const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getAll();
      // Only show orders that have been officially "Billed" or progressed past billing
      const billedOrders = res.data.filter(o => ["invoiced", "shipped", "completed"].includes(o.status));
      setInvoices(billedOrders);
    } catch (err) {
      console.error("Billing fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

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

  const filteredInvoices = invoices.filter(inv => 
    inv.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBilled = filteredInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalTax = filteredInvoices.reduce((acc, curr) => acc + curr.gstAmount, 0);

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="p-4 bg-gray-900 rounded-[2rem] shadow-xl shadow-gray-200">
                <Receipt className="w-8 h-8 text-white" />
             </div>
             <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Billing Hub</h2>
                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                   <ShieldCheck className="w-3 h-3 text-blue-500" />
                   GST Compliance & Tax Invoice Management
                </p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  className="pl-12 pr-4 py-3 bg-white border border-gray-100 shadow-sm rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 w-64 transition-all" 
                  placeholder="Search Invoice # or Party..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors">
                <Filter className="w-5 h-5 text-gray-400" />
             </button>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                     <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Monthly sales</span>
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Billed Volume</p>
               <h3 className="text-3xl font-black text-gray-900 mt-1">₹{totalBilled.toLocaleString('en-IN')}</h3>
               <div className="mt-4 flex items-center gap-2 text-green-600 font-bold text-xs">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Gross Sales Record</span>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                     <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Tax Overview</span>
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total GST Liability</p>
               <h3 className="text-3xl font-black text-gray-900 mt-1">₹{totalTax.toLocaleString('en-IN')}</h3>
               <p className="mt-4 text-xs font-bold text-gray-500 italic uppercase tracking-tighter">Derived from {filteredInvoices.length} Invoices</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-500/20 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="p-3 bg-white/10 rounded-2xl w-fit mb-4 backdrop-blur-md">
                     <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest opacity-70">Next GSTR-1 Deadline</p>
                  <h3 className="text-3xl font-black mt-1 tracking-tighter">11th Next Month</h3>
                  <button className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">Download GSTR Data</button>
               </div>
               <FileText className="absolute bottom-[-20px] right-[-20px] w-40 h-40 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
            </div>
        </div>

        {/* Invoice List */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                 <FileText className="w-6 h-6 text-blue-600" />
                 Generated Tax Invoices
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                 <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                 Showing Last 50 Documents
              </div>
           </div>

           <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 text-center italic text-gray-400 animate-pulse uppercase tracking-widest font-black">Decrypting Billing Data...</div>
              ) : filteredInvoices.length === 0 ? (
                <div className="p-24 text-center">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-30">
                      <FileText className="w-10 h-10 text-gray-400" />
                   </div>
                   <p className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">No Documents Found</p>
                   <p className="text-gray-400 font-medium text-xs mt-1">Try creating a Sales Order first.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                         <th className="px-8 py-4">Invoice No</th>
                         <th className="px-8 py-4">Party Details</th>
                         <th className="px-8 py-4">Taxable Amt</th>
                         <th className="px-8 py-4">GST Amt</th>
                         <th className="px-8 py-4">Bill Amount</th>
                         <th className="px-8 py-4">Status</th>
                         <th className="px-8 py-4 text-right pr-12">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {filteredInvoices.map((inv) => (
                        <tr key={inv._id} className="group hover:bg-gray-50/80 transition-all duration-300">
                           <td className="px-8 py-6">
                              <div className="flex flex-col">
                                 <span className="text-xs font-black text-gray-900">BT/{inv._id.substring(inv._id.length - 6).toUpperCase()}</span>
                                 <span className="text-[10px] font-bold text-gray-400">{new Date(inv.createdAt).toLocaleDateString('en-GB')}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex flex-col">
                                 <span className="text-sm font-black text-gray-900 uppercase tracking-tighter italic">{inv.customer?.company || inv.customer?.name}</span>
                                 <span className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    {inv.customerGstin || "Unregistered"}
                                 </span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-sm font-bold text-gray-600 tracking-tight">₹{inv.taxableAmount.toLocaleString('en-IN')}</span>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-sm font-black text-blue-600 tracking-tight">₹{inv.gstAmount.toLocaleString('en-IN')}</span>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-lg font-black text-gray-900 tracking-tighter tabular-nums">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                           </td>
                           <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                 {inv.paymentStatus === 'paid' ? 'Settled' : 'Unpaid'}
                              </span>
                           </td>
                           <td className="px-8 py-6 text-right pr-12">
                              <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                   onClick={() => handlePrintInvoice(inv)}
                                   className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-colors shadow-lg shadow-gray-200 active:scale-95"
                                   title="Print Invoice"
                                 >
                                    <Printer className="w-4 h-4" />
                                 </button>
                                 <button className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm active:scale-95" title="Download JSON/Data">
                                    <Download className="w-4 h-4 text-gray-400" />
                                 </button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              )}
           </div>
        </div>

      </div>
    </AppLayout>
  );
};

export default Billing;
