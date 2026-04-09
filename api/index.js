// This file is the Vercel serverless function entry point.
// It imports the Express app from the backend and exports it as a handler.

const express = require('express');
const cors = require('cors');
const path = require('path');

// Load env vars — on Vercel these come from the dashboard, not a .env file
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const connectDB = require('../backend/config/db');
const authRoutes = require('../backend/routes/auth');
const chatRoutes = require('../backend/routes/chat');
const resumeRoutes = require('../backend/routes/resume');
const analyticsRoutes = require('../backend/routes/analytics');

// Connect to MongoDB (cached for serverless)
let isConnected = false;
const connect = async () => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }
};

const app = express();

// CORS — allow your Vercel frontend URL and localhost for dev
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.send('🚀 PlacementBot Backend is Running');
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'PlacementBot API is running 🚀' });
});

// 404
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Vercel serverless handler
module.exports = async (req, res) => {
    await connect();
    return app(req, res);
};
