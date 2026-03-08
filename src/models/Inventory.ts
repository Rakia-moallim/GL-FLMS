import { Schema, model } from 'mongoose';
import { IInventory } from '../types/index.js';

const InventorySchema = new Schema<IInventory>(
    {
        itemName: { type: String, required: true, trim: true },
        itemType: {
            type: String,
            required: true,
            enum: ['gas_cylinder', 'sensor', 'valve', 'regulator', 'pipe', 'other'],
        },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true, default: 'piece' },
        minStockLevel: { type: Number, required: true, default: 5 },
        price: { type: Number, required: true, min: 0 },
        supplier: { type: String, trim: true },
    },
    { timestamps: true }
);

// Add a virtual to check if stock is low
InventorySchema.virtual('isLowStock').get(function () {
    return this.quantity <= this.minStockLevel;
});

export const Inventory = model<IInventory>('Inventory', InventorySchema);
