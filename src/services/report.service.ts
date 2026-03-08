import { GasReading } from '../models/GasReading.js';
import { Order } from '../models/Order.js';
import { Alert } from '../models/Alert.js';

export interface MonthlyLeakStat {
    year: number;
    month: number;
    totalLeaks: number;
    criticalLeaks: number;
    dangerLeaks: number;
    warningLeaks: number;
}

export interface OrderSummary {
    status: string;
    count: number;
    totalRevenue: number;
}

export interface DeviceHealthStat {
    deviceId: string;
    homeId: string;
    totalReadings: number;
    leakReadings: number;
    leakPercentage: number;
    lastSeen: Date | null;
}

/**
 * Returns monthly gas leak counts for the past N months.
 */
export const getMonthlyLeakReport = async (months = 12): Promise<MonthlyLeakStat[]> => {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const results = await GasReading.aggregate([
        { $match: { isLeak: true, timestamp: { $gte: since } } },
        {
            $group: {
                _id: {
                    year: { $year: '$timestamp' },
                    month: { $month: '$timestamp' },
                },
                totalLeaks: { $sum: 1 },
                criticalLeaks: {
                    $sum: { $cond: [{ $eq: ['$gasStatus', 'critical'] }, 1, 0] },
                },
                dangerLeaks: {
                    $sum: { $cond: [{ $eq: ['$gasStatus', 'danger'] }, 1, 0] },
                },
                warningLeaks: {
                    $sum: { $cond: [{ $eq: ['$gasStatus', 'warning'] }, 1, 0] },
                },
            },
        },
        {
            $project: {
                _id: 0,
                year: '$_id.year',
                month: '$_id.month',
                totalLeaks: 1,
                criticalLeaks: 1,
                dangerLeaks: 1,
                warningLeaks: 1,
            },
        },
        { $sort: { year: 1, month: 1 } },
    ]);

    return results as MonthlyLeakStat[];
};

/**
 * Returns order counts and revenue grouped by status.
 */
export const getOrdersSummary = async (): Promise<OrderSummary[]> => {
    const results = await Order.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalRevenue: { $sum: '$totalAmount' },
            },
        },
        {
            $project: {
                _id: 0,
                status: '$_id',
                count: 1,
                totalRevenue: 1,
            },
        },
        { $sort: { count: -1 } },
    ]);

    return results as OrderSummary[];
};

/**
 * Returns per-device leak percentage and last reading time.
 */
export const getDeviceHealthReport = async (): Promise<DeviceHealthStat[]> => {
    const results = await GasReading.aggregate([
        {
            $group: {
                _id: { deviceId: '$deviceId', homeId: '$homeId' },
                totalReadings: { $sum: 1 },
                leakReadings: { $sum: { $cond: ['$isLeak', 1, 0] } },
                lastSeen: { $max: '$timestamp' },
            },
        },
        {
            $project: {
                _id: 0,
                deviceId: '$_id.deviceId',
                homeId: '$_id.homeId',
                totalReadings: 1,
                leakReadings: 1,
                lastSeen: 1,
                leakPercentage: {
                    $cond: [
                        { $eq: ['$totalReadings', 0] },
                        0,
                        {
                            $round: [
                                { $multiply: [{ $divide: ['$leakReadings', '$totalReadings'] }, 100] },
                                2,
                            ],
                        },
                    ],
                },
            },
        },
        { $sort: { leakPercentage: -1 } },
    ]);

    return results as DeviceHealthStat[];
};

/**
 * Returns a quick dashboard summary.
 */
export const getDashboardSummary = async () => {
    const [totalReadings, totalLeaks, activeAlerts, totalOrders] = await Promise.all([
        GasReading.countDocuments(),
        GasReading.countDocuments({ isLeak: true }),
        Alert.countDocuments({ isResolved: false }),
        Order.countDocuments(),
    ]);

    const latestReading = await GasReading.findOne().sort({ timestamp: -1 }).lean();

    return {
        totalReadings,
        totalLeaks,
        activeAlerts,
        totalOrders,
        latestReading,
    };
};
