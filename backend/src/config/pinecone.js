// src/config/pinecone.js
// This file configures connection to Pinecone vector database
// Pinecone stores vector embeddings for semantic search

const { Pinecone } = require("@pinecone-database/pinecone");
require("dotenv").config();

// Initialize Pinecone client with API key
// This creates a client instance to interact with Pinecone services
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Get reference to the specific index where we'll store vectors
// An index is like a "database" in Pinecone that stores related vectors
const indexName = process.env.PINECONE_INDEX_NAME || "stripe-docs";

// const initializePinecone = async () => {
//   try {
//     const list = await pinecone.listIndexes();
//     const indexExists = list.indexes?.some((idx) => idx.name === indexName);
//     if (!indexExists) {
//       console.log(` Creating Index: ${indexName}...`);
//       await pinecone.createIndex({
//         name: indexName,
//         dimension: 768,
//         metric: "cosine",
//         spec: { serverless: { cloud: "aws", region: "us-east-1" } },
//       });
//       // Wait for initialization
//       await new Promise((resolve) => setTimeout(resolve, 30000));
//     }
//     console.log(" Pinecone index ready");
//     return pinecone.index(indexName);
//   } catch (error) {
//     console.error(" Pinecone error:", error.message);
//     throw error;
//   }
// };
// Function to initialize and verify Pinecone connection
const initializePinecone = async () => {
  try {
    console.log("Initializing Pinecone...");
    // List all existing indexes to check if ours exists
    const indexList = await pinecone.listIndexes();
    const indexExists = indexList.indexes?.some(
      (idx) => idx.name === indexName
    );
    if (!indexExists) {
      console.log(`Creating new Pinecone index: ${indexName}`);
      // Create a new index with specified configuration
      await pinecone.createIndex({
        name: indexName,
        dimension: 768, // Gemini embedding dimension (text-embedding-004 = 768)
        metric: "cosine", // Similarity metric (cosine similarity for text)
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1", // Choose region closest to your users
          },
        },
      });

      // Wait for index to be ready (can take 30-60 seconds)
      console.log("⏳ Waiting for index to be ready...");
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }

    // Get reference to the index for operations
    const index = pinecone.index(indexName);
    console.log(" Pinecone initialized successfully");

    return index;
  } catch (error) {
    console.error(" Pinecone initialization failed:", error.message);
    throw error;
  }
};

// Function to get index stats (useful for monitoring)
const getIndexStats = async () => {
  try {
    const index = pinecone.index(indexName);
    const stats = await index.describeIndexStats();
    console.log("Index Stats:", {
      totalVectors: stats.totalRecordCount,
      dimension: stats.dimension,
    });
    return stats;
  } catch (error) {
    console.error(" Failed to get index stats:", error.message);
    throw error;
  }
};
// ⚠️ DANGER: Deletes ALL vectors from the index
// Use only when you REALLY want to clear Pinecone data
const deleteAllVectors = async (namespace = "") => {
  try {
    const index = pinecone.index(indexName);

    console.log(" Deleting ALL vectors from Pinecone index...");
    await index.deleteAll();
    // await index.delete({
    //   deleteAll: true,
    //   namespace, // default namespace if empty
    // });

    console.log(" All vectors deleted successfully");
  } catch (error) {
    console.error("Failed to delete vectors:", error.message);
    throw error;
  }
};

// Export Pinecone client and utility functions
module.exports = {
  pinecone,
  indexName,
  initializePinecone,
  getIndexStats,
  deleteAllVectors,
};
