import { Alert } from '../models/Alert.js';
import { IAlert } from '../types/index.js';
import { GasAnalysis } from './gasLeak.service.js';
import { getIO } from './socket.service.js';

/**
 * Creates an alert when a gas leak is detected.
 * Checks for existing active (unresolved) alert for the same device to avoid duplicates.
 */
export const createGasLeakAlert = async (
    deviceId: string,
    homeId: string,
    ppmValue: number,
    analysis: GasAnalysis
): Promise<IAlert | null> => {
    if (!analysis.isLeak || !analysis.severity) return null;

    // Deduplication: skip if there's already an active alert for this device
    const existingAlert = await Alert.findOne({
        deviceId,
        alertType: 'gas_leak',
        isResolved: false,
    });

    if (existingAlert) {
        // Update ppm value so dashboard shows latest reading
        existingAlert.ppmValue = ppmValue;
        existingAlert.severity = analysis.severity;
        existingAlert.message = analysis.message;
        await existingAlert.save();
        return existingAlert;
    }

    const alert = await Alert.create({
        deviceId,
        homeId,
        alertType: 'gas_leak',
        severity: analysis.severity,
        ppmValue,
        message: analysis.message,
        isResolved: false,
    });

    // Emit real-time alert via Socket.IO
    const io = getIO();
    if (io) {
        io.to(`home_${homeId}`).emit('new_alert', {
            alertId: alert._id,
            deviceId,
            homeId,
            severity: alert.severity,
            message: alert.message,
            ppmValue,
            timestamp: alert.createdAt,
        });
        // Also emit to admin room
        io.to('admins').emit('new_alert', {
            alertId: alert._id,
            deviceId,
            homeId,
            severity: alert.severity,
            message: alert.message,
            ppmValue,
            timestamp: alert.createdAt,
        });
    }

    return alert;
};

export const createDeviceOfflineAlert = async (
    deviceId: string,
    homeId: string
): Promise<IAlert | null> => {
    const existingAlert = await Alert.findOne({
        deviceId,
        alertType: 'device_offline',
        isResolved: false,
    });
    if (existingAlert) return existingAlert;

    const alert = await Alert.create({
        deviceId,
        homeId,
        alertType: 'device_offline',
        severity: 'warning',
        message: `Device ${deviceId} has gone offline.`,
        isResolved: false,
    });

    const io = getIO();
    if (io) {
        io.to('admins').emit('device_status', { deviceId, homeId, isOnline: false });
    }

    return alert;
};

export const resolveAlertsForDevice = async (
    deviceId: string,
    alertType: IAlert['alertType']
): Promise<void> => {
    await Alert.updateMany(
        { deviceId, alertType, isResolved: false },
        { isResolved: true, resolvedAt: new Date() }
    );
};
