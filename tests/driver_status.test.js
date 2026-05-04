import request from 'supertest';
import { app, server } from '../server.js';
import mongoose from 'mongoose';
import Driver from '../models/DriverModel.js';
import * as dbHandler from './dbHandler.js';

describe('Driver Status Updates', () => {
    let token;
    let driverId;
    const testEmail = `status_test_${Date.now()}@example.com`;
    const testPassword = 'password123';

    beforeAll(async () => {
        await dbHandler.connect();
        // Register and login to get token
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Status Driver',
                email: testEmail,
                password: testPassword
            });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testEmail,
                password: testPassword
            });
        
        token = res.body.token;
        driverId = res.body._id;
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
        server.close();
    });

    it('Should update driver status to ONLINE', async () => {
        const res = await request(app)
            .patch('/api/driver/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'ONLINE' });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('ONLINE');

        // Verify in DB
        const driver = await Driver.findById(driverId);
        expect(driver.status).toBe('ONLINE');
    });

    it('Should update driver status to OFFLINE', async () => {
        const res = await request(app)
            .patch('/api/driver/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'OFFLINE' });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('OFFLINE');

        // Verify in DB
        const driver = await Driver.findById(driverId);
        expect(driver.status).toBe('OFFLINE');
    });

    it('Should fail with invalid status value', async () => {
        const res = await request(app)
            .patch('/api/driver/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'BUSY' });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Invalid status. Must be ONLINE or OFFLINE');
    });
});
