import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
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

export const orderApi = {
  getAll: () => api.get("/orders"),
  create: (data) => api.post("/orders", data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status })
};

export const authApi = {
  loginStep1: (data) => api.post("/auth/login-step1", data),
  loginStep2: (data) => api.post("/auth/login-step2", data),
  register: (data) => api.post("/auth/register", data)
};

export default api;
