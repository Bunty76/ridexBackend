import request from 'supertest';
import { app, server } from '../server.js';
import * as dbHandler from './dbHandler.js';

describe('Ride Management API', () => {
    let userToken, driverToken, rideId;
    const testUserEmail = `rideuser_${Date.now()}@example.com`;
    const testDriverEmail = `ridedriver_${Date.now()}@example.com`;

    beforeAll(async () => {
        await dbHandler.connect();
        if (!server.listening) {
            await new Promise((resolve) => server.listen(5003, resolve));
        }

        // Register User
        const userRes = await request(app).post('/api/user/register').send({
            name: 'Ride User',
            email: testUserEmail,
            password: 'password123'
        });
        userToken = userRes.body.token;

        // Register Driver
        const driverRes = await request(app).post('/api/auth/register').send({
            name: 'Ride Driver',
            email: testDriverEmail,
            password: 'password123'
        });
        driverToken = driverRes.body.token;
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
        server.close();
    });

    it('1. POST /api/rides/request - User should request a ride', async () => {
        const res = await request(app)
            .post('/api/rides/request')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                pickupLocation: {
                    coordinates: [77.1234, 28.5678],
                    address: "Start Point"
                },
                dropoffLocation: {
                    coordinates: [77.4321, 28.8765],
                    address: "End Point"
                },
                fare: 150,
                distance: 10
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.status).toEqual('PENDING');
        rideId = res.body._id;
    });

    it('2. PATCH /api/rides/:id/accept - Driver should accept ride', async () => {
        const res = await request(app)
            .patch(`/api/rides/${rideId}/accept`)
            .set('Authorization', `Bearer ${driverToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('ACCEPTED');
        expect(res.body).toHaveProperty('driver');
    });

    it('3. GET /api/rides/:id - User should view ride details', async () => {
        const res = await request(app)
            .get(`/api/rides/${rideId}`)
            .set('Authorization', `Bearer ${userToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('ACCEPTED');
        expect(res.body.driver).toHaveProperty('name', 'Ride Driver');
    });

    it('4. PATCH /api/rides/:id/status - Update ride status', async () => {
        const res = await request(app)
            .patch(`/api/rides/${rideId}/status`)
            .send({ status: 'IN_PROGRESS' });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('IN_PROGRESS');
    });
});
