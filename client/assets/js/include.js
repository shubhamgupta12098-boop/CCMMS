// client/assets/js/include.js
// Injects the shared sidebar + topbar into any page with
// <div id="sidebar-mount"></div> and <div id="topbar-mount"></div>,
// then applies role-based visibility, active-link highlighting,
// user info, and the logout handler.

async function loadComponent(url, mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const res = await fetch(url);
  mount.innerHTML = await res.text();
}

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    loadComponent("../components/sidebar.html", "sidebar-mount"),
    loadComponent("../components/navbar.html", "topbar-mount"),
  ]);

  const user = Session.getUser();
  const currentPage = window.location.pathname.split("/").pop();

  // Role-based nav visibility
  document.querySelectorAll("[data-role]").forEach((el) => {
    if (!user || el.dataset.role !== user.role) el.style.display = "none";
  });

  // Active link highlight
  document.querySelectorAll("[data-page]").forEach((el) => {
    if (el.dataset.page === currentPage) el.classList.add("active");
  });

  // Topbar content from <body data-title data-subtitle>
  const title = document.body.dataset.title;
  const subtitle = document.body.dataset.subtitle;
  if (title) document.getElementById("topbar-title").textContent = title;
  if (subtitle) document.getElementById("topbar-subtitle").textContent = subtitle;

  if (user) {
    document.getElementById("user-initial").textContent = user.name.charAt(0).toUpperCase();
    document.getElementById("user-name").textContent = user.name;
    document.getElementById("user-role").textContent = user.role;
  }

  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      Session.logout();
    });
  }
});
