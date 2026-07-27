// client/assets/js/my-complaints.js
document.addEventListener("DOMContentLoaded", async () => {
  const user = Session.requireAuth(["student"]);
  if (!user) return;

  let allComplaints = [];
  const list = document.getElementById("complaints-list");
  const filterSelect = document.getElementById("status-filter");

  function render(complaints) {
    list.innerHTML = "";
    if (complaints.length === 0) {
      list.innerHTML = `<div class="empty-state">No complaints match this filter.</div>`;
      return;
    }
    complaints.forEach((c) => {
      list.innerHTML += `
        <div class="ticket">
          <div class="ticket-id">Ticket<span class="num mono">${ticketRef(c.id)}</span></div>
          <div class="ticket-body">
            <h3><a href="complaint-details.html?id=${c.id}">${c.title}</a></h3>
            <div class="ticket-meta">
              <span>📍 ${c.location}</span>
              <span>🗂️ ${c.category}</span>
              <span class="priority-${c.priority}">⚑ ${c.priority}</span>
              <span>🕒 ${formatDate(c.createdAt)}</span>
            </div>
          </div>
          <div class="ticket-actions">
            <span class="status ${statusClass(c.status)}">${c.status}</span>
            ${c.status === "Open" ? `<button class="btn btn-sm btn-outline" data-withdraw="${c.id}">Withdraw</button>` : ""}
          </div>
        </div>`;
    });

    list.querySelectorAll("[data-withdraw]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Withdraw this complaint? This cannot be undone.")) return;
        try {
          await apiRequest(`/complaints/${btn.dataset.withdraw}`, { method: "DELETE" });
          showToast("Complaint withdrawn.", "success");
          loadComplaints();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  }

  async function loadComplaints() {
    try {
      const { complaints } = await apiRequest("/complaints/my");
      allComplaints = complaints;
      applyFilter();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function applyFilter() {
    const val = filterSelect.value;
    render(val === "all" ? allComplaints : allComplaints.filter((c) => c.status === val));
  }

  filterSelect.addEventListener("change", applyFilter);
  loadComplaints();
});
