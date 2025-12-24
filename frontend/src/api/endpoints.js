// src/api/endpoints.js
// All API endpoint functions organized by feature
// Each function returns a Promise with the API response

import axiosInstance from "./axios";

// ============================================
// HEALTH & SYSTEM
// ============================================

export const healthCheck = () => {
  return axiosInstance.get("/api/health");
};

// ============================================
// SCRAPING APIs
// ============================================

// Scrape a single URL
export const scrapeUrl = (url, usePuppeteer = false) => {
  return axiosInstance.post("/api/scrape", {
    url,
    usePuppeteer,
  });
};

// Scrape multiple URLs in batch
export const scrapeBatch = (urls, usePuppeteer = false) => {
  return axiosInstance.post("/api/scrape/batch", {
    urls,
    usePuppeteer,
  });
};

// Get all scraped documents
export const getDocuments = () => {
  return axiosInstance.get("/api/documents");
};

// Get document by ID
export const getDocumentById = (id) => {
  return axiosInstance.get(`/api/documents/${id}`);
};

// ============================================
// CHUNKING APIs
// ============================================

// Chunk a specific document by ID
export const chunkDocument = (documentId) => {
  return axiosInstance.post(`/api/chunk/${documentId}`);
};

// Chunk all pending documents
export const chunkAllDocuments = () => {
  return axiosInstance.post("/api/chunk/all");
};

// Get chunk statistics
export const getChunkStats = () => {
  return axiosInstance.get("/api/chunks/stats");
};

// Get chunks for a specific document
export const getChunksByDocument = (documentId) => {
  return axiosInstance.get(`/api/chunks/document/${documentId}`);
};

// Get all chunks (with pagination)
export const getAllChunks = (page = 1, limit = 50) => {
  return axiosInstance.get("/api/chunks", {
    params: { page, limit },
  });
};

// ============================================
// EMBEDDING & VECTOR STORAGE APIs
// ============================================

// Process pending chunks (embed + store in Pinecone)
export const processVectors = (limit = 100) => {
  return axiosInstance.post("/api/vectors/process", {
    limit,
  });
};

// Get vector database statistics
export const getVectorStats = () => {
  return axiosInstance.get("/api/vectors/stats");
};

// Clear all vectors from Pinecone (use with caution)
export const clearVectors = () => {
  return axiosInstance.delete("/api/vectors/clear");
};

// ============================================
// SEARCH APIs
// ============================================

// Semantic search in vector database
export const semanticSearch = (query, topK = 5, filter = null) => {
  return axiosInstance.post("/api/search", {
    query,
    topK,
    filter,
  });
};

// Advanced search with filters
export const advancedSearch = (query, options = {}) => {
  const {
    topK = 5,
    minScore = 0.7,
    sourceUrls = null,
    dateRange = null,
  } = options;

  return axiosInstance.post("/api/search", {
    query,
    topK,
    filter: {
      minScore,
      sourceUrls,
      dateRange,
    },
  });
};

// ============================================
// PIPELINE APIs
// ============================================

// Run complete pipeline (scrape + chunk + embed)
export const runPipeline = (urls) => {
  return axiosInstance.post("/api/pipeline", {
    urls,
  });
};

// Get pipeline status/progress
export const getPipelineStatus = () => {
  return axiosInstance.get("/api/pipeline/status");
};

// ============================================
// TESTING & ADMIN APIs
// ============================================

// Test Gemini API connection
export const testGemini = () => {
  return axiosInstance.get("/api/test/gemini");
};

// Test Pinecone connection
export const testPinecone = () => {
  return axiosInstance.get("/api/test/pinecone");
};

// Test Database connection
export const testDatabase = () => {
  return axiosInstance.get("/api/test/database");
};

// ============================================
// DASHBOARD & STATS APIs
// ============================================

// Get comprehensive dashboard statistics
export const getDashboardStats = async () => {
  const [documents, chunkStats, vectorStats] = await Promise.all([
    getDocuments(),
    getChunkStats(),
    getVectorStats(),
  ]);

  return {
    documents: documents.data,
    chunks: chunkStats.data?.stats ?? {},
    vectors: vectorStats.data?.stats ?? {},
  };
};

// Get system health status
const isHealthy = (r) =>
  r.status === "fulfilled" && r.value?.data?.success === true;

export const getSystemHealth = async () => {
  const [health, gemini, database] = await Promise.allSettled([
    healthCheck(),
    testGemini(),
    testDatabase(),
  ]);

  return {
    api: health.status === "fulfilled",
    gemini: isHealthy(gemini),
    database: isHealthy(database),
  };
};

// ============================================
// EXPORT ALL
// ============================================

const api = {
  // Health
  healthCheck,
  getSystemHealth,

  // Scraping
  scrapeUrl,
  scrapeBatch,
  getDocuments,
  getDocumentById,

  // Chunking
  chunkDocument,
  chunkAllDocuments,
  getChunkStats,
  getChunksByDocument,
  getAllChunks,

  // Vectors
  processVectors,
  getVectorStats,
  clearVectors,

  // Search
  semanticSearch,
  advancedSearch,

  // Pipeline
  runPipeline,
  getPipelineStatus,

  // Testing
  testGemini,
  testPinecone,
  testDatabase,

  // Dashboard
  getDashboardStats,
};

export default api;
