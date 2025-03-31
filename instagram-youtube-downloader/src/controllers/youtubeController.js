const express = require('express');
const youtubeService = require('../services/youtubeService');
const logger = require('../utils/logger');

class YoutubeController {
    async download(req, res) {
        const { url, quality } = req.body;
        logger.info(`YouTube download request for URL: ${url}`);

        try {
            const videoInfo = await youtubeService.downloadVideo(url, quality);
            return res.status(200).json({
                success: true,
                data: videoInfo
            });
        } catch (error) {
            logger.error(`YouTube download failed: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async downloadAudio(req, res) {
        const { url } = req.body;
        logger.info(`YouTube audio download request for URL: ${url}`);

        try {
            const audioInfo = await youtubeService.downloadAudio(url);
            return res.status(200).json({
                success: true,
                data: audioInfo
            });
        } catch (error) {
            logger.error(`YouTube audio download failed: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new YoutubeController();