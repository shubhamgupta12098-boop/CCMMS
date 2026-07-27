// client/assets/js/complaint-details.js
document.addEventListener("DOMContentLoaded", async () => {
  const user = Session.requireAuth();
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    document.getElementById("details-root").innerHTML = `<div class="empty-state">No complaint specified.</div>`;
    return;
  }

  const root = document.getElementById("details-root");

  async function load() {
    try {
      const { complaint: c } = await apiRequest(`/complaints/${id}`);

      root.innerHTML = `
        <div class="card mb-24">
          <div class="flex-between mb-16">
            <div>
              <span class="mono text-soft">Ticket ${ticketRef(c.id)}</span>
              <h2>${c.title}</h2>
            </div>
            <span class="status ${statusClass(c.status)}">${c.status}</span>
          </div>
          <p>${c.description}</p>
          <div class="ticket-meta mb-16" style="margin-top:16px;">
            <span>📍 ${c.location}</span>
            <span>🗂️ ${c.category}</span>
            <span class="priority-${c.priority}">⚑ ${c.priority} priority</span>
            <span>🕒 Raised ${formatDate(c.createdAt)}</span>
          </div>
          <div class="text-soft" style="font-size:0.85rem;">Raised by: ${c.studentName}</div>
          ${c.assignedStaffName ? `<div class="text-soft" style="font-size:0.85rem;">Assigned to: ${c.assignedStaffName}</div>` : ""}
          ${c.attachment ? `<div class="mt-16"><a href="${c.attachment}" target="_blank">📎 View attachment</a></div>` : ""}
        </div>

        <div class="card mb-24">
          <h3>Remarks &amp; Updates</h3>
          <div id="remarks-list" class="mt-16"></div>
        </div>

        <div id="action-panel"></div>
      `;

      const remarksList = document.getElementById("remarks-list");
      if (!c.remarks || c.remarks.length === 0) {
        remarksList.innerHTML = `<div class="text-soft" style="font-size:0.88rem;">No updates yet.</div>`;
      } else {
        remarksList.innerHTML = c.remarks
          .map(
            (r) => `
          <div style="border-left:2px solid var(--line); padding-left:12px; margin-bottom:12px;">
            <div style="font-size:0.85rem;">${r.text}</div>
            <div class="text-soft mono" style="font-size:0.72rem; margin-top:4px;">${r.by} (${r.role}) · ${formatDate(r.at)}</div>
          </div>`
          )
          .join("");
      }

      renderActionPanel(c);
    } catch (err) {
      root.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  }

  function renderActionPanel(c) {
    const panel = document.getElementById("action-panel");

    if (user.role === "staff" && c.assignedStaffUid === user.uid && c.status !== "Resolved") {
      panel.innerHTML = `
        <div class="card">
          <h3>Update Status</h3>
          <form id="staff-update-form" class="mt-16">
            <div class="form-group">
              <label for="staff-status">New status</label>
              <select id="staff-status">
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div class="form-group">
              <label for="staff-remark">Remark</label>
              <textarea id="staff-remark" placeholder="What did you do / find?"></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Save Update</button>
          </form>
        </div>`;

      document.getElementById("staff-update-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          await apiRequest(`/staff/complaints/${c.id}/status`, {
            method: "PUT",
            body: {
              status: document.getElementById("staff-status").value,
              remark: document.getElementById("staff-remark").value.trim(),
            },
          });
          showToast("Complaint updated.", "success");
          load();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
      return;
    }

    if (user.role === "admin") {
      panel.innerHTML = `
        <div class="card">
          <h3>Admin Actions</h3>
          <form id="admin-assign-form" class="mt-16">
            <div class="form-group">
              <label for="staff-uid">Assign staff (enter staff UID)</label>
              <input id="staff-uid" placeholder="Staff UID from Manage Users" />
            </div>
            <button type="submit" class="btn btn-outline">Assign</button>
          </form>
          <form id="admin-status-form" class="mt-16">
            <div class="form-group">
              <label for="admin-status">Force status</label>
              <select id="admin-status">
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div class="form-group">
              <label for="admin-remark">Remark</label>
              <textarea id="admin-remark" placeholder="Reason / note"></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Update Status</button>
          </form>
        </div>`;

      document.getElementById("admin-assign-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          await apiRequest(`/admin/complaints/${c.id}/assign`, {
            method: "PUT",
            body: { staffUid: document.getElementById("staff-uid").value.trim() },
          });
          showToast("Staff assigned.", "success");
          load();
        } catch (err) {
          showToast(err.message, "error");
        }
      });

      document.getElementById("admin-status-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          await apiRequest(`/admin/complaints/${c.id}/status`, {
            method: "PUT",
            body: {
              status: document.getElementById("admin-status").value,
              remark: document.getElementById("admin-remark").value.trim(),
            },
          });
          showToast("Status updated.", "success");
          load();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    }
  }

  load();
});
