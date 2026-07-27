// server/config/firebase.js
// Firebase Admin setup for local development and Render.
// Never commit a service-account JSON file or real secrets to GitHub.

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
    throw new Error(
      "Invalid Firebase private key. Recommended: set FIREBASE_SERVICE_ACCOUNT_BASE64 to the Base64 of the complete downloaded Firebase JSON file."
    );
  }

  return `${value}\n`;
}

function credentialFromServiceAccountBase64(encodedValue) {
  const encoded = clean(encodedValue);
  if (!encoded) return null;

  try {
    const jsonText = Buffer.from(encoded, "base64").toString("utf8");
    const serviceAccount = JSON.parse(jsonText);

    if (
      !serviceAccount.project_id ||
      !serviceAccount.client_email ||
      !serviceAccount.private_key
    ) {
      throw new Error("Required service-account fields are missing");
    }

    return cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: normalisePrivateKey(serviceAccount.private_key),
    });
  } catch (error) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT_BASE64 is invalid: ${error.message}`
    );
  }
}

function getCredential() {
  // Recommended on Render: Base64 of the complete Firebase service-account JSON.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return credentialFromServiceAccountBase64(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
    );
  }

  // Local-only fallback. This file is ignored by Git.
  if (fs.existsSync(localServiceAccountPath)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return cert(require(localServiceAccountPath));
  }

  // Alternative setup using separate Render variables.
  const projectId = clean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
  let privateKeyValue = process.env.FIREBASE_PRIVATE_KEY;

  // Backward compatibility: this variable contains Base64 of the PEM key only.
  if (!privateKeyValue && process.env.FIREBASE_PRIVATE_KEY_BASE64) {
    privateKeyValue = Buffer.from(
      clean(process.env.FIREBASE_PRIVATE_KEY_BASE64),
      "base64"
    ).toString("utf8");
  }

  const privateKey = normalisePrivateKey(privateKeyValue);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase credentials missing. Recommended: set FIREBASE_SERVICE_ACCOUNT_BASE64 in Render."
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
