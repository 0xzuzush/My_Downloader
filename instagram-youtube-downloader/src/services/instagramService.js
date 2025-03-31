const Instagram = require('instagram-web-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class InstagramService {
    constructor() {
        this.client = new Instagram({
            username: process.env.INSTAGRAM_USERNAME,
            password: process.env.INSTAGRAM_PASSWORD
        });
    }

    async login() {
        try {
            await this.client.login();
            logger.info('Instagram login successful');
        } catch (error) {
            logger.error(`Instagram login failed: ${error.message}`);
            throw new Error('Failed to login to Instagram');
        }
    }

    async downloadMedia(url) {
        try {
            // Extraire le shortcode du post à partir de l'URL
            const shortcode = this.extractShortcode(url);
            if (!shortcode) {
                throw new Error('Invalid Instagram URL');
            }

            logger.info(`Extracting media info for shortcode: ${shortcode}`);

            // Déterminer si c'est un post normal, un reel, ou une story
            const isReel = url.includes('/reel/') || url.includes('/reels/');

            let post;
            // Approche différente pour les Reels
            if (isReel) {
                try {
                    // Essayer d'abord la méthode pour les Reels
                    const response = await this.client.getMediaInfoByShortcode({shortcode});
                    post = response.graphql?.shortcode_media;
                    
                    if (!post) {
                        // Essayer une autre approche si la première échoue
                        logger.info('First approach failed, trying alternate method for Reels');
                        const mediaId = await this.getMediaIdFromShortcode(shortcode);
                        const mediaInfo = await this.client.getMediaInfo({mediaId});
                        post = mediaInfo.items[0];
                    }
                } catch (error) {
                    logger.error(`Error fetching reel: ${error.message}`);
                    throw new Error(`Unable to fetch Instagram Reel: ${error.message}`);
                }
            } else {
                // Méthode standard pour les posts normaux
                try {
                    post = await this.client.getMediaByShortcode({shortcode});
                    
                    if (!post) {
                        logger.info('Standard approach failed, trying alternate method');
                        // Fallback à la méthode GraphQL
                        const response = await this.client.request.get(`https://www.instagram.com/p/${shortcode}/?__a=1`);
                        post = response.data.graphql?.shortcode_media;
                    }
                } catch (error) {
                    logger.error(`Error fetching post: ${error.message}`);
                    throw new Error(`Unable to fetch Instagram post: ${error.message}`);
                }
            }

            if (!post) {
                throw new Error('Failed to retrieve post data from Instagram');
            }

            // Préparer les données de téléchargement
            const result = {
                title: post.caption ? (post.caption.text || post.caption) : 'Instagram Post',
                timestamp: post.taken_at_timestamp || post.taken_at || Math.floor(Date.now() / 1000),
                media: []
            };

            // Différentes structures pour différents types de contenus
            if (isReel) {
                // Structure pour les Reels
                if (post.video_versions && post.video_versions.length > 0) {
                    // Format pour les Reels récupérés via l'API privée
                    result.media.push({
                        type: 'video',
                        url: post.video_versions[0].url
                    });
                } else if (post.is_video && post.video_url) {
                    // Format pour les Reels récupérés via GraphQL
                    result.media.push({
                        type: 'video',
                        url: post.video_url
                    });
                } else if (post.carousel_media) {
                    // Pour les carousels dans les Reels (rare)
                    for (const item of post.carousel_media) {
                        if (item.video_versions && item.video_versions.length > 0) {
                            result.media.push({
                                type: 'video',
                                url: item.video_versions[0].url
                            });
                        } else if (item.image_versions2) {
                            result.media.push({
                                type: 'image',
                                url: item.image_versions2.candidates[0].url
                            });
                        }
                    }
                } else {
                    throw new Error('Could not identify media format in Reel');
                }
            } else {
                // Structure pour les posts normaux
                if (post.is_video) {
                    result.media.push({
                        type: 'video',
                        url: post.video_url
                    });
                } else if (post.display_url) {
                    result.media.push({
                        type: 'image',
                        url: post.display_url
                    });
                } else if (post.image_versions2) {
                    // Format alternatif
                    result.media.push({
                        type: 'image',
                        url: post.image_versions2.candidates[0].url
                    });
                }

                // Si c'est un carrousel, télécharger les autres médias
                if (post.edge_sidecar_to_children) {
                    for (const edge of post.edge_sidecar_to_children.edges) {
                        const node = edge.node;
                        result.media.push({
                            type: node.is_video ? 'video' : 'image',
                            url: node.is_video ? node.video_url : node.display_url
                        });
                    }
                } else if (post.carousel_media) {
                    // Format alternatif pour les carrousels
                    for (const item of post.carousel_media) {
                        if (item.video_versions && item.video_versions.length > 0) {
                            result.media.push({
                                type: 'video',
                                url: item.video_versions[0].url
                            });
                        } else if (item.image_versions2) {
                            result.media.push({
                                type: 'image',
                                url: item.image_versions2.candidates[0].url
                            });
                        }
                    }
                }
            }

            // S'assurer qu'au moins un média a été trouvé
            if (result.media.length === 0) {
                throw new Error('No media found in the Instagram post');
            }

            return result;
        } catch (error) {
            logger.error(`Error downloading Instagram media: ${error.message}`);
            throw new Error(`Failed to download Instagram media: ${error.message}`);
        }
    }

    extractShortcode(url) {
        // Extraire le shortcode de différents formats d'URL Instagram
        const reelRegex = /instagram\.com\/reels?\/([^\/\?]+)/;
        const postRegex = /instagram\.com\/p\/([^\/\?]+)/;
        
        let match = url.match(reelRegex);
        if (match) return match[1];
        
        match = url.match(postRegex);
        return match ? match[1] : null;
    }

    async getMediaIdFromShortcode(shortcode) {
        // Cette fonction convertit un shortcode en ID média utilisé par l'API
        try {
            const response = await axios.get(`https://www.instagram.com/p/${shortcode}/?__a=1`);
            return response.data.graphql.shortcode_media.id;
        } catch (error) {
            logger.error(`Error converting shortcode to media ID: ${error.message}`);
            throw new Error('Failed to get media ID from shortcode');
        }
    }
}

module.exports = new InstagramService();