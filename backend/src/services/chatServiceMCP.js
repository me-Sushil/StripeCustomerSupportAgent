// src/services/chatServiceMCP.js
// Optimized service to handle user queries with vector search + LLM response
// WITH MCP - Model Context Protocol integration for enhanced context
// This is a clean, optimized version with no code duplication

const { GoogleGenerativeAI } = require("@google/generative-ai");
const vectorStoreService = require("./vectorStore");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const {
  StdioClientTransport,
} = require("@modelcontextprotocol/sdk/client/stdio.js");
require("dotenv").config();

class ChatServiceMCP {
  constructor() {
    // Initialize Gemini AI for chat
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.chatModel = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // MCP Client configuration
    this.mcpClient = null;
    this.mcpConnected = false;

    // System prompt that guides AI behavior
    this.systemPrompt = `You are a Senior Stripe Support Specialist. Your goal is to provide clear, professional, and actionable solutions to user inquiries regarding Stripe services.

ROLE & TONE:
- Professional, empathetic, and concise.
- You speak as a human expert, not as a technical manual.
- Avoid mentioning "MCP," "databases," or "retrieval." The user should feel they are talking to a knowledgeable person.

GUIDELINES:
1. USE THE CONTEXT: You will be provided with specific snippets from the Stripe documentation. Base your answer ONLY on this information.
2. PROBLEM SOLVING: If a user has a problem (e.g., a failing payment), explain the "Why" and then the "How to fix it" in simple steps.
3. CODE & TECHNICALS: ONLY provide code snippets or API endpoint details if the user's query is clearly from a developer (e.g., asking about webhooks or API integration). For general users, stay with high-level dashboard instructions.
4. HONESTY: If the matched documentation does not contain the answer, say: "I apologize, but I don't have enough specific information in my records to answer that accurately. Would you like me to suggest how to contact Stripe's human support team?"
5. FORMATTING: Use clean Markdown. Use bolding for key terms and bullet points for steps to make it easy to read.`;
  }

  /**
   * Initialize MCP Client connection
   * Sets up connection to MCP server for enhanced context capabilities
   */
  async initializeMCP() {
    try {
      console.log("🔌 Initializing MCP client...");

      // Create transport layer for MCP communication
      const transport = new StdioClientTransport({
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem"],
      });

      // Initialize MCP client with configuration
      this.mcpClient = new Client(
        {
          name: "stripe-support-agent",
          version: "1.0.0",
        },
        {
          capabilities: {
            tools: {},
            resources: {},
          },
        }
      );

      // Establish connection
      await this.mcpClient.connect(transport);
      this.mcpConnected = true;

      // Log available tools
      const tools = await this.mcpClient.listTools();
      console.log("✅ MCP client connected");
      console.log(
        "📋 Available MCP tools:",
        tools.tools.map((t) => t.name)
      );

      return true;
    } catch (error) {
      console.error("❌ MCP initialization failed:", error.message);
      console.log("⚠️  Falling back to non-MCP mode");
      this.mcpConnected = false;
      return false;
    }
  }

