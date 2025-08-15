// models/Member.js

const mongoose = require('mongoose'); // importe mongoose

// schéma pour un membre de l'équipe
const memberSchema = new mongoose.Schema({
  name: { type: String, required: true }, // nom du membre requis
  email: { type: String, required: true, unique: true }, // email unique requis
  role: { type: String, default: 'member' } // rôle (member, lead, etc)
}, { timestamps: true }); // timestamps automatiques

module.exports = mongoose.model('Member', memberSchema); // exporte le modèle 'Member'