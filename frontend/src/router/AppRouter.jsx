import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import Customers from "../pages/Customers";
import Settings from "../pages/Settings";
import Orders from "../pages/Orders";
import Suppliers from "../pages/Suppliers";
import Purchases from "../pages/Purchases";
import Accounting from "../pages/Accounting";
import Payroll from "../pages/Payroll";
import Reports from "../pages/Reports";
import PartyLedger from "../pages/PartyLedger";
import CompanyStatement from "../pages/CompanyStatement";
import Login from "../pages/Login";
import PublicLedger from "../pages/PublicLedger";
import ProtectedRoute from "./ProtectedRoute";

import { useParams } from "react-router-dom";

// Helper for param-aware redirects
const RedirectWithId = ({ base }) => {
  const { id } = useParams();
  return <Navigate to={`${base}/${id}${window.location.search}`} replace />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/public/ledger/:token" element={<PublicLedger />} />
        
        {/* Protected ERP Routing */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
        <Route path="/accounting" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
        <Route path="/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        
        {/* Statement & Ledger (Renamed from Reports Context) */}
        <Route path="/statements" element={<ProtectedRoute><PartyLedger /></ProtectedRoute>} />
        <Route path="/statements/:id" element={<ProtectedRoute><PartyLedger /></ProtectedRoute>} />
        <Route path="/financial-statement" element={<ProtectedRoute><CompanyStatement /></ProtectedRoute>} />
        
        {/* Legacy Redirects for backwards compatibility */}
        <Route path="/reports/ledger" element={<Navigate to="/statements" replace />} />
        <Route path="/reports/party/:id" element={<RedirectWithId base="/statements" />} />

        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