  /**
   * Main method to process user queries with MCP enhancement
   * Flow: Vector Search → MCP Enhancement → LLM Generation
   */
  async processQuery(userQuery, options = {}) {
    const {
      topK = 5,
      minScore = 0.5,
      conversationHistory = [],
      useMCP = true,
    } = options;

    try {
      console.log(`\n Processing query with MCP: "${userQuery}"`);

      // Step 1: Search vector database for relevant chunks
      const searchResults = await vectorStoreService.search(userQuery, topK);

      if (!searchResults.success) {
        throw new Error("Vector search failed");
      }

      // Step 2: Retrieve full chunk data from database
      const relevantChunks = await vectorStoreService.getChunksForResults(
        searchResults
      );

      console.log(
        "DEBUG: Pinecone scores:",
        relevantChunks.map((c) => c.score)
      );

      // Filter by minimum similarity score
      const filteredChunks = relevantChunks.filter(
        (chunk) => chunk.score >= minScore
      );
      console.log(
        `DEBUG: After filtering at ${minScore}: ${filteredChunks.length} chunks remain.`
      );

      // Step 3: Build context and enhance with MCP if available
      let context = this.buildContext(filteredChunks);
      let mcpUsed = false;

      if (useMCP && this.mcpConnected) {
        const mcpContext = await this.getMCPContext(userQuery, filteredChunks);
        if (mcpContext) {
          context += "\n\nAdditional MCP Context:\n" + mcpContext;
          mcpUsed = true;
          console.log("✅ Enhanced with MCP context");
        }
      }

      // Step 4: Generate LLM response with enhanced context
      const llmResponse = await this.generateResponse(
        userQuery,
        context,
        conversationHistory
      );

      // Step 5: Return complete response with metadata
      return {
        success: true,
        response: llmResponse,
        sources: filteredChunks.map((chunk) => ({
          title: chunk.source?.title || "Untitled",
          url: chunk.source?.url || "",
          score: chunk.score,
          excerpt: chunk.chunkText.substring(0, 200) + "...",
        })),
        metadata: {
          chunksUsed: filteredChunks.length,
          averageScore: this.calculateAverageScore(filteredChunks),
          mcpUsed,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ Chat service error:", error.message);
      return {
        success: false,
        error: error.message,
        response:
          "I apologize, but I encountered an error processing your question. Please try again.",
      };
    }
  }

  /**
   * Get additional context using MCP tools
   * Attempts to fetch enhanced context from external resources
   */

  async getMCPContext(query, chunks) {
    if (!this.mcpClient || !this.mcpConnected) return null;

    try {
      // 1. CHANGE: Look for "read_file" instead of "read_resource"
      const mcpTool = "read_file";

      const tools = await this.mcpClient.listTools();
      const hasTool = tools.tools.some((t) => t.name === mcpTool);

      if (!hasTool) {
        console.log(`⚠️ MCP ${mcpTool} tool not available`);
        return null;
      }

      // 2. Prepare the path.
      // NOTE: server-filesystem needs a PATH on your computer, not a URL.
      // If you want to read a local file:
      const filePath = "path/to/your/local/stripe/docs/info.txt";

      const result = await this.mcpClient.callTool({
        name: mcpTool,
        arguments: {
          path: filePath, // Filesystem server uses 'path', not 'uri'
        },
      });

      if (result.content && result.content.length > 0) {
        return result.content[0].text;
      }
      return null;
    } catch (error) {
      console.log("⚠️ MCP tool call failed:", error.message);
      return null;
    }
  }
  /**
   * Build formatted context string from retrieved chunks
   */
  buildContext(chunks) {
    if (chunks.length === 0) {
      return "No relevant documentation found.";
    }

    let context = "Relevant documentation from Stripe:\n\n";

    chunks.forEach((chunk, index) => {
      const source = chunk.source?.title || "Documentation";
      const url = chunk.source?.url || "";

      context += `[Source ${index + 1}: ${source}]\n`;
      if (url) {
        context += `URL: ${url}\n`;
      }
      context += `${chunk.chunkText}\n\n`;
      context += "---\n\n";
    });

    return context;
  }

  /**
   * Generate response using Gemini LLM
   */
  async generateResponse(query, context, conversationHistory = []) {
    try {
      const prompt = this.buildPrompt(query, context, conversationHistory);

      console.log("🤖 Generating LLM response with MCP context...");

      const result = await this.chatModel.generateContent(prompt);
      const text = result.response.text();

      console.log("✅ LLM response generated");

      return text;
    } catch (error) {
      console.error("❌ LLM generation error:", error.message);
      throw new Error("Failed to generate response from LLM");
    }
  }

  /**
   * Build complete prompt with system instructions, context, and history
   */
  buildPrompt(query, context, conversationHistory) {
    let prompt = `${this.systemPrompt}\n\n`;

    // Add documentation context
    prompt += `Context from documentation:\n${context}\n\n`;

    // Add conversation history (last 5 messages)
    if (conversationHistory.length > 0) {
      prompt += "Previous conversation:\n";
      conversationHistory.slice(-5).forEach((msg) => {
        prompt += `${msg.role === "user" ? "User" : "Assistant"}: ${
          msg.content
        }\n`;
      });
      prompt += "\n";
    }

    // Add current user query
    prompt += `User question: ${query}\n\n`;
    prompt +=
      "Please provide a helpful and accurate answer based on the context above:";

    return prompt;
  }

  /**
   * Calculate average similarity score from chunks
   */
  calculateAverageScore(chunks) {
    if (chunks.length === 0) return 0;
    const sum = chunks.reduce((acc, chunk) => acc + chunk.score, 0);
    return (sum / chunks.length).toFixed(3);
  }

  /**
   * Stream response in real-time (for streaming endpoints)
   */
  async streamResponse(query, context, conversationHistory = []) {
    try {
      const prompt = this.buildPrompt(query, context, conversationHistory);
      const result = await this.chatModel.generateContentStream(prompt);
      return result.stream;
    } catch (error) {
      console.error("❌ Stream generation error:", error.message);
      throw error;
    }
  }

  /**
   * Test both LLM and MCP connections
   */
  async testConnection() {
    try {
      // Test LLM connection
      const result = await this.chatModel.generateContent("Hello");
      result.response.text();
      console.log("✅ Chat LLM connection working");

      // Test MCP connection if initialized
      if (this.mcpConnected) {
        const tools = await this.mcpClient.listTools();
        console.log(
          "✅ MCP connection working, tools available:",
          tools.tools.length
        );
      }

      return true;
    } catch (error) {
      console.error("❌ Connection test failed:", error.message);
      return false;
    }
  }

  /**
   * Cleanup MCP connection on shutdown
   */
  async cleanup() {
    if (this.mcpClient && this.mcpConnected) {
      try {
        await this.mcpClient.close();
        console.log("🔌 MCP client disconnected");
      } catch (error) {
        console.error("❌ MCP cleanup error:", error.message);
      }
    }
  }
}

// Export singleton instance
module.exports = new ChatServiceMCP();
