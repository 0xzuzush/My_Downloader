document.addEventListener('DOMContentLoaded', () => {
    const instagramForm = document.getElementById('instagram-form');
    const urlInput = document.getElementById('url');
    const mediaPreview = document.getElementById('media-preview');

    // Formulaire de téléchargement
    instagramForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const url = urlInput.value;
        
        if (!url) {
            alert('Veuillez entrer une URL Instagram valide');
            return;
        }
        
        try {
            // Afficher l'état de chargement
            mediaPreview.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Récupération des informations du post...</p>
                </div>
            `;
            mediaPreview.classList.add('active');
            
            // Envoi de la requête API
            const response = await fetch('/api/instagram/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Afficher les informations du média
                const mediaInfo = data.data;
                
                // Construire l'affichage HTML pour tous les médias
                const mediaHtml = mediaInfo.media.map((media, index) => {
                    if (media.type === 'image') {
                        return `
                            <div class="media-item">
                                <img src="${media.url}" alt="Image ${index + 1}" class="preview-image">
                                <a href="${media.url}" class="btn instagram-btn" download="instagram-image-${index + 1}">Télécharger l'image</a>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="media-item">
                                <video controls class="preview-video">
                                    <source src="${media.url}" type="video/mp4">
                                    Votre navigateur ne supporte pas la vidéo HTML5.
                                </video>
                                <a href="${media.url}" class="btn instagram-btn" download="instagram-video-${index + 1}">Télécharger la vidéo</a>
                            </div>
                        `;
                    }
                }).join('');
                
                mediaPreview.innerHTML = `
                    <div class="preview-header">
                        <div class="preview-info">
                            <h3>${mediaInfo.title}</h3>
                        </div>
                    </div>
                    <div class="media-gallery">
                        ${mediaHtml}
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
});