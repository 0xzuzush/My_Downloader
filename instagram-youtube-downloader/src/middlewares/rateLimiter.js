const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const rateLimiter = rateLimit({
    windowMs: config.RATE_LIMIT.WINDOW_MS,
    max: config.RATE_LIMIT.MAX,
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
});

module.exports = { rateLimiter };