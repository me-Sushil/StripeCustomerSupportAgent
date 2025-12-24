// src/models/ChunkedDocument.js
// This model represents text chunks created from raw documents
// Each chunk is a smaller piece of text suitable for embedding

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const RawDocument = require("./RawDocument");


// Define the ChunkedDocument model schema
// This will create a 'chunked_documents' table in PostgreSQL
const ChunkedDocument = sequelize.define(
  "ChunkedDocument",
  {
    // Primary key - auto-incrementing integer
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // Foreign key linking to the parent RawDocument
    rawDocumentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "raw_document_id",
      references: {
        model: "raw_documents", // References the raw_documents table
        key: "id",
      },
      onDelete: "CASCADE", // Delete chunks if parent document is deleted
    },

    // The actual text chunk content
    chunkText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "chunk_text",
    },

    // Position of this chunk in the original document (0, 1, 2, ...)
    chunkIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "chunk_index",
    },

    // Character count of this chunk
    chunkSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "chunk_size",
    },

    // Embedding vector ID in Pinecone (for reference)
    vectorId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "vector_id",
    },

    // Status of embedding process
    embeddingStatus: {
      type: DataTypes.ENUM("pending", "embedded", "failed"),
      defaultValue: "pending",
      field: "embedding_status",
    },

    // Metadata inherited from parent + chunk-specific data
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },

    // When this chunk was created
    chunkedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "chunked_at",
    },

    // When this chunk was embedded
    embeddedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "embedded_at",
    },
  },
  {
    tableName: "chunked_documents",
    timestamps: true,
    indexes: [
      {
        fields: ["raw_document_id"], // Fast lookup of chunks by parent document
      },
      {
        fields: ["embedding_status"], // Filter chunks by embedding status
      },
      {
        fields: ["vector_id"], // Lookup chunk by its vector ID
      },
      {
        fields: ["raw_document_id", "chunk_index"], // Composite index for ordered retrieval
      },
    ],
  }
);

// Define relationship: ChunkedDocument belongs to RawDocument
ChunkedDocument.belongsTo(RawDocument, {
  foreignKey: "rawDocumentId",
  as: "rawDocument",
});

// Define reverse relationship: RawDocument has many ChunkedDocuments
RawDocument.hasMany(ChunkedDocument, {
  foreignKey: "rawDocumentId",
  as: "chunks",
});

// Instance method to mark chunk as embedded
ChunkedDocument.prototype.markEmbedded = async function (vectorId) {
  this.embeddingStatus = "embedded";
  this.vectorId = vectorId;
  this.embeddedAt = new Date();
  await this.save();
};

// Instance method to mark chunk embedding as failed
ChunkedDocument.prototype.markFailed = async function () {
  this.embeddingStatus = "failed";
  await this.save();
};

// Static method to get pending chunks for embedding
ChunkedDocument.getPendingEmbeddings = async function (limit = 100) {
  return await this.findAll({
    where: { embeddingStatus: "pending" },
    limit,
    order: [["chunked_at", "ASC"]],
    include: [
      {
        model: RawDocument,
        as: "rawDocument",
        attributes: ["url", "title"], // Include parent document info
      },
    ],
  });
};

// Static method to get all chunks for a specific document
ChunkedDocument.getByDocumentId = async function (rawDocumentId) {
  return await this.findAll({
    where: { rawDocumentId },
    order: [["chunk_index", "ASC"]],
  });
};

module.exports = ChunkedDocument;
