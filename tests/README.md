# Ridex Backend Test Suite

This repository uses **Jest** and **Supertest** for testing the backend API and WebSockets.

## Running Tests

To run all tests:
```bash
npm test
```

## Test Structure

- `tests/app.test.js`: General API health check and basic auth/socket flow.
- `tests/auth_errors.test.js`: Detailed authentication error scenarios (duplicate emails, wrong passwords, missing fields, etc.).
- `tests/driver_status.test.js`: Tests for driver availability status updates (ONLINE/OFFLINE).
- `tests/socket.test.js`: In-depth WebSocket tests including database updates verification.
- `tests/system.test.js`: Tests for system middleware like 404 handlers.

## Coverage

- **Authentication**: Registration, Login (Driver & Admin), Token validation.
- **Authorization**: Protected routes, JWT handling.
- **Real-time**: Socket.IO connection, location updates, database persistence.
- **Error Handling**: 404 Not Found, 400 Bad Request, 401 Unauthorized.
- **Validation**: Mongoose schema validation.

## Environment

Tests run with `NODE_ENV=test`. To ensure speed and safety, tests use **`mongodb-memory-server`** (an in-memory MongoDB instance) instead of your real database. This means:
- Tests are significantly faster.
- There is zero risk of polluting your production or development data.
- Tests can run completely offline.

The `tests/dbHandler.js` utility manages the lifecycle of the in-memory database for all test suites.
