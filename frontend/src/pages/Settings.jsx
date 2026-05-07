import { useState, useEffect } from "react";
import {
   Bell, Lock, Building2, ShieldCheck, Activity, CreditCard, Layout,
   Settings as SettingsIcon, LogOut, Save, Shield, Upload, Database, Wallet,
   Image as ImageIcon, EyeOff, Eye, Trash2, Loader2, Boxes,
   Zap, Search, Truck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authApi, gstApi, complianceApi } from "../api/erpApi";
import AppLayout from "../components/layout/AppLayout";
import HammerLoader from "../components/common/HammerLoader";

const Settings = () => {
   const { user, logout, setUser } = useAuth();
   const [loading, setLoading] = useState(false);
   const [activeTab, setActiveTab] = useState("profile");

   const handleAccountingToggle = () => {
      setActiveModules({ ...activeModules, accounting: !activeModules.accounting });
   };

   const [profileData, setProfileData] = useState({
      name: user?.name || "",
      companyName: user?.companyName || "",
      gstin: user?.gstin || "",
      pan: user?.pan || ((user?.gstin)?.length >= 12 ? (user?.gstin).substring(2, 12) : ""),
      address: user?.address || "",
      state: user?.state || "",
      pincode: user?.pincode || "",
      companyLogo: user?.companyLogo || "",
   });

   const [bankDetails, setBankDetails] = useState({
      bankName: user?.bankDetails?.bankName || "",
      branchName: user?.bankDetails?.branchName || "",
      accountNumber: user?.bankDetails?.accountNumber || "",
      ifscCode: user?.bankDetails?.ifscCode || ""
   });

   const getDefaultContent = (val, def) => (val === def || !val) ? "" : val;

   const [invoiceSettings, setInvoiceSettings] = useState({
      columns: {
         product: {
            label: (getDefaultContent(user?.invoiceSettings?.columns?.product?.label ?? user?.invoiceSettings?.headers?.product, "Product Details") === "Product Details / HSN") ? "Product Details" : getDefaultContent(user?.invoiceSettings?.columns?.product?.label ?? user?.invoiceSettings?.headers?.product, "Product Details"),
            show: user?.invoiceSettings?.columns?.product?.show ?? true
         },
         hsn: {
            label: getDefaultContent(user?.invoiceSettings?.columns?.hsn?.label ?? user?.invoiceSettings?.headers?.hsn, "HSN/SAC"),
            show: user?.invoiceSettings?.columns?.hsn?.show ?? true
         },
         quantity: {
            label: getDefaultContent(user?.invoiceSettings?.columns?.quantity?.label ?? user?.invoiceSettings?.headers?.quantity, "Qty"),
            show: user?.invoiceSettings?.columns?.quantity?.show ?? true
         },
         price: {
            label: getDefaultContent(user?.invoiceSettings?.columns?.price?.label ?? user?.invoiceSettings?.headers?.price, "Unit Price"),
            show: user?.invoiceSettings?.columns?.price?.show ?? true
         },
         taxable: {
            label: getDefaultContent(user?.invoiceSettings?.columns?.taxable?.label ?? user?.invoiceSettings?.headers?.taxable, "Taxable Val."),
            show: user?.invoiceSettings?.columns?.taxable?.show ?? true
         },
         amount: {
            label: getDefaultContent(user?.invoiceSettings?.columns?.amount?.label ?? user?.invoiceSettings?.headers?.amount, "Net Amount"),
            show: user?.invoiceSettings?.columns?.amount?.show ?? true
         }
      },
      showLogo: user?.invoiceSettings?.showLogo ?? true,
      footerText: getDefaultContent(user?.invoiceSettings?.footerText, "Certified that the particulars given above are true and correct. Taxes shown above are extra as applicable."),
   });

   const [passwordData, setPasswordData] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
   });
   const [showPasswords, setShowPasswords] = useState({
      current: false,
      new: false,
      confirm: false,
      financial: false,
   });

   const [notificationSettings, setNotificationSettings] = useState({
      channelEmail: user?.notificationSettings?.channelEmail ?? true
   });

   const [activeModules, setActiveModules] = useState({
      erp: user?.activeModules?.erp ?? true,
      accounting: user?.activeModules?.accounting ?? true
   });

   useEffect(() => {
      const fetchGlobalProfile = async () => {
         try {
            const res = await authApi.getCompanyProfile();
            const globalData = res.data;
            setProfileData(prev => ({
               ...prev,
               companyName: globalData.companyName || "",
               gstin: globalData.gstin || "",
               pan: globalData.pan || ((globalData.gstin)?.length >= 12 ? (globalData.gstin).substring(2, 12) : ""),
               address: globalData.address || "",
               state: globalData.state || "",
               pincode: globalData.pincode || "",
               companyLogo: globalData.companyLogo || "",
            }));
            if (globalData.bankDetails) {
               setBankDetails({
                  bankName: globalData.bankDetails.bankName || "",
                  branchName: globalData.bankDetails.branchName || "",
                  accountNumber: globalData.bankDetails.accountNumber || "",
                  ifscCode: globalData.bankDetails.ifscCode || ""
               });
            }
            if (globalData.invoiceSettings) {
               setInvoiceSettings({
                  columns: {
                     product: { label: globalData.invoiceSettings.columns?.product?.label || "Product Details", show: globalData.invoiceSettings.columns?.product?.show ?? true },
                     hsn: { label: globalData.invoiceSettings.columns?.hsn?.label || "HSN/SAC", show: globalData.invoiceSettings.columns?.hsn?.show ?? true },
                     quantity: { label: globalData.invoiceSettings.columns?.quantity?.label || "Qty", show: globalData.invoiceSettings.columns?.quantity?.show ?? true },
                     price: { label: globalData.invoiceSettings.columns?.price?.label || "Unit Price", show: globalData.invoiceSettings.columns?.price?.show ?? true },
                     taxable: { label: globalData.invoiceSettings.columns?.taxable?.label || "Taxable Val.", show: globalData.invoiceSettings.columns?.taxable?.show ?? true },
                     amount: { label: globalData.invoiceSettings.columns?.amount?.label || "Net Amount", show: globalData.invoiceSettings.columns?.amount?.show ?? true }
                  },
                  footerText: globalData.invoiceSettings.footerText || "Certified that the particulars given above are true and correct. Taxes shown above are extra as applicable.",
               });
            }
            if (globalData.activeModules) {
               setActiveModules({
                  erp: globalData.activeModules.erp ?? true,
                  accounting: globalData.activeModules.accounting ?? true
               });
            }
         } catch (err) {
            console.error(err);
         }
      };
      fetchGlobalProfile();
   }, []);

   const handleProfileChange = (e) => {
      const { name, value } = e.target;
      if (name === "gstin") {
         const derivedPan = value.length >= 12 ? value.substring(2, 12).toUpperCase() : "";
         setProfileData({ ...profileData, gstin: value.toUpperCase(), pan: derivedPan });
      } else {
         setProfileData({ ...profileData, [name]: value });
      }
   };

   const handleLogoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
            setProfileData({ ...profileData, companyLogo: reader.result });
         };
         reader.readAsDataURL(file);
      }
   };

   const removeLogo = () => {
      setProfileData({ ...profileData, companyLogo: "" });
   };

   const handleBankChange = (e) => setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
   const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

   const handleGstLookup = async () => {
      if (!profileData.gstin || profileData.gstin.length < 15) return;
      try {
         setLoading(true);
         const res = await gstApi.lookup(profileData.gstin);
         const data = res.data;
         setProfileData(prev => ({ ...prev, companyName: data.companyName, address: data.address, state: data.state, pincode: data.pincode, pan: data.pan || (data.gstin?.length >= 12 ? data.gstin.substring(2, 12) : prev.pan) }));
      } catch (err) {
         const detail = err.response?.data?.error || err.message || "Unknown connectivity failure";
         console.error("[GST LOOKUP ERROR]:", err);
         alert(`GST Lookup Protocol Failed: ${detail}`);
      } finally {
         setLoading(false);
      }
   };

   const performUpdate = async () => {
      try {
         setLoading(true);
         const res = await authApi.updateProfile({ ...profileData, bankDetails, invoiceSettings, notificationSettings, activeModules });
         setUser({ ...(user || {}), ...res.data, bankDetails, invoiceSettings, notificationSettings, activeModules });
         alert("System configuration synchronized successfully.");
      } catch (err) {
         alert("Update protocol failed.");
      } finally {
         setLoading(false);
      }
   };

   const updateProfile = async (e) => {
      if (e) e.preventDefault();
      await performUpdate();
   };

   const changePassword = async (e) => {
      e.preventDefault();
      if (passwordData.newPassword !== passwordData.confirmPassword) return;
      try {
         setLoading(true);
         await authApi.changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
         alert("Security credential updated.");
         setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } catch (err) {
         alert("Password change protocol failed.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <AppLayout>
         {loading && <HammerLoader message="Synchronizing Enterprise Flux..." />}
         <div className="space-y-4 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">

            {/* Elite Governance Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 rounded-md flex items-center justify-center group hover:scale-110 transition-transform duration-500 shadow-xl border border-slate-800">
                     <SettingsIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                     <h2 className="text-3xl font-black text-slate-900 tracking-tightest leading-none mb-2 ">System <span className="text-primary not-">Governance</span></h2>
                     <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Intelligence Config & Enterprise Authorization</span>
                     </div>
                  </div>
               </div>

               <button onClick={logout} className="erp-button-secondary !py-4 !px-4 border-rose-100 text-rose-600 hover:bg-rose-50 group rounded-md">
                  <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  Terminate Session
               </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
               {/* Advanced Tab Navigation */}
               <div className="lg:col-span-1 space-y-3">
                  {[
                     { id: "profile", label: "Company Identity", icon: Building2, desc: "Legal & Entity Details" },
                     { id: "bank", label: "Financial Nodes", icon: CreditCard, desc: "Banking & Settlement" },
                     { id: "invoice", label: "Invoice Logic", icon: Layout, desc: "Miracle-Style Arch" },
                     { id: "security", label: "Security Shield", icon: Lock, desc: "Auth & Access Control" },
                     ...(["super_admin", "admin"].includes(user?.role) ? [
                        { id: "compliance", label: "Compliance Gateway", icon: ShieldCheck, desc: "E-Way Bill & E-Invoice" },
                        { id: "modules", label: "Module Hub", icon: Activity, desc: "ERP vs Accounting" }
                     ] : []),
                     { id: "notifications", label: "Alert Ecosystem", icon: Bell, desc: "Proactive Notifications" },
                  ].map((tab) => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full group flex flex-col p-4 rounded-md transition-all duration-500 border relative overflow-hidden ${activeTab === tab.id ? "bg-slate-900 border-slate-900 shadow-xl shadow-slate-900/10 text-white z-10" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"}`}
                     >
                        <div className="flex items-center gap-4 mb-2">
                           <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-indigo-400" : "text-slate-300 group-hover:text-slate-900"}`} />
                           <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                        </div>
                        <span className={`text-[10px] font-bold text-left  transition-colors ${activeTab === tab.id ? "text-white/40" : "text-slate-300 group-hover:text-slate-400"}`}>{tab.desc}</span>
                        {activeTab === tab.id && <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="w-12 h-12 text-white" /></div>}
                     </button>
                  ))}
               </div>

               {/* Configuration Workspace */}
               <div className="lg:col-span-3">
                  {activeTab === "profile" && (
                     <form onSubmit={updateProfile} className="bg-white p-4 rounded-md border border-slate-100 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600"><Building2 className="w-6 h-6" /></div>
                              <div>
                                 <h3 className="text-xl font-black text-slate-900 tracking-tightest uppercase ">Entity Registry</h3>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configure your core business identity datasets</p>
                              </div>
                           </div>
                           <Activity className="w-6 h-6 text-slate-100 animate-pulse" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Proprietor Name</label>
                              <input name="name" className="erp-input !py-4 !bg-slate-50 focus:!bg-white" value={profileData.name} onChange={handleProfileChange} />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trade Label / Company</label>
                              <input name="companyName" className="erp-input !py-4 !bg-slate-50" value={profileData.companyName} onChange={handleProfileChange} />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GSTIN Master UID</label>
                              <div className="relative">
                                 <input name="gstin" className="erp-input !py-4 !bg-indigo-50 !text-indigo-600 !font-black !tracking-[0.2em] uppercase pr-16" value={profileData.gstin} onChange={handleProfileChange} placeholder="27XXXXX0000X1Z5" />
                                 <button type="button" onClick={handleGstLookup} disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-md shadow-lg shadow-indigo-200 active:scale-90 transition-all">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                 </button>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fiscal State</label>
                                 <input name="state" className="erp-input !py-4 uppercase !font-black" value={profileData.state} onChange={handleProfileChange} />
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Postal Pincode</label>
                                 <input name="pincode" className="erp-input !py-4 uppercase !font-black" value={profileData.pincode} onChange={handleProfileChange} placeholder="360001" maxLength="6" />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Operational Hub (Address)</label>
                           <textarea name="address" rows="3" className="erp-input !py-3 resize-none h-28" value={profileData.address} onChange={handleProfileChange} />
                        </div>

                        <div className="pt-4 flex justify-end">
                           <button disabled={loading} className="erp-button-primary !py-4 !bg-slate-900 !rounded-md hover:!bg-black group">
                              <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              {loading ? "Capturing Flux..." : "Commit Entity Update"}
                           </button>
                        </div>
                     </form>
                  )}

                  {activeTab === "bank" && (
                     <form onSubmit={updateProfile} className="bg-white p-4 rounded-md border border-slate-100 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600"><CreditCard className="w-6 h-6" /></div>
                           <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tightest uppercase ">Settlement Configuration</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorize banking nodes for financial clearance</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Institution</label>
                              <input name="bankName" className="erp-input !py-4 uppercase" value={bankDetails.bankName} onChange={handleBankChange} placeholder="ICICI BANK" />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Identifier</label>
                              <input name="accountNumber" className="erp-input !py-4 !font-mono !text-indigo-600" value={bankDetails.accountNumber} onChange={handleBankChange} />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IFSC Protocol UID</label>
                              <input name="ifscCode" className="erp-input !py-4 uppercase !font-black !tracking-widest" value={bankDetails.ifscCode} onChange={handleBankChange} />
                           </div>
                           <div className="flex items-end pb-1">
                              <div className="p-4 bg-slate-50 border border-slate-100 rounded-md flex items-center gap-4 w-full">
                                 <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                 <span className="text-[9px] font-black uppercase text-slate-400">Encrypted Financial Node Connected</span>
                              </div>
                           </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full erp-button-primary !py-4 !bg-emerald-600 !rounded-md hover:!bg-emerald-700 shadow-emerald-500/20">
                           <Shield className="w-5 h-5" />
                           {loading ? "Synchronizing Node..." : "Authorize Financial Protocol"}
                        </button>
                     </form>
                  )}

                  {activeTab === "invoice" && (
                     <form onSubmit={updateProfile} className="bg-white p-3 rounded-md border border-slate-100 shadow-sm space-y-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600"><Layout className="w-6 h-6" /></div>
                              <div>
                                 <h3 className="text-xl font-black text-slate-900 tracking-tightest uppercase ">Invoice Architecture</h3>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Grid Config (Miracle-Style)</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-md border border-slate-100">
                              <span className="text-[10px] font-black uppercase text-slate-400 mr-2">Logo Branding</span>
                              <button type="button" onClick={() => setInvoiceSettings({ ...invoiceSettings, showLogo: !invoiceSettings.showLogo })} className={`w-14 h-7 rounded-full transition-all relative ${invoiceSettings.showLogo ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                 <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${invoiceSettings.showLogo ? 'left-8' : 'left-1'}`}></div>
                              </button>
                           </div>
                        </div>

                        {/* Logo Upload System */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                              <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-widest uppercase">Brand Essence (Logo)</h4>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-1">
                                 <div className={`aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all ${profileData.companyLogo ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white'}`}>
                                    {profileData.companyLogo ? (
                                       <>
                                          <img src={profileData.companyLogo} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                             <button type="button" onClick={removeLogo} className="p-3 bg-rose-600 text-white rounded-md shadow-xl active:scale-95 transition-all"><Trash2 className="w-5 h-5" /></button>
                                          </div>
                                       </>
                                    ) : (
                                       <label className="w-full h-full cursor-pointer flex flex-col items-center justify-center p-4 text-center group">
                                          <Upload className="w-8 h-8 text-slate-300 mb-4 group-hover:text-indigo-500 group-hover:scale-110 transition-all" />
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Drop Brand Node<br /> or Click to Browse</span>
                                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                       </label>
                                    )}
                                 </div>
                              </div>
                              <div className="md:col-span-2 flex flex-col justify-center space-y-4 p-4 bg-slate-50/50 rounded-md border border-slate-50">
                                 <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center shadow-sm"><ImageIcon className="w-5 h-5 text-indigo-400" /></div>
                                    <div>
                                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Vector/Raster Compatibility</p>
                                       <p className="text-[9px] font-black text-slate-400 uppercase  leading-relaxed">System supports PNG, JPG, and SVG formats. Recommended dimensions: 512x512px for maximum clarity on printed PDF docs.</p>
                                    </div>
                                 </div>
                                 <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center shadow-sm"><Zap className="w-5 h-5 text-amber-400" /></div>
                                    <div>
                                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Persistence Engine</p>
                                       <p className="text-[9px] font-black text-slate-400 uppercase  leading-relaxed">Your brand node is securely cached and synchronized across all enterprise billing terminals instantly.</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] pl-2 border-l-4 border-indigo-500">Grid Parameter Mapping</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                              {Object.keys(invoiceSettings.columns).map((key) => {
                                 const col = invoiceSettings.columns[key];
                                 return (
                                    <div key={key} className="space-y-3 group">
                                       <div className="flex justify-between items-center px-1">
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{key.toUpperCase()} COLUMN LABEL</label>
                                          <button type="button" onClick={() => setInvoiceSettings({ ...invoiceSettings, columns: { ...invoiceSettings.columns, [key]: { ...col, show: !col.show } } })} className={`p-1.5 rounded-md transition-all ${col.show ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 bg-slate-50'}`}>
                                             {col.show ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                          </button>
                                       </div>
                                       <input disabled={!col.show} value={col.label} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, columns: { ...invoiceSettings.columns, [key]: { ...col, label: e.target.value } } })} className={`erp-input !py-4 ${!col.show ? 'opacity-30 grayscale cursor-not-allowed' : 'focus:ring-indigo-500/10'}`} />
                                    </div>
                                 );
                              })}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2 border-l-4 border-slate-900">Legal Footer Disclaimer</label>
                           <textarea rows="4" className="erp-input h-32 resize-none !text-[11px] !leading-relaxed" value={invoiceSettings.footerText} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })} />
                        </div>

                        <button type="submit" className="erp-button-primary !py-7 !bg-slate-900 !rounded-md hover:!bg-black group">
                           <Activity className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                           Deploy Architecture Config
                        </button>
                     </form>
                  )}

                  {activeTab === "security" && (
                     <form onSubmit={changePassword} className="bg-white p-4 rounded-md border border-slate-100 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600"><Lock className="w-6 h-6" /></div>
                           <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tightest uppercase ">Auth Governance</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage system access & secure credentials</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="p-3 bg-slate-50 rounded-md border border-slate-100 flex items-center gap-4 group hover:border-slate-300 transition-all">
                              <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Database className="w-6 h-6 text-slate-300" /></div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Encryption</p>
                                 <p className="text-sm font-black text-slate-900 uppercase ">Active AES-256</p>
                              </div>
                           </div>
                           <div className="p-3 bg-indigo-50 rounded-md border border-indigo-100 flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center shadow-sm"><ShieldCheck className="w-6 h-6 text-indigo-500" /></div>
                              <div>
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Security Status</p>
                                 <p className="text-sm font-black text-indigo-900 uppercase ">Threat: LOW_INTEL</p>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] pl-2 border-l-4 border-slate-900">Credential Synchronization</h4>
                           <div className="space-y-4">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Master Password</label>
                                 <div className="relative">
                                    <input type={showPasswords.current ? "text" : "password"} name="currentPassword" required className="erp-input !py-4 pr-16" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">
                                       {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                 </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Secure Cipher</label>
                                    <input type={showPasswords.new ? "text" : "password"} name="newPassword" required className="erp-input !py-4" value={passwordData.newPassword} onChange={handlePasswordChange} />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Cipher</label>
                                    <input type={showPasswords.confirm ? "text" : "password"} name="confirmPassword" required className="erp-input !py-4" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
                                 </div>
                              </div>
                           </div>
                        </div>

                        <button type="submit" className="erp-button-primary w-full !py-4 !bg-slate-900 !rounded-md hover:!bg-black">
                           <Lock className="w-5 h-5" />
                           Commit Security Update
                        </button>
                     </form>
                  )}

                  {activeTab === "notifications" && (
                     <form onSubmit={updateProfile} className="bg-white p-3 rounded-md border border-slate-100 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-amber-50 rounded-md flex items-center justify-center text-amber-600"><Bell className="w-6 h-6" /></div>
                           <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tightest uppercase ">Alert Intelligence</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configure telemetry & notification ecosystem</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] pl-2 border-l-4 border-amber-500">Inventory & Flux</h4>
                              {[
                                 { key: 'lowStock', label: 'STOCK ATTRITION ALERT', desc: 'Critical re-order level triggers' },
                                 { key: 'newOrder', label: 'SALES NODE CREATION', desc: 'Real-time billing telemetry' },
                              ].map((item) => (
                                 <div key={item.key} className="p-4 bg-slate-50 rounded-md border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                                    <div className="space-y-1">
                                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item.label}</p>
                                       <p className="text-[9px] font-black text-slate-400 uppercase  opacity-40">{item.desc}</p>
                                    </div>
                                    <button type="button" onClick={() => setNotificationSettings({ ...notificationSettings, [item.key]: !notificationSettings[item.key] })} className={`w-14 h-7 rounded-full transition-all relative ${notificationSettings[item.key] ? 'bg-amber-600' : 'bg-slate-300'}`}>
                                       <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${notificationSettings[item.key] ? 'left-8' : 'left-1'}`}></div>
                                    </button>
                                 </div>
                              ))}
                           </div>
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] pl-2 border-l-4 border-slate-900">System Telemetry</h4>
                              {[
                                 { key: 'securityAlerts', label: 'AUTH THREAT DETECT', desc: 'Login from unauthorized geographical nodes' },
                                 { key: 'channelEmail', label: 'EMAIL RELAY PROTOCOL', desc: 'Primary asynchronous delivery channel' },
                              ].map((item) => (
                                 <div key={item.key} className="p-4 bg-slate-50 rounded-md border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                                    <div className="space-y-1">
                                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item.label}</p>
                                       <p className="text-[9px] font-black text-slate-400 uppercase  opacity-40">{item.desc}</p>
                                    </div>
                                    <button type="button" onClick={() => setNotificationSettings({ ...notificationSettings, [item.key]: !notificationSettings[item.key] })} className={`w-14 h-7 rounded-full transition-all relative ${notificationSettings[item.key] ? 'bg-slate-900' : 'bg-slate-300'}`}>
                                       <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${notificationSettings[item.key] ? 'left-8' : 'left-1'}`}></div>
                                    </button>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <button type="submit" className="erp-button-primary !py-7 !bg-amber-600 !rounded-md hover:!bg-amber-700 shadow-amber-500/20">
                           <Save className="w-5 h-5" />
                           Commit Ecosystem Preferences
                        </button>
                     </form>
                  )}

                  {activeTab === "modules" && (
                     <form onSubmit={updateProfile} className="bg-white p-3 rounded-md border border-slate-100 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600"><Activity className="w-6 h-6" /></div>
                           <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tightest uppercase ">Module Governance</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toggle enterprise-wide operational modules</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="p-4 bg-slate-50 rounded-md border border-slate-100 space-y-4 group hover:border-slate-300 transition-all">
                              <div className="flex items-center justify-between">
                                 <div className="w-14 h-14 bg-white rounded-md flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Boxes className="w-6 h-6 text-indigo-600" /></div>
                                 <button type="button" onClick={() => setActiveModules({ ...activeModules, erp: !activeModules.erp })} className={`w-14 h-7 rounded-full transition-all relative ${activeModules.erp ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${activeModules.erp ? 'left-8' : 'left-1'}`}></div>
                                 </button>
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900 uppercase ">ERP Module</p>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Inventory, Orders, Production, Suppliers, Customers</p>
                              </div>
                           </div>

                           <div className="p-4 bg-slate-50 rounded-md border border-slate-100 space-y-4 group hover:border-slate-300 transition-all">
                              <div className="flex items-center justify-between">
                                 <div className="w-14 h-14 bg-white rounded-md flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Wallet className="w-6 h-6 text-emerald-600" /></div>
                                 <div className="flex items-center gap-3">
                                    <button type="button" onClick={handleAccountingToggle} className={`w-14 h-7 rounded-full transition-all relative ${activeModules.accounting ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                                       <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${activeModules.accounting ? 'left-8' : 'left-1'}`}></div>
                                    </button>
                                 </div>
                              </div>
                              <div>
                                 <div className="text-base font-black text-slate-900 uppercase  flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                                    Accounting Module
                                 </div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Billing, Ledgers, Statements, Payroll, Profit & Loss</p>
                              </div>
                           </div>
                        </div>

                        <button type="submit" className="erp-button-primary w-full !py-4 !bg-slate-900 !rounded-md shadow-2xl flex items-center justify-center gap-4 group transition-all duration-500 hover:scale-[1.01] active:scale-95 border border-slate-700">
                           <ShieldCheck className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                           <span className="text-sm font-black uppercase tracking-[0.1em]">Commit Module Architecture</span>
                        </button>
                     </form>
                  )}

                  {activeTab === "compliance" && (
                     <div className="animate-in fade-in zoom-in-95 duration-500">
                        <GstComplianceGateway />
                     </div>
                  )}
               </div>
            </div>
         </div>
      </AppLayout>
   );
};

