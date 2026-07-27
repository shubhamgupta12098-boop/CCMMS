// server/config/firebase.js
// Firebase Admin setup for local development and Render.
// Never commit firebase-service-account.json or real secrets to GitHub.

const fs = require("fs");
const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getStorage } = require("firebase-admin/storage");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const serviceAccountPath = path.join(__dirname, "firebase-service-account.json");

function clean(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function normalisePrivateKey(rawValue) {
  let value = clean(rawValue);
  if (!value) return "";

  // Also accepts a Base64-encoded private key through
  // FIREBASE_PRIVATE_KEY_BASE64, which is often easiest on hosting sites.
  if (!value.includes("BEGIN PRIVATE KEY")) {
    try {
      const decoded = Buffer.from(value, "base64").toString("utf8").trim();
      if (decoded.includes("BEGIN PRIVATE KEY")) value = decoded;
    } catch (_) {
      // Keep the original value; validation below gives a useful error.
    }
  }

  value = value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();

  if (
    !value.startsWith("-----BEGIN PRIVATE KEY-----") ||
    !value.endsWith("-----END PRIVATE KEY-----")
  ) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY is invalid. Paste the complete private_key from the Firebase service-account JSON, including BEGIN/END lines, or set FIREBASE_PRIVATE_KEY_BASE64."
    );
  }

  return `${value}\n`;
}

function getCredential() {
  // Local-only fallback. This file is ignored by Git and removed from the
  // distributable ZIP. Render should use environment variables instead.
  if (fs.existsSync(serviceAccountPath)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return cert(require(serviceAccountPath));
  }

  const projectId = clean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKeySource =
    process.env.FIREBASE_PRIVATE_KEY_BASE64 || process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = normalisePrivateKey(privateKeySource);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase credentials missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (or FIREBASE_PRIVATE_KEY_BASE64) in Render Environment."
    );
  }

  return cert({ projectId, clientEmail, privateKey });
}

if (getApps().length === 0) {
  const options = { credential: getCredential() };

  const databaseURL = clean(process.env.FIREBASE_DATABASE_URL);
  const storageBucket = clean(process.env.FIREBASE_STORAGE_BUCKET);

  if (databaseURL) options.databaseURL = databaseURL;
  if (storageBucket) options.storageBucket = storageBucket;

  initializeApp(options);
}

const db = getFirestore();
const auth = getAuth();
const bucket = clean(process.env.FIREBASE_STORAGE_BUCKET)
  ? getStorage().bucket()
  : null;

module.exports = { db, auth, bucket };
