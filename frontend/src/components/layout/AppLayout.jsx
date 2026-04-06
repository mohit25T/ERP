import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex bg-gray-50 md:h-screen md:overflow-hidden print:block print:bg-white">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="relative flex flex-col flex-1 min-w-0 md:overflow-y-auto overflow-x-hidden print:block print:overflow-visible">
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 md:hidden"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="ml-4 text-xl font-bold text-gray-800 hidden md:block uppercase tracking-tighter">Nexus ERP</h1>
          </div>
          <div className="flex items-center space-x-4">
             <Link 
               to="/settings"
               className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-blue-500/20 hover:scale-110 transition-transform active:scale-95"
             >
               {user?.name?.charAt(0).toUpperCase() || 'A'}
             </Link>
          </div>
        </header>

        <main className="flex-1 min-w-0">
          <div className="px-4 py-8 sm:px-6 lg:px-8 w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
