const express = require('express');
const router = express.Router();
const { Vehicle, Image } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { vehicleValidation } = require('../middleware/validation');

// Get all vehicles for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await Vehicle.findAndCountAll({
            where: { userId: req.user.id },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            vehicles: rows,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
});

// Get single vehicle
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: [{
                model: Image,
                as: 'vehicleImages'
            }]
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        res.json({ vehicle });
    } catch (error) {
        console.error('Get vehicle error:', error);
        res.status(500).json({ error: 'Failed to fetch vehicle' });
    }
});

// Create vehicle
router.post('/', authenticateToken, vehicleValidation.create, async (req, res) => {
    try {
        const vehicleData = {
            ...req.body,
            userId: req.user.id
        };

        const vehicle = await Vehicle.create(vehicleData);

        res.status(201).json({
            message: 'Vehicle saved successfully',
            vehicle
        });
    } catch (error) {
        console.error('Create vehicle error:', error);
        res.status(500).json({ error: 'Failed to save vehicle' });
    }
});

// Update vehicle
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        await vehicle.update(req.body);

        res.json({
            message: 'Vehicle updated successfully',
            vehicle
        });
    } catch (error) {
        console.error('Update vehicle error:', error);
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
});

// Delete vehicle
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        await vehicle.destroy();

        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Delete vehicle error:', error);
        res.status(500).json({ error: 'Failed to delete vehicle' });
    }
});

module.exports = router;

