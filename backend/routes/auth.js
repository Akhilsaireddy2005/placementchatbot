const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, college, branch } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password, college, branch });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            college: user.college,
            branch: user.branch,
            profilePhoto: user.profilePhoto || null,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            college: user.college,
            branch: user.branch,
            profilePhoto: user.profilePhoto || null,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    res.json(req.user);
});

// @route   PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user) {
            user.name = req.body.name || user.name;
            user.college = req.body.college !== undefined ? req.body.college : user.college;
            user.branch = req.body.branch !== undefined ? req.body.branch : user.branch;
            if (req.body.profilePhoto !== undefined) {
                user.profilePhoto = req.body.profilePhoto;
            }
            
            const updatedUser = await user.save();
            
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                college: updatedUser.college,
                branch: updatedUser.branch,
                profilePhoto: updatedUser.profilePhoto || null,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
