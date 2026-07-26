// client/assets/js/admin-dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const user = Session.requireAuth(["admin"]);
  if (!user) return;

  document.getElementById("welcome-name").textContent = user.name.split(" ")[0];

  try {
    const { stats } = await apiRequest("/admin/stats");
    document.getElementById("stat-total").textContent = stats.total;
    document.getElementById("stat-open").textContent = stats.open;
    document.getElementById("stat-progress").textContent = stats.inProgress;
    document.getElementById("stat-resolved").textContent = stats.resolved;
  } catch (err) {
    showToast(err.message, "error");
  }

  const list = document.getElementById("complaints-list");
  const filterSelect = document.getElementById("status-filter");

  async function loadComplaints() {
    try {
      const val = filterSelect.value;
      const query = val === "all" ? "" : `?status=${encodeURIComponent(val)}`;
      const { complaints } = await apiRequest(`/admin/complaints${query}`);
      renderList(complaints);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderList(complaints) {
    list.innerHTML = "";
    if (complaints.length === 0) {
      list.innerHTML = `<div class="empty-state">No complaints found for this filter.</div>`;
      return;
    }
    complaints.forEach((c) => {
      list.innerHTML += `
        <div class="ticket">
          <div class="ticket-id">Ticket<span class="num mono">${ticketRef(c.id)}</span></div>
          <div class="ticket-body">
            <h3><a href="complaint-details.html?id=${c.id}">${c.title}</a></h3>
            <div class="ticket-meta">
              <span>👤 ${c.studentName}</span>
              <span>🗂️ ${c.category}</span>
              <span class="priority-${c.priority}">⚑ ${c.priority}</span>
              <span>🕒 ${formatDate(c.createdAt)}</span>
              ${c.assignedStaffName ? `<span>🔧 ${c.assignedStaffName}</span>` : `<span>Unassigned</span>`}
            </div>
          </div>
          <div class="ticket-actions">
            <span class="status ${statusClass(c.status)}">${c.status}</span>
          </div>
        </div>`;
    });
  }

  filterSelect.addEventListener("change", loadComplaints);
  loadComplaints();
});
