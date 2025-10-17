const express = require('express');
const router = express.Router();
const { User, Subscription, SocialConnection } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        res.json({ user: req.user.toJSON() });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, preferences } = req.body;

        if (name) req.user.name = name;
        if (preferences) {
            req.user.preferences = { ...req.user.preferences, ...preferences };
        }

        await req.user.save();

        res.json({
            message: 'Profile updated successfully',
            user: req.user.toJSON()
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get subscription info
router.get('/subscription', authenticateToken, async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            where: { userId: req.user.id }
        });

        res.json(subscription);
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
});

// Get social connections
router.get('/connections', authenticateToken, async (req, res) => {
    try {
        const connections = await SocialConnection.findAll({
            where: { userId: req.user.id },
            attributes: ['platform', 'platformUsername', 'isActive', 'createdAt']
        });

        const connectionMap = {
            facebook: false,
            instagram: false,
            twitter: false,
            linkedin: false
        };

        connections.forEach(conn => {
            connectionMap[conn.platform] = conn.isActive;
        });

        res.json(connectionMap);
    } catch (error) {
        console.error('Connections error:', error);
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findByPk(req.user.id);
        const isValid = await user.validatePassword(currentPassword);

        if (!isValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Delete account
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        req.user.isActive = false;
        await req.user.save();

        res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;

