const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

console.log('🔍 Testing MongoDB connection...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('URI:', uri.replace(/:[^:@]*@/, ':***@')); // Hide password

// DON'T use conflicting options - choose ONE approach
const client = new MongoClient(uri, {
  // Option A: Use tlsInsecure (simpler)
  tls: true,
  tlsInsecure: true,  // This enables both invalid certs and hostnames
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  retryReads: true,
  
  // Don't use these with tlsInsecure:
  // tlsAllowInvalidCertificates: true,
  // tlsAllowInvalidHostnames: true,
});

async function run() {
  try {
    console.log('⏳ Connecting...');
    await client.connect();
    console.log('✅ CONNECTED SUCCESSFULLY!');
    
    // Get database info
    const db = client.db();
    const admin = db.admin();
    
    // List databases
    const dbs = await admin.listDatabases();
    console.log('📊 Available databases:', dbs.databases.map(db => db.name));
    
    await client.close();
    console.log('👋 Connection closed');
  } catch (err) {
    console.error('❌ Connection failed:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    if (err.cause) {
      console.error('Cause:', err.cause);
    }
  }
}

run();