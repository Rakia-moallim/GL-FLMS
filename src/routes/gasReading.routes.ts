import { Router } from 'express';
import {
    saveReading,
    getReadings,
    getLatestReading,
    getGasHistory,
} from '../controllers/gasReading.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router: Router = Router();

// POST is open — ESP32 devices post readings without a JWT token
router.post('/', saveReading);

router.use(protect);
router.get('/', getReadings);
router.get('/history', getGasHistory);
router.get('/latest/:deviceId', getLatestReading);

export default router;
