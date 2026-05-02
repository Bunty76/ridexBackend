import Driver from '../models/DriverModel.js';

const configureSockets = (io) => {
    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Handle driver location updates
        socket.on('updateLocation', async (data) => {
            try {
                const { driverId, coordinates } = data; // coordinates should be [longitude, latitude]
                
                if (driverId && coordinates) {
                    await Driver.findByIdAndUpdate(driverId, {
                        location: {
                            type: 'Point',
                            coordinates: coordinates
                        }
                    });
                    
                    // Broadcast location to riders or other interested clients
                    io.emit('driverLocationUpdated', { driverId, coordinates });
                }
            } catch (error) {
                console.error('Error updating location:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};

export default configureSockets;
