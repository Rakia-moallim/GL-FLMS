import { GAS_THRESHOLDS } from '../config/constants.js';

export type GasStatus = 'normal' | 'warning' | 'danger' | 'critical';

export interface GasAnalysis {
    isLeak: boolean;
    gasStatus: GasStatus;
    severity?: 'warning' | 'danger' | 'critical';
    message: string;
}

/**
 * Analyses a PPM reading and returns leak status, severity, and a human-readable message.
 * Thresholds (configurable via .env):
 *   normal   < 200 PPM
 *   warning  200–499 PPM
 *   danger   500–1999 PPM
 *   critical >= 2000 PPM
 */
export const analyseGasReading = (ppmValue: number): GasAnalysis => {
    if (ppmValue < GAS_THRESHOLDS.WARNING) {
        return {
            isLeak: false,
            gasStatus: 'normal',
            message: `Gas level is normal at ${ppmValue} PPM.`,
        };
    }

    if (ppmValue < GAS_THRESHOLDS.DANGER) {
        return {
            isLeak: true,
            gasStatus: 'warning',
            severity: 'warning',
            message: `⚠️ Elevated gas level detected: ${ppmValue} PPM. Monitor closely.`,
        };
    }

    if (ppmValue < GAS_THRESHOLDS.CRITICAL) {
        return {
            isLeak: true,
            gasStatus: 'danger',
            severity: 'danger',
            message: `🚨 Dangerous gas level detected: ${ppmValue} PPM! Evacuate and ventilate immediately.`,
        };
    }

    return {
        isLeak: true,
        gasStatus: 'critical',
        severity: 'critical',
        message: `🔴 CRITICAL gas level: ${ppmValue} PPM! Immediate emergency action required!`,
    };
};
