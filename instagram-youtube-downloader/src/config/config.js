module.exports = {
    PORT: process.env.PORT || 3000,
    INSTAGRAM_API: {
        // Configuration for Instagram API or library
        USERNAME: process.env.INSTAGRAM_USERNAME,
        PASSWORD: process.env.INSTAGRAM_PASSWORD,
    },
    YOUTUBE_API: {
        // Configuration for YouTube API or library
        API_KEY: process.env.YOUTUBE_API_KEY,
    },
    LOGGING: {
        LEVEL: process.env.LOG_LEVEL || 'info',
    },
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX: 200, // limit each IP to 100 requests per windowMs
    },
};