import request from 'supertest';
import { app, server } from '../server.js';
import * as dbHandler from './dbHandler.js';

describe('Ride Lifecycle (OTP & Completion) Test', () => {
    let userToken, driverToken, rideId, generatedOtp;
    const testUserEmail = `user_life_${Date.now()}@example.com`;
    const testDriverEmail = `driver_life_${Date.now()}@example.com`;

    beforeAll(async () => {
        await dbHandler.connect();
        if (!server.listening) {
            await new Promise((resolve) => server.listen(0, resolve));
        }

        // 1. Register User
        const userRes = await request(app).post('/api/user/register').send({
            name: 'Lifecycle User',
            email: testUserEmail,
            password: 'password123',
            phone: '9999999999'
        });
        userToken = userRes.body.token;

        // 2. Register Driver
        const driverRes = await request(app).post('/api/auth/register').send({
            name: 'Lifecycle Driver',
            email: testDriverEmail,
            password: 'password123',
            phone: '8888888888',
            vehicle: {
                type: 'economy',
                model: 'Toyota Corolla',
                plateNumber: 'ABC-123',
                color: 'White'
            }
        });
        driverToken = driverRes.body.token;

        // 3. Create Ride Request
        const rideReq = await request(app)
            .post('/api/rides/request')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                pickupLocation: { coordinates: [77, 23], address: "Start" },
                dropoffLocation: { coordinates: [77.1, 23.1], address: "End" },
                vehicleType: "economy",
                distance: 5,
                duration: 10
            });
        rideId = rideReq.body._id;
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
        server.close();
    });

    it('1. Driver Accepts Ride - Should generate an OTP', async () => {
        const res = await request(app)
            .patch(`/api/rides/${rideId}/accept`)
            .set('Authorization', `Bearer ${driverToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('ACCEPTED');
        expect(res.body).toHaveProperty('otp');
        expect(res.body.otp.length).toEqual(4);
        generatedOtp = res.body.otp;
    });

    it('2. Start Ride with WRONG OTP - Should fail with 400', async () => {
        const res = await request(app)
            .patch(`/api/rides/${rideId}/start`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ otp: '0000' }); // Intentionally wrong
        
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toEqual('Invalid OTP');
    });

    it('3. Start Ride with CORRECT OTP - Should succeed and update status to STARTED', async () => {
        const res = await request(app)
            .patch(`/api/rides/${rideId}/start`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ otp: generatedOtp });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('STARTED');
    });

    it('4. Complete Ride - Should update status to COMPLETED', async () => {
        const res = await request(app)
            .patch(`/api/rides/${rideId}/status`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ status: 'COMPLETED' });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('COMPLETED');
    });
});
