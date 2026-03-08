import { Request, Response, NextFunction } from 'express';
import { GasReading } from '../models/GasReading.js';
import { Device } from '../models/Device.js';
import { analyseGasReading } from '../services/gasLeak.service.js';
import { createGasLeakAlert } from '../services/alert.service.js';
import { emitGasReading } from '../services/socket.service.js';
import { AppError } from '../utils/AppError.js';
import { PAGINATION } from '../config/constants.js';

export const saveReading = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { deviceId, homeId, ppmValue, temperature, humidity } = req.body as {
            deviceId?: string;
            homeId?: string;
            ppmValue?: number;
            temperature?: number;
            humidity?: number;
        };

        if (!deviceId || !homeId || ppmValue === undefined) {
            return next(new AppError('deviceId, homeId, and ppmValue are required.', 400));
        }

        const analysis = analyseGasReading(ppmValue);

        const reading = await GasReading.create({
            deviceId,
            homeId: homeId.toUpperCase(),
            ppmValue,
            temperature,
            humidity,
            isLeak: analysis.isLeak,
            gasStatus: analysis.gasStatus,
            timestamp: new Date(),
        });

        // Update device online status
        await Device.findOneAndUpdate(
            { deviceId },
            { isOnline: true, lastSeen: new Date() },
            { upsert: false }
        );

        // Emit live reading via Socket.IO
        emitGasReading(homeId.toUpperCase(), {
            deviceId,
            ppmValue,
            gasStatus: analysis.gasStatus,
            isLeak: analysis.isLeak,
            temperature,
            humidity,
            timestamp: reading.timestamp,
        });

        // Auto-create alert if leak
        let alert = null;
        if (analysis.isLeak) {
            alert = await createGasLeakAlert(deviceId, homeId.toUpperCase(), ppmValue, analysis);
        }

        res.status(201).json({
            success: true,
            message: analysis.isLeak ? `⚠️ Leak detected: ${analysis.message}` : 'Reading saved.',
            data: {
                reading,
                analysis,
                alert: alert ? { id: alert._id, severity: alert.severity } : null,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getReadings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query['page'] as string) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query['limit'] as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        if (req.query['homeId']) filter['homeId'] = String(req.query['homeId']).toUpperCase();
        if (req.query['deviceId']) filter['deviceId'] = req.query['deviceId'];
        if (req.query['isLeak'] !== undefined) filter['isLeak'] = req.query['isLeak'] === 'true';

        const [readings, total] = await Promise.all([
            GasReading.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
            GasReading.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: readings,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};

export const getLatestReading = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const reading = await GasReading.findOne({ deviceId: req.params['deviceId'] })
            .sort({ timestamp: -1 })
            .lean();

        if (!reading) return next(new AppError('No readings found for this device.', 404));
        res.status(200).json({ success: true, data: reading });
    } catch (error) {
        next(error);
    }
};

export const getGasHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { deviceId, homeId, from, to } = req.query as {
            deviceId?: string;
            homeId?: string;
            from?: string;
            to?: string;
        };

        const filter: Record<string, unknown> = {};
        if (deviceId) filter['deviceId'] = deviceId;
        if (homeId) filter['homeId'] = homeId.toUpperCase();
        if (from || to) {
            const dateFilter: Record<string, Date> = {};
            if (from) dateFilter['$gte'] = new Date(from);
            if (to) dateFilter['$lte'] = new Date(to);
            filter['timestamp'] = dateFilter;
        }

        const readings = await GasReading.find(filter).sort({ timestamp: 1 }).lean();
        res.status(200).json({ success: true, count: readings.length, data: readings });
    } catch (error) {
        next(error);
    }
};
