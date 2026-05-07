import request from 'supertest';
import { app, server } from '../server.js';
import * as dbHandler from './dbHandler.js';

describe('User Authentication & Profile API', () => {
    let userToken;
    let userId;
    const testUserEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'password123';

    beforeAll(async () => {
        await dbHandler.connect();
        if (!server.listening) {
            await new Promise((resolve) => server.listen(5002, resolve));
        }
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
        server.close();
    });

    it('1. POST /api/user/register - Should register a new user', async () => {
        const res = await request(app)
            .post('/api/user/register')
            .send({
                name: 'Test User',
                email: testUserEmail,
                password: testPassword
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body).toHaveProperty('token');
        userId = res.body._id;
        userToken = res.body.token;
    });

    it('2. POST /api/user/login - Should authenticate user', async () => {
        const res = await request(app)
            .post('/api/user/login')
            .send({
                email: testUserEmail,
                password: testPassword
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('3. GET /api/user/profile - Should get user profile', async () => {
        const res = await request(app)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${userToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.email).toEqual(testUserEmail);
    });

    it('4. PUT /api/user/profile - Should update user profile', async () => {
        const res = await request(app)
            .put('/api/user/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'Updated User Name'
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual('Updated User Name');
    });
});
