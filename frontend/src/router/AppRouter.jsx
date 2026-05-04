import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/erp/Products";
import Customers from "../pages/erp/Customers";
import Settings from "../pages/Settings";
import Orders from "../pages/erp/Orders";
import Suppliers from "../pages/erp/Suppliers";
import Purchases from "../pages/erp/Purchases";
import Accounting from "../pages/accounting/Accounting";
import Payroll from "../pages/accounting/Payroll";
import Reports from "../pages/Reports";
import PartyLedger from "../pages/accounting/PartyLedger";
import CompanyStatement from "../pages/accounting/CompanyStatement";
import Login from "../pages/Login";
import PublicLedger from "../pages/accounting/PublicLedger";
import Production from "../pages/erp/Production";
import Billing from "../pages/accounting/Billing";
import Compliance from "../pages/accounting/Compliance";
import ProtectedRoute from "./ProtectedRoute";
import TreasuryDashboard from "../pages/treasury/TreasuryDashboard";
import BankManagement from "../pages/treasury/BankManagement";
import ExpenseManagement from "../pages/treasury/ExpenseManagement";
import CashManagement from "../pages/treasury/CashManagement";

import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Helper for param-aware redirects
const RedirectWithId = ({ base }) => {
  const { id } = useParams();
  return <Navigate to={`${base}/${id}${window.location.search}`} replace />;
};

// Role-Based Authorization Wrapper
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase();

  // Admin and Super Admin satisfy all role requirements
  if (userRole === "admin" || userRole === "super_admin") {
    return children;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <h2 className="text-xl font-black text-rose-500 uppercase italic tracking-widest">Access Protocol Restricted</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Your credentials do not satisfy the security requirements for this sector.</p>
          <button onClick={() => window.location.href = "/"} className="erp-button-primary mt-4">Return to Base</button>
        </div>
      </div>
    );
  }

  return children;
};

const AppRouter = () => {
  const { user } = useAuth();
  const activeModules = user?.activeModules || { erp: true, accounting: true };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/public/ledger/:token" element={<PublicLedger />} />

        {/* Protected ERP Routing */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        <Route path="/products" element={<ProtectedRoute>{activeModules.erp ? <Products /> : <Navigate to="/" replace />}</ProtectedRoute>} />

        <Route path="/suppliers" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "accountant"]}>
            {activeModules.erp ? <Suppliers /> : <Navigate to="/" replace />}
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        <Route path="/purchases" element={<ProtectedRoute>{activeModules.erp ? <Purchases /> : <Navigate to="/" replace />}</ProtectedRoute>} />
        <Route path="/production" element={<ProtectedRoute>{activeModules.erp ? <Production /> : <Navigate to="/" replace />}</ProtectedRoute>} />

        <Route path="/reports" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "accountant"]}>
            {activeModules.erp ? <Reports /> : <Navigate to="/" replace />}
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        <Route path="/customers" element={<ProtectedRoute>{activeModules.erp ? <Customers /> : <Navigate to="/" replace />}</ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute>{activeModules.erp ? <Orders /> : <Navigate to="/" replace />}</ProtectedRoute>} />

        {/* Global Fiscal Domain - NO LOCK */}
        <Route path="/accounting" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "accountant"]}>
            {activeModules.accounting ? <Accounting /> : <Navigate to="/" replace />}
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        <Route path="/payroll" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin"]}>
            {activeModules.accounting ? <Payroll /> : <Navigate to="/" replace />}
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        <Route path="/billing" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "accountant"]}>
            {activeModules.accounting ? <Billing /> : <Navigate to="/" replace />}
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        {/* Statement & Ledger */}
        <Route path="/statements" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "accountant"]}>
            {activeModules.accounting ? <PartyLedger /> : <Navigate to="/" replace />}
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        <Route path="/statements/:id" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "accountant"]}>
            {activeModules.accounting ? <PartyLedger /> : <Navigate to="/" replace />}
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        <Route path="/compliance" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin"]}>
            {activeModules.accounting ? <Compliance /> : <Navigate to="/" replace />}
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        <Route path="/financial-statement" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin"]}>
            {activeModules.accounting ? <CompanyStatement /> : <Navigate to="/" replace />}
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        {/* Treasury Intelligence Modules */}
        <Route path="/treasury" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "accountant"]}>
            <TreasuryDashboard />
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        <Route path="/treasury/bank" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "accountant"]}>
            <BankManagement />
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        <Route path="/treasury/expenses" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "accountant"]}>
            <ExpenseManagement />
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        <Route path="/treasury/cash" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "accountant"]}>
            <CashManagement />
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        {/* Support & Configuration */}
        <Route path="/settings" element={<ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <Settings />
          </RoleProtectedRoute>
        </ProtectedRoute>} />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
