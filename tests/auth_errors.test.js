import request from 'supertest';
import { app, server } from '../server.js';
import mongoose from 'mongoose';
import Driver from '../models/DriverModel.js';
import * as dbHandler from './dbHandler.js';

describe('Auth Error Scenarios', () => {
    const testEmail = `error_test_${Date.now()}@example.com`;
    const testPassword = 'password123';

    beforeAll(async () => {
        await dbHandler.connect();
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
        server.close();
    });

    it('Should fail to register a driver with duplicate email', async () => {
        // Register first time
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Error Test',
                email: testEmail,
                password: testPassword
            });

        // Register second time
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Error Test 2',
                email: testEmail,
                password: testPassword
            });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Driver already exists');
    });

    it('Should fail to login with incorrect password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testEmail,
                password: 'wrongpassword'
            });
        
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Invalid email or password');
    });

    it('Should fail to login with non-existent email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nonexistent@example.com',
                password: testPassword
            });
        
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Invalid email or password');
    });

    it('Should fail to access protected route without token', async () => {
        const res = await request(app)
            .patch('/api/driver/status')
            .send({ status: 'ONLINE' });
        
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Not authorized, no token');
    });

    it('Should fail to access protected route with invalid token', async () => {
        const res = await request(app)
            .patch('/api/driver/status')
            .set('Authorization', 'Bearer invalidtoken')
            .send({ status: 'ONLINE' });
        
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Not authorized, token failed');
    });

    it('Should fail to register with missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Missing Fields'
                // email and password missing
            });
        
        expect(res.statusCode).toEqual(400); 
        expect(res.body.message).toBe('Please provide name, email and password');
    });

    it('Should fail to login with missing email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                password: testPassword
            });
        
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Invalid email or password');
    });
    it('Should fail to login as admin with incorrect password', async () => {
        const res = await request(app)
            .post('/api/admin/login')
            .send({
                email: 'admin@ridex.com', // Seeded admin or previously created
                password: 'wrongpassword'
            });
        
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Invalid email or password');
    });

    it('Should fail to login as admin with non-existent email', async () => {
        const res = await request(app)
            .post('/api/admin/login')
            .send({
                email: 'noadmin@example.com',
                password: 'password123'
            });
        
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Invalid email or password');
    });
});
