const { body, validationResult } = require('express-validator');

const validateAuth = [
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').isLength({ min: 1 }).withMessage('Password must be at least 1 character long').trim().escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = { validateAuth };
