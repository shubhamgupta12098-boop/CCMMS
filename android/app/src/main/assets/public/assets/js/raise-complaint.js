// client/assets/js/raise-complaint.js
document.addEventListener("DOMContentLoaded", () => {
  const user = Session.requireAuth(["student"]);
  if (!user) return;

  const form = document.getElementById("complaint-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    try {
      const formData = new FormData();
      formData.append("title", document.getElementById("title").value.trim());
      formData.append("description", document.getElementById("description").value.trim());
      formData.append("category", document.getElementById("category").value);
      formData.append("location", document.getElementById("location").value.trim());
      formData.append("priority", document.getElementById("priority").value);

      const fileInput = document.getElementById("attachment");
      if (fileInput.files[0]) formData.append("attachment", fileInput.files[0]);

      await apiRequest("/complaints", { method: "POST", body: formData, isFormData: true });

      showToast("Complaint raised successfully.", "success");
      setTimeout(() => (window.location.href = "my-complaints.html"), 900);
    } catch (err) {
      showToast(err.message, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Complaint";
    }
  });
});
