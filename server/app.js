// server/app.js
// Configures the Express application: middleware, static files, and routes.

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const adminRoutes = require("./routes/adminRoutes");
const staffRoutes = require("./routes/staffRoutes");

const app = express();
const clientRoot = path.join(__dirname, "..", "client");
const pagesRoot = path.join(clientRoot, "pages");

app.use(
  cors({
    // Allows both the Node-served UI (5000) and VS Code Live Server (5500)
    // during local development. Restrict this list before public deployment.
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const allowed = new Set([
        process.env.CLIENT_URL,
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
      ].filter(Boolean));

      return callback(null, allowed.has(origin));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(clientRoot));

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/staff", staffRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "CCMMS API is running." });
});

// Friendly page URLs when the UI is opened through http://localhost:5000
app.get("/", (req, res) => res.sendFile(path.join(pagesRoot, "index.html")));
app.get("/:page.html", (req, res, next) => {
  const safePage = path.basename(req.params.page);
  const filePath = path.join(pagesRoot, `${safePage}.html`);
  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});
app.get("/pages/:page.html", (req, res, next) => {
  const safePage = path.basename(req.params.page);
  const filePath = path.join(pagesRoot, `${safePage}.html`);
  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "API route not found." });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(pagesRoot, "index.html"));
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

module.exports = app;
