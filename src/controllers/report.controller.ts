import { Request, Response, NextFunction } from 'express';
import {
    getMonthlyLeakReport,
    getOrdersSummary,
    getDeviceHealthReport,
    getDashboardSummary,
} from '../services/report.service.js';

export const getMonthlyLeaks = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const months = parseInt(_req.query['months'] as string) || 12;
        const data = await getMonthlyLeakReport(months);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getOrdersSummaryReport = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await getOrdersSummary();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getDeviceHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await getDeviceHealthReport();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getDashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await getDashboardSummary();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
