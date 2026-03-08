export const GAS_THRESHOLDS = {
    NORMAL: parseInt(process.env.GAS_NORMAL_THRESHOLD || '200'),
    WARNING: parseInt(process.env.GAS_WARNING_THRESHOLD || '500'),
    DANGER: parseInt(process.env.GAS_DANGER_THRESHOLD || '1000'),
    CRITICAL: parseInt(process.env.GAS_CRITICAL_THRESHOLD || '2000'),
};

export const GAS_STATUS = {
    NORMAL: 'normal',
    WARNING: 'warning',
    DANGER: 'danger',
    CRITICAL: 'critical',
} as const;

export const ALERT_TYPES = {
    GAS_LEAK: 'gas_leak',
    DEVICE_OFFLINE: 'device_offline',
    LOW_BATTERY: 'low_battery',
} as const;

export const ALERT_SEVERITY = {
    WARNING: 'warning',
    DANGER: 'danger',
    CRITICAL: 'critical',
} as const;

export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
} as const;

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const SIMULATOR_INTERVAL_MS = parseInt(process.env.SIMULATOR_INTERVAL_MS || '5000');
