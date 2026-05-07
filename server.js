import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import rideRoutes from './routes/ride.js';
import { configureSockets } from './socket/socket.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*', // For React Native, origin must be * or handled specifically
        methods: ['GET', 'POST']
    }
});

// Initialize WebSockets
configureSockets(io);

// Middleware
app.use(helmet()); // Set security HTTP headers
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // HTTP request logger
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/rides', rideRoutes);

app.get('/', (req, res) => {
    res.send('Ride-Hailing API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export { app, server };
