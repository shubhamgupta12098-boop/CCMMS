// client/assets/js/api.js
// API Helper + Session + Toast

const API_BASE = (() => {

  // Android App (Capacitor)
  if (window.Capacitor?.isNativePlatform?.()) {
    return "https://ccmms.onrender.com/api";
  }

  // Website hosted on Render
  if (window.location.hostname.includes("onrender.com")) {
    return "/api";
  }

  // Local Node Server
  if (window.location.port === "5000") {
    return "/api";
  }

  // VS Code Live Server
  return "http://localhost:5000/api";

})();

const Session = {
  setSession(token, user) {
    localStorage.setItem("ccmms_token", token);
    localStorage.setItem("ccmms_user", JSON.stringify(user));
  },

  getToken() {
    return localStorage.getItem("ccmms_token");
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem("ccmms_user"));
    } catch {
      return null;
    }
  },

  clear() {
    localStorage.removeItem("ccmms_token");
    localStorage.removeItem("ccmms_user");
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    this.clear();
    window.location.href = "login.html";
  },

  requireAuth(roles = []) {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      window.location.href = "login.html";
      return;
    }

    if (roles.length && !roles.includes(user.role)) {
      window.location.href = `${user.role}-dashboard.html`;
    }

    return user;
  }
};

async function apiRequest(path, options = {}) {

  const headers = {};

  if (!options.isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = Session.getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(API_BASE + path, {
    method: options.method || "GET",
    headers,
    body: options.body
      ? options.isFormData
        ? options.body
        : JSON.stringify(options.body)
      : undefined
  });

  let data;

  try {
    data = await response.json();
  } catch (e) {
    throw new Error("Unexpected server response.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function showToast(message, type = "success") {

  const old = document.querySelector(".toast");

  if (old) old.remove();

  const toast = document.createElement("div");

  toast.className = `toast ${type}`;

  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {

    toast.remove();

  }, 3000);

}

function statusClass(status) {

  return {
    Open: "status-open",
    "In Progress": "status-progress",
    Resolved: "status-resolved",
    Rejected: "status-rejected"
  }[status] || "status-open";

}

function formatDate(date) {

  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN");

}

function ticketRef(id) {

  return "#" + id.substring(0, 6).toUpperCase();

}