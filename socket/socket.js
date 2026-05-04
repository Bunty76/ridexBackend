import Driver from '../models/DriverModel.js';
import jwt from 'jsonwebtoken';

const configureSockets = (io) => {
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

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};

export default configureSockets;
