// src/routes/api.js
// This file defines all API endpoints for the application
// Handles scraping, chunking, embedding, and search operations

const express = require("express");
const router = express.Router();
const scraperService = require("../services/scraper");
const chunkerService = require("../services/chunker");
const embedderService = require("../services/embedder");
const vectorStoreService = require("../services/vectorStore");
const RawDocument = require("../models/RawDocument");
const ChunkedDocument = require("../models/ChunkedDocument");

// ============================================
// HEALTH CHECK
// ============================================

// Check if API is running
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// SCRAPING ENDPOINTS
// ============================================

// Scrape a single URL
// POST /api/scrape
// Body: { "url": "https://example.com", "usePuppeteer": false }
router.post("/scrape", async (req, res) => {
  try {
    const { url, usePuppeteer = false } = req.body;

    if (!url) {
      return res.status(400).json({
        error: "URL is required",
      });
    }

    const result = await scraperService.scrapeURL(url, usePuppeteer);

    if (result.success) {
      res.json({
        success: true,
        message: "URL scraped successfully",
        data: {
          documentId: result.document.id,
          url: result.document.url,
          title: result.document.title,
          wordCount: result.wordCount,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || result.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Scrape multiple URLs
// POST /api/scrape/batch
// Body: { "urls": ["url1", "url2"], "usePuppeteer": false }
router.post("/scrape/batch", async (req, res) => {
  try {
    const { urls, usePuppeteer = false } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        error: "URLs array is required",
      });
    }

    const results = await scraperService.scrapeURLs(urls, usePuppeteer);

    res.json({
      success: true,
      message: "Batch scraping completed",
      summary: {
        successful: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
      },
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get all scraped documents
// GET /api/documents
router.get("/documents", async (req, res) => {
  try {
    const documents = await RawDocument.findAll({
      attributes: ["id", "url", "title", "status", "wordCount", "scrapedAt"],
      order: [["scrapedAt", "DESC"]],
    });

    res.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// ============================================
// CHUNKING ENDPOINTS
// ============================================

// Chunk a specific document
// POST /api/chunk/:documentId
router.post("/chunk/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await chunkerService.chunkDocument(parseInt(documentId));

    if (result.success) {
      res.json({
        success: true,
        message: "Document chunked successfully",
        data: {
          documentId: result.documentId,
          chunkCount: result.chunkCount,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || result.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Chunk all pending documents
// POST /api/chunk/all
router.post("/chunk/all", async (req, res) => {
  try {
    const result = await chunkerService.chunkAllPending();

    res.json({
      success: true,
      message: "Batch chunking completed",
      data: {
        processed: result.processed,
        failed: result.failed,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get chunk statistics
// GET /api/chunks/stats
router.get("/chunks/stats", async (req, res) => {
  try {
    const stats = await chunkerService.getChunkStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get chunks for a specific document
// GET /api/chunks/document/:documentId
router.get("/chunks/document/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;
    const chunks = await ChunkedDocument.getByDocumentId(parseInt(documentId));

    res.json({
      success: true,
      count: chunks.length,
      chunks,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// ============================================
// EMBEDDING & VECTOR STORAGE ENDPOINTS
// ============================================

// Process all pending chunks (embed + upload to Pinecone)
// POST /api/vectors/process
router.post("/vectors/process", async (req, res) => {
  try {
    const { limit = 100 } = req.body;
    const result = await vectorStoreService.processAllPending(limit);

    res.json({
      success: true,
      message: "Vector processing completed",
      data: {
        processed: result.processed,
        failed: result.failed,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get Pinecone index statistics
// GET /api/vectors/stats
router.get("/vectors/stats", async (req, res) => {
  try {
    const stats = await vectorStoreService.getStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// ============================================
// SEARCH ENDPOINT
// ============================================

// Semantic search
// POST /api/search
// Body: { "query": "How do I create a payment intent?", "topK": 5 }
router.post("/search", async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Query is required",
      });
    }

    // Search in vector database
    const searchResults = await vectorStoreService.search(query, topK);

    if (!searchResults.success) {
      return res.status(500).json({
        error: "Search failed",
        message: searchResults.error,
      });
    }

    // Get full chunk data from database
    const enrichedResults = await vectorStoreService.getChunksForResults(
      searchResults
    );

    res.json({
      success: true,
      query,
      resultCount: enrichedResults.length,
      results: enrichedResults,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// ============================================
// PIPELINE ENDPOINT (ALL STEPS)
// ============================================

// Run complete pipeline: scrape -> chunk -> embed -> store
// POST /api/pipeline
// Body: { "urls": ["url1", "url2"] }
router.post("/pipeline", async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        error: "URLs array is required",
      });
    }

    const results = {
      scraping: null,
      chunking: null,
      embedding: null,
    };

    // Step 1: Scrape URLs
    console.log("\n=== STEP 1: SCRAPING ===");
    results.scraping = await scraperService.scrapeURLs(urls);

    // Step 2: Chunk documents
    console.log("\n=== STEP 2: CHUNKING ===");
    results.chunking = await chunkerService.chunkAllPending();

    // Step 3: Embed and store vectors
    console.log("\n=== STEP 3: EMBEDDING & STORING ===");
    results.embedding = await vectorStoreService.processAllPending();

    res.json({
      success: true,
      message: "Pipeline completed",
      results,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// ============================================
// ADMIN/UTILITY ENDPOINTS
// ============================================

// Test Gemini connection
// GET /api/test/gemini
router.get("/test/gemini", async (req, res) => {
  try {
    const isWorking = await embedderService.testConnection();
    res.json({
      success: isWorking,
      message: isWorking ? "Gemini API is working" : "Gemini API test failed",
    });
  } catch (error) {
    res.status(500).json({
      error: "Test failed",
      message: error.message,
    });
  }
});

// Clear Pinecone index (use with caution!)
// DELETE /api/vectors/clear
router.delete("/vectors/clear", async (req, res) => {
  try {
    const result = await vectorStoreService.clearIndex();
    res.json({
      success: result.success,
      message: "Index cleared",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to clear index",
      message: error.message,
    });
  }
});

module.exports = router;
