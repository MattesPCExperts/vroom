const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, Subscription } = require('../models');
const { authValidation } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Register
router.post('/register', authValidation.register, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        // Create free subscription
        await Subscription.create({
            userId: user.id,
            tier: 'free',
            postLimit: parseInt(process.env.FREE_TIER_POST_LIMIT) || 10
        });

        // Generate token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', authValidation.login, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ 
            where: { email },
            include: [{
                model: Subscription,
                as: 'subscription'
            }]
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Validate password
        const isValid = await user.validatePassword(password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Verify token
router.get('/verify', authenticateToken, async (req, res) => {
    res.json({
        message: 'Token valid',
        user: req.user.toJSON()
    });
});

// Logout (client-side token deletion)
router.post('/logout', authenticateToken, async (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;

