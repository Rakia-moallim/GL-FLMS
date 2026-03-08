import { Request, Response, NextFunction } from 'express';
import { validateAdminCredentials, generateToken } from '../services/auth.service.js';
import { AppError } from '../utils/AppError.js';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body as { email?: string; password?: string };

        if (!email || !password) {
            return next(new AppError('Email and password are required.', 400));
        }

        const isValid = await validateAdminCredentials(email, password);
        if (!isValid) {
            return next(new AppError('Invalid email or password.', 401));
        }

        const token = generateToken({ role: 'admin', email: email.toLowerCase() });

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                token,
                role: 'admin',
                email: email.toLowerCase(),
            },
        });
    } catch (error) {
        next(error);
    }
};
