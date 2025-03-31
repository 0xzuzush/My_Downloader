const express = require('express');
const router = express.Router();
const instagramController = require('../controllers/instagramController');
const youtubeController = require('../controllers/youtubeController');

// Route pour la page d'accueil
router.get('/', (req, res) => {
    res.render('index');
});

// Routes pour les pages Instagram et YouTube
router.get('/instagram', (req, res) => {
    res.render('instagram');
});

router.get('/youtube', (req, res) => {
    res.render('youtube');
});

// Routes pour l'API de téléchargement
router.post('/download/instagram', instagramController.download);
router.post('/download/youtube', youtubeController.download);

module.exports = router;