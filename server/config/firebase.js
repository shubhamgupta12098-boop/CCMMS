// server/config/firebase.js
// Initializes Firebase Admin SDK from a downloaded service-account JSON file
// when present, otherwise falls back to credentials stored in server/.env.

const fs = require("fs");
const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getStorage } = require("firebase-admin/storage");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const serviceAccountPath = path.join(__dirname, "firebase-service-account.json");

function getCredential() {
  if (fs.existsSync(serviceAccountPath)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return cert(require(serviceAccountPath));
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase credentials missing. Put firebase-service-account.json in server/config or fill FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in server/.env."
    );
  }

  return cert({ projectId, clientEmail, privateKey });
}

if (getApps().length === 0) {
  const options = { credential: getCredential() };

  if (process.env.FIREBASE_DATABASE_URL) {
    options.databaseURL = process.env.FIREBASE_DATABASE_URL;
  }
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    options.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  }

  initializeApp(options);
}

const db = getFirestore();
const auth = getAuth();
const bucket = process.env.FIREBASE_STORAGE_BUCKET
  ? getStorage().bucket()
  : null;

module.exports = { db, auth, bucket };
