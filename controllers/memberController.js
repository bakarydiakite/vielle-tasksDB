// controllers/memberController.js

const Member = require('../models/Member'); // modèle Member

// créer un membre
exports.createMember = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Champs manquants' });

    // vérifie unicité email
    const existing = await Member.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email déjà utilisé' });

    const member = new Member({ name, email, role });
    await member.save();
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// lister membres (simple)
exports.getMembers = async (req, res) => {
  try {
    const members = await Member.find().sort({ name: 1 }); // trie alphabétique
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// mettre à jour
exports.updateMember = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const member = await Member.findByIdAndUpdate(req.params.id, { name, email, role }, { new: true });
    if (!member) return res.status(404).json({ message: 'Membre non trouvé' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// supprimer
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: 'Membre non trouvé' });
    res.json({ message: 'Membre supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};