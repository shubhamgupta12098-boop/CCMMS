// server/config/firebase.js
// Firebase Admin setup for local development and Render.
// Recommended on Render: FIREBASE_SERVICE_ACCOUNT_JSON (complete Firebase JSON).

const fs = require("fs");
const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getStorage } = require("firebase-admin/storage");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const localServiceAccountPath = path.join(
  __dirname,
  "firebase-service-account.json"
);

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

  value = value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();

  if (
    !value.startsWith("-----BEGIN PRIVATE KEY-----") ||
    !value.endsWith("-----END PRIVATE KEY-----")
  ) {
    throw new Error("Firebase private key is not valid PEM data.");
  }

  return `${value}\n`;
}

function credentialFromObject(serviceAccount) {
  if (
    !serviceAccount ||
    !serviceAccount.project_id ||
    !serviceAccount.client_email ||
    !serviceAccount.private_key
  ) {
    throw new Error(
      "Firebase service-account JSON is missing project_id, client_email, or private_key."
    );
  }

  return cert({
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: normalisePrivateKey(serviceAccount.private_key),
  });
}

function credentialFromJson(rawJson) {
  const value = clean(rawJson);
  if (!value) return null;

  try {
    return credentialFromObject(JSON.parse(value));
  } catch (error) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT_JSON is invalid: ${error.message}`);
  }
}

function credentialFromBase64(rawBase64) {
  const value = clean(rawBase64);
  if (!value) return null;

  try {
    const jsonText = Buffer.from(value, "base64").toString("utf8");
    return credentialFromObject(JSON.parse(jsonText));
  } catch (error) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT_BASE64 is invalid: ${error.message}`
    );
  }
}

function getCredential() {
  // Simplest Render setup: paste the complete downloaded JSON as one value.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return credentialFromJson(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  // Base64 alternative.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return credentialFromBase64(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
    );
  }

  // Local development only; this file is ignored by Git.
  if (fs.existsSync(localServiceAccountPath)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return credentialFromObject(require(localServiceAccountPath));
  }

  throw new Error(
    "Firebase credentials missing. In Render, add FIREBASE_SERVICE_ACCOUNT_JSON and paste the complete fresh service-account JSON."
  );
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
