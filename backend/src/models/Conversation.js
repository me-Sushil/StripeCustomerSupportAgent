// src/models/Conversation.js
// Model for storing user conversations
// Tracks chat history, feedback, and analytics

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// Define the Conversation model
// Stores complete conversation threads with users
const Conversation = sequelize.define(
  "Conversation",
  {
    // Primary key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // Unique session identifier
    sessionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false,
      field: "session_id",
    },

    // Optional user identifier (can be IP, user ID, etc.)
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "user_id",
    },

    // Conversation title (auto-generated from first query)
    title: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    // Current status of conversation
    status: {
      type: DataTypes.ENUM("active", "archived", "deleted"),
      defaultValue: "active",
    },

    // Metadata (user agent, IP, etc.)
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },

    // Timestamps
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "started_at",
    },

    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_message_at",
    },
  },
  {
    tableName: "conversations",
    timestamps: true,
    indexes: [
      { fields: ["session_id"] },
      { fields: ["user_id"] },
      { fields: ["status"] },
      { fields: ["started_at"] },
    ],
  }
);

// Define the Message model
// Individual messages within a conversation
const Message = sequelize.define(
  "Message",
  {
    // Primary key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // Foreign key to conversation
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "conversation_id",
      references: {
        model: "conversations",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    // Message role (user or assistant)
    role: {
      type: DataTypes.ENUM("user", "assistant"),
      allowNull: false,
    },

    // Message content
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // Sources used for this response (for assistant messages)
    sources: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },

    // Response metadata (chunks used, scores, etc.)
    responseMetadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "response_metadata",
    },

    // User feedback (thumbs up/down, rating)
    feedback: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },

    // Processing time in milliseconds
    processingTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "processing_time",
    },

    // Token usage (if tracking LLM costs)
    tokenUsage: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "token_usage",
    },

    // Timestamp
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    tableName: "messages",
    timestamps: false,
    indexes: [
      { fields: ["conversation_id"] },
      { fields: ["role"] },
      { fields: ["created_at"] },
    ],
  }
);

// Define relationships
Conversation.hasMany(Message, {
  foreignKey: "conversationId",
  as: "messages",
});

Message.belongsTo(Conversation, {
  foreignKey: "conversationId",
  as: "conversation",
});

// Instance methods for Conversation
Conversation.prototype.addMessage = async function (
  role,
  content,
  metadata = {}
) {
  const message = await Message.create({
    conversationId: this.id,
    role,
    content,
    sources: metadata.sources || [],
    responseMetadata: metadata.responseMetadata || null,
    processingTime: metadata.processingTime || null,
    tokenUsage: metadata.tokenUsage || null,
    createdAt: new Date(),
  });

  // Update last message timestamp
  this.lastMessageAt = new Date();
  await this.save();

  return message;
};

Conversation.prototype.getMessages = async function (limit = 50) {
  return await Message.findAll({
    where: { conversationId: this.id },
    order: [["created_at", "ASC"]],
    limit,
  });
};

Conversation.prototype.archive = async function () {
  this.status = "archived";
  await this.save();
};

// Static methods for Conversation
Conversation.getBySessionId = async function (sessionId) {
  return await this.findOne({
    where: { sessionId },
    include: [
      {
        model: Message,
        as: "messages",
        order: [["created_at", "ASC"]],
      },
    ],
  });
};

Conversation.createNew = async function (userId = null, metadata = {}) {
  return await this.create({
    userId,
    metadata,
    status: "active",
    startedAt: new Date(),
  });
};

Conversation.getRecent = async function (limit = 20, userId = null) {
  const where = { status: "active" };
  if (userId) {
    where.userId = userId;
  }

  return await this.findAll({
    where,
    order: [["last_message_at", "DESC"]],
    limit,
    include: [
      {
        model: Message,
        as: "messages",
        limit: 1,
        order: [["created_at", "DESC"]],
      },
    ],
  });
};

// Instance methods for Message
Message.prototype.addFeedback = async function (feedback) {
  this.feedback = {
    ...this.feedback,
    ...feedback,
    timestamp: new Date().toISOString(),
  };
  await this.save();
};

// Static methods for Message
Message.getByConversation = async function (conversationId) {
  return await this.findAll({
    where: { conversationId },
    order: [["created_at", "ASC"]],
  });
};

Message.getStats = async function () {
  const total = await this.count();
  const byRole = await this.count({
    group: ["role"],
  });
  const withFeedback = await this.count({
    where: {
      feedback: {
        [sequelize.Op.ne]: null,
      },
    },
  });

  return {
    total,
    byRole,
    withFeedback,
  };
};

module.exports = {
  Conversation,
  Message,
};
