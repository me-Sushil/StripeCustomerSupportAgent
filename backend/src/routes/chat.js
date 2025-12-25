// src/routes/chat.js
// API routes for user-facing chat functionality
// Handles both MCP and non-MCP versions

const express = require("express");
const router = express.Router();

// Import both chat services
const chatServiceMCP = require("../services/chatServiceMCP"); // With MCP

const { Conversation, Message } = require("../models/Conversation");
// ============================================
// CHAT ENDPOINTS (WITH MCP)
// ============================================

/**
 * POST /api/chat/query-mcp
 * Process a user query with MCP
 * Enhanced context using Model Context Protocol
 */
router.post("/query-mcp", async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      query,
      sessionId = null,
      userId = null,
      topK = 5,
      minScore = 0.5,
      useMCP = true,
    } = req.body;

    // Validate input
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: "Query is required",
      });
    }

    console.log(`\n📨 Received query (MCP): "${query}"`);

    // Initialize MCP if not already done
    if (useMCP && !chatServiceMCP.mcpConnected) {
      await chatServiceMCP.initializeMCP();
    }

    // Get or create conversation
    let conversation;
    if (sessionId) {
      conversation = await Conversation.getBySessionId(sessionId);
    }

    if (!conversation) {
      conversation = await Conversation.createNew(userId, {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        mcpEnabled: useMCP,
      });
      console.log(`✅ Created new conversation: ${conversation.sessionId}`);
    }

    // Set title from first query
    if (!conversation.title && query.length > 0) {
      conversation.title = query.substring(0, 100);
      await conversation.save();
    }

    // Get conversation history
    const messages = await conversation.getMessages(10);
    const conversationHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Save user message
    await conversation.addMessage("user", query);

    // Process query with MCP service
    const result = await chatServiceMCP.processQuery(query, {
      topK,
      minScore,
      conversationHistory,
      useMCP,
    });

    const processingTime = Date.now() - startTime;

    if (!result.success) {
      return res.status(500).json({
        error: "Failed to process query",
        message: result.error,
      });
    }

    // Save assistant response
    await conversation.addMessage("assistant", result.response, {
      sources: result.sources,
      responseMetadata: result.metadata,
      processingTime,
    });

    // Return response
    res.json({
      success: true,
      sessionId: conversation.sessionId,
      response: result.response,
      sources: result.sources,
      metadata: {
        ...result.metadata,
        processingTime,
      },
    });
  } catch (error) {
    console.error("❌ Query processing error (MCP):", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// ============================================
// STREAMING ENDPOINT
// ============================================

/**
 * POST /api/chat/stream
 * Stream response in real-time (Server-Sent Events)
 */
router.post("/stream", async (req, res) => {
  try {
    const { query, sessionId, useMCP = false } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: "Query is required",
      });
    }

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Get conversation
    let conversation;
    if (sessionId) {
      conversation = await Conversation.getBySessionId(sessionId);
    }

    if (!conversation) {
      conversation = await Conversation.createNew(null, {
        userAgent: req.headers["user-agent"],
      });
    }

    // Get history
    const messages = await conversation.getMessages(10);
    const conversationHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Save user message
    await conversation.addMessage("user", query);

    // Get relevant chunks
    const vectorStoreService = require("../services/vectorStore");
    const searchResults = await vectorStoreService.search(query, 5);
    const relevantChunks = await vectorStoreService.getChunksForResults(
      searchResults
    );

    const service = useMCP ? chatServiceMCP : chatService;
    const context = service.buildContext(relevantChunks);

    // Get streaming response
    const stream = await service.streamResponse(
      query,
      context,
      conversationHistory
    );

    let fullResponse = "";

    // Stream tokens to client
    for await (const chunk of stream) {
      const text = chunk.text();
      fullResponse += text;

      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    // Save complete response
    await conversation.addMessage("assistant", fullResponse, {
      sources: relevantChunks.map((c) => ({
        title: c.source?.title || "",
        url: c.source?.url || "",
        score: c.score,
      })),
    });

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("❌ Streaming error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// ============================================
// CONVERSATION MANAGEMENT
// ============================================

/**
 * GET /api/chat/conversations
 * Get user's conversation history
 */
router.get("/conversations", async (req, res) => {
  try {
    const { userId, limit = 20 } = req.query;

    const conversations = await Conversation.getRecent(parseInt(limit), userId);

    res.json({
      success: true,
      conversations: conversations.map((c) => ({
        sessionId: c.sessionId,
        title: c.title,
        startedAt: c.startedAt,
        lastMessageAt: c.lastMessageAt,
        messageCount: c.messages ? c.messages.length : 0,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    res.status(500).json({
      error: "Failed to fetch conversations",
      message: error.message,
    });
  }
});

/**
 * GET /api/chat/conversation/:sessionId
 * Get specific conversation with all messages
 */
router.get("/conversation/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversation = await Conversation.getBySessionId(sessionId);

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    const messages = await conversation.getMessages();

    res.json({
      success: true,
      conversation: {
        sessionId: conversation.sessionId,
        title: conversation.title,
        startedAt: conversation.startedAt,
        lastMessageAt: conversation.lastMessageAt,
        status: conversation.status,
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources,
          metadata: m.responseMetadata,
          feedback: m.feedback,
          createdAt: m.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching conversation:", error);
    res.status(500).json({
      error: "Failed to fetch conversation",
      message: error.message,
    });
  }
});

/**
 * POST /api/chat/feedback
 * Add feedback to a message
 */
router.post("/feedback", async (req, res) => {
  try {
    const { messageId, feedback } = req.body;

    if (!messageId || !feedback) {
      return res.status(400).json({
        error: "messageId and feedback are required",
      });
    }

    const message = await Message.findByPk(messageId);

    if (!message) {
      return res.status(404).json({
        error: "Message not found",
      });
    }

    await message.addFeedback(feedback);

    res.json({
      success: true,
      message: "Feedback added successfully",
    });
  } catch (error) {
    console.error("❌ Error adding feedback:", error);
    res.status(500).json({
      error: "Failed to add feedback",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/chat/conversation/:sessionId
 * Delete/archive a conversation
 */
router.delete("/conversation/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversation = await Conversation.getBySessionId(sessionId);

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    await conversation.archive();

    res.json({
      success: true,
      message: "Conversation archived successfully",
    });
  } catch (error) {
    console.error("❌ Error archiving conversation:", error);
    res.status(500).json({
      error: "Failed to archive conversation",
      message: error.message,
    });
  }
});

// ============================================
// HEALTH & TESTING
// ============================================

/**
 * GET /api/chat/health
 * Check chat service health
 */
router.get("/health", async (req, res) => {
  try {
    const llmStatus = await chatService.testConnection();
    const mcpStatus = await chatServiceMCP.testConnection();

    res.json({
      success: true,
      services: {
        llm: llmStatus,
        mcp: mcpStatus && chatServiceMCP.mcpConnected,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Health check failed",
      message: error.message,
    });
  }
});

module.exports = router;
