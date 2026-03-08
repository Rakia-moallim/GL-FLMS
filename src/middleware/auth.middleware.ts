import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service.js';
import { AppError } from '../utils/AppError.js';

export const protect = (req: Request, _res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new AppError('No token provided. Please log in.', 401));
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return next(new AppError('Invalid token format.', 401));
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

export const adminOnly = (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== 'admin') {
        return next(new AppError('Access restricted to administrators only.', 403));
    }
    next();
};
