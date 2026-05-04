import request from 'supertest';
import { app, server } from '../server.js';
import mongoose from 'mongoose';
import * as dbHandler from './dbHandler.js';

describe('Advanced Validation Tests', () => {
    beforeAll(async () => {
        await dbHandler.connect();
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
        server.close();
    });

    describe('Email Format Validation', () => {
        it('Should fail to register with invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Invalid Email',
                    email: 'not-an-email',
                    password: 'password123'
                });
            
            expect(res.statusCode).toEqual(400); 
            expect(res.body.message).toContain('valid email address');
        });
    });

    describe('Status Value Validation', () => {
        it('Should fail with status other than ONLINE/OFFLINE', async () => {
            // Need a valid token first
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Status Driver',
                    email: 'status@test.com',
                    password: 'password123'
                });

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'status@test.com',
                    password: 'password123'
                });
            
            const token = loginRes.body.token;

            const res = await request(app)
                .patch('/api/driver/status')
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'AWAY' });
            
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Invalid status. Must be ONLINE or OFFLINE');
        });
    });
});
