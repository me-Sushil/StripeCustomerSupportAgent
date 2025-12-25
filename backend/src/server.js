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
const chatRoutes = require("./routes/chat"); // NEW: User chat routes

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(
  cors({
    origin: [
      "http://localhost:5173", // Admin frontend
      "http://localhost:5174", // User frontend
      "http://localhost:3000", // Backend
    ],
    credentials: true,
  })
);

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
    version: "2.0.0",
    endpoints: {
      admin: {
        health: "GET /api/health",
        scrape: "POST /api/scrape",
        documents: "GET /api/documents",
        chunk: "POST /api/chunk/all",
        vectors: "POST /api/vectors/process",
        search: "POST /api/search",
      },
      user: {
        chatMCP: "POST /api/chat/query-mcp",
        stream: "POST /api/chat/stream",
        conversations: "GET /api/chat/conversations",
        health: "GET /api/chat/health",
      },
    },
  });
});

// Mount API routes
app.use("/api", apiRoutes); // Admin routes
app.use("/api/chat", chatRoutes); // User chat routes

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
    console.log("\n🚀 Starting Stripe Customer Support Agent...\n");

    // Test PostgreSQL connection
    console.log("📦 Connecting to PostgreSQL...");
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error("Failed to connect to PostgreSQL");
    }

    // Sync database models (create tables including conversation tables)
    console.log("🔄 Synchronizing database models...");
    await syncDatabase();

    // Initialize Pinecone
    console.log("🔄 Initializing Pinecone...");
    await initializePinecone();

    // Initialize chat services
    console.log("🤖 Initializing chat services...");
    const chatServiceMCP = require("./services/chatServiceMCP");

    await chatServiceMCP.testConnection();

    // Try to initialize MCP (it's okay if it fails)
    try {
      await chatServiceMCP.initializeMCP();
    } catch (error) {
      console.log("⚠️  MCP initialization failed, continuing without MCP");
    }

    console.log("\n✅ All services initialized successfully!\n");
  } catch (error) {
    console.error("\n❌ Initialization failed:", error.message);
    process.exit(1);
  }
}

// Start the server
async function startServer() {
  await initializeApp();

  app.listen(PORT, () => {
    console.log(`\n🌟 Server is running on port ${PORT}`);
    console.log(`📡 Admin API available at http://localhost:${PORT}`);
    console.log(`💬 Chat API available at http://localhost:${PORT}/api/chat`);
    console.log(`📚 Documentation at http://localhost:${PORT}/\n`);
    console.log("Ready to accept requests! 🎉\n");
  });
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⚠️  SIGINT received, shutting down gracefully...");

  // Cleanup MCP connection
  const chatServiceMCP = require("./services/chatServiceMCP");
  await chatServiceMCP.cleanup();

  process.exit(0);
});

// Start the application
if (require.main === module) {
  startServer().catch((error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  });
}

module.exports = app;
