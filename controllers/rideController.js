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

        const MAX_DISTANCE_METERS = process.env.MAX_RIDE_DISTANCE || 5000;
        
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
        
        ride.driversNotifiedCount = nearbyDrivers.length;
        await ride.save();

        const populatedRide = await Ride.findById(ride._id).populate('user', 'name phone');

        const io = getIO();
        if (io) {
            io.emit('newRideRequest', {
                id: populatedRide._id,
                passengerName: populatedRide.user?.name || 'Passenger',
                pickupLocation: populatedRide.pickupLocation,
                dropoffLocation: populatedRide.dropoffLocation,
                fare: populatedRide.fare,
                distance: populatedRide.distance
            });
        }

        res.status(201).json(ride);
    } catch (error) {
        next(error);
    }
};

// @desc    Accept a ride request
// @route   PATCH /api/rides/:id/accept
export const acceptRide = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id);
        if (!ride || ride.status !== 'PENDING') {
            return res.status(404).json({ message: 'Ride not found or already taken' });
        }

        ride.driver = req.driver._id;
        ride.status = 'ACCEPTED';
        ride.otp = Math.floor(1000 + Math.random() * 9000).toString();

        const updatedRide = await ride.save();
        const io = getIO();
        if (io) io.emit('rideAccepted', updatedRide);

        res.json(updatedRide);
    } catch (error) {
        next(error);
    }
};

// @desc    Start the ride with OTP verification
// @route   PATCH /api/rides/:id/start
export const startRide = async (req, res, next) => {
    const { otp } = req.body;
    try {
        const ride = await Ride.findById(req.params.id);
        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        if (ride.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        ride.status = 'STARTED';
        const updatedRide = await ride.save();
        
        const io = getIO();
        if (io) io.emit('rideStatusUpdated', updatedRide);

        res.json(updatedRide);
    } catch (error) {
        next(error);
    }
};

// @desc    Update ride status (ARRIVED, COMPLETED, CANCELLED)
export const updateRideStatus = async (req, res, next) => {
    const { status } = req.body;
    try {
        const ride = await Ride.findById(req.params.id);
        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        // Basic authorization
        const isDriver = req.driver && req.driver._id.toString() === ride.driver?.toString();
        const isUser = req.user && req.user._id.toString() === ride.user.toString();

        if (['ARRIVED', 'COMPLETED'].includes(status) && !isDriver) {
            return res.status(403).json({ message: 'Only the assigned driver can update this status' });
        }

        if (status === 'CANCELLED' && !isDriver && !isUser) {
            return res.status(403).json({ message: 'Not authorized to cancel this ride' });
        }

        // State Machine Validation
        const allowedTransitions = {
            'PENDING': ['ACCEPTED', 'CANCELLED'],
            'ACCEPTED': ['ARRIVED', 'CANCELLED'],
            'ARRIVED': ['CANCELLED'],
            'STARTED': ['COMPLETED', 'CANCELLED'],
            'COMPLETED': [],
            'CANCELLED': []
        };

        if (status === 'STARTED') {
            return res.status(400).json({ message: 'Please use the /start endpoint with OTP to start the ride' });
        }

        if (!allowedTransitions[ride.status].includes(status)) {
            return res.status(400).json({ message: `Invalid status transition from ${ride.status} to ${status}` });
        }
        
        ride.status = status;
        const updatedRide = await ride.save();
        
        const io = getIO();
        if (io) io.emit('rideStatusUpdated', updatedRide);

        res.json(updatedRide);
    } catch (error) {
        next(error);
    }
};

// @desc    Reject a ride
export const rejectRide = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id);
        if (ride) {
            ride.driversRejectedCount += 1;
            await ride.save();
        }
        res.json({ message: 'Rejected' });
    } catch (error) {
        next(error);
    }
};

export const getRideById = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id).populate('user', 'name email phone').populate('driver', 'name status');
        if (!ride) return res.status(404).json({ message: 'Ride not found' });
        res.json(ride);
    } catch (error) {
        next(error);
    }
};

export const getFareEstimates = async (req, res, next) => {
    const { distance, duration } = req.body;
    try {
        const estimates = calculateFareEstimates(distance, duration);
        res.json(estimates);
    } catch (error) {
        next(error);
    }
};
