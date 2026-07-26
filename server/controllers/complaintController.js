// server/controllers/complaintController.js
// Core complaint operations available to students (and shared read logic).

const { db } = require("../config/firebase");

const COMPLAINTS_COLLECTION = "complaints";

// POST /api/complaints  (student raises a new complaint)
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, location, priority } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: "Title, description, category and location are required.",
      });
    }

    const complaintsRef = db.collection(COMPLAINTS_COLLECTION);
    const newDoc = complaintsRef.doc();

    const attachment = req.file ? `/uploads/${req.file.filename}` : null;

    const complaintData = {
      id: newDoc.id,
      title,
      description,
      category, // e.g. Electrical, Plumbing, Furniture, IT, Cleanliness, Other
      location,
      priority: priority || "Medium", // Low, Medium, High
      status: "Open", // Open, In Progress, Resolved, Rejected
      attachment,
      studentUid: req.user.uid,
      studentName: req.user.name,
      assignedStaffUid: null,
      assignedStaffName: null,
      remarks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await newDoc.set(complaintData);

    return res.status(201).json({
      success: true,
      message: "Complaint raised successfully.",
      complaint: complaintData,
    });
  } catch (err) {
    console.error("Create complaint error:", err);
    return res.status(500).json({ success: false, message: "Server error creating complaint." });
  }
};

// GET /api/complaints/my  (student views own complaints)
exports.getMyComplaints = async (req, res) => {
  try {
    const snapshot = await db
      .collection(COMPLAINTS_COLLECTION)
      .where("studentUid", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();

    const complaints = snapshot.docs.map((doc) => doc.data());
    return res.status(200).json({ success: true, count: complaints.length, complaints });
  } catch (err) {
    console.error("Get my complaints error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching complaints." });
  }
};

// GET /api/complaints/:id  (view a single complaint - owner, assigned staff, or admin)
exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const docSnap = await db.collection(COMPLAINTS_COLLECTION).doc(id).get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const complaint = docSnap.data();
    const { uid, role } = req.user;

    const isOwner = complaint.studentUid === uid;
    const isAssignedStaff = complaint.assignedStaffUid === uid;
    const isAdmin = role === "admin";

    if (!isOwner && !isAssignedStaff && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied to this complaint." });
    }

    return res.status(200).json({ success: true, complaint });
  } catch (err) {
    console.error("Get complaint by id error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching complaint." });
  }
};

// PUT /api/complaints/:id  (student edits own complaint while still Open)
exports.updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection(COMPLAINTS_COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const complaint = docSnap.data();

    if (complaint.studentUid !== req.user.uid) {
      return res.status(403).json({ success: false, message: "You can only edit your own complaints." });
    }

    if (complaint.status !== "Open") {
      return res.status(400).json({
        success: false,
        message: "Complaint can only be edited while status is Open.",
      });
    }

    const { title, description, category, location, priority } = req.body;
    const updates = { updatedAt: new Date().toISOString() };
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (category) updates.category = category;
    if (location) updates.location = location;
    if (priority) updates.priority = priority;

    await docRef.update(updates);
    return res.status(200).json({ success: true, message: "Complaint updated." });
  } catch (err) {
    console.error("Update complaint error:", err);
    return res.status(500).json({ success: false, message: "Server error updating complaint." });
  }
};

// DELETE /api/complaints/:id  (student withdraws own Open complaint)
exports.deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection(COMPLAINTS_COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const complaint = docSnap.data();
    if (complaint.studentUid !== req.user.uid) {
      return res.status(403).json({ success: false, message: "You can only delete your own complaints." });
    }

    if (complaint.status !== "Open") {
      return res.status(400).json({
        success: false,
        message: "Only Open complaints can be withdrawn.",
      });
    }

    await docRef.delete();
    return res.status(200).json({ success: true, message: "Complaint withdrawn." });
  } catch (err) {
    console.error("Delete complaint error:", err);
    return res.status(500).json({ success: false, message: "Server error deleting complaint." });
  }
};
