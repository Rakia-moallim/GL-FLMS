import { Schema, model } from 'mongoose';
import { IGasReading } from '../types/index.js';

const GasReadingSchema = new Schema<IGasReading>(
    {
        deviceId: { type: String, required: true, index: true },
        homeId: { type: String, required: true, index: true },
        ppmValue: { type: Number, required: true, min: 0 },
        temperature: { type: Number },
        humidity: { type: Number, min: 0, max: 100 },
        isLeak: { type: Boolean, default: false },
        gasStatus: {
            type: String,
            enum: ['normal', 'warning', 'danger', 'critical'],
            default: 'normal',
        },
        timestamp: { type: Date, default: Date.now, index: true },
    },
    { timestamps: false }
);

// Compound index for efficient time-series queries
GasReadingSchema.index({ deviceId: 1, timestamp: -1 });
GasReadingSchema.index({ homeId: 1, timestamp: -1 });
GasReadingSchema.index({ isLeak: 1, timestamp: -1 });

export const GasReading = model<IGasReading>('GasReading', GasReadingSchema);
