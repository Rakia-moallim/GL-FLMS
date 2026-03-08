import { Document, Types } from 'mongoose';

// ─── JWT ────────────────────────────────────────────────────────────────────
export interface IJwtPayload {
    role: 'admin';
    email: string;
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface IUser extends Document {
    name: string;
    homeId: string;
    phone: string;
    email: string;
    address: string;
    isActive: boolean;
    devices: string[];
    createdAt: Date;
    updatedAt: Date;
}

// ─── Device ──────────────────────────────────────────────────────────────────
export interface IDevice extends Document {
    deviceId: string;
    homeId: string;
    location: string;
    type: string;
    isOnline: boolean;
    lastSeen: Date;
    status: 'active' | 'inactive' | 'maintenance';
    createdAt: Date;
    updatedAt: Date;
}

// ─── Gas Reading ─────────────────────────────────────────────────────────────
export interface IGasReading extends Document {
    deviceId: string;
    homeId: string;
    ppmValue: number;
    temperature?: number;
    humidity?: number;
    isLeak: boolean;
    gasStatus: 'normal' | 'warning' | 'danger' | 'critical';
    timestamp: Date;
}

// ─── Order ───────────────────────────────────────────────────────────────────
export interface IOrderItem {
    itemName: string;
    quantity: number;
    unitPrice: number;
}

export interface IOrder extends Document {
    homeId: string;
    userId: Types.ObjectId;
    items: IOrderItem[];
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export interface IInventory extends Document {
    itemName: string;
    itemType: string;
    quantity: number;
    unit: string;
    minStockLevel: number;
    price: number;
    supplier?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Alert ───────────────────────────────────────────────────────────────────
export interface IAlert extends Document {
    deviceId: string;
    homeId: string;
    alertType: 'gas_leak' | 'device_offline' | 'low_battery';
    severity: 'warning' | 'danger' | 'critical';
    ppmValue?: number;
    message: string;
    isResolved: boolean;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Request extension ────────────────────────────────────────────────────────
declare global {
    namespace Express {
        interface Request {
            user?: IJwtPayload;
        }
    }
}
