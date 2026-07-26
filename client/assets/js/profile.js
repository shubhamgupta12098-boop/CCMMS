// client/assets/js/profile.js
document.addEventListener("DOMContentLoaded", async () => {
  const user = Session.requireAuth();
  if (!user) return;

  document.getElementById("p-name").value = user.name || "";
  document.getElementById("p-email").value = user.email || "";
  document.getElementById("p-role").value = user.role || "";
  document.getElementById("p-department").value = user.department || "";
  document.getElementById("p-rollnumber").value = user.rollNumber || "";

  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await apiRequest("/auth/profile", {
        method: "PUT",
        body: {
          name: document.getElementById("p-name").value.trim(),
          department: document.getElementById("p-department").value.trim(),
          rollNumber: document.getElementById("p-rollnumber").value.trim(),
        },
      });
      const updatedUser = { ...user, name: document.getElementById("p-name").value.trim() };
      Session.setSession(Session.getToken(), updatedUser);
      showToast("Profile updated.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  });
});
