import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../config/db.js';
import { startSimulator } from '../services/simulator.service.js';

/**
 * Standalone entry point to run ONLY the sensor simulator
 * (connects to DB and emits fake readings without starting HTTP server)
 * Usage: pnpm run simulate
 */
(async () => {
    await connectDB();
    console.log('🤖 Running standalone simulator...');
    startSimulator();
})();
