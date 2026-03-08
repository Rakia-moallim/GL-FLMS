import { Router } from 'express';
import {
    registerDevice,
    getAllDevices,
    getDeviceById,
    updateDeviceStatus,
    deleteDevice,
} from '../controllers/device.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router: Router = Router();

router.use(protect);

router.post('/', registerDevice);
router.get('/', getAllDevices);
router.get('/:deviceId', getDeviceById);
router.patch('/:deviceId/status', updateDeviceStatus);
router.delete('/:deviceId', deleteDevice);

export default router;
