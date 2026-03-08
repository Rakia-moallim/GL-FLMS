import { Router } from 'express';
import {
    getMonthlyLeaks,
    getOrdersSummaryReport,
    getDeviceHealth,
    getDashboard,
} from '../controllers/report.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router: Router = Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/monthly-leaks', getMonthlyLeaks);
router.get('/orders-summary', getOrdersSummaryReport);
router.get('/device-health', getDeviceHealth);

export default router;
