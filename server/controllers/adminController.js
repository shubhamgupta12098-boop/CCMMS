// server/controllers/adminController.js
// Admin-only operations: view all complaints, assign staff, manage users, view stats.

const { db } = require("../config/firebase");

const COMPLAINTS_COLLECTION = "complaints";
const USERS_COLLECTION = "users";

// GET /api/admin/complaints  (optional query filters: status, category, priority)
exports.getAllComplaints = async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    let query = db.collection(COMPLAINTS_COLLECTION);

    if (status) query = query.where("status", "==", status);
    if (category) query = query.where("category", "==", category);
    if (priority) query = query.where("priority", "==", priority);

    const snapshot = await query.orderBy("createdAt", "desc").get();
    const complaints = snapshot.docs.map((doc) => doc.data());

    return res.status(200).json({ success: true, count: complaints.length, complaints });
  } catch (err) {
    console.error("Get all complaints error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching complaints." });
  }
};

// PUT /api/admin/complaints/:id/assign  (assign a staff member to a complaint)
exports.assignStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffUid } = req.body;

    if (!staffUid) {
      return res.status(400).json({ success: false, message: "staffUid is required." });
    }

    const staffSnap = await db
      .collection(USERS_COLLECTION)
      .where("uid", "==", staffUid)
      .where("role", "==", "staff")
      .limit(1)
      .get();

    if (staffSnap.empty) {
      return res.status(404).json({ success: false, message: "Staff member not found." });
    }

    const staffData = staffSnap.docs[0].data();
    const complaintRef = db.collection(COMPLAINTS_COLLECTION).doc(id);
    const complaintSnap = await complaintRef.get();

    if (!complaintSnap.exists) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    await complaintRef.update({
      assignedStaffUid: staffData.uid,
      assignedStaffName: staffData.name,
      status: "In Progress",
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: `Assigned to ${staffData.name}.` });
  } catch (err) {
    console.error("Assign staff error:", err);
    return res.status(500).json({ success: false, message: "Server error assigning staff." });
  }
};

// PUT /api/admin/complaints/:id/status  (force-update status, e.g. Reject)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;
    const validStatuses = ["Open", "In Progress", "Resolved", "Rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const complaintRef = db.collection(COMPLAINTS_COLLECTION).doc(id);
    const complaintSnap = await complaintRef.get();

    if (!complaintSnap.exists) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const updates = { status, updatedAt: new Date().toISOString() };

    if (remark) {
      const complaint = complaintSnap.data();
      const remarks = complaint.remarks || [];
      remarks.push({
        text: remark,
        by: req.user.name,
        role: req.user.role,
        at: new Date().toISOString(),
      });
      updates.remarks = remarks;
    }

    await complaintRef.update(updates);
    return res.status(200).json({ success: true, message: "Status updated." });
  } catch (err) {
    console.error("Update status error:", err);
    return res.status(500).json({ success: false, message: "Server error updating status." });
  }
};

// GET /api/admin/users  (list all users, optional ?role= filter)
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = db.collection(USERS_COLLECTION);
    if (role) query = query.where("role", "==", role);

    const snapshot = await query.get();
    const users = snapshot.docs.map((doc) => {
      const { password, ...safe } = doc.data();
      return safe;
    });

    return res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    console.error("Get all users error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching users." });
  }
};

// DELETE /api/admin/users/:uid  (remove a user account)
exports.deleteUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const snapshot = await db.collection(USERS_COLLECTION).where("uid", "==", uid).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await snapshot.docs[0].ref.delete();
    return res.status(200).json({ success: true, message: "User removed." });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ success: false, message: "Server error deleting user." });
  }
};

// GET /api/admin/stats  (dashboard summary counts)
exports.getDashboardStats = async (req, res) => {
  try {
    const snapshot = await db.collection(COMPLAINTS_COLLECTION).get();
    const complaints = snapshot.docs.map((doc) => doc.data());

    const stats = {
      total: complaints.length,
      open: complaints.filter((c) => c.status === "Open").length,
      inProgress: complaints.filter((c) => c.status === "In Progress").length,
      resolved: complaints.filter((c) => c.status === "Resolved").length,
      rejected: complaints.filter((c) => c.status === "Rejected").length,
      byCategory: complaints.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {}),
    };

    return res.status(200).json({ success: true, stats });
  } catch (err) {
    console.error("Get dashboard stats error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching stats." });
  }
};
