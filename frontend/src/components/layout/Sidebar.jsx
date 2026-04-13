import { NavLink } from "react-router-dom";
import { 
  Package, Users, ShoppingCart, LayoutDashboard, X, Settings, 
  Building2, Download, Wallet, Banknote, BarChart3, FileText, 
  FileBarChart, ClipboardCheck, Boxes, Zap, ShieldCheck, Activity,
  Database, Globe, Share2, LogOut, ChevronRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

/**
 * Sidebar: The Global Control Core
 * Designed with a dark industrial aesthetic for an elite command-center experience.
 */
const navSections = [
  {
    title: "Intelligence Hub",
    items: [
      { name: "Global Overview", path: "/", icon: LayoutDashboard },
      { name: "Compliance Reports", path: "/reports", icon: BarChart3 },
    ]
  },
  {
    title: "Commercial Flux",
    items: [
      { name: "Relationship Hub", path: "/customers", icon: Users },
      { name: "Order Registry", path: "/orders", icon: ShoppingCart },
      { name: "Billing Terminal", path: "/billing", icon: FileText },
    ]
  },
  {
    title: "Operational Core",
    items: [
      { name: "Asset Inventory", path: "/products", icon: Boxes },
      { name: "Vendor Matrix", path: "/suppliers", icon: Building2 },
      { name: "Stock Ingress", path: "/purchases", icon: Download },
      { name: "Execution Hub", path: "/production", icon: ClipboardCheck },
    ]
  },
  {
    title: "Fiscal Governance",
    items: [
      { name: "Treasury Data", path: "/accounting", icon: Wallet },
      { name: "Audit Ledgers", path: "/statements", icon: FileText },
      { name: "Human Capital", path: "/payroll", icon: Banknote },
      { name: "Global Statement", path: "/financial-statement", icon: FileBarChart },
    ]
  },
  {
    title: "System Orchestration",
    items: [
      { name: "Master Settings", path: "/settings", icon: Settings }
    ]
  }
];

const Sidebar = ({ open, setOpen }) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md md:hidden animate-in fade-in transition-all duration-500"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Primary Sidebar Structure */}
      <aside
        className={`fixed inset-y-0 left-0 z-[110] w-80 bg-slate-900 transform transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) md:translate-x-0 md:static md:inset-0 ${
          open ? "translate-x-0 shadow-3xl shadow-black/50" : "-translate-x-full"
        } flex flex-col border-r border-slate-800`}
      >
        <div className="flex flex-col h-full relative overflow-hidden">
          
          {/* Decorative Flux Background */}
          <div className="absolute top-0 left-0 w-full h-96 pointer-events-none overflow-hidden opacity-20">
             <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/30 rounded-full filter blur-3xl"></div>
          </div>

          {/* Logo & Entity Branding */}
          <div className="flex items-center justify-between px-10 py-10 relative z-10">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white uppercase tracking-tightest italic leading-none mb-1">
                {user?.companyName?.slice(0, 15) || "APEX_ERP"}
              </span>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Operational Core</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2.5 text-slate-500 hover:text-white md:hidden bg-slate-800 rounded-2xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Optimized Navigation Ecosystem */}
          <div className="flex-1 py-4 overflow-y-auto px-6 custom-scrollbar relative z-10">
            <nav className="space-y-10">
              {navSections.map((section, sIdx) => (
                <div key={section.title} className="space-y-4 animate-in" style={{ animationDelay: `${sIdx * 100}ms` }}>
                  <h3 className="px-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic">
                    {section.title}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setOpen(false)}
                          className={({ isActive }) =>
                            `sidebar-link group ${isActive ? "sidebar-link-active" : "sidebar-link-inactive"}`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className="flex items-center relative z-10 w-full">
                                 <Icon className={`w-5 h-5 mr-4 transition-all duration-500 ${isActive ? "text-white scale-110" : "text-slate-600 group-hover:text-white"}`} />
                                 <span className="flex-1 tracking-tighter">{item.name}</span>
                                 {isActive && <ChevronRight className="w-4 h-4 text-white/40" />}
                              </div>
                              {isActive && (
                                 <motion.div 
                                   layoutId="active-pill"
                                   className="absolute inset-0 bg-indigo-600 z-0"
                                   initial={false}
                                   transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                 />
                              )}
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* User Console Terminal */}
          <div className="p-8 border-t border-slate-800 relative z-10">
             <div className="flex items-center gap-4 p-5 bg-slate-800/50 rounded-[2rem] border border-slate-700/50 group transition-all hover:bg-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-900 group-hover:scale-110 transition-transform duration-500">
                   {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                   <span className="text-sm font-black text-white truncate italic tracking-tightest">
                      {user?.name || "Root Admin"}
                   </span>
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate mt-0.5">
                      {user?.role || "System Authority"}
                   </span>
                </div>
                <button onClick={logout} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                   <LogOut className="w-4 h-4" />
                </button>
             </div>
          </div>
          
          {/* Footer Telemetry */}
          <div className="px-10 pb-8 opacity-20 flex justify-between items-center text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">
             <span>Node V2.5</span>
             <Activity className="w-3 h-3" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
