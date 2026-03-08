import { Schema, model } from 'mongoose';
import { IDevice } from '../types/index.js';

const DeviceSchema = new Schema<IDevice>(
    {
        deviceId: { type: String, required: true, unique: true, trim: true },
        homeId: { type: String, required: true, trim: true, uppercase: true },
        location: { type: String, required: true, trim: true },
        type: { type: String, default: 'gas_sensor', trim: true },
        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ['active', 'inactive', 'maintenance'],
            default: 'active',
        },
    },
    { timestamps: true }
);

DeviceSchema.index({ deviceId: 1 });
DeviceSchema.index({ homeId: 1 });

export const Device = model<IDevice>('Device', DeviceSchema);
