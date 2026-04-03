import React, { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { User, Shield, Bell, Globe, Save, Lock, Building2 } from "lucide-react";
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
    state: user?.state || "",
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
      const res = await authApi.updateProfile(profileData);
      setUser({ ...user, ...res.data });
      alert("Profile & Company details updated successfully!");
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
