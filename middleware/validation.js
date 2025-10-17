const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const authValidation = {
    register: [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        validate
    ],
    login: [
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
        validate
    ]
};

const vehicleValidation = {
    create: [
        body('year').notEmpty().withMessage('Year is required'),
        body('make').notEmpty().withMessage('Make is required'),
        body('model').notEmpty().withMessage('Model is required'),
        validate
    ]
};

const postValidation = {
    generate: [
        body('vehicleData').isObject().withMessage('Vehicle data is required'),
        body('options').optional().isObject(),
        validate
    ],
    publish: [
        body('post').isObject().withMessage('Post data is required'),
        body('platforms').isArray({ min: 1 }).withMessage('At least one platform is required'),
        validate
    ]
};

module.exports = {
    validate,
    authValidation,
    vehicleValidation,
    postValidation
};

