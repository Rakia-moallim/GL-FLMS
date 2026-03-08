import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './services/socket.service.js';
import { startSimulator } from './services/simulator.service.js';

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  // Connect to MongoDB first
  await connectDB();

  // Create HTTP server from Express app
  const httpServer = http.createServer(app);

  // Attach Socket.IO to the HTTP server
  const io = initSocket(httpServer);
  console.log('🔌 Socket.IO initialized');

  // Start the HTTP server
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Smart Gas Backend Server`);
    console.log(`   Port    : ${PORT}`);
    console.log(`   Mode    : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   API     : http://localhost:${PORT}/api`);
    console.log(`   Health  : http://localhost:${PORT}/api/health\n`);

    // Start fake sensor simulator after server is up
    startSimulator();
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n⚡ Received ${signal}. Gracefully shutting down...`);
    httpServer.close(() => {
      console.log('✅ HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
    httpServer.close(() => process.exit(1));
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });
};

startServer();