// src/services/scraper.js
// This service scrapes web pages and stores them in PostgreSQL
// Uses Puppeteer for JavaScript-heavy sites and Cheerio for simple HTML parsing

const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const axios = require("axios");
const RawDocument = require("../models/RawDocument");

class ScraperService {
  constructor() {
    this.browser = null;
  }

  // Initialize browser instance (reusable for multiple scrapes)
  async initBrowser() {
    if (!this.browser) {
      console.log(" Launching browser...");
      this.browser = await puppeteer.launch({
        headless: "new", // Run in headless mode (no GUI)
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
    return this.browser;
  }

  // Close browser when done
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log(" Browser closed");
    }
  }

  cleanText(html) {
    const $ = cheerio.load(html);
    // 1. REMOVE SPECIFIC NOISE
    // We remove code blocks that aren't the primary language if possible,
    // and definitely remove scripts/nav/footer.
    $(
      "script, style, nav, footer, header, .sidebar, .table-of-contents"
    ).remove();
    // 2. TARGET THE CONTENT AREA (Stripe specific)
    // Most Stripe docs store the main content in a specific div or article tag.
    const mainContent = $("article").length
      ? $("article")
      : $("main").length
      ? $("main")
      : $("body");
    let text = mainContent.text();
    // 3. BETTER WHITESPACE CLEANING
    text = text
      .replace(/\t/g, " ")
      .replace(/ +/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();
    return text;
  }
  // // Clean HTML to extract meaningful text
  // cleanText(html) {
  //   const $ = cheerio.load(html);
  //   // Remove unwanted elements
  //   $("script, style, nav, footer, header, iframe, noscript").remove();
  //   // Get text content
  //   let text = $("body").text();
  //   // Clean up whitespace
  //   text = text
  //     .replace(/\s+/g, " ") // Multiple spaces to single space
  //     .replace(/\n\s*\n/g, "\n") // Multiple newlines to single newline
  //     .trim();
  //   return text;
  // }

  // Extract metadata from page
  // extractMetadata(html, url) {
  //   const $ = cheerio.load(html);
  //   return {
  //     url,
  //     title: $("title").text() || $("h1").first().text() || "Untitled",
  //     description: $('meta[name="description"]').attr("content") || "",
  //     author: $('meta[name="author"]').attr("content") || "",
  //     keywords: $('meta[name="keywords"]').attr("content") || "",
  //     ogTitle: $('meta[property="og:title"]').attr("content") || "",
  //     ogDescription: $('meta[property="og:description"]').attr("content") || "",
  //     scrapedDate: new Date().toISOString(),
  //   };
  // }
  extractMetadata(html, url) {
    const $ = cheerio.load(html);
    // Priority: 1. H1 tag (Best for docs), 2. OG Title, 3. HTML Title
    const title =
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim() ||
      "Stripe Documentation";
    return {
      url,
      title,
      scrapedDate: new Date().toISOString(),
    };
  }
  // Scrape a single URL using Puppeteer (for JavaScript-rendered content)
  async scrapeWithPuppeteer(url) {
    console.log(` Scraping with Puppeteer: ${url}`);

    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      );

      // Navigate to page and wait for content to load
      await page.goto(url, {
        waitUntil: "networkidle2", // Wait until network is idle
        timeout: 30000,
      });

      // Wait a bit more for JavaScript to execute
      await page.waitForTimeout(2000);

      // Get page content
      const html = await page.content();
      await page.close();

      return html;
    } catch (error) {
      console.error(`Puppeteer scraping failed for ${url}:`, error.message);
      throw error;
    }
  }

  // Scrape a single URL using Axios + Cheerio (faster, for static content)
  async scrapeWithAxios(url) {
    console.log(` Scraping with Axios: ${url}`);

    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Axios scraping failed for ${url}:`, error.message);
      throw error;
    }
  }

  // Main scraping method - tries Axios first, falls back to Puppeteer
  async scrapeURL(url, usePuppeteer = false) {
    try {
      // Check if URL already exists in database
      const exists = await RawDocument.urlExists(url);
      if (exists) {
        console.log(` URL already scraped: ${url}`);
        return { success: false, message: "URL already exists" };
      }

      // Get HTML content
      let html;
      if (usePuppeteer) {
        html = await this.scrapeWithPuppeteer(url);
      } else {
        try {
          html = await this.scrapeWithAxios(url);
        } catch (error) {
          // Fallback to Puppeteer if Axios fails
          console.log("  Axios failed, trying Puppeteer...");
          html = await this.scrapeWithPuppeteer(url);
        }
      }

      // Extract metadata and clean text
      const metadata = this.extractMetadata(html, url);
      const cleanedContent = this.cleanText(html);
      const wordCount = cleanedContent.split(/\s+/).length;

      // Save to database
      const document = await RawDocument.create({
        url,
        title: metadata.title,
        rawContent: html,
        cleanedContent,
        metadata,
        wordCount,
        status: "pending",
        scrapedAt: new Date(),
      });

      console.log(` Successfully scraped: ${url} (${wordCount} words)`);
      return {
        success: true,
        document,
        wordCount,
      };
    } catch (error) {
      console.error(` Failed to scrape ${url}:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Scrape multiple URLs
  async scrapeURLs(urls, usePuppeteer = false) {
    console.log(` Starting to scrape ${urls.length} URLs...`);

    const results = {
      successful: [],
      failed: [],
      skipped: [],
    };

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n[${i + 1}/${urls.length}] Processing: ${url}`);

      const result = await this.scrapeURL(url, usePuppeteer);

      if (result.success === false && result.message === "URL already exists") {
        results.skipped.push(url);
      } else if (result.success) {
        results.successful.push(url);
      } else {
        results.failed.push({ url, error: result.error });
      }

      // Add delay to avoid rate limiting
      if (i < urls.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log("\n Scraping Summary:");
    console.log(`Successful: ${results.successful.length}`);
    console.log(`  Skipped: ${results.skipped.length}`);
    console.log(` Failed: ${results.failed.length}`);

    return results;
  }

  // Get all pending documents from database
  async getPendingDocuments() {
    return await RawDocument.getPending();
  }
}

module.exports = new ScraperService();
// src/services/scraper.js
