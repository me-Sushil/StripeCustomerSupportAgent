// src/config/database.js
// This file configures the connection to PostgreSQL database using Sequelize ORM
// Sequelize provides an easy way to interact with PostgreSQL without writing raw SQL

const { Sequelize } = require("sequelize");
require("dotenv").config();

// Create a new Sequelize instance with database connection details
// This establishes the connection pool to PostgreSQL
// Prioritize DATABASE_URL (for Render/Production) over individual params
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres", // Specify we're using PostgreSQL
  logging: false, // Disable SQL query logging (set to console.log to see queries)
  dialectOptions: {
    ssl: process.env.DATABASE_URL.includes("render.com")
      ? {
          require: true,
          rejectUnauthorized: false, // Required for Render/External DBs
        }
      : false,
  },
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
});

// Function to test database connection
// This should be called when the application starts
const testConnection = async () => {
  try {
    // Authenticate checks if credentials are correct and database is reachable
    await sequelize.authenticate();
    console.log(" PostgreSQL connection established successfully");
    return true;
  } catch (error) {
    console.error(" Unable to connect to PostgreSQL:", error.message);
    return false;
  }
};

// Function to sync all models with database
// This creates tables if they don't exist
const syncDatabase = async () => {
  try {
    // alter: true will update existing tables to match models
    // force: true would drop and recreate tables (use carefully!)
    await sequelize.sync({ alter: true });
    console.log(" Database synchronized successfully");
  } catch (error) {
    console.error("Database sync failed:", error.message);
    throw error;
  }
};

// Export sequelize instance and utility functions
module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
