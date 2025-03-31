const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

const binDir = path.join(__dirname, '..', 'bin');
if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
}

let url, destination;

// Détection de l'OS et de l'architecture
const platform = os.platform();
const arch = os.arch();

// Sélection de l'URL appropriée en fonction de la plateforme
if (platform === 'win32') {
    url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    destination = path.join(binDir, 'yt-dlp.exe');
} else if (platform === 'darwin') { // macOS
    if (arch === 'arm64') {
        url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos_arm64';
    } else {
        url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
    }
    destination = path.join(binDir, 'yt-dlp');
} else { // Linux et autres
    if (arch === 'arm64' || arch === 'arm') {
        url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64';
    } else {
        url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';
    }
    destination = path.join(binDir, 'yt-dlp');
}

console.log(`Téléchargement de yt-dlp depuis ${url}...`);
console.log(`Destination: ${destination}`);

// Suppression du fichier existant si présent
if (fs.existsSync(destination)) {
    fs.unlinkSync(destination);
    console.log("Ancien fichier yt-dlp supprimé.");
}

// Télécharger avec axios plutôt que node-downloader-helper
async function downloadFile() {
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });
        
        const writer = fs.createWriteStream(destination);
        
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error.message);
        process.exit(1);
    }
}

downloadFile().then(() => {
    console.log('Téléchargement terminé!');
    if (platform !== 'win32') {
        fs.chmodSync(destination, '755');
        console.log('Permissions exécutables ajoutées.');
    }
}).catch(err => {
    console.error('Erreur:', err);
});