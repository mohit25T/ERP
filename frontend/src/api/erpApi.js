import axios from "axios";

// Automatic Environment Detection: Uses localhost for dev and Render for production
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.startsWith("192.168.") ||
  window.location.hostname.startsWith("10.");

const API_BASE_URL = isLocalhost
  ? `http://localhost:5000/api/v1`
  : "https://erp-1i9o.onrender.com/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Diagnostic Interceptor: Captures absolute network failures and redirects on session expiry
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 1. Handle Network/Connectivity Failures
    if (!err.response) {
      alert(`[MIRACLE ERP NETWORK DIAGNOSTIC]\n\nA connectivity failure occurred.\n\nMessage: ${err.message}\nResolution: Check if the Backend Server is running at ${API_BASE_URL}`);
    }

    // 2. Handle Session Expiry (401 Unauthorized)
    if (err.response && err.response.status === 401) {
      console.warn("[AUTH PROTOCOL] Session expired. Redirecting to Login Terminal.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Prevent infinite loop if already on login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Financial Integrity Protocol: Enforce secondary master key for sensitive fiscal mutations
  const financialKey = localStorage.getItem("financial_key") || "erp123";
  config.headers["x-financial-key"] = financialKey;

  // Cache Busting: Appends a timestamp to all all requests to bypass aggressive browser/proxy caches
  if (config.method?.toLowerCase() === 'get') {
    config.params = { ...config.params, _t: Date.now() };
  }

  // Debugger: Logs the full URL in your browser console
  console.log(`[ERP NETWORK DEBUG] Sending ${config.method?.toUpperCase()} to: ${config.baseURL}${config.url}`);

  return config;
});

export const productApi = {
  getAll: () => api.get("/products"),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

export const bomApi = {
  getAll: () => api.get("/boms"),
  getByProduct: (productId) => api.get(`/boms/product/${productId}`),
  upsert: (productId, data) => api.post(`/boms/product/${productId}`, data),
  delete: (id) => api.delete(`/boms/${id}`)
};

export const customerApi = {
  getAll: () => api.get("/customers"),
  create: (data) => api.post("/customers", data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  generateShareToken: (id) => api.patch(`/customers/${id}/share-token`)
};

export const supplierApi = {
  getAll: () => api.get("/suppliers"),
  create: (data) => api.post("/suppliers", data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  generateShareToken: (id) => api.patch(`/suppliers/${id}/share-token`)
};

export const purchaseApi = {
  getAll: () => api.get("/purchases"),
  create: (data) => api.post("/purchases", data),
  updateStatus: (id, status) => api.put(`/purchases/${id}/status`, { status }),
  delete: (id) => api.delete(`/purchases/${id}`)
};

export const orderApi = {
  getAll: () => api.get("/orders"),
  create: (data) => api.post("/orders", data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  delete: (id) => api.delete(`/orders/${id}`)
};

export const authApi = {
  loginStep1: (data) => api.post("/auth/login-step1", data),
  loginStep2: (data) => api.post("/auth/login-step2", data),
  register: (data) => api.post("/auth/register", data),
  updateProfile: (data) => api.put("/auth/profile", data),
  getCompanyProfile: () => api.get("/auth/company-profile"),
  verifyPassword: (password) => api.post("/auth/verify-password", { password }),
  changePassword: (data) => api.post("/auth/change-password", data),
};

export const dashboardApi = {
  getStats: () => api.get("/dashboard/stats"),
  getFinancialSummary: () => api.get("/payments/summary"),
  getPnLSummary: () => api.get("/dashboard/pnl-summary")
};

export const paymentApi = {
  getSummary: () => api.get("/payments/summary"),
  addOrderPayment: (id, data) => api.post(`/payments/order/${id}`, data),
  addPurchasePayment: (id, data) => api.post(`/payments/purchase/${id}`, data),
  getHistory: (type, id) => api.get(`/ledger?${type}=${id}`),
};

export const ledgerApi = {
  getAll: () => api.get("/ledger"),
  getSummary: () => api.get("/ledger/summary"),
};

export const staffApi = {
  getAll: () => api.get("/staff"),
  create: (data) => api.post("/staff", data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`)
};

export const payrollApi = {
  getAll: (month, year) => api.get(`/payroll?month=${month}&year=${year}`),
  create: (data) => api.post("/payroll", data),
  paySalary: (id) => api.put(`/payroll/${id}/pay`),
  delete: (id) => api.delete(`/payroll/${id}`)
};

export const reportsApi = {
  getGSTR1: (month, year) => api.get(`/reports/gstr1?month=${month}&year=${year}`),
  getGSTR3B: (month, year) => api.get(`/reports/gstr3b?month=${month}&year=${year}`),
  getBalanceSheet: () => api.get("/reports/balance-sheet"),
  getPartyStatement: (id, type) => api.get(`/reports/party/${id}?type=${type}`),
  getCompanyStatement: () => api.get("/reports/company")
};

export const gstApi = {
  lookup: (gstin) => api.get(`/gst/lookup/${gstin}`)
};

export const publicApi = {
  getPublicLedger: (token) => api.get(`/public/ledger/${token}`)
};

export const distanceApi = {
  fetch: (fromAddress, toAddress) => api.get(`/distance/fetch?fromAddress=${encodeURIComponent(fromAddress)}&toAddress=${encodeURIComponent(toAddress)}`)
};

export const productionApi = {
  getAll: () => api.get("/productions"),
  create: (data) => api.post("/productions", data),
  update: (id, data) => api.patch(`/productions/${id}`, data),
  start: (id) => api.patch(`/productions/${id}/start`),
  complete: (id, data) => api.patch(`/productions/${id}/complete`, data),
  adjustScrap: (id, data) => api.patch(`/productions/${id}/adjust-scrap`, data),
  delete: (id) => api.delete(`/productions/${id}`),
  getInsights: () => api.get("/productions/insights")
};

export const invoiceApi = {
  getAll: () => api.get("/invoices"),
  getNextNumber: () => api.get("/invoices/next-number"),
  create: (data) => api.post("/invoices", data),
  finalize: (id) => api.patch(`/invoices/${id}/finalize`),
  downloadPdf: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/invoices/${id}`),
  // New Offline Workflow Methods
  downloadEinvoiceJson: (id) => api.get(`/invoices/${id}/json/einvoice`, { responseType: 'blob' }),
  downloadEwayBillJson: (id) => api.get(`/invoices/${id}/json/ewaybill`, { responseType: 'blob' }),
  updateEinvoiceDetails: (id, data) => api.patch(`/invoices/${id}/einvoice-details`, data),
  updateEwayBillDetails: (id, data) => api.patch(`/invoices/${id}/ewaybill-details`, data)
};

export const auditApi = {
  getLogs: (params) => api.get("/audit", { params })
};

export const journalApi = {
  getAll: () => api.get("/journal")
};

export const inventoryApi = {
  getLogs: (productId) => api.get(`/inventory/logs/${productId}`),
  getAllLogs: () => api.get("/inventory/logs"),
  getScrapLogs: () => api.get("/inventory/scrap")
};

export const complianceApi = {
  getGstConfig: () => api.get("/compliance/gst-config"),
  saveGstConfig: (data) => api.post("/compliance/gst-config", data)
};

export default api;
