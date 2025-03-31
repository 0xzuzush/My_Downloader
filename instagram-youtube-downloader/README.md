# Instagram & YouTube Downloader

Ce projet est une application web développée en Node.js qui permet aux utilisateurs de télécharger des contenus en haute définition depuis Instagram et YouTube en collant simplement le lien du post ou de la vidéo.

## Fonctionnalités

### Téléchargement depuis Instagram 📸
- Téléchargement de photos et vidéos en haute définition.
- Support pour les posts simples, carrousels et Reels.

### Téléchargement depuis YouTube 🎥
- Téléchargement de vidéos YouTube en très haute qualité (MP4, 1080p, 4K, etc.).
- Option pour extraire uniquement l'audio en MP3.

### Interface utilisateur 🎨
- Design simple et intuitif avec une barre de recherche.
- Affichage des métadonnées du contenu (titre de la vidéo, miniature, durée).

## Technologies utilisées
- **Backend**: Node.js avec Express
- **Frontend**: HTML/CSS/JavaScript (ou un framework comme React/Vue.js si nécessaire)

## APIs et librairies
- Utilisation de modules comme `youtube-dl`, `yt-dlp` ou `instaloader` pour récupérer les fichiers.
- Gestion des formats et de la conversion si besoin.

## Contraintes et optimisations 🚀
- Temps de traitement rapide.
- Système de logs et d’erreurs en cas de lien invalide.
- Sécurisation de l’application pour éviter les abus, avec un taux limite d’utilisation.

## Installation

1. Clonez le dépôt:
   ```
   git clone https://github.com/votre-utilisateur/instagram-youtube-downloader.git
   ```
2. Accédez au répertoire du projet:
   ```
   cd instagram-youtube-downloader
   ```
3. Installez les dépendances:
   ```
   npm install
   ```
4. Configurez les variables d'environnement en copiant `.env.example` vers `.env` et en remplissant les valeurs nécessaires.

5. Démarrez l'application:
   ```
   npm start
   ```

## Contribuer

Les contributions sont les bienvenues! N'hésitez pas à soumettre des demandes de tirage ou à ouvrir des problèmes pour toute suggestion ou bug.

## License

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.