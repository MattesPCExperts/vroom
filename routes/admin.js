const express = require('express');
const router = express.Router();
const { User, Subscription, Vehicle, Post } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.count();
        const activeUsers = await User.count({ where: { isActive: true } });
        const premiumUsers = await Subscription.count({ where: { tier: 'premium', status: 'active' } });
        const totalVehicles = await Vehicle.count();
        const totalPosts = await Post.count();
        const publishedPosts = await Post.count({ where: { status: 'published' } });

        // Get recent activity
        const recentUsers = await User.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'name', 'email', 'createdAt']
        });

        const recentPosts = await Post.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{
                model: User,
                as: 'user',
                attributes: ['name', 'email']
            }]
        });

        res.json({
            stats: {
                totalUsers,
                activeUsers,
                premiumUsers,
                totalVehicles,
                totalPosts,
                publishedPosts
            },
            recentUsers,
            recentPosts
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get all users with pagination
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await User.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            include: [{
                model: Subscription,
                as: 'subscription'
            }]
        });

        res.json({
            users: rows,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get single user details
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: [
                {
                    model: Subscription,
                    as: 'subscription'
                },
                {
                    model: Vehicle,
                    as: 'vehicles',
                    limit: 10
                },
                {
                    model: Post,
                    as: 'posts',
                    limit: 10
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update user
router.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { name, email, isActive, role } = req.body;

        if (name) user.name = name;
        if (email) user.email = email;
        if (typeof isActive !== 'undefined') user.isActive = isActive;
        if (role) user.role = role;

        await user.save();

        res.json({
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user (soft delete)
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.isActive = false;
        await user.save();

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get all subscriptions
router.get('/subscriptions', async (req, res) => {
    try {
        const { page = 1, limit = 20, tier } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (tier) where.tier = tier;

        const { count, rows } = await Subscription.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email']
            }]
        });

        res.json({
            subscriptions: rows,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});

// Update subscription
router.put('/subscriptions/:id', async (req, res) => {
    try {
        const subscription = await Subscription.findByPk(req.params.id);

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        const { tier, status, postLimit } = req.body;

        if (tier) subscription.tier = tier;
        if (status) subscription.status = status;
        if (postLimit) subscription.postLimit = postLimit;

        await subscription.save();

        res.json({
            message: 'Subscription updated successfully',
            subscription
        });
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ error: 'Failed to update subscription' });
    }
});

// Get all posts
router.get('/posts', async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;

        const { count, rows } = await Post.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['id', 'year', 'make', 'model']
                }
            ]
        });

        res.json({
            posts: rows,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Delete post
router.delete('/posts/:id', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        await post.destroy();

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// System settings
router.get('/settings', async (req, res) => {
    try {
        res.json({
            freeTierPostLimit: parseInt(process.env.FREE_TIER_POST_LIMIT) || 10,
            premiumTierPrice: parseFloat(process.env.PREMIUM_TIER_PRICE) || 29.99,
            maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

module.exports = router;