const GstComplianceGateway = () => {
   const { user } = useAuth();
   const [loading, setLoading] = useState(false);
   const [showSecrets, setShowSecrets] = useState(false);

   const defaultGstin = user?.gstin || "";
   const defaultPan = user?.pan || (defaultGstin.length >= 12 ? defaultGstin.substring(2, 12) : "") || "";

   const [formData, setFormData] = useState({
      gstin: defaultGstin,
      legalName: user?.companyName || user?.name || "",
      address: user?.address || "",
      stateCode: "",
      pincode: user?.pincode || "",
      pan: defaultPan,
      eInvoiceUsername: "",
      eInvoicePassword: "",
      eWayBillUsername: "",
      eWayBillPassword: "",
      isEInvoiceEnabled: true,
      isEWayBillEnabled: true
   });

   useEffect(() => {
      const fetchConfig = async () => {
         try {
            setLoading(true);
            const { data } = await complianceApi.getGstConfig();
            if (data && Object.keys(data).length > 0) {
               setFormData(prev => ({
                  ...prev,
                  ...data,
                  // Fallback to user profile if config is empty for these fields
                  gstin: data.gstin || defaultGstin,
                  legalName: data.legalName || user?.companyName || user?.name || "",
                  address: data.address || user?.address || "",
                  pincode: data.pincode || user?.pincode || "",
                  pan: data.pan || defaultPan,
                  // If backend sends masked password, keep it as is
                  eInvoicePassword: data.eInvoicePassword || "",
                  eWayBillPassword: data.eWayBillPassword || ""
               }));
            }
         } catch (err) {
            console.error("Compliance fetch protocol failed");
         } finally {
            setLoading(false);
         }
      };
      fetchConfig();
   }, [user]);

   const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
         ...prev,
         [name]: type === 'checkbox' ? checked : value
      }));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      try {
         setLoading(true);
         await complianceApi.saveGstConfig(formData);
         // Refetch to get masked values and latest state
         const { data } = await complianceApi.getGstConfig();
         if (data.exists) {
            setFormData(prev => ({ ...prev, ...data }));
         }
         alert("Compliance Gateway synchronized successfully.");
      } catch (err) {
         alert("Compliance synchronization protocol failed.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md border border-slate-100 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-slate-900 rounded-md flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform"><ShieldCheck className="w-8 h-8" /></div>
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tightest uppercase ">GST Compliance <span className="text-indigo-600">Gateway</span></h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global NIC Proxy & Encrypted Credential Vault</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <button type="button" onClick={() => setShowSecrets(!showSecrets)} className="p-4 bg-slate-50 text-slate-400 rounded-md hover:text-slate-900 transition-colors shadow-sm">
                  {showSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
               </button>
            </div>
         </div>

         {/* Core Entity Data */}
         <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="h-px bg-slate-100 flex-grow"></div>
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Entity Identity</span>
               <div className="h-px bg-slate-100 flex-grow"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GSTIN Identifier</label>
                  <input name="gstin" className="erp-input !py-3 uppercase font-mono tracking-widest !bg-slate-50 focus:!bg-white" value={formData.gstin} onChange={handleChange} placeholder="24XXXXXXXXXXXXX" />
               </div>
               <div className="space-y-3 md:col-span-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Entity Name (GST Records)</label>
                  <input name="legalName" className="erp-input !py-3 uppercase !bg-slate-50 focus:!bg-white" value={formData.legalName} onChange={handleChange} />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PAN Master ID</label>
                  <input name="pan" className="erp-input !py-3 uppercase font-mono !bg-slate-50 focus:!bg-white" value={formData.pan} onChange={handleChange} />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GST State Code</label>
                  <input name="stateCode" className="erp-input !py-3 !bg-slate-50 focus:!bg-white" value={formData.stateCode} onChange={handleChange} placeholder="24" />
               </div>
               <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIC Dispatch Pincode</label>
                  <input name="pincode" className="erp-input !py-3 uppercase font-mono tracking-tighter !bg-slate-50 focus:!bg-white" value={formData.pincode} onChange={handleChange} placeholder="360001" maxLength="6" />
               </div>
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Principal Place of Business (Full Address)</label>
               <textarea name="address" rows="2" className="erp-input !py-3 resize-none h-24 uppercase !text-[11px]" value={formData.address} onChange={handleChange} />
            </div>
         </div>

         {/* NIC Credentials */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* E-Invoice */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-md border border-slate-100 hover:border-indigo-200 transition-colors">
               <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center text-white shadow-lg"><Zap className="w-5 h-5" /></div>
                     <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase  tracking-tighter">E-Invoice Portal</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NIC Integration Credentials</p>
                     </div>
                  </div>
                  <button type="button" onClick={() => setFormData({ ...formData, isEInvoiceEnabled: !formData.isEInvoiceEnabled })} className={`w-10 h-5 rounded-full relative transition-all duration-300 ${formData.isEInvoiceEnabled ? 'bg-indigo-600 shadow-inner' : 'bg-slate-200'}`}>
                     <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${formData.isEInvoiceEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </button>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">System Username</label>
                     <input name="eInvoiceUsername" className="erp-input !py-4 !bg-white" value={formData.eInvoiceUsername} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Portal Password</label>
                     <input type={showSecrets ? "text" : "password"} name="eInvoicePassword" className="erp-input !py-4 !bg-white" value={formData.eInvoicePassword} onChange={handleChange} placeholder="••••••••••••" />
                  </div>
               </div>
            </div>

            {/* E-Way Bill */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-md border border-slate-100 hover:border-emerald-200 transition-colors">
               <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-emerald-600 rounded-md flex items-center justify-center text-white shadow-lg"><Truck className="w-5 h-5" /></div>
                     <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase  tracking-tighter">E-Way Bill Portal</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NIC Integration Credentials</p>
                     </div>
                  </div>
                  <button type="button" onClick={() => setFormData({ ...formData, isEWayBillEnabled: !formData.isEWayBillEnabled })} className={`w-10 h-5 rounded-full relative transition-all duration-300 ${formData.isEWayBillEnabled ? 'bg-emerald-600 shadow-inner' : 'bg-slate-200'}`}>
                     <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${formData.isEWayBillEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </button>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">System Username</label>
                     <input name="eWayBillUsername" className="erp-input !py-4 !bg-white" value={formData.eWayBillUsername} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Portal Password</label>
                     <input type={showSecrets ? "text" : "password"} name="eWayBillPassword" className="erp-input !py-4 !bg-white" value={formData.eWayBillPassword} onChange={handleChange} placeholder="••••••••••••" />
                  </div>
               </div>
            </div>
         </div>

         <div className="flex justify-end pt-4">
            <button type="submit" disabled={loading} className="px-12 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-md hover:bg-black transition-all shadow-2xl flex items-center gap-4 group">
               <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
               {loading ? "Capturing Flux..." : "Commit Compliance Setup"}
            </button>
         </div>
      </form>
   );
};

export default Settings;
