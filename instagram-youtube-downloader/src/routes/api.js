const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const youtubeService = require('../services/youtubeService');
const instagramService = require('../services/instagramService');
const youtubeController = require('../controllers/youtubeController'); // Ajout de cette ligne

// Dossier de téléchargement
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'downloads');

// Routes Instagram
router.post('/instagram/download', async (req, res) => {
    const { url } = req.body;
    
    try {
        // Vérifier si l'URL est fournie
        if (!url) {
            return res.status(400).json({ message: 'URL manquante' });
        }
        
        const result = await instagramService.downloadMedia(url);
        
        // Vérifier si le résultat est valide
        if (!result || !result.downloadUrl) {
            return res.status(500).json({ message: 'Erreur lors du téléchargement du média' });
        }
        
        // Construire le chemin complet du fichier
        const filePath = path.join(DOWNLOAD_DIR, path.basename(result.downloadUrl));
        
        // Vérifier si le fichier existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Fichier non trouvé' });
        }
        
        // Envoyer le fichier au client
        return res.download(filePath, path.basename(filePath), (err) => {
            if (err) {
                return res.status(500).json({ message: `Erreur lors de l'envoi du fichier: ${err.message}` });
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// Routes YouTube
router.post('/youtube/download', async (req, res) => {
    const { url, quality } = req.body;
    try {
        const result = await youtubeService.downloadVideo(url, quality);

        // Envoyer le fichier directement au client
        const filePath = path.join(__dirname, '..', '..', 'downloads', result.downloadUrl.split('/').pop());
        res.download(filePath, result.title + '.mp4', (err) => {
            if (err) {
                console.error('Erreur lors de l\'envoi du fichier :', err);
                res.status(500).send('Erreur lors de l\'envoi du fichier.');
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/youtube/audio', async (req, res) => {
    const { url } = req.body;
    try {
        const result = await youtubeService.downloadAudio(url);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/youtube/formats', async (req, res) => {
    const { url } = req.body;
    try {
        const formats = await youtubeService.listFormats(url);
        res.status(200).json({ formats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route de streaming pour les fichiers téléchargés
router.get('/youtube/download/stream', (req, res) => {
    try {
        const { file } = req.query;

        if (!file) {
            return res.status(400).send('Fichier non spécifié');
        }

        // Vérifier si le chemin est sécurisé (éviter les attaques de traversée de chemin)
        const safePath = path.normalize(file).replace(/^(\.\.(\/|\\|$))+/, '');
        const filePath = path.join(DOWNLOAD_DIR, safePath);

        // Vérifier si le fichier existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('Fichier non trouvé');
        }

        // Déterminer le type de contenu
        const ext = path.extname(filePath).toLowerCase();
        let contentType = 'application/octet-stream';

        if (ext === '.mp4') {
            contentType = 'video/mp4';
        } else if (ext === '.mp3') {
            contentType = 'audio/mpeg';
        }

        // Obtenir le nom du fichier d'origine
        const filename = path.basename(filePath);

        // Configurer les en-têtes
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Diffuser le fichier
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Optionnel: supprimez le fichier après le téléchargement
        fileStream.on('end', () => {
            // Nous pouvons choisir de supprimer le fichier après envoi
            // fs.unlinkSync(filePath);
        });

        fileStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            res.status(500).send('Erreur lors de la diffusion du fichier');
        });
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).send(`Erreur: ${error.message}`);
    }
});

module.exports = router;