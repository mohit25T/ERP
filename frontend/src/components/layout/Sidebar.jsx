import { NavLink } from "react-router-dom";
import { Package, Users, ShoppingCart, LayoutDashboard, X, Settings, Building2, Download, Wallet, Banknote } from "lucide-react";
const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Inventory", path: "/products", icon: Package },
  { name: "Suppliers", path: "/suppliers", icon: Building2 },
  { name: "Inward Stock", path: "/purchases", icon: Download },
  { name: "Accounting", path: "/accounting", icon: Wallet },
  { name: "Payroll", path: "/payroll", icon: Banknote },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Sales Orders", path: "/orders", icon: ShoppingCart },
  { name: "Settings", path: "/settings", icon: Settings }
];

const Sidebar = ({ open, setOpen }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden" 
          onClick={() => setOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              NexusERP
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700 md:hidden"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 py-6 overflow-y-auto">
            <nav className="px-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-5 h-5 mr-3 transition-colors duration-200 ${
                            isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                          }`}
                        />
                        {item.name}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
