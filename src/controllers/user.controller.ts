import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { PAGINATION } from '../config/constants.js';

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await User.create(req.body);
        res.status(201).json({ success: true, message: 'User created.', data: user });
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query['page'] as string) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query['limit'] as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            User.countDocuments(),
        ]);

        res.status(200).json({
            success: true,
            data: users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};

export const getUserByHomeId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await User.findOne({ homeId: String(req.params['homeId'] || '').toUpperCase() }).lean();
        if (!user) return next(new AppError('User not found.', 404));
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await User.findByIdAndUpdate(String(req.params['id']), req.body, { new: true, runValidators: true });
        if (!user) return next(new AppError('User not found.', 404));
        res.status(200).json({ success: true, message: 'User updated.', data: user });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await User.findByIdAndDelete(String(req.params['id']));
        if (!user) return next(new AppError('User not found.', 404));
        res.status(200).json({ success: true, message: 'User deleted.' });
    } catch (error) {
        next(error);
    }
};
