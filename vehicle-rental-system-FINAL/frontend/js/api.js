/* =========================================================
   api.js — single point of contact with the Java/Spring backend.
   Change API_BASE if you deploy the backend somewhere else.
   ========================================================= */
const API_BASE = "http://localhost:8080/api";

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch (e) { data = text; }
  }

  if (!res.ok) {
    const message = (data && data.message) ? data.message : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

const Api = {
  // ---- Vehicles ----
  getVehicles: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/vehicles${qs ? "?" + qs : ""}`);
  },
  getVehicle: (id) => apiRequest(`/vehicles/${id}`),
  createVehicle: (payload) => apiRequest(`/vehicles`, { method: "POST", body: JSON.stringify(payload) }),
  updateVehicle: (id, payload) => apiRequest(`/vehicles/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteVehicle: (id) => apiRequest(`/vehicles/${id}`, { method: "DELETE" }),
  setVehicleStatus: (id, status) => apiRequest(`/vehicles/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // ---- Auth / Users ----
  register: (payload) => apiRequest(`/auth/register`, { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => apiRequest(`/auth/login`, { method: "POST", body: JSON.stringify(payload) }),
  resendVerification: (email) => apiRequest(`/auth/resend-verification`, { method: "POST", body: JSON.stringify({ email }) }),
  getUsers: () => apiRequest(`/users`),
  updateUser: (id, payload) => apiRequest(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteUser: (id) => apiRequest(`/users/${id}`, { method: "DELETE" }),

  // ---- Bookings ----
  getBookings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/bookings${qs ? "?" + qs : ""}`);
  },
  createBooking: (payload) => apiRequest(`/bookings`, { method: "POST", body: JSON.stringify(payload) }),
  setBookingStatus: (id, status) => apiRequest(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  payBooking: (id) => apiRequest(`/bookings/${id}/pay`, { method: "PATCH" }),
  deleteBooking: (id) => apiRequest(`/bookings/${id}`, { method: "DELETE" }),

  // ---- Reviews ----
  createReview: (payload) => apiRequest(`/reviews`, { method: "POST", body: JSON.stringify(payload) }),
  getReviewsForVehicle: (vehicleId) => apiRequest(`/reviews/vehicle/${vehicleId}`),
  getReviewsByCustomer: (customerId) => apiRequest(`/reviews/customer/${customerId}`),
  getAllReviews: () => apiRequest(`/reviews`),
  deleteReview: (id) => apiRequest(`/reviews/${id}`, { method: "DELETE" }),

  // ---- AI Insights (UC-04) ----
  getAiRecommendations: (customerId) => apiRequest(`/ai/recommendations${customerId ? "?customerId=" + customerId : ""}`),
  predictPrice: (vehicleId, days) => apiRequest(`/ai/predict-price`, { method: "POST", body: JSON.stringify({ vehicleId, days }) }),
  getAiDemand: (category) => apiRequest(`/ai/predict-demand${category ? "?category=" + encodeURIComponent(category) : ""}`),
  getAiPatterns: () => apiRequest(`/ai/patterns`),
  getAiModelComparison: () => apiRequest(`/ai/model-comparison`),
};

/* ---------- Session helpers (localStorage) ---------- */
const Session = {
  save(user) { localStorage.setItem("dl_user", JSON.stringify(user)); },
  get() { const raw = localStorage.getItem("dl_user"); return raw ? JSON.parse(raw) : null; },
  clear() { localStorage.removeItem("dl_user"); },
  isAdmin() { const u = this.get(); return u && u.role === "ADMIN"; },
};

/* ---------- Toast ---------- */
function toast(message, type = "") {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = `toast show ${type}`;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

function money(n) {
  if (n === null || n === undefined) return "-";
  return "LKR " + Number(n).toLocaleString("en-LK", { maximumFractionDigits: 0 });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

// Shared badge coloring for a booking's paymentStatus - REFUNDED gets its own
// neutral color so it doesn't look like an unpaid debt (red) or an active
// payment (green); it's a resolved, informational state.
function paymentBadgeStyle(paymentStatus) {
  if (paymentStatus === "PAID") return "#E4F3EA;color:#2F8F5B";
  if (paymentStatus === "REFUNDED") return "#E8ECF3;color:#4A5A78";
  return "#FDEDE9;color:#C7462F"; // UNPAID
}
