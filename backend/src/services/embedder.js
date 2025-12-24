// src/services/embedder.js
// This service generates embeddings using Google's Gemini API
// Embeddings convert text into vector representations for semantic search

const { GoogleGenerativeAI } = require("@google/generative-ai");
const ChunkedDocument = require("../models/ChunkedDocument");
require("dotenv").config();

class EmbedderService {
  constructor() {
    // Initialize Gemini AI client
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Use the text embedding model
    // 'text-embedding-004' produces 768-dimensional vectors
    this.model = this.genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    // Batch size for embedding (to avoid rate limits)
    this.batchSize = 10;
  }

  // Generate embedding for a single text
  async embedText(text) {
    try {
      // Call Gemini API to generate embedding
      const result = await this.model.embedContent(text);

      // Extract the embedding vector
      const embedding = result.embedding.values;

      // Verify embedding dimension
      if (embedding.length !== 768) {
        throw new Error(`Unexpected embedding dimension: ${embedding.length}`);
      }

      return embedding;
    } catch (error) {
      console.error(" Embedding generation failed:", error.message);
      throw error;
    }
  }

  // Generate embeddings for multiple texts (batch processing)
  async embedTexts(texts) {
    try {
      const embeddings = [];

      // Process in batches to avoid rate limits
      for (let i = 0; i < texts.length; i += this.batchSize) {
        const batch = texts.slice(i, i + this.batchSize);

        console.log(
          `Embedding batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(
            texts.length / this.batchSize
          )}`
        );

        // Generate embeddings for this batch
        const batchEmbeddings = await Promise.all(
          batch.map((text) => this.embedText(text))
        );

        embeddings.push(...batchEmbeddings);

        // Add delay between batches to respect rate limits
        if (i + this.batchSize < texts.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      return embeddings;
    } catch (error) {
      console.error(" Batch embedding failed:", error.message);
      throw error;
    }
  }

  // Generate embedding for a query (user question)
  async embedQuery(query) {
    console.log(` Generating embedding for query: "${query}"`);
    try {
      const embedding = await this.embedText(query);
      return embedding;
    } catch (error) {
      console.error(" Query embedding failed:", error.message);
      throw error;
    }
  }

  // Process a single chunk: generate embedding and update database
  async embedChunk(chunkId) {
    try {
      // Fetch the chunk from database
      const chunk = await ChunkedDocument.findByPk(chunkId, {
        include: ["rawDocument"], // Include parent document info
      });

      if (!chunk) {
        throw new Error(`Chunk with ID ${chunkId} not found`);
      }

      if (chunk.embeddingStatus === "embedded") {
        console.log(`  Chunk already embedded: ${chunkId}`);
        return { success: false, message: "Already embedded" };
      }

      console.log(
        `\n Embedding chunk ${chunk.id} (${chunk.chunkSize} chars)`
      );

      // Generate embedding
      const embedding = await this.embedText(chunk.chunkText);

      // Return the embedding along with chunk info
      // The vectorStore service will handle Pinecone upload
      return {
        success: true,
        chunkId: chunk.id,
        embedding,
        chunk,
      };
    } catch (error) {
      console.error(` Failed to embed chunk ${chunkId}:`, error.message);

      // Mark chunk as failed
      const chunk = await ChunkedDocument.findByPk(chunkId);
      if (chunk) {
        await chunk.markFailed();
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process all pending chunks
  async embedAllPending(limit = 100) {
    console.log(` Starting to embed pending chunks (limit: ${limit})...\n`);

    try {
      // Get pending chunks from database
      const pendingChunks = await ChunkedDocument.getPendingEmbeddings(limit);

      if (pendingChunks.length === 0) {
        console.log(" No pending chunks to embed");
        return { success: true, processed: 0 };
      }

      console.log(` Found ${pendingChunks.length} pending chunks\n`);

      const results = {
        successful: [],
        failed: [],
      };

      // Process each chunk
      for (let i = 0; i < pendingChunks.length; i++) {
        const chunk = pendingChunks[i];
        console.log(
          `\n[${i + 1}/${pendingChunks.length}] Processing chunk ID: ${
            chunk.id
          }`
        );

        const result = await this.embedChunk(chunk.id);

        if (result.success) {
          results.successful.push(result);
        } else {
          results.failed.push({ id: chunk.id, error: result.error });
        }

        // Small delay between embeddings
        if (i < pendingChunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      console.log("\n Embedding Summary:");
      console.log(` Successful: ${results.successful.length}`);
      console.log(` Failed: ${results.failed.length}`);

      return {
        success: true,
        processed: results.successful.length,
        failed: results.failed.length,
        results,
      };
    } catch (error) {
      console.error(" Batch embedding failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Verify API key is working
  async testConnection() {
    try {
      console.log(" Testing Gemini API connection...");
      const embedding = await this.embedText("test");
      console.log(
        `Gemini API working! Embedding dimension: ${embedding.length}`
      );
      return true;
    } catch (error) {
      console.error(" Gemini API test failed:", error.message);
      return false;
    }
  }
}

module.exports = new EmbedderService();
