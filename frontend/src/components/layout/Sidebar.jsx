import { useNavigate, NavLink } from "react-router-dom";
import {
  Users, ShoppingCart, LayoutDashboard, Settings,
  Building2, Download, Wallet, Banknote, BarChart3, FileText, Landmark, TrendingDown,
  FileBarChart, ClipboardCheck, Boxes, ShieldCheck, X, LogOut
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * Sidebar: The Global Control Core
 * Designed with a dark industrial aesthetic for an elite command-center experience.
 */
const navSections = [
  {
    title: "Intelligence Hub",
    items: [
      { name: "Global Overview", path: "/", icon: LayoutDashboard, end: true },
      { name: "Compliance Radar", path: "/compliance", icon: ShieldCheck, module: "accounting", roles: ["admin"] },
      { name: "Intelligence Reports", path: "/reports", icon: BarChart3, module: "erp", roles: ["admin", "accountant"] },
    ]
  },
  {
    title: "Commercial Flux",
    items: [
      { name: "Relationship Hub", path: "/customers", icon: Users, module: "erp" },
      { name: "Order Registry", path: "/orders", icon: ShoppingCart, module: "erp" },
      { name: "Billing Terminal", path: "/billing", icon: FileText, module: "accounting", roles: ["admin", "accountant"] },
    ]
  },
  {
    title: "Operational Core",
    module: "erp",
    items: [
      { name: "Asset Inventory", path: "/products", icon: Boxes },
      { name: "Vendor Matrix", path: "/suppliers", icon: Building2, roles: ["admin", "accountant"] },
      { name: "Stock Ingress", path: "/purchases", icon: Download },
      { name: "Execution Hub", path: "/production", icon: ClipboardCheck },
    ]
  },
  {
    title: "Fiscal Governance",
    module: "accounting",
    roles: ["admin", "accountant"],
    items: [
      { name: "Treasury Data", path: "/accounting", icon: Wallet },
      { name: "Audit Ledgers", path: "/statements", icon: FileText },
      { name: "Human Capital", path: "/payroll", icon: Banknote, roles: ["admin"] },
      { name: "Global Statement", path: "/financial-statement", icon: FileBarChart, roles: ["admin"] },
    ]
  },
  {
    title: "Treasury Intel",
    module: "accounting",
    roles: ["admin", "accountant"],
    items: [
      { name: "Financial Overview", path: "/treasury", icon: LayoutDashboard, end: true },
      { name: "Bank Reserves", path: "/treasury/bank", icon: Landmark },
      { name: "Burn Matrix", path: "/treasury/expenses", icon: TrendingDown },
      { name: "Cash Flux", path: "/treasury/cash", icon: Wallet },
    ]
  },
  {
    title: "System Orchestration",
    roles: ["admin"],
    items: [
      { name: "Master Settings", path: "/settings", icon: Settings }
    ]
  }
];

const Sidebar = ({ open, setOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        className={`fixed inset-y-0 left-0 z-[110] w-64 bg-white transform transition-transform duration-300 md:translate-x-0 md:static md:inset-0 ${open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          } flex flex-col border-r border-slate-200`}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Logo & Branding */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                {user?.companyName?.slice(0, 15) || "ERP System"}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 md:hidden bg-slate-50 hover:bg-slate-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Optimized Navigation Ecosystem */}
          <div className="flex-1 py-6 overflow-y-auto px-4 custom-scrollbar">
            <nav className="space-y-6">
              {navSections
                .filter(section => {
                  const role = user?.role?.toLowerCase();
                  const isSuperAdmin = role === "super_admin";

                  // Module filtering
                  const moduleActive = !section.module || user?.activeModules?.[section.module] !== false;

                  // Role filtering 
                  const roleAllowed = !section.roles || isSuperAdmin || (role && section.roles.includes(role));

                  return moduleActive && roleAllowed;
                })
                .map((section, sIdx) => {
                  const filteredItems = section.items.filter(item => {
                    const role = user?.role?.toLowerCase();
                    const isSuperAdmin = role === "super_admin";

                    const moduleActive = !item.module || user?.activeModules?.[item.module] !== false;
                    const roleAllowed = !item.roles || isSuperAdmin || (role && item.roles.includes(role));
                    return moduleActive && roleAllowed;
                  });
                  if (filteredItems.length === 0) return null;

                  return (
                    <div key={section.title} className="space-y-2">
                      <h3 className="px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        {section.title}
                      </h3>
                      <div className="space-y-1">
                        {filteredItems.map((item) => {
                          const Icon = item.icon;

                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              end={item.end}
                              onClick={() => setOpen(false)}
                              className={({ isActive }) =>
                                `sidebar-link group ${isActive ? "sidebar-link-active" : "sidebar-link-inactive"}`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                                  <span className="flex-1 tracking-wide">{item.name}</span>
                                </>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                )
              }
            </nav>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-md border border-slate-100 hover:bg-slate-100 transition-all duration-300">
              <div className="w-9 h-9 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-900 truncate tracking-tight">
                  {user?.name || "Root Admin"}
                </span>
                <span className="text-[10px] text-slate-400 truncate uppercase font-bold tracking-widest">
                  {user?.role || "System Authority"}
                </span>
              </div>
              <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-md transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
