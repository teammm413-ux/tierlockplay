const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

async function main() {
  const dbPath = path.join(__dirname, '../data/mongo-db');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  try {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'vegas_vault',
        dbPath: dbPath,
        storageEngine: 'wiredTiger',
      },
    });

    console.log(`[Standalone MongoDB] Running at ${mongod.getUri()} (Port 27017)`);

    process.on('SIGINT', async () => {
      await mongod.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongod.stop();
      process.exit(0);
    });
  } catch (err) {
    console.error('[Standalone MongoDB Error]', err);
    // If port 27017 is already in use by real mongod, that's also great!
    process.exit(0);
  }
}

main();
