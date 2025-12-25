// scripts/pipeline.js
// Standalone script to run the complete pipeline
// Usage: node scripts/pipeline.js

require("dotenv").config();
const { testConnection, syncDatabase } = require("../src/config/database");
const { initializePinecone } = require("../src/config/pinecone");
const scraperService = require("../src/services/scraper");
const chunkerService = require("../src/services/chunker");
const vectorStoreService = require("../src/services/vectorStore");

// ============================================
// CONFIGURATION
// ============================================

// Stripe documentation URLs to scrape
// Add more URLs as needed
const STRIPE_URLS = [
  "https://docs.stripe.com",
  "https://docs.stripe.com/api",
  "https://docs.stripe.com/payments/payment-methods",
  "https://docs.stripe.com/billing",
  "https://stripe.com/docs/connect",
  "https://docs.stripe.com/connect",
  "https://docs.stripe.com/disputes",
  "https://docs.stripe.com/refunds",
  "https://docs.stripe.com/error-codes",
  "https://docs.stripe.com/testing",
  "https://support.stripe.com/",
  "https://docs.stripe.com/get-started/api-request",
];

// ============================================
// PIPELINE FUNCTIONS
// ============================================

async function initialize() {
  console.log("\n Initializing Pipeline...\n");

  try {
    // Connect to PostgreSQL
    console.log(" Connecting to PostgreSQL...");
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error("Failed to connect to PostgreSQL");
    }

    // Sync database
    console.log(" Synchronizing database...");
    await syncDatabase();

    // Initialize Pinecone
    console.log(" Initializing Pinecone...");
    await initializePinecone();

    console.log(" Initialization complete!\n");
    return true;
  } catch (error) {
    console.error(" Initialization failed:", error.message);
    return false;
  }
}

async function runScraping(urls) {
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: WEB SCRAPING");
  console.log("=".repeat(60) + "\n");

  try {
    const results = await scraperService.scrapeURLs(urls, false);

    console.log("\n Scraping Results:");
    console.log(` Successful: ${results.successful.length}`);
    console.log(` Skipped: ${results.skipped.length}`);
    console.log(` Failed: ${results.failed.length}`);

    return results;
  } catch (error) {
    console.error("Scraping failed:", error.message);
    throw error;
  }
}

async function runChunking() {
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: TEXT CHUNKING");
  console.log("=".repeat(60) + "\n");

  try {
    const results = await chunkerService.chunkAllPending();

    console.log("\n Chunking Results:");
    console.log(`  Documents processed: ${results.processed}`);
    console.log(`  Failed: ${results.failed}`);

    // Get chunk statistics
    const stats = await chunkerService.getChunkStats();
    console.log("\nChunk Statistics:");
    console.log(`   Total chunks: ${stats.total}`);
    console.log(`   Pending: ${stats.pending}`);
    console.log(`   Embedded: ${stats.embedded}`);

    return results;
  } catch (error) {
    console.error(" Chunking failed:", error.message);
    throw error;
  }
}

async function runEmbeddingAndStorage(limit = 1000) {
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: EMBEDDING & VECTOR STORAGE");
  console.log("=".repeat(60) + "\n");

  try {
    const results = await vectorStoreService.processAllPending(limit);

    console.log("\n Embedding & Storage Results:");
    console.log(`   Vectors created: ${results.processed}`);
    console.log(`   Failed: ${results.failed}`);

    // Get Pinecone statistics
    const stats = await vectorStoreService.getStats();
    console.log("\n Vector Database Statistics:");
    console.log(`   Total vectors: ${stats.totalRecordCount || 0}`);
    console.log(`   Dimension: ${stats.dimension}`);

    return results;
  } catch (error) {
    console.error(" Embedding failed:", error.message);
    throw error;
  }
}

// ============================================
// MAIN PIPELINE
// ============================================

async function runPipeline() {
  const startTime = Date.now();

  try {
    // Initialize all services
    const initialized = await initialize();
    if (!initialized) {
      throw new Error("Failed to initialize services");
    }

    // Step 1: Scrape URLs
    const scrapingResults = await runScraping(STRIPE_URLS);

    // Step 2: Chunk documents
    const chunkingResults = await runChunking();

    // Step 3: Embed and store vectors
    const embeddingResults = await runEmbeddingAndStorage();

    // Calculate total time
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    // Final summary
    console.log("\n" + "=".repeat(60));
    console.log("PIPELINE COMPLETED SUCCESSFULLY! 🎉");
    console.log("=".repeat(60));
    console.log(` Total time: ${totalTime} seconds\n`);
    console.log("Summary:");
    console.log(`   URLs scraped: ${scrapingResults.successful.length}`);
    console.log(`   Documents chunked: ${chunkingResults.processed}`);
    console.log(`   Vectors created: ${embeddingResults.processed}`);
    console.log("\n Your RAG system is ready to use!\n");

    // Close browser
    await scraperService.closeBrowser();

    process.exit(0);
  } catch (error) {
    console.error("\n Pipeline failed:", error.message);
    console.error(error.stack);

    // Close browser on error
    await scraperService.closeBrowser();

    process.exit(1);
  }
}

// ============================================
// CLI COMMANDS
// ============================================

const command = process.argv[2];

switch (command) {
  case "scrape":
    // Run only scraping step
    initialize().then(() => {
      runScraping(STRIPE_URLS).then(() => {
        scraperService.closeBrowser();
        process.exit(0);
      });
    });
    break;

  case "chunk":
    // Run only chunking step
    initialize().then(() => {
      runChunking().then(() => process.exit(0));
    });
    break;

  case "embed":
    // Run only embedding step
    initialize().then(() => {
      runEmbeddingAndStorage().then(() => process.exit(0));
    });
    break;

  case "full":
  default:
    // Run full pipeline
    runPipeline();
    break;
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error(" Unhandled rejection:", error);
  process.exit(1);
});
