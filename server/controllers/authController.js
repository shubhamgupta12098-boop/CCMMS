// server/controllers/authController.js
// Handles user registration, login, profile retrieval and profile updates.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");
require("dotenv").config();

const USERS_COLLECTION = "users";

// Public registration ke liye admin role allow nahi kiya gaya.
// Admin account Firestore ya kisi protected admin route se create karo.
const REGISTER_ROLES = ["student", "staff"];

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing in environment variables.");
  }

  return secret;
}

function createToken(user) {
  return jwt.sign(
    {
      uid: user.uid,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

function createSafeUser(userData) {
  return {
    uid: userData.uid,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    department: userData.department || "",
    rollNumber: userData.rollNumber || "",
    createdAt: userData.createdAt || null,
    updatedAt: userData.updatedAt || null,
  };
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      rollNumber,
    } = req.body || {};

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");
    const cleanDepartment = String(department || "").trim();
    const cleanRollNumber = String(rollNumber || "").trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters.",
      });
    }

    const finalRole = REGISTER_ROLES.includes(role)
      ? role
      : "student";

    const usersRef = db.collection(USERS_COLLECTION);

    const existingUser = await usersRef
      .where("email", "==", cleanEmail)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    const newUserRef = usersRef.doc();

    const userData = {
      uid: newUserRef.id,
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: finalRole,
      department: cleanDepartment || null,
      rollNumber: cleanRollNumber || null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };

    await newUserRef.set(userData);

    const token = createToken(userData);
    const safeUser = createSafeUser(userData);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Server error during registration.",
    });
  }
};

// POST /api/auth/login
exports.login =