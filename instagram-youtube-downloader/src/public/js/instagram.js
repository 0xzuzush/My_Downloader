document.addEventListener('DOMContentLoaded', () => {
    const instagramForm = document.getElementById('instagram-form');
    const urlInput = document.getElementById('url');
    
    instagramForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const url = urlInput.value;
        
        if (!url) {
            alert('Veuillez entrer une URL Instagram');
            return;
        }
        
        try {
            // Créer un formulaire invisible pour déclencher le téléchargement
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/api/instagram/download';
            form.target = '_blank'; // Ouvrir dans un nouvel onglet
            
            const urlField = document.createElement('input');
            urlField.type = 'hidden';
            urlField.name = 'url';
            urlField.value = url;
            
            form.appendChild(urlField);
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        } catch (error) {
            alert('Erreur lors du téléchargement : ' + error.message);
        }
    });
});