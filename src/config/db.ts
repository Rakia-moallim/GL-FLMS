import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-gas-db';

const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error(`❌ MongoDB Error: ${err.message}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
        });
    } catch (error) {
        console.error(`❌ Failed to connect to MongoDB: ${(error as Error).message}`);
        process.exit(1);
    }
};

export default connectDB;
