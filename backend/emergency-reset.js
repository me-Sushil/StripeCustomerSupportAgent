// // emergency-reset.js
// const { sequelize } = require("./src/config/database");
// const RawDocument = require("./src/models/RawDocument");
// const ChunkedDocument = require("./src/models/ChunkedDocument");

// async function reset() {
//   console.log("1. Starting Script...");
//   try {
//     console.log("2. Attempting to connect to Render PostgreSQL...");
    
//     // Test the authentication specifically
//     await sequelize.authenticate();
//     console.log("3. Connection established successfully!");

//     console.log("4. Syncing database (Force: true)... this drops all tables.");
//     // This part takes the longest because it's talking to a server in Singapore
//     await sequelize.sync({ force: true });
    
//     console.log(" 5. SUCCESS: PostgreSQL tables are recreated and empty.");
//   } catch (err) {
//     console.error(" ERROR DURING RESET:");
//     console.error(err);
//   } finally {
//     console.log("6. Closing connection...");
//     await sequelize.close();
//     process.exit(0);
//   }
// }

// reset();

// emergency-reset.js
// ⚠️ DANGER ZONE: This script deletes ALL database tables AND Pinecone vectors

const { sequelize } = require("./src/config/database");
const RawDocument = require("./src/models/RawDocument");
const ChunkedDocument = require("./src/models/ChunkedDocument");

const {
  initializePinecone,
  deleteAllVectors,
} = require("./src/config/pinecone");

async function reset() {
  console.log(" EMERGENCY RESET STARTED 🚨");

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
