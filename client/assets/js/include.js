// client/assets/js/include.js
// Loads sidebar/navbar and handles navigation + logout.

async function loadComponent(url, mountId) {
  const mount = document.getElementById(mountId);

  if (!mount) return;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Component load failed: ${url}`);
    }

    mount.innerHTML = await response.text();
  } catch (error) {
    console.error(error);
  }
}

function getLoginPageUrl() {
  // All dashboards are inside client/pages/
  return new URL("../login.html", window.location.href).href;
}

function performLogout() {
  localStorage.removeItem("ccmms_token");
  localStorage.removeItem("ccmms_user");

  // replace() prevents returning to dashboard with Android back button
  window.location.replace(getLoginPageUrl());
}

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    loadComponent("../components/sidebar.html", "sidebar-mount"),
    loadComponent("../components/navbar.html", "topbar-mount"),
  ]);

  const user =
    typeof Session !== "undefined"
      ? Session.getUser()
      : null;

  const currentPage =
    window.location.pathname.split("/").pop();

  // Show navigation according to role
  document.querySelectorAll("[data-role]").forEach((element) => {
    if (!user || element.dataset.role !== user.role) {
      element.style.display = "none";
    }
  });

  // Highlight current page
  document.querySelectorAll("[data-page]").forEach((element) => {
    if (element.dataset.page === currentPage) {
      element.classList.add("active");
    }
  });

  // Set topbar title/subtitle
  const titleElement =
    document.getElementById("topbar-title");

  const subtitleElement =
    document.getElementById("topbar-subtitle");

  if (titleElement && document.body.dataset.title) {
    titleElement.textContent =
      document.body.dataset.title;
  }

  if (subtitleElement && document.body.dataset.subtitle) {
    subtitleElement.textContent =
      document.body.dataset.subtitle;
  }

  // Display logged-in user
  if (user) {
    const initialElement =
      document.getElementById("user-initial");

    const nameElement =
      document.getElementById("user-name");

    const roleElement =
      document.getElementById("user-role");

    const userName =
      user.name || user.email || "User";

    if (initialElement) {
      initialElement.textContent =
        userName.charAt(0).toUpperCase();
    }

    if (nameElement) {
      nameElement.textContent = userName;
    }

    if (roleElement) {
      roleElement.textContent =
        user.role || "";
    }
  }

  const logoutLink =
    document.getElementById("logout-link");

  if (logoutLink) {
    logoutLink.setAttribute(
      "href",
      getLoginPageUrl()
    );

    logoutLink.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      performLogout();
    });

    // Android touch support
    logoutLink.addEventListener(
      "touchend",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        performLogout();
      },
      { passive: false }
    );
  }
});