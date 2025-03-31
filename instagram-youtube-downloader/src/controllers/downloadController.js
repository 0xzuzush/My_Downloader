class DownloadController {
    constructor(instagramService, youtubeService) {
        this.instagramService = instagramService;
        this.youtubeService = youtubeService;
    }

    async downloadInstagram(req, res) {
        const { url } = req.body;
        try {
            const result = await this.instagramService.downloadContent(url);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors du téléchargement depuis Instagram', error: error.message });
        }
    }

    async downloadYoutube(req, res) {
        const { url, format } = req.body;
        try {
            const result = await this.youtubeService.downloadContent(url, format);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors du téléchargement depuis YouTube', error: error.message });
        }
    }
}

export default DownloadController;