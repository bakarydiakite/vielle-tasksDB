// models/User.js

// importe mongoose pour définir des schémas et interagir avec MongoDB
const mongoose = require('mongoose');

// définit un schéma pour les utilisateurs
const userSchema = new mongoose.Schema({
  // username : chaîne, requis et unique
  username: { type: String, required: true, unique: true },
  // password : chaîne hachée, requise
  password: { type: String, required: true }
}, {
  // timestamps : ajoute createdAt et updatedAt automatiquement
  timestamps: true
});

// exporte le modèle 'User' basé sur le schéma précédemment défini
module.exports = mongoose.model('User', userSchema);