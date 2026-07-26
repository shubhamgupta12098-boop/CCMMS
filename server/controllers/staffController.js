// server/controllers/staffController.js
// Operations available to staff members handling assigned complaints.

const { db } = require("../config/firebase");

const COMPLAINTS_COLLECTION = "complaints";

// GET /api/staff/complaints  (complaints assigned to the logged-in staff member)
exports.getAssignedComplaints = async (req, res) => {
  try {
    const snapshot = await db
      .collection(COMPLAINTS_COLLECTION)
      .where("assignedStaffUid", "==", req.user.uid)
      .orderBy("updatedAt", "desc")
      .get();

    const complaints = snapshot.docs.map((doc) => doc.data());
    return res.status(200).json({ success: true, count: complaints.length, complaints });
  } catch (err) {
    console.error("Get assigned complaints error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching assigned complaints." });
  }
};

// PUT /api/staff/complaints/:id/status  (staff updates progress on their assigned complaint)
exports.updateAssignedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;
    const validStatuses = ["In Progress", "Resolved"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Staff can only set status to 'In Progress' or 'Resolved'.",
      });
    }

    const complaintRef = db.collection(COMPLAINTS_COLLECTION).doc(id);
    const complaintSnap = await complaintRef.get();

    if (!complaintSnap.exists) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const complaint = complaintSnap.data();
    if (complaint.assignedStaffUid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "You can only update complaints assigned to you.",
      });
    }

    const remarks = complaint.remarks || [];
    if (remark) {
      remarks.push({
        text: remark,
        by: req.user.name,
        role: "staff",
        at: new Date().toISOString(),
      });
    }

    await complaintRef.update({
      status,
      remarks,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: "Complaint status updated." });
  } catch (err) {
    console.error("Update assigned status error:", err);
    return res.status(500).json({ success: false, message: "Server error updating complaint." });
  }
};
