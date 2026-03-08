import { Request, Response, NextFunction } from 'express';
import { Alert } from '../models/Alert.js';
import { AppError } from '../utils/AppError.js';
import { PAGINATION } from '../config/constants.js';

export const getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query['page'] as string) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query['limit'] as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;
        const filter: Record<string, unknown> = {};
        if (req.query['homeId']) filter['homeId'] = String(req.query['homeId']).toUpperCase();
        if (req.query['deviceId']) filter['deviceId'] = req.query['deviceId'];
        if (req.query['isResolved'] !== undefined) filter['isResolved'] = req.query['isResolved'] === 'true';
        if (req.query['severity']) filter['severity'] = req.query['severity'];
        if (req.query['alertType']) filter['alertType'] = req.query['alertType'];

        const [alerts, total] = await Promise.all([
            Alert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Alert.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: alerts,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};

export const getAlertById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const alert = await Alert.findById(req.params['id']).lean();
        if (!alert) return next(new AppError('Alert not found.', 404));
        res.status(200).json({ success: true, data: alert });
    } catch (error) {
        next(error);
    }
};

export const resolveAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params['id'],
            { isResolved: true, resolvedAt: new Date() },
            { new: true }
        );
        if (!alert) return next(new AppError('Alert not found.', 404));
        res.status(200).json({ success: true, message: 'Alert resolved.', data: alert });
    } catch (error) {
        next(error);
    }
};

export const resolveAllAlertsForHome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { homeId } = req.params;
        const result = await Alert.updateMany(
            { homeId: String(homeId || '').toUpperCase(), isResolved: false },
            { isResolved: true, resolvedAt: new Date() }
        );
        res.status(200).json({
            success: true,
            message: `Resolved ${result.modifiedCount} alert(s).`,
        });
    } catch (error) {
        next(error);
    }
};
