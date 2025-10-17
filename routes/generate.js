const express = require('express');
const router = express.Router();
const { Post } = require('../models');
const { authenticateToken, checkSubscriptionLimit } = require('../middleware/auth');
const { postValidation } = require('../middleware/validation');
const AIGenerator = require('../services/aiGenerator');

// Generate social media post
router.post('/', 
    authenticateToken, 
    checkSubscriptionLimit,
    postValidation.generate,
    async (req, res) => {
        try {
            const { vehicleData, options = {} } = req.body;

            // Generate post using AI
            const aiGenerator = new AIGenerator();
            const generatedContent = await aiGenerator.generatePost(vehicleData, options);

            // Prepare post data
            const postData = {
                content: generatedContent,
                images: vehicleData.images || [],
                vehicleData
            };

            res.json({
                message: 'Post generated successfully',
                post: postData
            });
        } catch (error) {
            console.error('Generation error:', error);
            res.status(500).json({ error: 'Failed to generate post: ' + error.message });
        }
    }
);

// Save generated post as draft
router.post('/save', authenticateToken, async (req, res) => {
    try {
        const { vehicleId, content, images, generationOptions, platforms } = req.body;

        const post = await Post.create({
            userId: req.user.id,
            vehicleId,
            content,
            images: images || [],
            status: 'draft',
            platforms: platforms || [],
            generationOptions: generationOptions || {}
        });

        res.status(201).json({
            message: 'Post saved as draft',
            post
        });
    } catch (error) {
        console.error('Save post error:', error);
        res.status(500).json({ error: 'Failed to save post' });
    }
});

// Get post history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const where = { userId: req.user.id };
        if (status) where.status = status;

        const { count, rows } = await Post.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            include: ['vehicle']
        });

        res.json({
            posts: rows,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to fetch post history' });
    }
});

module.exports = router;

