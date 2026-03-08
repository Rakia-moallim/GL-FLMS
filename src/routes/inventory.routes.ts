import { Router } from 'express';
import {
    addInventoryItem,
    getAllInventory,
    updateInventoryItem,
    deleteInventoryItem,
} from '../controllers/inventory.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router: Router = Router();

router.use(protect);

router.post('/', addInventoryItem);
router.get('/', getAllInventory);
router.patch('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

export default router;
