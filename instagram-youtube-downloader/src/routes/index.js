const express = require('express');
const router = express.Router();
const path = require('path');
const instagramService = require('../services/instagramService');
const youtubeService = require('../services/youtubeService');

// Routes pour les pages
router.get('/', (req, res) => {
    res.render('home');
});

router.get('/instagram', (req, res) => {
    res.render('instagram');
});

router.get('/youtube', (req, res) => {
    res.render('youtube');
});

// Route POST pour télécharger un média Instagram
router.post('/api/instagram/download', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ message: 'URL manquante' });
        }
        
        const result = await instagramService.downloadMedia(url);
        
        // Si nous avons un résultat valide, renvoyer le fichier
        if (result && result.downloadUrl) {
            const filePath = path.join(__dirname, '..', '..', 'downloads', path.basename(result.downloadUrl));
            return res.download(filePath);
        } else {
            return res.status(500).json({ message: 'Erreur lors du téléchargement du média' });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// Route GET pour télécharger un média Instagram (via paramètre de requête)
router.get('/api/instagram/download', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ message: 'URL manquante' });
        }
        
        const result = await instagramService.downloadMedia(url);
        
        // Si nous avons un résultat valide, renvoyer le fichier
        if (result && result.downloadUrl) {
            const filePath = path.join(__dirname, '..', '..', 'downloads', path.basename(result.downloadUrl));
            return res.download(filePath);
        } else {
            return res.status(500).json({ message: 'Erreur lors du téléchargement du média' });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// Route POST pour télécharger une vidéo YouTube
router.post('/api/youtube/download', async (req, res) => {
    try {
        const { url, quality } = req.body;
        
        if (!url) {
            return res.status(400).json({ message: 'URL manquante' });
        }
        
        const result = await youtubeService.downloadVideo(url, quality);
        
        // Si nous avons un résultat valide, renvoyer le fichier
        if (result && result.downloadUrl) {
            const filePath = path.join(__dirname, '..', '..', 'downloads', path.basename(result.downloadUrl));
            return res.download(filePath);
        } else {
            return res.status(500).json({ message: 'Erreur lors du téléchargement de la vidéo' });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// Route GET pour télécharger une vidéo YouTube (via paramètre de requête)
router.get('/api/youtube/download', async (req, res) => {
    try {
        const { url, quality } = req.query;
        
        if (!url) {
            return res.status(400).json({ message: 'URL manquante' });
        }
        
        const result = await youtubeService.downloadVideo(url, quality || 'best');
        
        // Si nous avons un résultat valide, renvoyer le fichier
        if (result && result.downloadUrl) {
            const filePath = path.join(__dirname, '..', '..', 'downloads', path.basename(result.downloadUrl));
            return res.download(filePath);
        } else {
            return res.status(500).json({ message: 'Erreur lors du téléchargement de la vidéo' });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;