// client/assets/js/staff-dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const user = Session.requireAuth(["staff"]);
  if (!user) return;

  document.getElementById("welcome-name").textContent = user.name.split(" ")[0];

  const list = document.getElementById("assigned-list");

  try {
    const { complaints } = await apiRequest("/staff/complaints");

    const counts = { "In Progress": 0, Resolved: 0 };
    complaints.forEach((c) => (counts[c.status] = (counts[c.status] || 0) + 1));
    document.getElementById("stat-total").textContent = complaints.length;
    document.getElementById("stat-progress").textContent = counts["In Progress"];
    document.getElementById("stat-resolved").textContent = counts.Resolved;

    if (complaints.length === 0) {
      list.innerHTML = `<div class="empty-state">No work orders assigned to you yet.</div>`;
      return;
    }

    list.innerHTML = "";
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
            </div>
          </div>
          <div class="ticket-actions">
            <span class="status ${statusClass(c.status)}">${c.status}</span>
            <a href="complaint-details.html?id=${c.id}" class="btn btn-sm btn-outline">Update</a>
          </div>
        </div>`;
    });
  } catch (err) {
    showToast(err.message, "error");
  }
});
