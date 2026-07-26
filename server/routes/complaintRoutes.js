// server/routes/complaintRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const complaintController = require("../controllers/complaintController");
const verifyToken = require("../middleware/verifyToken");
const roleMiddleware = require("../middleware/roleMiddleware");

// Multer setup for complaint photo/attachment uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error("Only JPG, PNG or PDF files are allowed."), ok);
  },
});

// All complaint routes require a logged-in user
router.use(verifyToken);

router.post("/", roleMiddleware(["student"]), upload.single("attachment"), complaintController.createComplaint);
router.get("/my", roleMiddleware(["student"]), complaintController.getMyComplaints);
router.get("/:id", complaintController.getComplaintById);
router.put("/:id", roleMiddleware(["student"]), complaintController.updateComplaint);
router.delete("/:id", roleMiddleware(["student"]), complaintController.deleteComplaint);

module.exports = router;
