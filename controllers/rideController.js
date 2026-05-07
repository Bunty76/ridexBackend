import Ride from '../models/RideModel.js';
import Driver from '../models/DriverModel.js';
import { calculateFareEstimates, calculateFare } from '../utils/fareCalculator.js';
import { getIO } from '../socket/socket.js';

// @desc    Create a new ride request
// @route   POST /api/rides/request
// @access  Private (User)
export const createRideRequest = async (req, res, next) => {
    const { pickupLocation, dropoffLocation, vehicleType, distance, duration } = req.body;

    if (!pickupLocation || !dropoffLocation || !vehicleType || distance === undefined || duration === undefined) {
        return res.status(400).json({ message: 'Pickup, dropoff, vehicleType, distance, and duration are required' });
    }

    const calculatedFare = calculateFare(vehicleType, distance, duration);
    if (calculatedFare === 0) {
        return res.status(400).json({ message: 'Invalid vehicle type' });
    }

    try {
        const ride = await Ride.create({
            user: req.user._id,
            pickupLocation: {
                type: 'Point',
                coordinates: pickupLocation.coordinates,
                address: pickupLocation.address
            },
            dropoffLocation: {
                type: 'Point',
                coordinates: dropoffLocation.coordinates,
                address: dropoffLocation.address
            },
            vehicleType,
            fare: calculatedFare,
            distance,
            duration
        });

        // Find nearby ONLINE drivers of the requested vehicle type
        const MAX_DISTANCE_METERS = 5000; // 5km radius
        
        const nearbyDrivers = await Driver.find({
            status: 'ONLINE',
            'vehicle.type': vehicleType,
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: pickupLocation.coordinates
                    },
                    $maxDistance: MAX_DISTANCE_METERS
                }
            }
        });
        
        const notifiedCount = nearbyDrivers.length;

        ride.driversNotifiedCount = notifiedCount;
        await ride.save();

        const populatedRide = await Ride.findById(ride._id).populate('user', 'name phone');

        // Emit a socket event to drivers
        const io = getIO();
        if (io) {
            io.emit('newRideRequest', {
                id: populatedRide._id,
                passengerName: populatedRide.user?.name || 'Passenger',
                pickupLocation: populatedRide.pickupLocation?.address || 'Unknown Pickup',
                dropoffLocation: populatedRide.dropoffLocation?.address || 'Unknown Dropoff',
                estimatedPrice: `₹${populatedRide.fare}`,
                distance: `${populatedRide.distance} km`
            });
        }

        res.status(201).json(ride);
    } catch (error) {
        next(error);
    }
};

// @desc    Accept a ride request
// @route   PATCH /api/rides/:id/accept
// @access  Private (Driver)
export const acceptRide = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.status !== 'PENDING') {
            return res.status(400).json({ message: 'Ride is no longer available' });
        }

        ride.driver = req.driver._id;
        ride.status = 'ACCEPTED';
        
        // Generate a 4-digit OTP for the ride start
        ride.otp = Math.floor(1000 + Math.random() * 9000).toString();

        const updatedRide = await ride.save();

        const io = getIO();
        if (io) {
            io.emit('rideAccepted', updatedRide);
        }

        res.json(updatedRide);
    } catch (error) {
        next(error);
    }
};

// @desc    Reject a ride request (from a driver)
// @route   PATCH /api/rides/:id/reject
// @access  Private (Driver)
export const rejectRide = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.status !== 'PENDING') {
            return res.status(400).json({ message: 'Ride is no longer available' });
        }

        // Increment the reject count
        ride.driversRejectedCount += 1;
        const updatedRide = await ride.save();

        res.json(updatedRide);
    } catch (error) {
        next(error);
    }
};

// @desc    Update ride status (ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED)
// @route   PATCH /api/rides/:id/status
// @access  Private (Driver/User)
export const updateRideStatus = async (req, res, next) => {
    const { status } = req.body;

    const validStatuses = ['ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status update' });
    }

    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        // Add authorization checks: only driver can update to ARRIVED, IN_PROGRESS, COMPLETED
        // Both user and driver can cancel. 
        // For simplicity, we just update.
        
        ride.status = status;

        const updatedRide = await ride.save();

        res.json(updatedRide);
    } catch (error) {
        next(error);
    }
};

// @desc    Get ride details by ID
// @route   GET /api/rides/:id
// @access  Private
export const getRideById = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id).populate('user', 'name email').populate('driver', 'name email status');

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        res.json(ride);
    } catch (error) {
        next(error);
    }
};

// @desc    Get fare estimates for all vehicle types
// @route   POST /api/rides/estimate
// @access  Private
export const getFareEstimates = async (req, res, next) => {
    const { distance, duration } = req.body;

    if (distance === undefined || duration === undefined) {
        return res.status(400).json({ message: 'Distance and duration are required' });
    }

    try {
        const estimates = calculateFareEstimates(distance, duration);
        res.json(estimates);
    } catch (error) {
        next(error);
    }
};
