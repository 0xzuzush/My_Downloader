const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const youtubeController = require('../controllers/youtubeController');
const instagramController = require('../controllers/instagramController');

// Dossier de téléchargement
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'downloads');

// Routes Instagram
router.post('/instagram/download', instagramController.download);

// Routes YouTube
router.post('/youtube/download', youtubeController.download);
router.post('/youtube/audio', youtubeController.downloadAudio);

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