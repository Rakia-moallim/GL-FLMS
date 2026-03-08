import { Router } from 'express';
import {
    getAlerts,
    getAlertById,
    resolveAlert,
    resolveAllAlertsForHome,
} from '../controllers/alert.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router: Router = Router();

router.use(protect);

router.get('/', getAlerts);
router.get('/:id', getAlertById);
router.patch('/:id/resolve', resolveAlert);
router.patch('/resolve-all/:homeId', resolveAllAlertsForHome);

export default router;
