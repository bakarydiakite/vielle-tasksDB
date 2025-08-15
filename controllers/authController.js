// controllers/authController.js

const User = require('../models/User'); // modèle User
const bcrypt = require('bcryptjs'); // crypter les mots de passe
const jwt = require('jsonwebtoken'); // gérer les tokens JWT

// inscription
exports.register = async (req, res) => {
  try {
    // extraction des champs depuis le corps de la requête
    const { username, password } = req.body;
    // contrôle basique
    if (!username || !password) return res.status(400).json({ message: 'Champs manquants' });

    // vérifie si l'utilisateur existe déjà
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Nom d\'utilisateur déjà utilisé' });

    // hachage du mot de passe (10 rounds)
    const hashed = await bcrypt.hash(password, 10);

    // création et sauvegarde du nouvel utilisateur
    const user = new User({ username, password: hashed });
    await user.save();

    // réponse : compte créé
    res.status(201).json({ message: 'Compte créé' });
  } catch (err) {
    // erreur serveur
    res.status(500).json({ message: err.message });
  }
}


// connexion
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Champs manquants' });

    // recherche de l'utilisateur
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Identifiants invalides' });

    // comparaison des mots de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Identifiants invalides' });

    // génération du token JWT ; payload minimal : user id et username
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_EXPIRES_IN });

    // renvoie le token au client
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};