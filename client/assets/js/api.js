// client/assets/js/api.js
// Fetch helper, session storage, and shared UI utilities.

// When pages are opened through the Node server, use the same origin.
// When opened through VS Code Live Server (port 5500), send API calls to
// the backend running on port 5000 instead of accidentally posting to 5500.
const API_BASE = (() => {
  const { protocol, hostname, port } = window.location;

  if (port === "5000" || !port) return "/api";

  // Android emulator can later override this value before loading api.js:
  // window.CCMMS_API_BASE = "http://10.0.2.2:5000/api";
  if (window.CCMMS_API_BASE) return window.CCMMS_API_BASE;

  return `${protocol}//${hostname}:5000/api`;
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
    const raw = localStorage.getItem("ccmms_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      Session.clear();
      return null;
    }
  },
  clear() {
    localStorage.removeItem("ccmms_token");
    localStorage.removeItem("ccmms_user");
  },
  isLoggedIn() {
    return Boolean(Session.getToken());
  },
  requireAuth(allowedRoles = []) {
    const user = Session.getUser();
    if (!Session.isLoggedIn() || !user) {
      window.location.href = "login.html";
      return null;
    }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      window.location.href = `${user.role}-dashboard.html`;
      return null;
    }
    return user;
  },
  logout() {
    Session.clear();
    window.location.href = "login.html";
  },
};

async function apiRequest(path, { method = "GET", body = null, isFormData = false } = {}) {
  const headers = {};
  const token = Session.getToken();

  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new Error("Backend server nahi mil raha. Terminal me 'cd server' aur 'node server.js' chalao.");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = { success: false, message: "Unexpected server response." };
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function statusClass(status) {
  return {
    Open: "status-open",
    "In Progress": "status-progress",
    Resolved: "status-resolved",
    Rejected: "status-rejected",
  }[status] || "status-open";
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ticketRef(id) {
  return `#${id.slice(0, 6).toUpperCase()}`;
}
