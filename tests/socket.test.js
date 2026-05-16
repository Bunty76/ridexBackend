import { server } from '../server.js';
import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';
import Driver from '../models/DriverModel.js';
import * as dbHandler from './dbHandler.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'testsecret', {
        expiresIn: '1h',
    });
};

describe('Socket.IO In-depth Tests', () => {
    let clientSocket;
    let driverId;
    let token;
    const testEmail = `socket_test_${Date.now()}@example.com`;

    beforeAll(async () => {
        await dbHandler.connect();
        // Create a driver in DB
        const driver = await Driver.create({
            name: 'Socket Driver',
            email: testEmail,
            password: 'password123',
            phone: '9999999999',
            vehicle: {
                type: 'economy',
                model: 'Test Model',
                plateNumber: 'TEST-123',
                color: 'Blue'
            }
        });
        driverId = driver._id.toString();
        token = generateToken(driverId);

        // Start server if not running
        if (!server.listening) {
            await new Promise((resolve) => server.listen(5002, resolve));
        }
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
        server.close();
    });

    beforeEach((done) => {
        clientSocket = Client('http://127.0.0.1:5002', {
            transports: ['websocket'],
            auth: { token }
        });
        clientSocket.on('connect', done);
    });

    afterEach(() => {
        if (clientSocket.connected) {
            clientSocket.disconnect();
        }
    });

    it('Should update driver location in database via socket', (done) => {
        const coordinates = [77.1234, 28.5678];
        
        clientSocket.emit('updateLocation', {
            driverId: driverId,
            coordinates: coordinates
        });

        clientSocket.on('driverLocationUpdated', async (data) => {
            try {
                expect(data.driverId).toBe(driverId);
                expect(data.coordinates).toEqual(coordinates);

                // Wait a bit for DB update to complete (since it's async in socket handler)
                setTimeout(async () => {
                    const driver = await Driver.findById(driverId);
                    expect(driver.location.coordinates).toEqual(coordinates);
                    expect(driver.location.type).toBe('Point');
                    done();
                }, 500);
            } catch (error) {
                done(error);
            }
        });
    });

    it('Should not update location if driverId is missing', (done) => {
        clientSocket.emit('updateLocation', {
            coordinates: [77.0, 28.0]
        });

        // We don't expect driverLocationUpdated to be called
        const timeout = setTimeout(() => {
            done();
        }, 1000);

        clientSocket.on('driverLocationUpdated', () => {
            clearTimeout(timeout);
            done(new Error('Should not have updated location'));
        });
    });
    it('Should not update location if coordinates are invalid format', (done) => {
        clientSocket.emit('updateLocation', {
            driverId: driverId,
            coordinates: [77.0] // Only 1 element
        });

        const timeout = setTimeout(() => {
            done();
        }, 1000);

        clientSocket.on('driverLocationUpdated', () => {
            clearTimeout(timeout);
            done(new Error('Should not have updated location with invalid coordinates'));
        });
    });

    it('Should not update location if coordinates contain non-numbers', (done) => {
        clientSocket.emit('updateLocation', {
            driverId: driverId,
            coordinates: ['abc', 'def']
        });

        const timeout = setTimeout(() => {
            done();
        }, 1000);

        clientSocket.on('driverLocationUpdated', () => {
            clearTimeout(timeout);
            done(new Error('Should not have updated location with non-number coordinates'));
        });
    });
});
