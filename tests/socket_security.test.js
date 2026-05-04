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

describe('Socket Security Tests', () => {
    let clientSocket1;
    let driver1Id, driver2Id;
    let driver1Token;

    beforeAll(async () => {
        await dbHandler.connect();
        
        const driver1 = await Driver.create({
            name: 'Driver One',
            email: 'driver1@test.com',
            password: 'password123'
        });
        driver1Id = driver1._id.toString();
        driver1Token = generateToken(driver1Id);

        const driver2 = await Driver.create({
            name: 'Driver Two',
            email: 'driver2@test.com',
            password: 'password123'
        });
        driver2Id = driver2._id.toString();

        if (!server.listening) {
            await new Promise((resolve) => server.listen(5003, resolve));
        }
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
        server.close();
    });

    it('Should not allow driver1 to update driver2 location', (done) => {
        clientSocket1 = Client('http://127.0.0.1:5003', { 
            transports: ['websocket'],
            auth: { token: driver1Token }
        });

        clientSocket1.on('connect', () => {
            clientSocket1.emit('updateLocation', {
                driverId: driver2Id, // Attempting to update driver2 with driver1's token
                coordinates: [10.0, 10.0]
            });

            setTimeout(async () => {
                const driver2InDb = await Driver.findById(driver2Id);
                try {
                    expect(driver2InDb.location.coordinates).toEqual([0, 0]);
                    clientSocket1.disconnect();
                    done();
                } catch (error) {
                    clientSocket1.disconnect();
                    done(new Error('Security FAILED: Driver 1 was able to update Driver 2 location using their own token'));
                }
            }, 500);
        });
    });

    it('Should not allow update without any token', (done) => {
        const clientSocketNoAuth = Client('http://127.0.0.1:5003', { transports: ['websocket'] });

        clientSocketNoAuth.on('connect', () => {
            clientSocketNoAuth.emit('updateLocation', {
                driverId: driver1Id,
                coordinates: [20.0, 20.0]
            });

            setTimeout(async () => {
                const driver1InDb = await Driver.findById(driver1Id);
                try {
                    expect(driver1InDb.location.coordinates).toEqual([0, 0]);
                    clientSocketNoAuth.disconnect();
                    done();
                } catch (error) {
                    clientSocketNoAuth.disconnect();
                    done(new Error('Security FAILED: Update succeeded without token'));
                }
            }, 500);
        });
    });
});
