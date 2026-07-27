// client/assets/js/auth.js
// Handles the login and register forms.

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Signing in…";

      try {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const data = await apiRequest("/auth/login", {
          method: "POST",
          body: { email, password },
        });

        Session.setSession(data.token, data.user);
        window.location.href = `${data.user.role}-dashboard.html`;
      } catch (err) {
        showToast(err.message, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign In";
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating account…";

      try {
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;
        const department = document.getElementById("department")?.value.trim() || "";
        const rollNumber = document.getElementById("rollNumber")?.value.trim() || "";

        const data = await apiRequest("/auth/register", {
          method: "POST",
          body: { name, email, password, role, department, rollNumber },
        });

        Session.setSession(data.token, data.user);
        showToast("Account created!", "success");
        window.location.href = `${data.user.role}-dashboard.html`;
      } catch (err) {
        showToast(err.message, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
      }
    });
  }
});
