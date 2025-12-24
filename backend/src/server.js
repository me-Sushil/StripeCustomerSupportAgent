// npm install express sequelize pg pg-hstore langchain @langchain/google-genai @langchain/pinecone @pinecone-database/pinecone cheerio dotenv
// src/server.js
// Main Express server file
// Initializes the application, connects to databases, and starts the server

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

// Import configurations and routes
const { testConnection, syncDatabase } = require("./config/database");
const { initializePinecone } = require("./config/pinecone");
const apiRoutes = require("./routes/api");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(bodyParser.json({ limit: "50mb" }));

// Parse URL-encoded request bodies
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Stripe Customer Support Agent API",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      scrape: "POST /api/scrape",
      scrapeBatch: "POST /api/scrape/batch",
      documents: "GET /api/documents",
      chunk: "POST /api/chunk/:documentId",
      chunkAll: "POST /api/chunk/all",
      chunkStats: "GET /api/chunks/stats",
      vectorProcess: "POST /api/vectors/process",
      vectorStats: "GET /api/vectors/stats",
      search: "POST /api/search",
      pipeline: "POST /api/pipeline",
    },
  });
});

// Mount API routes
app.use("/api", apiRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ============================================
// INITIALIZATION & STARTUP
// ============================================

async function initializeApp() {
  try {
    console.log("\n Starting Stripe Customer Support Agent...\n");

    // Test PostgreSQL connection
    console.log(" Connecting to PostgreSQL...");
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error("Failed to connect to PostgreSQL");
    }

    // Sync database models (create tables)
    console.log(" Synchronizing database models...");
    await syncDatabase();

    // Initialize Pinecone
    console.log("Initializing Pinecone...");
    await initializePinecone();

    console.log("\n All services initialized successfully!\n");
  } catch (error) {
    console.error("\n Initialization failed:", error.message);
    process.exit(1);
  }
}

// Start the server
async function startServer() {
  await initializeApp();

  app.listen(PORT, () => {
    console.log(`\n Server is running on port ${PORT}`);
    console.log(` API available at http://localhost:${PORT}`);
    console.log(` Documentation at http://localhost:${PORT}/\n`);
    console.log("Ready to accept requests! \n");
  });
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n  SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n SIGINT received, shutting down gracefully...");
  process.exit(0);
});

// Start the application
if (require.main === module) {
  startServer().catch((error) => {
    console.error(" Failed to start server:", error);
    process.exit(1);
  });
}

module.exports = app;
