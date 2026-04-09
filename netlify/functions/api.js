const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('../../backend/config/db');
const authRoutes = require('../../backend/routes/auth');
const chatRoutes = require('../../backend/routes/chat');
const resumeRoutes = require('../../backend/routes/resume');
const analyticsRoutes = require('../../backend/routes/analytics');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// NOTE: Routes are mounted WITHOUT /api prefix here.
// Netlify strips /api from the path before forwarding to this function via :splat.
// So a frontend call to /api/auth/login → function receives /auth/login
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/resume', resumeRoutes);
app.use('/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
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

module.exports.handler = serverless(app);
