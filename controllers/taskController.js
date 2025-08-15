// controllers/taskController.js

const Task = require('../models/Task'); // modèle Task
const Joi = require('joi'); // validation

// schéma Joi pour valider création / mise à jour
const taskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().allow('').max(2000),
  priority: Joi.string().valid('low','medium','high').default('medium'),
  status: Joi.string().valid('todo','inprogress','done').default('todo'),
  assignee: Joi.string().allow(null, ''),
  dueDate: Joi.date().allow(null, '')
});

// création d'une tâche
exports.createTask = async (req, res) => {
  try {
    const { error, value } = taskSchema.validate(req.body); // validation
    if (error) return res.status(400).json({ message: error.details[0].message });

    const task = new Task(value); // crée le document Task à partir de 'value'
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// récupération des tâches avec pagination, filtres et tri
exports.getTasks = async (req, res) => {
  try {
    // pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // filtres (optionnels)
    const filter = {};
    if (req.query.priority) filter.priority = req.query.priority; // ?priority=high
    if (req.query.status) filter.status = req.query.status; // ?status=done
    if (req.query.assignee) filter.assignee = req.query.assignee; // ?assignee=<id>

    // tri
    const sortField = req.query.sort || 'createdAt';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;

    // exécution : populate pour avoir infos assignee
    const tasks = await Task.find(filter)
      .populate('assignee') // remplace l'id par le document Member
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments(filter); // total pour le front
    res.json({ page, limit, total, tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// récupérer une tâche par id
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignee');
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// mise à jour d'une tâche
exports.updateTask = async (req, res) => {
  try {
    const { error, value } = taskSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const task = await Task.findByIdAndUpdate(req.params.id, value, { new: true }).populate('assignee');
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// suppression d'une tâche
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
    res.json({ message: 'Tâche supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}