// server/routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const verifyToken = require("../middleware/verifyToken");
const roleMiddleware = require("../middleware/roleMiddleware");

// All admin routes require a logged-in admin
router.use(verifyToken, roleMiddleware(["admin"]));

router.get("/complaints", adminController.getAllComplaints);
router.put("/complaints/:id/assign", adminController.assignStaff);
router.put("/complaints/:id/status", adminController.updateComplaintStatus);
router.get("/users", adminController.getAllUsers);
router.delete("/users/:uid", adminController.deleteUser);
router.get("/stats", adminController.getDashboardStats);

module.exports = router;
