// client/assets/js/student-dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const user = Session.requireAuth(["student"]);
  if (!user) return;

  document.getElementById("welcome-name").textContent = user.name.split(" ")[0];

  try {
    const { complaints } = await apiRequest("/complaints/my");

    const counts = { Open: 0, "In Progress": 0, Resolved: 0, Rejected: 0 };
    complaints.forEach((c) => (counts[c.status] = (counts[c.status] || 0) + 1));

    document.getElementById("stat-total").textContent = complaints.length;
    document.getElementById("stat-open").textContent = counts.Open;
    document.getElementById("stat-progress").textContent = counts["In Progress"];
    document.getElementById("stat-resolved").textContent = counts.Resolved;

    const list = document.getElementById("recent-list");
    list.innerHTML = "";

    if (complaints.length === 0) {
      list.innerHTML = `<div class="empty-state">No complaints yet. Raise your first work order to get started.</div>`;
      return;
    }

    complaints.slice(0, 5).forEach((c) => {
      list.innerHTML += `
        <a href="complaint-details.html?id=${c.id}" class="ticket" style="text-decoration:none;color:inherit;">
          <div class="ticket-id">Ticket<span class="num mono">${ticketRef(c.id)}</span></div>
          <div class="ticket-body">
            <h3>${c.title}</h3>
            <div class="ticket-meta">
              <span>📍 ${c.location}</span>
              <span>🗂️ ${c.category}</span>
              <span>🕒 ${formatDate(c.createdAt)}</span>
            </div>
          </div>
          <div class="ticket-actions">
            <span class="status ${statusClass(c.status)}">${c.status}</span>
          </div>
        </a>`;
    });
  } catch (err) {
    showToast(err.message, "error");
  }
});
