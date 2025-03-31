const instagramService = require('../services/instagramService');
const logger = require('../utils/logger');

class InstagramController {
    async downloadMedia(req, res) {
        try {
            const { url } = req.body;
            
            if (!url) {
                return res.status(400).json({ message: 'URL manquante' });
            }
            
            logger.info(`Demande de téléchargement Instagram : ${url}`);
            const result = await instagramService.downloadMedia(url);
            
            // Cette ligne pourrait être la source de l'erreur
            // Assurons-nous que result est défini avant d'y accéder
            if (!result) {
                return res.status(500).json({ message: 'Erreur lors du téléchargement' });
            }
            
            return res.status(200).json(result);
        } catch (error) {
            logger.error(`Erreur contrôleur Instagram : ${error.message}`);
            return res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new InstagramController();