document.addEventListener('DOMContentLoaded', () => {
    const youtubeForm = document.getElementById('youtube-form');
    const urlInput = document.getElementById('url');
    const formatInput = document.getElementById('format');
    const formatOptions = document.querySelectorAll('.format-option');
    const mediaPreview = document.getElementById('media-preview');

    // Sélection du format
    formatOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all options
            formatOptions.forEach(opt => opt.classList.remove('active'));
            // Add active class to clicked option
            option.classList.add('active');
            // Update hidden input value
            formatInput.value = option.dataset.format;
        });
    });

    // Formulaire de téléchargement
    youtubeForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const url = urlInput.value;
        const format = formatInput.value;
        
        if (!url) {
            alert('Veuillez entrer une URL YouTube valide');
            return;
        }
        
        try {
            // Afficher l'état de chargement
            mediaPreview.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Récupération des informations de la vidéo...</p>
                </div>
            `;
            mediaPreview.classList.add('active');
            
            // Envoi de la requête API
            const response = await fetch('/api/youtube/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, format }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Afficher les informations de la vidéo
                const videoInfo = data.data;
                mediaPreview.innerHTML = `
                    <div class="preview-header">
                        <img src="${videoInfo.thumbnail}" alt="${videoInfo.title}" class="preview-thumbnail">
                        <div class="preview-info">
                            <h3>${videoInfo.title}</h3>
                            <p>Durée: ${formatDuration(videoInfo.duration)}</p>
                            <p>Format: ${videoInfo.format}</p>
                        </div>
                    </div>
                    <div class="download-buttons">
                        <a href="${videoInfo.downloadUrl}" class="btn youtube-btn" download>Télécharger maintenant</a>
                    </div>
                `;
            } else {
                throw new Error(data.message || 'Erreur lors du téléchargement');
            }
        } catch (error) {
            mediaPreview.innerHTML = `
                <div class="error-message">
                    <h3>Erreur</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    });
    
    // Fonction pour formater la durée en minutes:secondes
    function formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
});