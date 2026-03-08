import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

// Route imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import deviceRoutes from './routes/device.routes.js';
import gasReadingRoutes from './routes/gasReading.routes.js';
import orderRoutes from './routes/order.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import alertRoutes from './routes/alert.routes.js';
import reportRoutes from './routes/report.routes.js';

// Middleware imports
import { errorMiddleware } from './middleware/error.middleware.js';
import { AppError } from './utils/AppError.js';

const app: Application = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
    cors({
        origin: [
            'http://localhost:3000',   // Next.js admin
            'http://localhost:3001',
            '*',                       // Flutter/ESP32; tighten in production
        ],
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Smart Gas Backend API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, status: 'healthy', uptime: process.uptime() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/readings', gasReadingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Route ${req.originalUrl} not found.`, 404));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorMiddleware);

export default app;
