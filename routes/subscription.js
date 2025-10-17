const express = require('express');
const router = express.Router();
const { Subscription } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Get current subscription
router.get('/', authenticateToken, async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            where: { userId: req.user.id }
        });

        res.json(subscription);
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
});

// Upgrade to premium
router.post('/upgrade', authenticateToken, async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            where: { userId: req.user.id }
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        if (subscription.tier === 'premium') {
            return res.status(400).json({ error: 'Already on premium plan' });
        }

        // In production, integrate with payment processor (Stripe, etc.)
        // For now, simulate upgrade
        subscription.tier = 'premium';
        subscription.postLimit = 999999;
        subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await subscription.save();

        res.json({
            message: 'Upgraded to premium successfully',
            subscription
        });
    } catch (error) {
        console.error('Upgrade error:', error);
        res.status(500).json({ error: 'Failed to upgrade subscription' });
    }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            where: { userId: req.user.id }
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        if (subscription.tier === 'free') {
            return res.status(400).json({ error: 'Cannot cancel free tier' });
        }

        subscription.status = 'cancelled';
        subscription.tier = 'free';
        subscription.postLimit = parseInt(process.env.FREE_TIER_POST_LIMIT) || 10;
        await subscription.save();

        res.json({
            message: 'Subscription cancelled',
            subscription
        });
    } catch (error) {
        console.error('Cancel error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// Get usage statistics
router.get('/usage', authenticateToken, async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            where: { userId: req.user.id }
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        res.json({
            tier: subscription.tier,
            postsThisMonth: subscription.postsThisMonth,
            postLimit: subscription.postLimit,
            remaining: subscription.postLimit - subscription.postsThisMonth,
            resetDate: new Date(subscription.lastResetDate.getFullYear(), 
                                subscription.lastResetDate.getMonth() + 1, 1)
        });
    } catch (error) {
        console.error('Usage error:', error);
        res.status(500).json({ error: 'Failed to fetch usage' });
    }
});

module.exports = router;

