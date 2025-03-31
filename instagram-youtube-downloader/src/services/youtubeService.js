const { exec } = require('child_process');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Chemin vers l'exécutable yt-dlp
const YT_DLP_PATH = 'C:\\yt-dlp\\yt-dlp.exe';

class YoutubeService {
    async getVideoInfo(url) {
        try {
            logger.info(`Récupération des informations de la vidéo YouTube : ${url}`);

            // Récupérer les informations de la vidéo
            const info = await ytdl.getInfo(url);

            return {
                title: info.videoDetails.title,
                description: info.videoDetails.description,
                thumbnail: info.videoDetails.thumbnails[0].url,
                duration: info.videoDetails.lengthSeconds,
            };
        } catch (error) {
            logger.error(`Erreur lors de la récupération des informations de la vidéo : ${error.message}`);

            // Vérifiez si l'erreur est liée au déchiffrement
            if (error.message.includes('Could not extract functions')) {
                throw new Error(
                    "Impossible de traiter cette vidéo. Elle est peut-être protégée ou YouTube a modifié son système. Veuillez réessayer plus tard."
                );
            }

            throw new Error(`Impossible de récupérer les informations de la vidéo : ${error.message}`);
        }
    }

    async listFormats(url) {
        try {
            logger.info(`Listing formats for YouTube video: ${url}`);

            const command = `"${YT_DLP_PATH}" -F "${url}"`;
            const formats = await new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        logger.error(`Error listing formats: ${stderr}`);
                        return reject(new Error(stderr));
                    }
                    resolve(stdout);
                });
            });

            logger.info(`Available formats:\n${formats}`);
            return formats;
        } catch (error) {
            logger.error(`Error listing formats: ${error.message}`);
            throw new Error(`Impossible de lister les formats : ${error.message}`);
        }
    }

    async downloadVideo(url, quality = 'best') {
        try {
            logger.info(`Téléchargement de vidéo YouTube avec yt-dlp : ${url}`);

            const fileName = `${Date.now()}.mp4`;
            const outputFile = path.join(DOWNLOAD_DIR, fileName);

            // Construire la commande yt-dlp
            const command = `"${YT_DLP_PATH}" -f ${quality} -o "${outputFile}" "${url}"`;

            // Exécuter la commande
            await new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        // Si le format demandé n'est pas disponible, lister les formats
                        if (stderr.includes('Requested format is not available')) {
                            logger.warn('Format demandé non disponible. Listing des formats...');
                            return reject(new Error('FORMAT_NOT_AVAILABLE'));
                        }
                        logger.error(`Erreur yt-dlp : ${stderr}`);
                        return reject(new Error(`Erreur lors du téléchargement : ${stderr}`));
                    }
                    logger.info(`yt-dlp stdout : ${stdout}`);
                    resolve();
                });
            });

            logger.info(`Téléchargement terminé : ${outputFile}`);
            return {
                title: 'YouTube Video',
                downloadUrl: `/downloads/${fileName}`,
            };
        } catch (error) {
            if (error.message === 'FORMAT_NOT_AVAILABLE') {
                // Lister les formats disponibles et renvoyer une erreur descriptive
                const formats = await this.listFormats(url);
                throw new Error(
                    `Le format demandé (${quality}) n'est pas disponible. Voici les formats disponibles :\n${formats}`
                );
            }
            logger.error(`Erreur lors du téléchargement de la vidéo YouTube avec yt-dlp : ${error.message}`);
            throw new Error(`Impossible de télécharger la vidéo YouTube : ${error.message}`);
        }
    }

    async downloadAudio(url) {
        try {
            logger.info(`Téléchargement de l'audio YouTube : ${url}`);

            // Récupérer les informations de la vidéo
            const videoInfo = await this.getVideoInfo(url);
            const fileName = `${videoInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
            const outputFile = path.join(DOWNLOAD_DIR, fileName);

            // Télécharger l'audio
            const audioStream = ytdl(url, {
                filter: 'audioonly',
            });

            const writeStream = fs.createWriteStream(outputFile);
            audioStream.pipe(writeStream);

            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            logger.info(`Téléchargement terminé : ${outputFile}`);
            return {
                title: videoInfo.title,
                thumbnail: videoInfo.thumbnail,
                duration: videoInfo.duration,
                downloadUrl: `/downloads/${fileName}`,
            };
        } catch (error) {
            logger.error(`Erreur lors du téléchargement de l'audio YouTube : ${error.message}`);
            throw new Error(`Impossible de télécharger l'audio YouTube : ${error.message}`);
        }
    }
}

module.exports = new YoutubeService();