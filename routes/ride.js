import express from 'express';
const router = express.Router();
import {
    createRideRequest,
    acceptRide,
    rejectRide,
    updateRideStatus,
    getRideById,
    getFareEstimates
} from '../controllers/rideController.js';
import { protectDriver, protectUser } from '../middleware/auth.js';

router.post('/estimate', protectUser, getFareEstimates);
router.post('/request', protectUser, createRideRequest);
router.get('/:id', protectUser, getRideById); // Or use a unified protect that checks either

// Driver actions
router.patch('/:id/accept', protectDriver, acceptRide);
router.patch('/:id/reject', protectDriver, rejectRide);
router.patch('/:id/status', updateRideStatus); // In a real app, protect this based on who is doing it

export default router;
