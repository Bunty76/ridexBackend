import Driver from '../models/DriverModel.js';
import jwt from 'jsonwebtoken';

let ioInstance;

const configureSockets = (io) => {
    ioInstance = io;
    // Authentication middleware for Socket.IO
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1];
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.user = decoded;
                next();
            } catch (err) {
                // We allow connection but socket.user will be undefined
                console.warn(`Socket ${socket.id} provided invalid token`);
                next();
            }
        } else {
            next();
        }
    });

    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Handle driver location updates
        socket.on('updateLocation', async (data) => {
            try {
                const { driverId, coordinates } = data; // coordinates should be [longitude, latitude]
                
                if (!driverId || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
                    console.warn(`Invalid location update received from socket ${socket.id}`);
                    return;
                }

                // Security check: Ensure authenticated driver is updating their own location
                if (!socket.user || socket.user.id !== driverId) {
                    console.warn(`Unauthorized location update attempt from socket ${socket.id} for driver ${driverId}`);
                    return;
                }

                const driver = await Driver.findByIdAndUpdate(driverId, {
                    location: {
                        type: 'Point',
                        coordinates: coordinates
                    }
                }, { new: true });
                
                if (driver) {
                    // Broadcast location to riders or other interested clients
                    io.emit('driverLocationUpdated', { driverId, coordinates });
                } else {
                    console.warn(`Driver location update failed: Driver ${driverId} not found`);
                }
            } catch (error) {
                console.error(`Error updating location for driver ${data.driverId}:`, error);
            }
        });

        // User requests a ride
        socket.on('requestRide', (rideData) => {
            // Emitting to all connected clients (in a real app, this should be to nearby online drivers)
            console.log(`Ride requested: ${rideData._id}`);
            io.emit('newRideRequest', rideData);
        });

        // Driver accepts a ride
        socket.on('acceptRide', (rideData) => {
            console.log(`Ride accepted: ${rideData._id} by driver ${rideData.driver}`);
            // Notify the specific user or broadcast to the room of that ride
            io.emit('rideAccepted', rideData);
        });

        // Driver updates ride status
        socket.on('updateRideStatus', (rideData) => {
            console.log(`Ride status updated: ${rideData._id} to ${rideData.status}`);
            io.emit('rideStatusUpdated', rideData);
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};

const getIO = () => ioInstance;

export { configureSockets, getIO };
