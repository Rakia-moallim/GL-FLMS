import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { PAGINATION } from '../config/constants.js';

export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { homeId, items } = req.body as { homeId?: string; items?: Array<{ unitPrice: number; quantity: number }> };
        if (!homeId || !items || items.length === 0) {
            return next(new AppError('homeId and items are required.', 400));
        }

        const user = await User.findOne({ homeId: homeId.toUpperCase() });
        if (!user) return next(new AppError('No user found for this homeId.', 404));

        const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

        const order = await Order.create({
            ...req.body,
            homeId: homeId.toUpperCase(),
            userId: user._id,
            totalAmount,
        });

        res.status(201).json({ success: true, message: 'Order created.', data: order });
    } catch (error) {
        next(error);
    }
};

export const getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query['page'] as string) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query['limit'] as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;
        const filter: Record<string, unknown> = {};
        if (req.query['status']) filter['status'] = req.query['status'];
        if (req.query['homeId']) filter['homeId'] = String(req.query['homeId']).toUpperCase();

        const [orders, total] = await Promise.all([
            Order.find(filter).populate('userId', 'name homeId phone').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Order.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const order = await Order.findById(req.params['id']).populate('userId', 'name homeId phone email').lean();
        if (!order) return next(new AppError('Order not found.', 404));
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { status } = req.body as { status?: string };
        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return next(new AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400));
        }

        const order = await Order.findByIdAndUpdate(req.params['id'], { status }, { new: true });
        if (!order) return next(new AppError('Order not found.', 404));
        res.status(200).json({ success: true, message: 'Order status updated.', data: order });
    } catch (error) {
        next(error);
    }
};
