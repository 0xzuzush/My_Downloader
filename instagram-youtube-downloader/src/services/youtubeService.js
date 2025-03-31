const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

class YoutubeService {
    async downloadVideo(url, quality = 'highest') {
        try {
            logger.info(`Téléchargement de vidéo YouTube avec qualité ${quality}: ${url}`);
            const fileId = crypto.randomBytes(8).toString('hex');
            const outputFile = path.join(DOWNLOAD_DIR, `${fileId}.mp4`);

            let format;
            switch(quality) {
                case 'mp4-4k':
                    format = 'bestvideo[ext=mp4][height<=2160]+bestaudio[ext=m4a]/best[ext=mp4][height<=2160]';
                    break;
                case 'mp4-1080p':
                    format = 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]';
                    break;
                case 'mp4-720p':
                    format = 'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]';
                    break;
                default:
                    format = 'bestvideo+bestaudio/best';
            }

            // Obtenir les métadonnées de la vidéo
            const info = await youtubedl(url, {
                dumpSingleJson: true,
                noWarnings: true,
                preferFreeFormats: true,
                youtubeSkipDashManifest: true
            });

            // Télécharger la vidéo
            await youtubedl(url, {
                format: format,
                output: outputFile,
                noWarnings: true,
                youtubeSkipDashManifest: true
            });

            const downloadUrl = `/api/youtube/download/stream?file=${fileId}.mp4`;
            const qualityLabel = quality === 'highest' ? (info.height ? `${info.height}p` : 'HD') : quality;

            return {
                title: info.title,
                thumbnail: info.thumbnail,
                duration: info.duration,
                format: qualityLabel,
                url: url,
                downloadUrl: downloadUrl
            };
        } catch (error) {
            logger.error(`Error downloading YouTube video with youtube-dl-exec: ${error.message}`);
            throw new Error(`Impossible de télécharger la vidéo YouTube: ${error.message}`);
        }
    }

    async downloadAudio(url) {
        try {
            logger.info(`Téléchargement audio YouTube: ${url}`);
            const fileId = crypto.randomBytes(8).toString('hex');
            const outputFile = path.join(DOWNLOAD_DIR, `${fileId}.mp3`);

            // Obtenir les métadonnées de la vidéo
            const info = await youtubedl(url, {
                dumpSingleJson: true,
                noWarnings: true,
                preferFreeFormats: true,
                youtubeSkipDashManifest: true
            });

            // Télécharger uniquement l'audio au format mp3
            await youtubedl(url, {
                extractAudio: true,
                audioFormat: 'mp3',
                audioQuality: '0',
                output: outputFile,
                noWarnings: true,
                youtubeSkipDashManifest: true
            });

            const downloadUrl = `/api/youtube/download/stream?file=${fileId}.mp3`;
            return {
                title: info.title,
                thumbnail: info.thumbnail,
                duration: info.duration,
                format: 'MP3 Audio',
                url: url,
                downloadUrl: downloadUrl
            };
        } catch (error) {
            logger.error(`Error downloading YouTube audio with youtube-dl-exec: ${error.message}`);
            throw new Error(`Impossible de télécharger l'audio YouTube: ${error.message}`);
        }
    }
}

module.exports = new YoutubeService();