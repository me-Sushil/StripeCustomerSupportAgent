// src/models/RawDocument.js
// This model represents scraped documents stored in PostgreSQL
// Each record contains the raw HTML/text content from a single URL

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// Define the RawDocument model schema
// This will create a 'raw_documents' table in PostgreSQL

const RawDocument = sequelize.define(
  "RawDocument",
  {
    // Primary key - auto-incrementing integer
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // URL of the scraped page (must be unique to avoid duplicates)
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true, // Prevents scraping the same URL twice
      validate: {
        isUrl: true, // Validates that the value is a proper URL
      },
    },

    // Page title extracted from <title> tag or h1
    title: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    // Raw HTML content of the page
    rawContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "raw_content", // Maps to 'raw_content' column in database
    },

    // Cleaned text content (HTML tags removed, formatted)
    cleanedContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "cleaned_content",
    },

    // Metadata as JSON (can store anything: author, date, category, etc.)
    metadata: {
      type: DataTypes.JSONB, // JSONB is PostgreSQL's efficient JSON storage
      allowNull: true,
      defaultValue: {},
    },

    // Status of document processing
    status: {
      type: DataTypes.ENUM("pending", "processed", "failed"),
      defaultValue: "pending",
    },

    // Track when document was scraped
    scrapedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "scraped_at",
    },

    // Word count of cleaned content
    wordCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "word_count",
    },
  },
  {
    tableName: "raw_documents", // Explicit table name
    timestamps: true, // Adds createdAt and updatedAt automatically
    indexes: [
      {
        fields: ["url"], // Index on URL for faster lookups
      },
      {
        fields: ["status"], // Index on status for filtering
      },
      {
        fields: ["scraped_at"], // Index on date for time-based queries
      },
    ],
  }
);

// Instance method to mark document as processed
RawDocument.prototype.markProcessed = async function () {
  this.status = "processed";
  await this.save();
};

// Instance method to mark document as failed
RawDocument.prototype.markFailed = async function () {
  this.status = "failed";
  await this.save();
};

// Static method to get all pending documents
RawDocument.getPending = async function () {
  return await this.findAll({
    where: { status: "pending" },
    order: [["scraped_at", "ASC"]],
  });
};

// Static method to check if URL already exists
RawDocument.urlExists = async function (url) {
  const count = await this.count({ where: { url } });
  return count > 0;
};

module.exports = RawDocument;
