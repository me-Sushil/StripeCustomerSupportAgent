// src/services/chunker.js
// This service splits large documents into smaller chunks using LangChain
// Chunks are stored in PostgreSQL for later embedding

const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const RawDocument = require("../models/RawDocument");
const ChunkedDocument = require("../models/ChunkedDocument");

class ChunkerService {
  constructor() {
    // Initialize text splitter with default parameters
    // These can be adjusted based on your embedding model's limits
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000, // Maximum characters per chunk
      chunkOverlap: 200, // Overlap between chunks for context continuity
      separators: ["\n\n", "\n", ". ", " ", ""], // Split at natural boundaries
      keepSeparator: false, // Don't include separators in chunks
    });
  }

  // Create a custom splitter with specific parameters
  createSplitter(chunkSize = 1000, chunkOverlap = 200) {
    return new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ["\n\n", "\n", ". ", " ", ""],
      keepSeparator: false,
    });
  }

  // Split text into chunks using LangChain splitter
  async splitText(text, customSplitter = null) {
    try {
      const splitter = customSplitter || this.splitter;

      // Split the text into chunks
      const chunks = await splitter.splitText(text);

      console.log(` Split into ${chunks.length} chunks`);
      return chunks;
    } catch (error) {
      console.error(" Text splitting failed:", error.message);
      throw error;
    }
  }

  // Process a single RawDocument: split and save chunks
  async chunkDocument(documentId) {
    try {
      // Fetch the raw document from database
      const document = await RawDocument.findByPk(documentId);

      if (!document) {
        throw new Error(`Document with ID ${documentId} not found`);
      }

      if (document.status === "processed") {
        console.log(` Document already processed: ${document.url}`);
        return { success: false, message: "Already processed" };
      }

      console.log(`\n Processing document: ${document.title}`);
      console.log(
        `📏 Content length: ${document.cleanedContent.length} characters`
      );

      // Split the cleaned content into chunks
      const textChunks = await this.splitText(document.cleanedContent);

      // Save each chunk to database
      const savedChunks = [];
      for (let i = 0; i < textChunks.length; i++) {
        const chunkText = textChunks[i];

        // Create chunk metadata (inherit from parent + add chunk-specific info)
        const chunkMetadata = {
          ...document.metadata,
          sourceUrl: document.url,
          sourceTitle: document.title,
          chunkIndex: i,
          totalChunks: textChunks.length,
          documentId: document.id,
        };

        // Save chunk to database
        const chunk = await ChunkedDocument.create({
          rawDocumentId: document.id,
          chunkText: chunkText,
          chunkIndex: i,
          chunkSize: chunkText.length,
          metadata: chunkMetadata,
          embeddingStatus: "pending",
          chunkedAt: new Date(),
        });

        savedChunks.push(chunk);
      }

      // Mark the raw document as processed
      await document.markProcessed();

      console.log(
        ` Created ${savedChunks.length} chunks for: ${document.title}`
      );

      return {
        success: true,
        documentId: document.id,
        chunkCount: savedChunks.length,
        chunks: savedChunks,
      };
    } catch (error) {
      console.error(
        ` Chunking failed for document ${documentId}:`,
        error.message
      );

      // Mark document as failed
      const document = await RawDocument.findByPk(documentId);
      if (document) {
        await document.markFailed();
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process all pending documents
  async chunkAllPending() {
    console.log(" Starting to chunk all pending documents...\n");

    try {
      // Get all documents with status 'pending'
      const pendingDocs = await RawDocument.getPending();

      if (pendingDocs.length === 0) {
        console.log(" No pending documents to process");
        return { success: true, processed: 0 };
      }

      console.log(` Found ${pendingDocs.length} pending documents\n`);

      const results = {
        successful: [],
        failed: [],
      };

      // Process each document
      for (let i = 0; i < pendingDocs.length; i++) {
        const doc = pendingDocs[i];
        console.log(
          `\n[${i + 1}/${pendingDocs.length}] Processing document ID: ${doc.id}`
        );

        const result = await this.chunkDocument(doc.id);

        if (result.success) {
          results.successful.push(doc.id);
        } else {
          results.failed.push({ id: doc.id, error: result.error });
        }
      }

      console.log("\nChunking Summary:");
      console.log(` Successful: ${results.successful.length}`);
      console.log(` Failed: ${results.failed.length}`);

      return {
        success: true,
        processed: results.successful.length,
        failed: results.failed.length,
        results,
      };
    } catch (error) {
      console.error(" Batch chunking failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get statistics about chunks
  async getChunkStats() {
    try {
      const totalChunks = await ChunkedDocument.count();
      const pendingChunks = await ChunkedDocument.count({
        where: { embeddingStatus: "pending" },
      });
      const embeddedChunks = await ChunkedDocument.count({
        where: { embeddingStatus: "embedded" },
      });
      const failedChunks = await ChunkedDocument.count({
        where: { embeddingStatus: "failed" },
      });

      return {
        total: totalChunks,
        pending: pendingChunks,
        embedded: embeddedChunks,
        failed: failedChunks,
      };
    } catch (error) {
      console.error(" Failed to get chunk stats:", error.message);
      throw error;
    }
  }

  // Get pending chunks for embedding
  async getPendingChunks(limit = 100) {
    return await ChunkedDocument.getPendingEmbeddings(limit);
  }
}

module.exports = new ChunkerService();
