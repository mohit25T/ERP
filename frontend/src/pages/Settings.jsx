import React, { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { User, Shield, Bell, Globe, Save, Lock, Building2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/erpApi";

const Settings = () => {
  const { user, logout, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    companyName: user?.companyName || "",
    gstin: user?.gstin || "",
    address: user?.address || "",
    pincode: user?.pincode || "",
  });

  const getDefaultContent = (val, def) => (val === def || !val) ? "" : val;

  const [invoiceSettings, setInvoiceSettings] = useState({
    columns: {
      product: {
        label: getDefaultContent(user?.invoiceSettings?.columns?.product?.label ?? user?.invoiceSettings?.headers?.product, "Product Details / HSN"),
        show: user?.invoiceSettings?.columns?.product?.show ?? true
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

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authApi.updateProfile({ ...profileData, invoiceSettings });
      setUser({ ...user, ...res.data, invoiceSettings });
      alert("Profile & Invoice settings updated successfully!");
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
              { id: "invoice", label: "Invoice Customization", icon: Globe },
              { id: "security", label: "Security", icon: Lock },
              { id: "notifications", label: "Notifications", icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold rounded-2xl transition-all duration-200 ${
                  activeTab === tab.id
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
                    <input name="gstin" className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-black text-blue-600 focus:ring-2 focus:ring-blue-500/10 outline-none uppercase placeholder:text-gray-300" value={profileData.gstin} onChange={handleProfileChange} placeholder="27XXXXX0000X1Z5" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Base State (for GST)</label>
                    <input name="state" className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none" value={profileData.state} onChange={handleProfileChange} placeholder="e.g. Maharashtra" />
                    <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Pincode</label>
                    <input name="pincode" className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none" value={profileData.pincode} onChange={handleProfileChange} placeholder="400001" maxLength="6" />
                  </div>
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
                          { key: 'product', label: 'Product/Item Column', defaultVal: 'Product Details / HSN' },
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
                        )})}
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

                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                      <input type="password" name="currentPassword" required className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Secure Password</label>
                         <input type="password" name="newPassword" required className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10" value={passwordData.newPassword} onChange={handlePasswordChange} />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                         <input type="password" name="confirmPassword" required className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
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
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
