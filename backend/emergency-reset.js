
// emergency-reset.js
// DANGER ZONE: This script deletes ALL database tables AND Pinecone vectors

const { sequelize } = require("./src/config/database");
const {
  initializePinecone,
  deleteAllVectors,
} = require("./src/config/pinecone");

async function reset() {
  console.log(" EMERGENCY RESET STARTED ");

  try {
    // -----------------------------
    // 1. PostgreSQL RESET
    // -----------------------------
    console.log("Connecting to PostgreSQL...");
    await sequelize.authenticate();
    console.log(" PostgreSQL connected");

    console.log(" Dropping & recreating all tables...");
    await sequelize.sync({ force: true });
    console.log(" PostgreSQL tables reset complete");

    // -----------------------------
    // 2. Pinecone RESET
    // -----------------------------
    console.log(" Initializing Pinecone...");
    await initializePinecone();

    console.log(" Deleting ALL Pinecone vectors...");
    await deleteAllVectors();
    console.log(" Pinecone index cleared");

    console.log(" RESET COMPLETED SUCCESSFULLY");
  } catch (err) {
    console.error(" ERROR DURING EMERGENCY RESET:");
    console.error(err);
  } finally {
    console.log(" Closing PostgreSQL connection...");
    await sequelize.close();
    process.exit(0);
  }
}

reset();
