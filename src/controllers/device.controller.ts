import { Request, Response, NextFunction } from 'express';
import { Device } from '../models/Device.js';
import { AppError } from '../utils/AppError.js';
import { PAGINATION } from '../config/constants.js';

export const registerDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const device = await Device.create(req.body);
        res.status(201).json({ success: true, message: 'Device registered.', data: device });
    } catch (error) {
        next(error);
    }
};

export const getAllDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query['page'] as string) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query['limit'] as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;
        const filter: Record<string, unknown> = {};
        if (req.query['homeId']) filter['homeId'] = String(req.query['homeId']).toUpperCase();

        const [devices, total] = await Promise.all([
            Device.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Device.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: devices,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};

export const getDeviceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const device = await Device.findOne({ deviceId: req.params['deviceId'] }).lean();
        if (!device) return next(new AppError('Device not found.', 404));
        res.status(200).json({ success: true, data: device });
    } catch (error) {
        next(error);
    }
};

export const updateDeviceStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const device = await Device.findOneAndUpdate(
            { deviceId: req.params['deviceId'] },
            { ...req.body, lastSeen: new Date() },
            { new: true, runValidators: true }
        );
        if (!device) return next(new AppError('Device not found.', 404));
        res.status(200).json({ success: true, message: 'Device updated.', data: device });
    } catch (error) {
        next(error);
    }
};

export const deleteDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const device = await Device.findOneAndDelete({ deviceId: req.params['deviceId'] });
        if (!device) return next(new AppError('Device not found.', 404));
        res.status(200).json({ success: true, message: 'Device removed.' });
    } catch (error) {
        next(error);
    }
};
