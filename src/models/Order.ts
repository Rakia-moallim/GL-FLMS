import { Schema, model } from 'mongoose';
import { IOrder } from '../types/index.js';

const OrderItemSchema = new Schema(
    {
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const OrderSchema = new Schema<IOrder>(
    {
        homeId: { type: String, required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        items: { type: [OrderItemSchema], required: true },
        totalAmount: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
        },
        notes: { type: String, trim: true },
    },
    { timestamps: true }
);

OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

export const Order = model<IOrder>('Order', OrderSchema);
