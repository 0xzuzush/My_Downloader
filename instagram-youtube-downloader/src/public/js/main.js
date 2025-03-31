document.addEventListener('DOMContentLoaded', () => {
    const downloadForm = document.getElementById('download-form');
    const urlInput = document.getElementById('url-input');
    const formatSelect = document.getElementById('format-select');
    const resultContainer = document.getElementById('result-container');

    downloadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const url = urlInput.value;
        const format = formatSelect.value;

        if (!url) {
            alert('Veuillez entrer une URL valide.');
            return;
        }

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, format }),
            });

            const data = await response.json();

            if (response.ok) {
                resultContainer.innerHTML = `
                    <h3>Téléchargement réussi!</h3>
                    <p>Titre: ${data.title}</p>
                    <p>Durée: ${data.duration}</p>
                    <a href="${data.downloadLink}" download>Télécharger le fichier</a>
                `;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            resultContainer.innerHTML = `
                <h3>Erreur!</h3>
                <p>${error.message}</p>
            `;
        }
    });
});