import React, { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import { User, Shield, Bell, Globe, Save, Lock, Building2, Eye, EyeOff, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authApi, gstApi } from "../api/erpApi";

const Settings = () => {
  const { user, logout, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    companyName: user?.companyName || "",
    gstin: user?.gstin || "",
    pan: user?.pan || ((user?.gstin)?.length >= 12 ? (user?.gstin).substring(2, 12) : ""),
    address: user?.address || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
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
  });

  const [notificationSettings, setNotificationSettings] = useState({
    lowStock: user?.notificationSettings?.lowStock ?? true,
    weeklySummary: user?.notificationSettings?.weeklySummary ?? false,
    newOrder: user?.notificationSettings?.newOrder ?? true,
    securityAlerts: user?.notificationSettings?.securityAlerts ?? true,
    channelEmail: user?.notificationSettings?.channelEmail ?? true
  });

  // Global Company Profile Fetching
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
              product: {
                label: globalData.invoiceSettings.columns?.product?.label || "Product Details",
                show: globalData.invoiceSettings.columns?.product?.show ?? true
              },
              hsn: {
                label: globalData.invoiceSettings.columns?.hsn?.label || "HSN/SAC",
                show: globalData.invoiceSettings.columns?.hsn?.show ?? true
              },
              quantity: {
                label: globalData.invoiceSettings.columns?.quantity?.label || "Qty",
                show: globalData.invoiceSettings.columns?.quantity?.show ?? true
              },
              price: {
                label: globalData.invoiceSettings.columns?.price?.label || "Unit Price",
                show: globalData.invoiceSettings.columns?.price?.show ?? true
              },
              taxable: {
                label: globalData.invoiceSettings.columns?.taxable?.label || "Taxable Val.",
                show: globalData.invoiceSettings.columns?.taxable?.show ?? true
              },
              amount: {
                label: globalData.invoiceSettings.columns?.amount?.label || "Net Amount",
                show: globalData.invoiceSettings.columns?.amount?.show ?? true
              }
            },
            showLogo: globalData.invoiceSettings.showLogo ?? true,
            footerText: globalData.invoiceSettings.footerText || "Certified that the particulars given above are true and correct. Taxes shown above are extra as applicable.",
          });
        }
      } catch (err) {
        console.error("Failed to load global company profile", err);
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

  const handleBankChange = (e) => {
    setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleGstLookup = async () => {
    if (!profileData.gstin || profileData.gstin.length < 15) {
      alert("Please enter a valid 15-digit GSTIN first.");
      return;
    }

    try {
      setLoading(true);
      const res = await gstApi.lookup(profileData.gstin);
      const data = res.data;

      setProfileData(prev => ({
        ...prev,
        companyName: data.companyName,
        address: data.address,
        state: data.state,
        pincode: data.pincode,
        pan: data.pan || (data.gstin?.length >= 12 ? data.gstin.substring(2, 12) : prev.pan)
      }));

      alert("Business details successfully fetched from GST Network!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to fetch GST details. Please enter manually.");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authApi.updateProfile({ ...profileData, bankDetails, invoiceSettings, notificationSettings });
      setUser({ ...(user || {}), ...res.data, bankDetails, invoiceSettings, notificationSettings });
      alert("Profile, Bank & Invoice settings updated successfully!");
    } catch (err) {
      alert(err.response?.data?.msg || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      alert("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      alert(err.response?.data?.msg || "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">System Settings</h2>
          <p className="text-sm text-gray-500 font-medium">Manage your enterprise profile, tax details, and security.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            {[
              { id: "profile", label: "Company Profile", icon: Building2 },
              { id: "bank", label: "Bank & Financials", icon: ShieldCheck },
              { id: "invoice", label: "Invoice Customization", icon: Globe },
              { id: "security", label: "Security", icon: Lock },
              { id: "notifications", label: "Notifications", icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold rounded-2xl transition-all duration-200 ${activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 translate-x-2"
                  : "text-gray-500 hover:bg-gray-100"
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}

            <div className="pt-6 mt-6 border-t border-gray-100">
              <button onClick={logout} className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-colors">
                <Shield className="w-5 h-5 text-red-400" />
                Sign Out Security
              </button>
            </div>
          </div>

          {/* Dynamic Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {activeTab === "profile" && (
              <form onSubmit={updateProfile} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tighter uppercase italic">Company Identity</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                    <input name="name" className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" value={profileData.name} onChange={handleProfileChange} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Registered Name</label>
                    <input name="companyName" className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none" value={profileData.companyName} onChange={handleProfileChange} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GSTIN Number</label>
                    <div className="relative group">
                      <input
                        name="gstin"
                        className="w-full pl-5 pr-14 py-3 bg-gray-50 border-none rounded-2xl text-sm font-black text-blue-600 focus:ring-2 focus:ring-blue-500/10 outline-none uppercase placeholder:text-gray-300 transition-all"
                        value={profileData.gstin}
                        onChange={handleProfileChange}
                        placeholder="27XXXXX0000X1Z5"
                      />
                      <button
                        type="button"
                        onClick={handleGstLookup}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                        title="Fetch business details from GST Network"
                      >
                        <Search className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Base State (for GST)</label>
                    <input name="state" className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none" value={profileData.state} onChange={handleProfileChange} placeholder="e.g. Maharashtra" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Permanent Account Number (PAN)</label>
                    <input name="pan" readOnly className="w-full px-5 py-3 bg-gray-100 border-none rounded-2xl text-sm font-black text-indigo-600 outline-none cursor-not-allowed opacity-80" value={profileData.pan} placeholder="Derived from GSTIN" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Pincode</label>
                    <input name="pincode" className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none" value={profileData.pincode} onChange={handleProfileChange} placeholder="400001" maxLength="6" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Registered Business Address</label>
                  <textarea name="address" rows="3" className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/10 outline-none" value={profileData.address} onChange={handleProfileChange}></textarea>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-end">
                  <button disabled={loading} className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all uppercase text-xs tracking-widest">
                    <Save className="w-4 h-4" /> {loading ? "Saving..." : "Update Identity"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "bank" && (
              <form onSubmit={updateProfile} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tighter uppercase italic">Financial & Bank Setup</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank Name</label>
                    <input
                      name="bankName"
                      className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none"
                      value={bankDetails.bankName}
                      onChange={handleBankChange}
                      placeholder="e.g. ICICI BANK"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Branch Name</label>
                    <input
                      name="branchName"
                      className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none"
                      value={bankDetails.branchName}
                      onChange={handleBankChange}
                      placeholder="e.g. RAJKOT MAIN BRANCH"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Number</label>
                    <input
                      name="accountNumber"
                      className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-black text-blue-600 focus:ring-2 focus:ring-emerald-500/10 outline-none"
                      value={bankDetails.accountNumber}
                      onChange={handleBankChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">RTGS / IFSC Code</label>
                    <input
                      name="ifscCode"
                      className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-black text-indigo-600 focus:ring-2 focus:ring-emerald-500/10 outline-none uppercase"
                      value={bankDetails.ifscCode}
                      onChange={handleBankChange}
                      placeholder="e.g. ICIC0002396"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 uppercase text-xs tracking-[0.2em]">
                    <Save className="w-4 h-4" />
                    {loading ? "Processing..." : "Secure Save Financial Profiles"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "invoice" && (
              <form onSubmit={updateProfile} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <Globe className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tighter uppercase italic">Invoice Architecture</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customize your grid headers & layout like Miracle ERP</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Grid Header Labels</h4>

                    <div className="space-y-4">
                      {[
                        { key: 'product', label: 'Product Details Column', defaultVal: 'Product Details' },
                        { key: 'hsn', label: 'HSN/SAC Code Column', defaultVal: 'HSN/SAC' },
                        { key: 'quantity', label: 'Quantity Column', defaultVal: 'Qty' },
                        { key: 'price', label: 'Rate/Unit Price Column', defaultVal: 'Unit Price' },
                        { key: 'taxable', label: 'Taxable Value Column', defaultVal: 'Taxable Val.' },
                        { key: 'amount', label: 'Net Amount Column', defaultVal: 'Net Amount' },
                      ].map((item) => {
                        const colConfig = invoiceSettings.columns[item.key];
                        return (
                          <div key={item.key} className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</label>
                              <button
                                type="button"
                                onClick={() => setInvoiceSettings({
                                  ...invoiceSettings,
                                  columns: {
                                    ...invoiceSettings.columns,
                                    [item.key]: { ...colConfig, show: !colConfig.show }
                                  }
                                })}
                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all ${colConfig.show ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'}`}
                              >
                                {colConfig.show ? <><Eye className="w-3 h-3" /> Visible</> : <><EyeOff className="w-3 h-3" /> Hidden</>}
                              </button>
                            </div>
                            <input
                              className={`w-full px-5 py-3 ${colConfig.show ? 'bg-gray-50' : 'bg-gray-100 opacity-50'} border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none placeholder:text-gray-300 placeholder:italic transition-all`}
                              placeholder={item.defaultVal}
                              value={colConfig.label}
                              disabled={!colConfig.show}
                              onChange={(e) => setInvoiceSettings({
                                ...invoiceSettings,
                                columns: {
                                  ...invoiceSettings.columns,
                                  [item.key]: { ...colConfig, label: e.target.value }
                                }
                              })}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-500 pl-3">Layout & Branding</h4>

                    <div className="p-6 bg-gray-50 rounded-[2rem] space-y-4 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-700 uppercase tracking-tight">Display Company Logo</span>
                        <button
                          type="button"
                          onClick={() => setInvoiceSettings({ ...invoiceSettings, showLogo: !invoiceSettings.showLogo })}
                          className={`w-12 h-6 rounded-full transition-all duration-300 relative ${invoiceSettings.showLogo ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${invoiceSettings.showLogo ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <p className="text-[9px] text-gray-400 font-medium leading-relaxed italic">
                        * Logos are automatically fetched from your company profile settings. Disable if you use pre-printed letterheads.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Invoice Footer Disclaimer</label>
                      <textarea
                        rows="4"
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-[11px] font-medium leading-relaxed focus:ring-2 focus:ring-blue-500/10 outline-none resize-none"
                        value={invoiceSettings.footerText}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50 flex justify-end">
                  <button disabled={loading} className="flex items-center gap-2 px-10 py-3.5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all uppercase text-xs tracking-widest">
                    <Save className="w-4 h-4" /> {loading ? "Syncing Logic..." : "Save Configuration"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "security" && (
              <form onSubmit={changePassword} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <Lock className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tighter uppercase italic">Security Shield</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Lock className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Password</p>
                      <p className="text-lg font-black text-slate-900 tracking-[0.2em] pt-0.5 mt-1 leading-none">
                        {"•".repeat(passwordData.currentPassword.length || user?.passwordLength || 8)}
                      </p>
                    </div>
                  </div>
                  <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <ShieldCheck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Security Status</p>
                      <p className="text-xs font-black text-indigo-900 uppercase tracking-tighter pt-1">Active & Protected</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-l-4 border-indigo-500 box-border pl-3">Update Authentication</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password (to Verify Identity)</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        name="currentPassword"
                        required
                        className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Required to change password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Secure Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          name="newPassword"
                          required
                          className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          name="confirmPassword"
                          required
                          className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-end">
                  <button disabled={loading} className="px-8 py-3.5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all uppercase text-xs tracking-widest">
                    {loading ? "Verifying..." : "Update Security"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "notifications" && (
              <form onSubmit={updateProfile} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <Bell className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tighter uppercase italic">Alert Ecosystem</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configure how you stay updated with your business</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-l-4 border-amber-500 pl-3">Inventory & Sales</h4>

                    <div className="space-y-4">
                      {[
                        { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Notify when items reach re-order level', icon: Building2 },
                        { key: 'newOrder', label: 'New Sales Orders', desc: 'Alert on every new order creation', icon: Globe },
                        { key: 'weeklySummary', label: 'Performance Reports', desc: 'Weekly business health summaries', icon: Search },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <item.icon className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{item.label}</p>
                              <p className="text-[9px] text-gray-400 font-medium italic">{item.desc}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNotificationSettings({ ...notificationSettings, [item.key]: !notificationSettings[item.key] })}
                            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notificationSettings[item.key] ? 'bg-amber-500' : 'bg-gray-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${notificationSettings[item.key] ? 'left-7' : 'left-1'}`}></div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-l-4 border-slate-500 pl-3">Security & Channels</h4>

                    <div className="space-y-4">
                      {[
                        { key: 'securityAlerts', label: 'Security Notifications', desc: 'Alert on login from new devices', icon: Shield },
                        { key: 'channelEmail', label: 'Email Delivery', desc: 'Primary channel for all business alerts', icon: Bell },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <item.icon className="w-4 h-4 text-slate-600" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{item.label}</p>
                              <p className="text-[9px] text-gray-400 font-medium italic">{item.desc}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNotificationSettings({ ...notificationSettings, [item.key]: !notificationSettings[item.key] })}
                            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notificationSettings[item.key] ? 'bg-slate-700' : 'bg-gray-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${notificationSettings[item.key] ? 'left-7' : 'left-1'}`}></div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50 flex justify-end">
                  <button disabled={loading} className="flex items-center gap-2 px-10 py-3.5 bg-amber-600 text-white font-black rounded-2xl shadow-xl shadow-amber-600/20 hover:scale-105 active:scale-95 transition-all uppercase text-xs tracking-widest">
                    <Save className="w-4 h-4" /> {loading ? "Updating..." : "Save Preferences"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
