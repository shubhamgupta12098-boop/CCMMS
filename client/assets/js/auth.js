// client/assets/js/auth.js
// Handles login and registration forms.

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  function openDashboard(role) {
    const validRoles = ["student", "staff", "admin"];

    if (!validRoles.includes(role)) {
      throw new Error("Invalid user role received from server.");
    }

    window.location.href = `pages/${role}-dashboard.html`;
  }

  // ================= LOGIN =================
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitBtn = loginForm.querySelector(
        'button[type="submit"]'
      );

      submitBtn.disabled = true;
      submitBtn.textContent = "Signing in...";

      try {
        const email = document
          .getElementById("email")
          .value
          .trim();

        const password = document
          .getElementById("password")
          .value;

        const data = await apiRequest("/auth/login", {
          method: "POST",
          body: {
            email,
            password,
          },
        });

        if (
          data.success === false ||
          !data.token ||
          !data.user ||
          !data.user.role
        ) {
          throw new Error(
            data.message || "Login failed. Please try again."
          );
        }

        Session.setSession(data.token, data.user);

        showToast("Login successful!", "success");

        setTimeout(() => {
          openDashboard(data.user.role);
        }, 500);
      } catch (error) {
        showToast(
          error.message || "Login failed.",
          "error"
        );

        submitBtn.disabled = false;
        submitBtn.textContent = "Sign In";
      }
    });
  }

  // ================= REGISTER =================
  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitBtn = registerForm.querySelector(
        'button[type="submit"]'
      );

      submitBtn.disabled = true;
      submitBtn.textContent = "Creating account...";

      try {
        const name = document
          .getElementById("name")
          .value
          .trim();

        const email = document
          .getElementById("email")
          .value
          .trim();

        const password = document
          .getElementById("password")
          .value;

        const role = document
          .getElementById("role")
          .value;

        const department =
          document
            .getElementById("department")
            ?.value
            .trim() || "";

        const rollNumber =
          document
            .getElementById("rollNumber")
            ?.value
            .trim() || "";

        const data = await apiRequest("/auth/register", {
          method: "POST",
          body: {
            name,
            email,
            password,
            role,
            department,
            rollNumber,
          },
        });

        if (
          data.success === false ||
          !data.token ||
          !data.user ||
          !data.user.role
        ) {
          throw new Error(
            data.message ||
              "Registration failed. Please try again."
          );
        }

        Session.setSession(data.token, data.user);

        showToast(
          "Account created successfully!",
          "success"
        );

        setTimeout(() => {
          openDashboard(data.user.role);
        }, 700);
      } catch (error) {
        showToast(
          error.message || "Registration failed.",
          "error"
        );

        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
      }
    });
  }
});