import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

interface MongooseValidationError extends Error {
    name: 'ValidationError';
    errors: Record<string, { message: string }>;
}

interface MongoDuplicateKeyError extends Error {
    code: number;
    keyValue: Record<string, unknown>;
}

const handleValidationError = (err: MongooseValidationError): AppError => {
    const messages = Object.values(err.errors).map((e) => e.message);
    return new AppError(`Validation error: ${messages.join('. ')}`, 400);
};

const handleDuplicateKeyError = (err: MongoDuplicateKeyError): AppError => {
    const field = Object.keys(err.keyValue)[0];
    return new AppError(`Duplicate value for field: ${field}`, 409);
};

const handleJwtError = (): AppError =>
    new AppError('Invalid token. Please log in again.', 401);

const handleJwtExpiredError = (): AppError =>
    new AppError('Token expired. Please log in again.', 401);

export const errorMiddleware = (
    err: unknown,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
): void => {
    let error = err as AppError & { name?: string; code?: number; keyValue?: Record<string, unknown>; errors?: Record<string, { message: string }> };

    // Handle known Mongoose/JWT errors
    if (error.name === 'ValidationError') {
        error = handleValidationError(error as unknown as MongooseValidationError);
    } else if ((error as unknown as MongoDuplicateKeyError).code === 11000) {
        error = handleDuplicateKeyError(error as unknown as MongoDuplicateKeyError);
    } else if (error.name === 'JsonWebTokenError') {
        error = handleJwtError();
    } else if (error.name === 'TokenExpiredError') {
        error = handleJwtExpiredError();
    } else if (error.name === 'CastError') {
        error = new AppError('Invalid ID format', 400);
    }

    const statusCode = error.statusCode || 500;
    const message = error.isOperational ? error.message : 'Internal server error';

    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
};
