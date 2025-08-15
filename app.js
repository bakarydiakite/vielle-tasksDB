// app.js

// charge les variables d'environnement depuis .env
require('dotenv').config();

const express = require('express'); // framework web
const mongoose = require('mongoose'); // connecteur MongoDB
const helmet = require('helmet'); // sécurité des headers
const cors = require('cors'); // gestion cross-origin
const rateLimit = require('express-rate-limit'); // protection brute-force
const path = require('path'); // utilitaires chemins de fichiers

// import des routes
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express(); // création de l'application express

// rate limit : empêche trop de requêtes depuis une même IP
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // fenêtre en ms
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // max requêtes par IP
});
app.use(limiter); // applique le rate limiter globalement

app.use(helmet()); // ajoute des headers HTTP sécurisés
app.use(cors()); // autorise toutes les origines ; config possible pour restreindre
app.use(express.json()); // parse application/json

// route racine simple pour vérifier que l'API tourne
app.get('/', (req, res) => res.send('API Task Manager en ligne'));

// montée des routes sous le préfixe /api
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/tasks', taskRoutes);

// connexion à MongoDB via MONGO_URI
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    // démarrage du serveur après connexion DB réussie
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`🚀 Serveur démarré sur http://localhost:${port}`));
  })
  .catch(err => {
    console.error('❌ Impossible de se connecter à MongoDB', err);
  });