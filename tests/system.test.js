import request from 'supertest';
import { app, server } from '../server.js';
import mongoose from 'mongoose';
import * as dbHandler from './dbHandler.js';

describe('System & Error Middleware', () => {
    beforeAll(async () => {
        await dbHandler.connect();
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
        server.close();
    });

    it('Should return 404 for non-existent routes', async () => {
        const res = await request(app).get('/api/non-existent-route');
        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toContain('Not Found');
    });
});
