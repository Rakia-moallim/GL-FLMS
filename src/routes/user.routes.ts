import { Router } from 'express';
import {
    createUser,
    getAllUsers,
    getUserByHomeId,
    updateUser,
    deleteUser,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router: Router = Router();

router.use(protect);

router.post('/', createUser);
router.get('/', getAllUsers);
router.get('/:homeId', getUserByHomeId);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
