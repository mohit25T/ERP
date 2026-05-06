import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import { LayoutGrid, Search, Settings as SettingsIcon, Sun, Moon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * AppLayout: The Global Terminal Framework
 * Refined for enterprise stability with dark mode support.
 */
const AppLayout = ({ children, fullWidth = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

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
    <div className="flex bg-background md:h-screen md:overflow-hidden print:block print:bg-white text-foreground font-sans selection:bg-primary/20 transition-colors duration-300">

      {/* Sidebar Navigation */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="relative flex flex-col flex-1 min-w-0 md:overflow-y-auto overflow-x-hidden print:block print:overflow-visible border-l border-border">

        {/* Top Header */}
        <header className="sticky top-0 z-[100] flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur-md border-b border-border transition-all duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-muted-foreground hover:text-foreground md:hidden bg-muted hover:bg-accent rounded-md transition-colors"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>

            <div className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span className="text-foreground">{getPageTitle()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search Interface */}
            <div className="hidden lg:flex items-center bg-muted/50 border border-border rounded px-3 py-1.5 w-64 focus-within:bg-background focus-within:ring-1 focus-within:ring-ring focus-within:border-primary transition-all duration-200">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                placeholder="Command search..."
                className="bg-transparent border-none outline-none text-xs ml-2 w-full placeholder:text-muted-foreground text-foreground font-medium"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>

            {/* System Utilities */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <button 
                onClick={toggleTheme}
                className="p-2 hover:bg-muted hover:text-foreground rounded-md transition-colors"
                title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <NotificationBell />
              <Link to="/settings" className="p-2 hover:bg-muted hover:text-foreground rounded-md transition-colors">
                <SettingsIcon className="w-4 h-4" />
              </Link>
            </div>

            <div className="h-4 w-px bg-border hidden sm:block mx-1"></div>

            {/* Authorized User Profile */}
            <Link
              to="/settings"
              className="flex items-center gap-2 hover:bg-muted/50 p-1 px-2 rounded border border-transparent hover:border-border transition-colors"
            >
              <div className="w-7 h-7 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-foreground leading-none">
                  {user?.name || "Root Admin"}
                </span>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                  {user?.role || "System Authority"}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Global Main Workspace */}
        <main className="flex-1 min-w-0 bg-background transition-colors duration-300">
          <div className={`p-4 md:p-6 w-full mx-auto ${fullWidth ? 'max-w-full' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
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
