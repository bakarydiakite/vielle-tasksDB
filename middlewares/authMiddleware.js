// middlewares/authMiddleware.js

const jwt = require('jsonwebtoken'); // import de jsonwebtoken pour vérifier les tokens

// middleware permettant de protéger des routes (vérifie la présence d'un token valide)
module.exports = (req, res, next) => {
  // récupère le header Authorization
  const authHeader = req.headers.authorization;
  // si header absent, renvoie 401 Unauthorized
  if (!authHeader) return res.status(401).json({ message: 'Token manquant' });

  // format attendu : 'Bearer <token>' ; on split pour obtenir la 2ème partie
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    // vérifie le token avec la clé secrète stockée en .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // attache le payload décodé à req.user pour l'utiliser plus loin
    req.user = decoded;
    // passe au middleware suivant / route
    next();
  } catch (err) {
    // si token invalide ou expiré
    return res.status(403).json({ message: 'Token invalide' });
  }
};