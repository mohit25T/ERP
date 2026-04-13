import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import { ChevronRight, LayoutGrid, Search, Bell, Settings as SettingsIcon, Globe, ShieldCheck, Zap, User, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AppLayout: The Global Terminal Framework
 * Designed for elite functional stability and premium visual flow.
 */
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Central Dashboard";
    if (path === "/statements") return "Relationship Audit";
    if (path === "/financial-statement") return "Capital Flow Terminal";
    if (path === "/billing") return "Operational Billing Hub";
    if (path === "/production") return "Execution Terminal";
    
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 0) return "Global Hub";
    return parts[parts.length - 1].split("-").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };

  return (
    <div className="flex bg-slate-50 md:h-screen md:overflow-hidden print:block print:bg-white text-slate-900 font-sans selection:bg-indigo-100">
      
      {/* Sidebar Command Core */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      {/* Main Operational Secondary Node */}
      <div className="relative flex flex-col flex-1 min-w-0 md:overflow-y-auto overflow-x-hidden print:block print:overflow-visible">
        
        {/* Elite Glass Navigation Header */}
        <header className="sticky top-0 z-[100] flex items-center justify-between px-10 py-6 bg-white/80 backdrop-blur-3xl border-b border-slate-100 shadow-sm">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 text-slate-500 hover:text-white md:hidden bg-slate-100 hover:bg-slate-900 rounded-2xl transition-all shadow-inner active:scale-95"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            
            {/* Dynamic Breadcrumb Telemetry */}
            <div className="hidden md:flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-slate-300">
               <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                  <Globe className="w-3.5 h-3.5" />
                  <span>CORE_NODE_ALPHA</span>
               </div>
               <ChevronRight className="w-3.5 h-3.5 opacity-40" />
               <span className="text-slate-900 italic tracking-tightest text-sm">{getPageTitle()}</span>
            </div>
          </div>

          <div className="flex items-center gap-8">
             {/* Global Search Interface */}
             <div className="hidden lg:flex items-center bg-slate-50 border border-slate-100 rounded-[1.5rem] px-6 py-3 w-80 group focus-within:ring-8 focus-within:ring-slate-900/5 focus-within:bg-white transition-all duration-500 shadow-inner">
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <input 
                  placeholder="Global Metadata Lookup..."
                  className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest ml-4 w-full placeholder:text-slate-300 placeholder:opacity-50"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
             </div>

             {/* System Utilities */}
             <div className="flex items-center gap-4">
                <div className="p-1 px-1.5 bg-slate-100 rounded-2xl flex items-center gap-2 border border-slate-200">
                   <NotificationBell />
                   <Link to="/settings" className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-[1.25rem] transition-all">
                      <SettingsIcon className="w-5 h-5" />
                   </Link>
                </div>
             </div>

             <div className="h-10 w-px bg-slate-100 mx-2 hidden sm:block opacity-60"></div>

             {/* Authorized User Profile */}
             <Link 
               to="/settings"
               className="flex items-center gap-4 group p-1 pr-4 bg-slate-50 rounded-[2rem] border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-500"
             >
               <div className="w-12 h-12 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-xl shadow-slate-900/20 group-hover:rotate-6 transition-all duration-700">
                 {user?.name?.charAt(0).toUpperCase() || 'A'}
               </div>
               <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[13px] font-black text-slate-900 leading-none mb-1.5 tracking-tightest italic">
                    {user?.name || "Root Admin"}
                  </span>
                  <div className="flex items-center gap-2">
                     <ShieldCheck className="w-3 h-3 text-emerald-500" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        {user?.role || "System Authority"}
                     </span>
                  </div>
               </div>
             </Link>
          </div>
        </header>

        {/* Dynamic Global Main Workspace */}
        <main className="flex-1 min-w-0 relative">
          <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none opacity-40 overflow-hidden">
             <div className="absolute -top-48 -right-48 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-[120px]"></div>
          </div>
          
          <div className="p-10 lg:p-16 w-full mx-auto relative z-10">
            <AnimatePresence mode="wait">
               <motion.div
                 key={location.pathname}
                 initial={{ opacity: 0, y: 30, scale: 0.98 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
               >
                  {children}
               </motion.div>
            </AnimatePresence>
          </div>

          {/* Global Terminal Footer */}
          <footer className="px-16 py-12 border-t border-slate-100 opacity-20 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 italic">
             <div className="flex items-center gap-4">
                <span>&copy; {new Date().getFullYear()} GLOBAL_INTELLIGENCE_NETWORK</span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                <span>SECURE_NODE_BETA</span>
             </div>
             <div className="flex items-center gap-4">
                <Database className="w-4 h-4" />
                <span>DATA_VAULT_ENCRYPTED</span>
             </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
