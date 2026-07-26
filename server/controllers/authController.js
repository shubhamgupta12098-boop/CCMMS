// server/controllers/authController.js
// Handles user registration, login, and profile retrieval.
// Users are stored in Firestore "users" collection; passwords hashed with bcrypt.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");
require("dotenv").config();

const USERS_COLLECTION = "users";
const VALID_ROLES = ["student", "staff", "admin"];

function signToken(user) {
  return jwt.sign(
    {
      uid: user.uid,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, rollNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const finalRole = VALID_ROLES.includes(role) ? role : "student";

    const usersRef = db.collection(USERS_COLLECTION);
    const existing = await usersRef.where("email", "==", email).limit(1).get();

    if (!existing.empty) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserRef = usersRef.doc();
    const userData = {
      uid: newUserRef.id,
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      department: department || null,
      rollNumber: rollNumber || null,
      createdAt: new Date().toISOString(),
    };

    await newUserRef.set(userData);

    const token = signToken(userData);
    const { password: _pw, ...safeUser } = userData;

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: "Server error during registration." });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const usersRef = db.collection(USERS_COLLECTION);
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = signToken(userData);
    const { password: _pw, ...safeUser } = userData;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error during login." });
  }
};

// GET /api/auth/profile  (requires verifyToken)
exports.getProfile = async (req, res) => {
  try {
    const usersRef = db.collection(USERS_COLLECTION);
    const snapshot = await usersRef.where("uid", "==", req.user.uid).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const { password, ...safeUser } = snapshot.docs[0].data();
    return res.status(200).json({ success: true, user: safeUser });
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching profile." });
  }
};

// PUT /api/auth/profile (requires verifyToken)
exports.updateProfile = async (req, res) => {
  try {
    const { name, department, rollNumber } = req.body;
    const usersRef = db.collection(USERS_COLLECTION);
    const snapshot = await usersRef.where("uid", "==", req.user.uid).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const docRef = snapshot.docs[0].ref;
    const updates = {};
    if (name) updates.name = name;
    if (department) updates.department = department;
    if (rollNumber) updates.rollNumber = rollNumber;
    updates.updatedAt = new Date().toISOString();

    await docRef.update(updates);
    return res.status(200).json({ success: true, message: "Profile updated." });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ success: false, message: "Server error updating profile." });
  }
};
