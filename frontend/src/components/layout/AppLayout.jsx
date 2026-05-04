import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import { LayoutGrid, Search, Settings as SettingsIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * AppLayout: The Global Terminal Framework
 * Designed for elite functional stability and premium visual flow.
 */
const AppLayout = ({ children, fullWidth = false }) => {
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

      {/* Sidebar Navigation */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="relative flex flex-col flex-1 min-w-0 md:overflow-y-auto overflow-x-hidden print:block print:overflow-visible">

        {/* Top Header */}
        <header className="sticky top-0 z-[100] flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-500 hover:text-slate-900 md:hidden bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>

            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500">
              <span className="text-slate-900 font-semibold">{getPageTitle()}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Global Search Interface */}
            <div className="hidden lg:flex items-center bg-slate-100 border border-transparent rounded-md px-4 py-2 w-72 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all duration-300">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                placeholder="Search dataset..."
                className="bg-transparent border-none outline-none text-sm ml-3 w-full placeholder:text-slate-400 text-slate-900 font-medium"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>

            {/* System Utilities */}
            <div className="flex items-center gap-2 text-slate-500">
              <NotificationBell />
              <Link to="/settings" className="p-2 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors">
                <SettingsIcon className="w-5 h-5" />
              </Link>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Authorized User Profile */}
            <Link
              to="/settings"
              className="flex items-center gap-3 hover:bg-slate-50 p-1 pr-3 rounded-md transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-semibold text-slate-900">
                  {user?.name || "Root Admin"}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {user?.role || "System Authority"}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Global Main Workspace */}
        <main className="flex-1 min-w-0 bg-slate-50">
          <div className={`p-4 md:p-6 w-full mx-auto ${fullWidth ? 'max-w-full' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
