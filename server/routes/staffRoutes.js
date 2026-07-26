// server/routes/staffRoutes.js
const express = require("express");
const router = express.Router();

const staffController = require("../controllers/staffController");
const verifyToken = require("../middleware/verifyToken");
const roleMiddleware = require("../middleware/roleMiddleware");

// All staff routes require a logged-in staff member
router.use(verifyToken, roleMiddleware(["staff"]));

router.get("/complaints", staffController.getAssignedComplaints);
router.put("/complaints/:id/status", staffController.updateAssignedStatus);

module.exports = router;
