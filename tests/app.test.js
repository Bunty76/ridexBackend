import request from 'supertest';
import { app, server } from '../server.js';
import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';
import Admin from '../models/AdminModel.js';
import * as dbHandler from './dbHandler.js';

describe('Ride-Hailing API & WebSockets', () => {
    let driverToken;
    let adminToken;
    let driverId;
    const testDriverEmail = `testdriver_${Date.now()}@example.com`;
    const testAdminEmail = `testadmin_${Date.now()}@example.com`;
    const testPassword = 'password123';
    
    let clientSocket;

    beforeAll(async () => {
        await dbHandler.connect();
        // Start server on a specific test port for socket.io client to connect
        if (!server.listening) {
            await new Promise((resolve) => server.listen(5001, resolve));
        }
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
        server.close();
    });

    it('1. GET / - Should return health check message', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('Ride-Hailing API is running...');
    });

    it('2. POST /api/auth/register - Should register a new driver', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Driver',
                email: testDriverEmail,
                password: testPassword,
                phone: '8888888888',
                vehicle: {
                    type: 'economy',
                    model: 'Test Car',
                    plateNumber: 'REG-555',
                    color: 'Red'
                }
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('_id');
        driverId = res.body._id;
    });

    it('3. POST /api/auth/login - Should authenticate driver', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testDriverEmail,
                password: testPassword
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        driverToken = res.body.token;
    });

    it('4. Admin Auth - Should create admin and login', async () => {
        // Create admin directly in DB for test
        await Admin.create({
            name: 'Test Admin',
            email: testAdminEmail,
            password: testPassword
        });

        const res = await request(app)
            .post('/api/admin/login')
            .send({
                email: testAdminEmail,
                password: testPassword
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        adminToken = res.body.token;
    });

    it('5. WebSockets - Should connect and receive updates', (done) => {
        clientSocket = Client('http://127.0.0.1:5001', {
            transports: ['websocket'],
            auth: { token: driverToken }
        });

        clientSocket.on('connect', () => {
            clientSocket.emit('updateLocation', {
                driverId: driverId,
                coordinates: [77.1234, 28.5678]
            });
        });

        clientSocket.on('driverLocationUpdated', (data) => {
            try {
                expect(data).toHaveProperty('driverId', driverId);
                clientSocket.disconnect();
                done();
            } catch (error) {
                done(error);
            }
        });
    });
});
