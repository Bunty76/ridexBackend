import request from 'supertest';
import { app, server } from '../server.js';
import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';

describe('Ride-Hailing API & WebSockets', () => {
    let token;
    let driverId;
    const testEmail = `testdriver_${Date.now()}@example.com`;
    const testPassword = 'password123';
    
    let clientSocket;

    beforeAll((done) => {
        // Start server on a specific test port for socket.io client to connect
        server.listen(5001, () => {
            done();
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    it('1. GET / - Should return health check message', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('Ride-Hailing API is running...');
    });

    it('2. POST /auth/register - Should register a new driver', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                name: 'Test Driver',
                email: testEmail,
                password: testPassword
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body).toHaveProperty('name', 'Test Driver');
        expect(res.body).toHaveProperty('status', 'OFFLINE');
        
        driverId = res.body._id;
    });

    it('3. POST /auth/login - Should authenticate driver and return a JWT token', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: testEmail,
                password: testPassword
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        token = res.body.token;
    });

    it('4. PATCH /driver/status - Should update driver status to ONLINE using token', async () => {
        const res = await request(app)
            .patch('/driver/status')
            .set('Authorization', `Bearer ${token}`)
            .send({
                status: 'ONLINE'
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'ONLINE');
    });

    it('5. WebSockets - Should connect, send location, and broadcast update', (done) => {
        clientSocket = Client('http://127.0.0.1:5001');

        clientSocket.on('connect', () => {
            // Once connected, emit the updateLocation event
            clientSocket.emit('updateLocation', {
                driverId: driverId,
                coordinates: [77.1234, 28.5678]
            });
        });

        // Listen for the broadcasted location event
        clientSocket.on('driverLocationUpdated', (data) => {
            try {
                expect(data).toHaveProperty('driverId', driverId);
                expect(data.coordinates).toEqual([77.1234, 28.5678]);
                
                clientSocket.disconnect();
                done();
            } catch (error) {
                done(error);
            }
        });
    });
});
