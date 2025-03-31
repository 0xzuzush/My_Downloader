const { body, validationResult } = require('express-validator');

const validateUrl = (req, res, next) => {
    // Validate Instagram URL
    body('url').isURL().withMessage('Invalid URL format').custom(value => {
        const instagramRegex = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/.+$/;
        if (!instagramRegex.test(value)) {
            throw new Error('Invalid Instagram URL');
        }
        return true;
    });

    // Validate YouTube URL
    body('url').isURL().withMessage('Invalid URL format').custom(value => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        if (!youtubeRegex.test(value)) {
            throw new Error('Invalid YouTube URL');
        }
        return true;
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    validateUrl,
};