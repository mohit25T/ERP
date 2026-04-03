import axios from "axios";

export const api = axios.create({
  // Backend URL MUST include the /api prefix
  baseURL: "https://erp-1i9o.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
  delete: (id) => api.delete(`/customers/${id}`)
};

export const supplierApi = {
  getAll: () => api.get("/suppliers"),
  create: (data) => api.post("/suppliers", data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`)
};

export const purchaseApi = {
  getAll: () => api.get("/purchases"),
  create: (data) => api.post("/purchases", data),
  updateStatus: (id, status) => api.put(`/purchases/${id}/status`, { status })
};

export const orderApi = {
  getAll: () => api.get("/orders"),
  create: (data) => api.post("/orders", data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status })
};

export const authApi = {
  loginStep1: (data) => api.post("/auth/login-step1", data),
  loginStep2: (data) => api.post("/auth/login-step2", data),
  register: (data) => api.post("/auth/register", data),
  updateProfile: (data) => api.put("/auth/profile", data),
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
  getBalanceSheet: () => api.get("/reports/balance-sheet")
};

export const gstApi = {
  lookup: (gstin) => api.get(`/gst/lookup/${gstin}`)
};

export default api;
