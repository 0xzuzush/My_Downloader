document.addEventListener('DOMContentLoaded', () => {
    const youtubeForm = document.getElementById('youtube-form');
    const urlInput = document.getElementById('url');
    const formatInput = document.getElementById('format');
    const formatOptions = document.querySelectorAll('.format-option');
    const mediaPreview = document.getElementById('media-preview');
    const listFormatsButton = document.getElementById('list-formats');

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

    // Lister les formats disponibles
    listFormatsButton.addEventListener('click', async () => {
        const url = urlInput.value;

        if (!url) {
            alert('Veuillez entrer une URL YouTube valide');
            return;
        }

        try {
            const response = await fetch('/api/youtube/formats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Formats disponibles :\n${data.formats}`);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            alert('Erreur lors de la récupération des formats : ' + error.message);
        }
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
            // Créer un formulaire invisible pour déclencher le téléchargement
            const downloadForm = document.createElement('form');
            downloadForm.action = '/api/youtube/download';
            downloadForm.method = 'POST';
            downloadForm.style.display = 'none';

            const urlField = document.createElement('input');
            urlField.name = 'url';
            urlField.value = url;
            downloadForm.appendChild(urlField);

            const formatField = document.createElement('input');
            formatField.name = 'quality';
            formatField.value = format;
            downloadForm.appendChild(formatField);

            document.body.appendChild(downloadForm);
            downloadForm.submit();
            document.body.removeChild(downloadForm);
        } catch (error) {
            alert('Erreur lors du téléchargement : ' + error.message);
        }
    });
    
    // Fonction pour formater la durée en minutes:secondes
    function formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
});