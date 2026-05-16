import request from 'supertest';
import { app, server } from '../server.js';
import * as dbHandler from './dbHandler.js';

describe('Ride Coordinates Transmission Test', () => {
    let userToken;
    const testUserEmail = `coord_user_${Date.now()}@example.com`;

    beforeAll(async () => {
        await dbHandler.connect();
        if (!server.listening) {
            await new Promise((resolve) => server.listen(0, resolve)); // Use random port for test
        }

        // Register a test user to get a token
        const userRes = await request(app).post('/api/user/register').send({
            name: 'Coord Tester',
            email: testUserEmail,
            password: 'password123',
            phone: '1234567890'
        });
        userToken = userRes.body.token;
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
        server.close();
    });

    it('Should include coordinates in the response when a ride is requested', async () => {
        const payload = {
            pickupLocation: {
                coordinates: [77.3621, 23.3101], // Bhopal RGPV
                address: "RGPV, Bhopal"
            },
            dropoffLocation: {
                coordinates: [77.4082, 23.2845], // Bhopal BMHRC
                address: "BMHRC, Bhopal"
            },
            vehicleType: "economy",
            distance: 5.5,
            duration: 15
        };

        const res = await request(app)
            .post('/api/rides/request')
            .set('Authorization', `Bearer ${userToken}`)
            .send(payload);
        
        // Assertions for status code
        expect(res.statusCode).toEqual(201);
        
        // ASSERTION: Verify Pickup Coordinates exist and match
        expect(res.body.pickupLocation).toHaveProperty('coordinates');
        expect(res.body.pickupLocation.coordinates).toEqual(payload.pickupLocation.coordinates);
        expect(res.body.pickupLocation.type).toEqual('Point');

        // ASSERTION: Verify Dropoff Coordinates exist and match
        expect(res.body.dropoffLocation).toHaveProperty('coordinates');
        expect(res.body.dropoffLocation.coordinates).toEqual(payload.dropoffLocation.coordinates);
        expect(res.body.dropoffLocation.type).toEqual('Point');

        console.log('✅ Success: Backend correctly saved and returned coordinates.');
    });
});
