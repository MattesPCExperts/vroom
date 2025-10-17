const express = require('express');
const router = express.Router();
const { Post, Vehicle } = require('../models');
const { authenticateToken, checkSubscriptionLimit } = require('../middleware/auth');
const { postValidation } = require('../middleware/validation');
const SocialPublisher = require('../services/socialPublisher');

// Publish post to social media
router.post('/', 
    authenticateToken,
    checkSubscriptionLimit,
    postValidation.publish,
    async (req, res) => {
        try {
            const { post, platforms, vehicleId } = req.body;

            // Create post record
            const newPost = await Post.create({
                userId: req.user.id,
                vehicleId: vehicleId,
                content: post.content,
                images: post.images || [],
                platforms: platforms,
                status: 'published',
                publishedAt: new Date()
            });

            // Publish to each platform
            const publisher = new SocialPublisher(req.user.id);
            const results = await publisher.publishToMultiple(platforms, {
                content: post.content,
                images: post.images
            });

            // Update post with results
            newPost.publishResults = results;
            await newPost.save();

            // Increment subscription post count
            if (req.user.subscription) {
                await req.user.subscription.incrementPostCount();
            }

            res.json({
                message: 'Post published successfully',
                post: newPost,
                results
            });
        } catch (error) {
            console.error('Publish error:', error);
            res.status(500).json({ error: 'Failed to publish post: ' + error.message });
        }
    }
);

// Schedule post
router.post('/schedule', authenticateToken, async (req, res) => {
    try {
        const { post, platforms, vehicleId, scheduledFor } = req.body;

        const newPost = await Post.create({
            userId: req.user.id,
            vehicleId,
            content: post.content,
            images: post.images || [],
            platforms,
            status: 'scheduled',
            scheduledFor: new Date(scheduledFor)
        });

        res.json({
            message: 'Post scheduled successfully',
            post: newPost
        });
    } catch (error) {
        console.error('Schedule error:', error);
        res.status(500).json({ error: 'Failed to schedule post' });
    }
});

// Get publishing status
router.get('/status/:postId', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findOne({
            where: {
                id: req.params.postId,
                userId: req.user.id
            }
        });

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json({
            status: post.status,
            publishResults: post.publishResults,
            analytics: post.analytics
        });
    } catch (error) {
        console.error('Status error:', error);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

module.exports = router;

