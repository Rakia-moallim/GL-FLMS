import { Router } from 'express';
import {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
} from '../controllers/order.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router: Router = Router();

router.use(protect);

router.post('/', createOrder);
router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);

export default router;
