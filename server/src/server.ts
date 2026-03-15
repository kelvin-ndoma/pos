// src/server.ts
import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { connectDB } from './config/db';

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function startServer() {
  try {
    await connectDB(); // ✅ ensure MongoDB is connected first

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });

    // Optional: basic process-level error listeners
    server.on('error', (error: NodeJS.ErrnoException) => {
      console.error('Server error:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
