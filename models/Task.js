// models/Task.js

const mongoose = require('mongoose'); // importe mongoose

// schéma pour une tâche
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true }, // titre obligatoire
  description: { type: String }, // description texte
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' }, // priorité restreinte
  status: { type: String, enum: ['todo','inprogress','done'], default: 'todo' }, // statut restreint
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null }, // référence vers Member
  dueDate: { type: Date, default: null } // date butoir
}, { timestamps: true }); // createdAt, updatedAt

module.exports = mongoose.model('Task', taskSchema); // exporte 'Task'