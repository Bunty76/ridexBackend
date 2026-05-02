import express from 'express';
const router = express.Router();
import { registerDriver, loginDriver, updateDriverStatus } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

router.post('/auth/register', registerDriver);
router.post('/auth/login', loginDriver);
router.patch('/driver/status', protect, updateDriverStatus);

export default router;
