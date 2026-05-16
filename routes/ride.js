import express from 'express';
const router = express.Router();
import {
    createRideRequest,
    acceptRide,
    startRide,
    rejectRide,
    updateRideStatus,
    getRideById,
    getFareEstimates
} from '../controllers/rideController.js';
import { protectUser, protectDriver, protectAny } from '../middleware/auth.js';

router.post('/estimate', protectUser, getFareEstimates);
router.post('/request', protectUser, createRideRequest);
router.get('/:id', protectAny, getRideById); 

// Driver actions
router.patch('/:id/accept', protectDriver, acceptRide);
router.patch('/:id/start', protectDriver, startRide);
router.patch('/:id/reject', protectDriver, rejectRide);
router.patch('/:id/status', protectAny, updateRideStatus); 

export default router;
