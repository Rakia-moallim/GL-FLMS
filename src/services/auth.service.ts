import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { IJwtPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (payload: IJwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): IJwtPayload => {
    return jwt.verify(token, JWT_SECRET) as IJwtPayload;
};

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 12);
};

export const comparePassword = async (plain: string, hashed: string): Promise<boolean> => {
    return bcrypt.compare(plain, hashed);
};

export const validateAdminCredentials = async (
    email: string,
    password: string
): Promise<boolean> => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartgas.io';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123';

    if (email.toLowerCase() !== adminEmail.toLowerCase()) return false;
    // Direct comparison for env-defined admin (no DB needed)
    return password === adminPassword;
};
