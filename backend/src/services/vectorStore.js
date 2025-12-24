// src/services/vectorStore.js
// This service manages vector storage in Pinecone
// Handles uploading embeddings and searching for similar vectors

const { pinecone, indexName } = require("../config/pinecone");
const embedderService = require("./embedder");
const ChunkedDocument = require("../models/ChunkedDocument");

class VectorStoreService {
  constructor() {
    this.index = null;
  }

  // Initialize Pinecone index
  async initialize() {
    try {
      if (!this.index) {
        this.index = pinecone.index(indexName);
        console.log(" Vector store initialized");
      }
      return this.index;
    } catch (error) {
      console.error(" Vector store initialization failed:", error.message);
      throw error;
    }
  }

  // Upload a single vector to Pinecone
  async upsertVector(chunkId, embedding, metadata) {
    try {
      await this.initialize();

      // Create unique vector ID (using chunk ID)
      const vectorId = `chunk-${chunkId}`;

      // Prepare vector data for Pinecone
      const vector = {
        id: vectorId,
        values: embedding,
        metadata: {
          ...metadata,
          chunkId,
          text: metadata.text ? metadata.text.substring(0, 500) : "", // Limit text in metadata
        },
      };

      // Upload to Pinecone
      await this.index.upsert([vector]);

      console.log(` Uploaded vector: ${vectorId}`);

      return {
        success: true,
        vectorId,
      };
    } catch (error) {
      console.error(
        ` Failed to upsert vector for chunk ${chunkId}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Upload multiple vectors in batch
  async upsertVectors(vectors) {
    try {
      await this.initialize();

      // Pinecone recommends batches of 100-1000 vectors
      const batchSize = 100;
      let uploaded = 0;

      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);

        console.log(
          ` Uploading batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            vectors.length / batchSize
          )}`
        );

        await this.index.upsert(batch);
        uploaded += batch.length;

        // Small delay between batches
        if (i + batchSize < vectors.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      console.log(` Uploaded ${uploaded} vectors to Pinecone`);

      return {
        success: true,
        count: uploaded,
      };
    } catch (error) {
      console.error(" Batch vector upload failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process and upload a single chunk
  async processChunk(chunk) {
    try {
      console.log(`\n Processing chunk ${chunk.id}...`);

      // Generate embedding
      const embedding = await embedderService.embedText(chunk.chunkText);

      // Prepare metadata
      const metadata = {
        chunkId: chunk.id,
        documentId: chunk.rawDocumentId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.chunkText,
        ...chunk.metadata,
      };

      // Upload to Pinecone
      const result = await this.upsertVector(chunk.id, embedding, metadata);

      if (result.success) {
        // Mark chunk as embedded in database
        await chunk.markEmbedded(result.vectorId);
        console.log(` Chunk ${chunk.id} processed successfully`);
      }

      return result;
    } catch (error) {
      console.error(` Failed to process chunk ${chunk.id}:`, error.message);
      await chunk.markFailed();
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process all pending chunks
  async processAllPending(limit = 100) {
    console.log(` Starting to process pending chunks (limit: ${limit})...\n`);

    try {
      // Get pending chunks
      const pendingChunks = await ChunkedDocument.getPendingEmbeddings(limit);

      if (pendingChunks.length === 0) {
        console.log("  No pending chunks to process");
        return { success: true, processed: 0 };
      }

      console.log(` Found ${pendingChunks.length} pending chunks\n`);

      const results = {
        successful: 0,
        failed: 0,
      };

      // Process each chunk
      for (let i = 0; i < pendingChunks.length; i++) {
        const chunk = pendingChunks[i];
        console.log(
          `\n[${i + 1}/${pendingChunks.length}] Processing chunk ${chunk.id}`
        );

        const result = await this.processChunk(chunk);

        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
        }

        // Add delay to respect rate limits
        if (i < pendingChunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log("\n Processing Summary:");
      console.log(` Successful: ${results.successful}`);
      console.log(` Failed: ${results.failed}`);

      return {
        success: true,
        processed: results.successful,
        failed: results.failed,
      };
    } catch (error) {
      console.error(" Batch processing failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Search for similar vectors (semantic search)
  async search(queryText, topK = 5, filter = null) {
    try {
      await this.initialize();

      console.log(` Searching for: "${queryText}"`);

      // Generate embedding for query
      const queryEmbedding = await embedderService.embedQuery(queryText);

      // Search in Pinecone
      const queryRequest = {
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        includeValues: false, // Don't return vector values to save bandwidth
      };

      if (filter) {
        queryRequest.filter = filter;
      }

      const searchResults = await this.index.query(queryRequest);

      console.log(` Found ${searchResults.matches.length} matches`);

      // Format results
      const formattedResults = searchResults.matches.map((match) => ({
        chunkId: match.id,
        score: match.score,
        metadata: match.metadata,
      }));

      return {
        success: true,
        results: formattedResults,
        query: queryText,
      };
    } catch (error) {
      console.error(" Search failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get chunks from database for search results
  async getChunksForResults(searchResults) {
    try {
      const chunkIds = searchResults.results.map((r) => {
        // Extract chunk ID from vector ID (format: "chunk-123")
        const id = parseInt(r.chunkId.replace("chunk-", ""));
        return id;
      });

      // Fetch chunks from database
      const chunks = await ChunkedDocument.findAll({
        where: {
          id: chunkIds,
        },
        include: ["rawDocument"],
      });

      // Combine search results with full chunk data
      const enrichedResults = searchResults.results.map((result) => {
        const chunkId = parseInt(result.chunkId.replace("chunk-", ""));
        const chunk = chunks.find((c) => c.id === chunkId);

        return {
          score: result.score,
          chunkText: chunk ? chunk.chunkText : null,
          metadata: chunk ? chunk.metadata : result.metadata,
          source: chunk?.rawDocument,
        };
      });

      return enrichedResults;
    } catch (error) {
      console.error(" Failed to enrich results:", error.message);
      throw error;
    }
  }

  // Delete a vector from Pinecone
  async deleteVector(chunkId) {
    try {
      await this.initialize();
      const vectorId = `chunk-${chunkId}`;
      await this.index.deleteOne(vectorId);
      console.log(`  Deleted vector: ${vectorId}`);
      return { success: true };
    } catch (error) {
      console.error(` Failed to delete vector ${chunkId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Get index statistics
  async getStats() {
    try {
      await this.initialize();
      const stats = await this.index.describeIndexStats();

      console.log(" Pinecone Index Stats:");
      console.log(`   Total vectors: ${stats.totalRecordCount || 0}`);
      console.log(`   Dimension: ${stats.dimension}`);

      return stats;
    } catch (error) {
      console.error(" Failed to get stats:", error.message);
      throw error;
    }
  }

  // Clear all vectors from index (use with caution!)
  async clearIndex() {
    try {
      await this.initialize();
      await this.index.deleteAll();
      console.log("  Cleared all vectors from index");
      return { success: true };
    } catch (error) {
      console.error(" Failed to clear index:", error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new VectorStoreService();
