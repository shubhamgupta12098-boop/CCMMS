// server/server.js
// Entry point: starts the HTTP server.

const app = require("./app");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ CCMMS server running at http://localhost:${PORT}`);
});
