const express = require('express');
const router = express.Router();
const { SocialConnection } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Get all social connections
router.get('/connections', authenticateToken, async (req, res) => {
    try {
        const connections = await SocialConnection.findAll({
            where: { userId: req.user.id },
            attributes: { exclude: ['accessToken', 'refreshToken'] }
        });

        res.json({ connections });
    } catch (error) {
        console.error('Get connections error:', error);
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
});

// Initiate OAuth connection for a platform
router.get('/connect/:platform', authenticateToken, async (req, res) => {
    try {
        const { platform } = req.params;
        const validPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin'];

        if (!validPlatforms.includes(platform)) {
            return res.status(400).json({ error: 'Invalid platform' });
        }

        // Generate OAuth URL based on platform
        // In production, implement proper OAuth flow
        const authUrls = {
            facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&scope=pages_manage_posts,pages_read_engagement`,
            instagram: `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&scope=user_profile,user_media`,
            twitter: `https://twitter.com/i/oauth2/authorize?client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${process.env.TWITTER_REDIRECT_URI}&scope=tweet.read tweet.write users.read`,
            linkedin: `https://www.linkedin.com/oauth/v2/authorization?client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.LINKEDIN_REDIRECT_URI}&scope=w_member_social`
        };

        res.json({
            authUrl: authUrls[platform],
            state: req.user.id // In production, use proper state token
        });
    } catch (error) {
        console.error('Connect error:', error);
        res.status(500).json({ error: 'Failed to initiate connection' });
    }
});

// OAuth callback handler
router.get('/callback/:platform', async (req, res) => {
    try {
        const { platform } = req.params;
        const { code, state } = req.query;

        // In production, exchange code for tokens
        // Store tokens in SocialConnection model
        
        res.send('<script>window.close();</script>');
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).json({ error: 'Connection failed' });
    }
});

// Disconnect social account
router.delete('/disconnect/:platform', authenticateToken, async (req, res) => {
    try {
        const { platform } = req.params;

        const connection = await SocialConnection.findOne({
            where: {
                userId: req.user.id,
                platform
            }
        });

        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        await connection.destroy();

        res.json({ message: 'Disconnected successfully' });
    } catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({ error: 'Failed to disconnect' });
    }
});

// Test connection
router.get('/test/:platform', authenticateToken, async (req, res) => {
    try {
        const { platform } = req.params;

        const connection = await SocialConnection.findOne({
            where: {
                userId: req.user.id,
                platform
            }
        });

        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        const isValid = connection.isTokenValid();

        res.json({
            platform,
            connected: connection.isActive,
            tokenValid: isValid
        });
    } catch (error) {
        console.error('Test connection error:', error);
        res.status(500).json({ error: 'Failed to test connection' });
    }
});

module.exports = router;

