import { analyseGasReading } from './gasLeak.service.js';
import { createGasLeakAlert } from './alert.service.js';
import { GasReading } from '../models/GasReading.js';
import { Device } from '../models/Device.js';
import { emitGasReading } from './socket.service.js';
import { SIMULATOR_INTERVAL_MS } from '../config/constants.js';

// Sample devices used by the simulator
const SAMPLE_DEVICES = [
    { deviceId: 'DEV-001', homeId: 'HOME-A1' },
    { deviceId: 'DEV-002', homeId: 'HOME-B2' },
    { deviceId: 'DEV-003', homeId: 'HOME-C3' },
];

let simulatorInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Generates a realistic PPM reading.
 * 80% of the time: normal (10–400 PPM)
 * 15% of the time: warning/danger spike (400–1500 PPM)
 *  5% of the time: critical spike (1500–3000 PPM)
 */
const generatePPM = (): number => {
    const roll = Math.random();
    if (roll < 0.8) {
        return Math.round(Math.random() * 390 + 10);
    } else if (roll < 0.95) {
        return Math.round(Math.random() * 1100 + 400);
    } else {
        return Math.round(Math.random() * 1500 + 1500);
    }
};

const generateReading = async (): Promise<void> => {
    // Pick a random device
    const device = SAMPLE_DEVICES[Math.floor(Math.random() * SAMPLE_DEVICES.length)];
    if (!device) return;

    const ppmValue = generatePPM();
    const temperature = parseFloat((20 + Math.random() * 15).toFixed(1));
    const humidity = parseFloat((40 + Math.random() * 40).toFixed(1));
    const analysis = analyseGasReading(ppmValue);

    const reading = await GasReading.create({
        deviceId: device.deviceId,
        homeId: device.homeId,
        ppmValue,
        temperature,
        humidity,
        isLeak: analysis.isLeak,
        gasStatus: analysis.gasStatus,
        timestamp: new Date(),
    });

    // Update device lastSeen
    await Device.findOneAndUpdate(
        { deviceId: device.deviceId },
        { lastSeen: new Date(), isOnline: true },
        { upsert: true, new: true }
    );

    // Emit real-time reading
    emitGasReading(device.homeId, {
        deviceId: device.deviceId,
        ppmValue,
        gasStatus: analysis.gasStatus,
        isLeak: analysis.isLeak,
        temperature,
        humidity,
        timestamp: reading.timestamp,
    });

    // Create alert if leak detected
    if (analysis.isLeak) {
        await createGasLeakAlert(device.deviceId, device.homeId, ppmValue, analysis);
        console.log(
            `🚨 [Simulator] Leak detected on ${device.deviceId} — ${ppmValue} PPM (${analysis.gasStatus})`
        );
    } else {
        console.log(
            `📊 [Simulator] ${device.deviceId} — ${ppmValue} PPM (${analysis.gasStatus})`
        );
    }
};

export const startSimulator = (): void => {
    if (process.env.SIMULATOR_ENABLED !== 'true') {
        console.log('🔇 Sensor simulator is disabled (SIMULATOR_ENABLED != true)');
        return;
    }

    console.log(
        `🤖 Starting fake sensor simulator (interval: ${SIMULATOR_INTERVAL_MS}ms)...`
    );
    simulatorInterval = setInterval(generateReading, SIMULATOR_INTERVAL_MS);
};

export const stopSimulator = (): void => {
    if (simulatorInterval) {
        clearInterval(simulatorInterval);
        simulatorInterval = null;
        console.log('🛑 Sensor simulator stopped.');
    }
};
