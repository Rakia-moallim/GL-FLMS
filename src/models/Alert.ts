import { Schema, model } from 'mongoose';
import { IAlert } from '../types/index.js';

const AlertSchema = new Schema<IAlert>(
    {
        deviceId: { type: String, required: true, index: true },
        homeId: { type: String, required: true, index: true },
        alertType: {
            type: String,
            required: true,
            enum: ['gas_leak', 'device_offline', 'low_battery'],
        },
        severity: {
            type: String,
            required: true,
            enum: ['warning', 'danger', 'critical'],
        },
        ppmValue: { type: Number },
        message: { type: String, required: true },
        isResolved: { type: Boolean, default: false, index: true },
        resolvedAt: { type: Date },
    },
    { timestamps: true }
);

AlertSchema.index({ homeId: 1, isResolved: 1 });
AlertSchema.index({ createdAt: -1 });

export const Alert = model<IAlert>('Alert', AlertSchema);
