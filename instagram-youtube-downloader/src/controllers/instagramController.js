const instagramService = require('../services/instagramService');
const logger = require('../utils/logger');

class InstagramController {
    async download(req, res) {
        const { url } = req.body;
        logger.info(`Instagram download request for URL: ${url}`);

        try {
            const media = await instagramService.downloadMedia(url);
            return res.status(200).json({
                success: true,
                data: media
            });
        } catch (error) {
            logger.error(`Instagram download failed: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new InstagramController();