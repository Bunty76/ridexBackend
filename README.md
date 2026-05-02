# 🚗 Drivero Ride-Hailing Backend

A robust, production-ready Node.js backend for a ride-hailing driver application (Uber/Ola clone). It handles driver authentication, real-time availability toggling, and live GPS location tracking via WebSockets.

## 🛠 Tech Stack

* **Runtime**: Node.js (ES Modules)
* **Framework**: Express.js
* **Database**: MongoDB (Mongoose)
* **Real-time**: Socket.IO
* **Authentication**: JWT (JSON Web Tokens) & Bcrypt
* **Testing**: Jest & Supertest

## ✨ Features

* **JWT Authentication**: Secure login and registration flows with password hashing.
* **Online/Offline Status**: Drivers can toggle their availability status dynamically.
* **Live Location Tracking**: Real-time GPS coordinate broadcasting using Socket.IO.
* **Security & Logging**: Configured with `helmet` for HTTP header security and `morgan` for robust request logging.
* **Automated Testing**: Comprehensive integration test suite covering REST APIs and WebSockets.

## 🚀 Getting Started

### 1. Installation

Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root of your project and add your configuration details:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Running the Server

**Development Mode** (with Nodemon for auto-restarts):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

### 4. Running Tests

Run the full automated integration test suite:
```bash
npm test
```

---

## 📡 API Endpoints

### Authentication
* `POST /auth/register` - Register a new driver (requires `name`, `email`, `password`)
* `POST /auth/login` - Authenticate a driver and receive a JWT token

### Driver Management
* `PATCH /driver/status` - Toggle driver status between `ONLINE` and `OFFLINE` (Requires Bearer Token)

---

## 🔌 Socket.IO Events

**Connect to WebSocket at:** `ws://localhost:5000`

### 1. `updateLocation` (Emit from Client)
Used to send the driver's current GPS location.
```json
{
    "driverId": "60d5ecb8b392...",
    "coordinates": [77.2090, 28.6139]
}
```

### 2. `driverLocationUpdated` (Listen on Client)
Broadcasted by the server when a location is updated, so the rider app or dispatch system can track the driver.
```json
{
    "driverId": "60d5ecb8b392...",
    "coordinates": [77.2090, 28.6139]
}
```
