import axios from "axios";

// Automatic Environment Detection: Uses localhost for dev and Render for production
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = isLocalhost 
  ? "http://localhost:5000/api" 
  : "https://erp-1i9o.onrender.com/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Cache Busting: Appends a timestamp to all GET requests to bypass aggressive browser/proxy caches
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
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  delete: (id) => api.delete(`/orders/${id}`)
};

export const authApi = {
  loginStep1: (data) => api.post("/auth/login-step1", data),
  loginStep2: (data) => api.post("/auth/login-step2", data),
  register: (data) => api.post("/auth/register", data),
  updateProfile: (data) => api.put("/auth/profile", data),
  getCompanyProfile: () => api.get("/auth/company-profile"),
  changePassword: (data) => api.post("/auth/change-password", data),
};

export const dashboardApi = {
  getStats: () => api.get("/dashboard/stats"),
  getFinancialSummary: () => api.get("/payments/summary"),
  getPnLSummary: () => api.get("/ledger/summary")
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
  delete: (id) => api.delete(`/productions/${id}`)
};

export const invoiceApi = {
  getAll: () => api.get("/invoices"),
  create: (data) => api.post("/invoices", data),
  finalize: (id) => api.patch(`/invoices/${id}/finalize`),
  downloadPdf: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/invoices/${id}`)
};

export const journalApi = {
  getAll: () => api.get("/journal")
};

export const inventoryApi = {
  getLogs: (productId) => api.get(`/inventory/logs/${productId}`),
  getAllLogs: () => api.get("/inventory/logs")
};

export default api;

