import { Schema, model } from 'mongoose';
import { IUser } from '../types/index.js';

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        homeId: { type: String, required: true, unique: true, trim: true, uppercase: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        address: { type: String, required: true, trim: true },
        isActive: { type: Boolean, default: true },
        devices: [{ type: String }],
    },
    { timestamps: true }
);

UserSchema.index({ homeId: 1 });
UserSchema.index({ email: 1 });

export const User = model<IUser>('User', UserSchema);
