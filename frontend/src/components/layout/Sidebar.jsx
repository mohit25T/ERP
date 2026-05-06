import { useNavigate, NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Users, ShoppingCart, LayoutDashboard, Settings,
  Building2, Download, Wallet, Banknote, BarChart3, FileText, Landmark, TrendingDown,
  FileBarChart, ClipboardCheck, Boxes, ShieldCheck, X, LogOut
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * Sidebar: The Global Control Core
 * Optimized for enterprise information density and semantic styling.
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
  const scrollRef = useRef(null);

  // Persistent Scroll Logic
  useEffect(() => {
    const savedScroll = localStorage.getItem("sidebar-scroll");
    if (savedScroll && scrollRef.current) {
      scrollRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, []);

  const handleScroll = (e) => {
    localStorage.setItem("sidebar-scroll", e.target.scrollTop);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm md:hidden animate-in fade-in transition-all duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Primary Sidebar Structure */}
      <aside
        className={`fixed inset-y-0 left-0 z-[110] w-64 bg-card transform transition-transform duration-300 md:translate-x-0 md:static md:inset-0 ${open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          } flex flex-col border-r border-border`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Branding */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              {user?.companyLogo ? (
                <img src={user.companyLogo} alt="Logo" className="w-8 h-8 object-contain rounded shadow-sm border border-border/50" />
              ) : (
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-black text-xs shadow-sm">
                  {user?.companyName?.charAt(0) || 'E'}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[13px] font-black text-foreground tracking-tightest uppercase leading-none truncate max-w-[120px]">
                  {user?.companyName?.slice(0, 20) || "Enterprise OS"}
                </span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">
                  Global Hub
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 text-muted-foreground hover:text-foreground md:hidden bg-muted rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Optimized Navigation Ecosystem */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 py-4 overflow-y-auto px-3 scrollbar-hide"
          >
            <nav className="space-y-4">
              {navSections
                .filter(section => {
                  const role = user?.role?.toLowerCase();
                  const isSuperAdmin = role === "super_admin";
                  const moduleActive = !section.module || user?.activeModules?.[section.module] !== false;
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
                    <div key={section.title} className="space-y-1">
                      <h3 className="px-3 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-60">
                        {section.title}
                      </h3>
                      <div className="space-y-0.5">
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
                                  <Icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                                  <span className="flex-1 tracking-tight">{item.name}</span>
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
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2.5 p-2 bg-muted/30 rounded border border-border/50 hover:bg-muted/50 transition-all duration-200">
              <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-black shadow-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[11px] font-bold text-foreground truncate tracking-tight">
                  {user?.name || "Root Admin"}
                </span>
                <span className="text-[9px] text-muted-foreground truncate uppercase font-bold tracking-tighter">
                  {user?.role || "System Authority"}
                </span>
              </div>
              <button onClick={logout} className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
