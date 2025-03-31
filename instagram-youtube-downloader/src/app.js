const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { rateLimiter } = require('./middlewares/rateLimiter');
const apiRoutes = require('./routes/api');
const indexRoutes = require('./routes/index');

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Middleware pour parser le corps des requêtes en JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);
app.use(express.static(path.join(__dirname, 'public')));

// Configuration des vues
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.use('/', indexRoutes);
app.use('/api', apiRoutes);

// Gérer les erreurs 404
app.use((req, res, next) => {
    res.status(404).render('404', { message: 'Page introuvable' });
});

// Gérer les erreurs serveur
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { message: 'Erreur serveur', error: err });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;