const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const puppeteer = require('puppeteer');

const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

class InstagramService {
    extractMediaCode(url) {
        const regexPatterns = [
            /instagram\.com\/p\/([^\/\?]+)/,
            /instagram\.com\/reel\/([^\/\?]+)/,
            /instagram\.com\/stories\/[^\/]+\/([^\/\?]+)/
        ];
        
        for (const pattern of regexPatterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        throw new Error('Format d\'URL Instagram non reconnu');
    }

    async downloadMedia(url) {
        let browser = null;
        try {
            logger.info(`Téléchargement de média Instagram : ${url}`);
            if (!url || typeof url !== 'string') {
                throw new Error('URL Instagram invalide');
            }
            
            const mediaCode = this.extractMediaCode(url);
            logger.info(`Code média extrait : ${mediaCode}`);
            
            // Lancer Puppeteer pour charger uniquement le post fourni
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');
            await page.setViewport({ width: 1280, height: 800 });
            
            // Charger la page du post et attendre que le contenu soit bien chargé
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Extraire le média depuis le DOM du post uniquement
            const postData = await page.evaluate(async () => {
                // Pour couvrir les cas classiques ou les reels, essayer de récupérer la première vidéo trouvée
                const videoElem = document.querySelector('article video') || document.querySelector('video');
                let videoSrc = videoElem ? videoElem.getAttribute('src') : null;
                let videoData = null;
                
                // Si aucune vidéo n'est trouvée, essayer de récupérer via la meta og:video (cas des reels)
                if (!videoSrc) {
                    const metaVideo = document.querySelector('meta[property="og:video"]');
                    if (metaVideo) {
                        videoSrc = metaVideo.getAttribute('content');
                    }
                }
                
                // Si la source commence par "blob:" on tente de récupérer une source enfant ou fallback meta
                if (videoSrc && videoSrc.startsWith('blob:')) {
                    const sourceChild = videoElem && videoElem.querySelector('source');
                    if (sourceChild) {
                        videoSrc = sourceChild.getAttribute('src');
                    }
                    // Si toujours blob, tenter la conversion blob via fetch
                    if (videoSrc && videoSrc.startsWith('blob:')) {
                        try {
                            const response = await fetch(videoElem.src);
                            const buffer = await response.arrayBuffer();
                            let binary = '';
                            const bytes = new Uint8Array(buffer);
                            for (let i = 0; i < bytes.byteLength; i++) {
                                binary += String.fromCharCode(bytes[i]);
                            }
                            const base64Data = btoa(binary);
                            videoData = 'data:video/mp4;base64,' + base64Data;
                        } catch (e) {
                            // On ignore l'erreur pour rester sur null
                        }
                        // Fallback : tenter de récupérer le lien via meta si conversion échoue
                        if (!videoData) {
                            const metaVideo = document.querySelector('meta[property="og:video"]');
                            if (metaVideo) {
                                videoSrc = metaVideo.getAttribute('content');
                            }
                        }
                    }
                }
                
                const imageElem = document.querySelector('article img');
                const postText = document.querySelector('meta[property="og:description"]')?.content || '';
                return {
                    videoSrc: videoSrc,
                    videoData: videoData,
                    imageSrc: imageElem ? imageElem.src : null,
                    postText: postText
                };
            });
            
            await browser.close();
            browser = null;
            
            // Si le post contient une vidéo, télécharger le post vidéo (texte inclus)
            if (postData.videoSrc) {
                if (postData.videoSrc.startsWith('blob:')) {
                    if (postData.videoData) {
                        // Utiliser la vidéo convertie au format base64
                        const result = await this.downloadBlobVideo(postData.videoData);
                        result.postText = postData.postText;
                        logger.info('Post vidéo (via blob) téléchargé avec succès');
                        return result;
                    } else {
                        throw new Error('La vidéo utilise le protocole blob mais la conversion en base64 a échoué.');
                    }
                } else {
                    // Cas standard avec une URL HTTP valide
                    const result = await this.downloadVideo(postData.videoSrc);
                    result.postText = postData.postText;
                    logger.info('Post vidéo téléchargé avec succès');
                    return result;
                }
            } else if (postData.imageSrc) {
                try {
                    const result = await this.downloadImage(postData.imageSrc);
                    logger.info('Image du post téléchargée avec succès');
                    return result;
                } catch (errorImage) {
                    logger.error(`L’image n’a pas pu être téléchargée: ${errorImage.message}`);
                    throw new Error('L’image n’a pas pu être téléchargée à cause d’un problème avec le lien ou le fichier.');
                }
            } else {
                throw new Error('Aucun média détecté dans ce post.');
            }
            
        } catch (error) {
            logger.error(`Erreur lors du téléchargement du média Instagram : ${error.message}`);
            throw new Error(`Impossible de télécharger le média Instagram : ${error.message}`);
        } finally {
            if (browser) await browser.close();
        }
    }
    
    // Méthodes d'extraction
    extractUrlsFromJSON(json, pattern, targetSet) {
        const regex = new RegExp(`"${pattern}":"([^"]+)"`, 'g');
        let match;
        while ((match = regex.exec(json)) !== null) {
            targetSet.add(match[1].replace(/\\u0026/g, '&'));
        }
    }
    
    extractUrlsFromHTML(html, pattern, targetSet) {
        const regex = new RegExp(`"${pattern}":"([^"]+)"`, 'g');
        let match;
        while ((match = regex.exec(html)) !== null) {
            targetSet.add(match[1].replace(/\\u0026/g, '&'));
        }
    }
    
    extractCarouselData(json, carouselArray) {
        const carouselMatch = json.match(/"edge_sidecar_to_children":{[^}]*"edges":\[(.*?)\]}/s);
        if (!carouselMatch) return;
        
        const edgesData = carouselMatch[1];
        const nodeMatches = edgesData.match(/"node":{(.*?)(?=,"node"|$)/g);
        if (!nodeMatches) return;
        
        for (const nodeMatch of nodeMatches) {
            const isVideo = nodeMatch.includes('"is_video":true');
            
            if (isVideo) {
                const videoUrlMatch = nodeMatch.match(/"video_url":"([^"]+)"/);
                if (videoUrlMatch) {
                    carouselArray.push({
                        type: 'video',
                        url: videoUrlMatch[1].replace(/\\u0026/g, '&')
                    });
                }
            } else {
                const imageUrlMatch = nodeMatch.match(/"display_url":"([^"]+)"/);
                if (imageUrlMatch) {
                    carouselArray.push({
                        type: 'image',
                        url: imageUrlMatch[1].replace(/\\u0026/g, '&')
                    });
                }
            }
        }
    }
    
    // Méthodes de téléchargement
    async downloadVideo(videoSrc) {
        try {
            const timestamp = Date.now();
            const fileName = `instagram_${timestamp}.mp4`;
            const outputPath = path.join(DOWNLOAD_DIR, fileName);
            
            logger.info(`Téléchargement de la vidéo depuis l'URL: ${videoSrc}`);
            await this.downloadFile(videoSrc, outputPath, true);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            return {
                title: 'Instagram Video',
                type: 'video',
                downloadUrl: `/downloads/${fileName}`
            };
        } catch (error) {
            logger.error(`Échec du téléchargement vidéo : ${error.message}`);
            throw error;
        }
    }
    
    async downloadBlobVideo(videoData) {
        try {
            const timestamp = Date.now();
            const fileName = `instagram_${timestamp}.mp4`;
            const outputPath = path.join(DOWNLOAD_DIR, fileName);
            // videoData a le format "data:video/mp4;base64,AAAA..."
            const base64Part = videoData.split(',')[1];
            const buffer = Buffer.from(base64Part, 'base64');
            fs.writeFileSync(outputPath, buffer);
            const stats = fs.statSync(outputPath);
            if (stats.size < 10000) {
                fs.unlinkSync(outputPath);
                throw new Error(`Fichier trop petit (${stats.size} octets)`);
            }
            return {
                title: 'Instagram Video',
                type: 'video',
                downloadUrl: `/downloads/${fileName}`
            };
        } catch (error) {
            logger.error(`Échec du téléchargement vidéo via blob : ${error.message}`);
            throw error;
        }
    }
    
    async downloadImage(imageUrl, isFallback = false) {
        logger.info(`Téléchargement d'image${isFallback ? ' (fallback)' : ''}: ${imageUrl}`);
        
        const timestamp = Date.now();
        const fileName = `instagram_${timestamp}${isFallback ? '_fallback' : ''}.jpg`;
        const outputPath = path.join(DOWNLOAD_DIR, fileName);
        
        await this.downloadFile(imageUrl, outputPath, false);
        
        return {
            title: 'Instagram Image',
            type: 'image',
            downloadUrl: `/downloads/${fileName}`
        };
    }
    
    async downloadFile(url, outputPath, isVideo) {
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
                    'Referer': 'https://www.instagram.com/'
                },
                maxRedirects: 5
            });
            
            const contentType = response.headers['content-type'] || '';
            const isCorrectType = isVideo 
                ? (contentType.includes('video') || contentType.includes('octet-stream'))
                : (contentType.includes('image') || contentType.includes('octet-stream'));
            
            if (!isCorrectType) {
                logger.warn(`Type de contenu inattendu: ${contentType}`);
            }
            
            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);
            
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            
            const stats = fs.statSync(outputPath);
            const minSize = isVideo ? 10000 : 5000;
            if (stats.size < minSize) {
                fs.unlinkSync(outputPath);
                throw new Error(`Fichier trop petit (${stats.size} octets)`);
            }
            
            logger.info(`Fichier téléchargé avec succès: ${outputPath} (${stats.size} octets)`);
            
        } catch (error) {
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
            throw error;
        }
    }
}

module.exports = new InstagramService();