import { Request, Response, NextFunction } from 'express';
import { Inventory } from '../models/Inventory.js';
import { AppError } from '../utils/AppError.js';
import { PAGINATION } from '../config/constants.js';

export const addInventoryItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const item = await Inventory.create(req.body);
        res.status(201).json({ success: true, message: 'Inventory item added.', data: item });
    } catch (error) {
        next(error);
    }
};

export const getAllInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query['page'] as string) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query['limit'] as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;
        const filter: Record<string, unknown> = {};
        if (req.query['itemType']) filter['itemType'] = req.query['itemType'];
        if (req.query['lowStock'] === 'true') {
            // Find items where quantity <= minStockLevel
            filter['$expr'] = { $lte: ['$quantity', '$minStockLevel'] };
        }

        const [items, total] = await Promise.all([
            Inventory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Inventory.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: items,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};

export const updateInventoryItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const item = await Inventory.findByIdAndUpdate(req.params['id'], req.body, {
            new: true,
            runValidators: true,
        });
        if (!item) return next(new AppError('Inventory item not found.', 404));
        res.status(200).json({ success: true, message: 'Inventory updated.', data: item });
    } catch (error) {
        next(error);
    }
};

export const deleteInventoryItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const item = await Inventory.findByIdAndDelete(req.params['id']);
        if (!item) return next(new AppError('Inventory item not found.', 404));
        res.status(200).json({ success: true, message: 'Inventory item deleted.' });
    } catch (error) {
        next(error);
    }
};
