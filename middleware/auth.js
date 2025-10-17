const jwt = require('jsonwebtoken');
const { User, Subscription } = require('../models');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findByPk(decoded.userId, {
            include: [{
                model: Subscription,
                as: 'subscription'
            }]
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid or inactive user' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const requireAdmin = async (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const checkSubscriptionLimit = async (req, res, next) => {
    try {
        const subscription = req.user.subscription;
        
        if (!subscription) {
            return res.status(403).json({ error: 'No active subscription' });
        }

        if (!subscription.canCreatePost()) {
            return res.status(403).json({ 
                error: 'Post limit reached for this month',
                limit: subscription.postLimit,
                used: subscription.postsThisMonth
            });
        }

        next();
    } catch (error) {
        console.error('Subscription check error:', error);
        return res.status(500).json({ error: 'Failed to check subscription' });
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    checkSubscriptionLimit
};

