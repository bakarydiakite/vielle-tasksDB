// middlewares/validateMiddleware.js

module.exports = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body); // valide req.body avec le schéma Joi passé
  if (error) return res.status(400).json({ message: error.details[0].message });
  next(); // si OK, passe à la route suivante
};