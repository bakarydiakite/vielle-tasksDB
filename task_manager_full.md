# Projet Final — Gestion des Tâches d'une Équipe (Node.js + Express + MongoDB)

**But :** Fournir un projet complet, commenté ligne par ligne, prêt à être installé, testé et déployé.

---

## 0) Résumé corrigé de l'énoncé

Bonsoir à toutes et à tous,

J’espère que vous allez bien ! Voici le projet final que vous devez réaliser pour mettre en pratique les notions abordées sur Node.js.

### Objectif
- Concevoir un projet complet qui applique : Node.js, Express, MongoDB, authentification (JWT), validation, upload si nécessaire, et bonnes pratiques de sécurité et déploiement.

### Projet : Gestion des Tâches d'une Équipe
Fonctionnalités :
1. Authentification utilisateur (JWT).
2. Gestion des membres de l'équipe (CRUD).
3. Ajout, modification et suppression de tâches (CRUD).
4. Affichage des tâches avec pagination.
5. Filtrage des tâches par priorité et statut (todo / inprogress / done).
6. Déploiement : MongoDB Atlas + Render/Heroku.

### Plan de la semaine (suggestion)
- Jour 1-2 : Développement (modèles, auth, routes, contrôleurs).
- Jour 3 : Tests et corrections (Postman, validations, protections).
- Jour 4 : Déploiement et présentation.

---

## 1) Préparation & Installation

Ouvrir un terminal et exécuter :

```bash
# Créer le dossier et initialiser
mkdir task-manager
cd task-manager
npm init -y

# Installer dépendances
npm install express mongoose dotenv bcryptjs jsonwebtoken joi helmet cors express-rate-limit

# Dépendance dev (optionnel)
npm install --save-dev nodemon

# Créer l'arborescence
mkdir models controllers routes middlewares
```

Crée un fichier `.env` à la racine (ne jamais le commiter).

---

## 2) Fichier `.env` (exemple)
```
PORT=3000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/taskmanager?retryWrites=true&w=majority
JWT_SECRET=ChangeThisToAStrongSecret
TOKEN_EXPIRES_IN=1h
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```
**Explication :** variables d'environnement utilisées par l'application pour la configuration sans exposer de secrets dans le code.

---

## 3) Structure des fichiers (proposée)
```
task-manager/
├── models/
│   ├── User.js
│   ├── Member.js
│   └── Task.js
├── controllers/
│   ├── authController.js
│   ├── memberController.js
│   └── taskController.js
├── routes/
│   ├── authRoutes.js
│   ├── memberRoutes.js
│   └── taskRoutes.js
├── middlewares/
│   ├── authMiddleware.js
│   └── validateMiddleware.js
├── .env
├── app.js
├── package.json
```

---

## 4) Modèles (models) — code et commentaires ligne par ligne

### `models/User.js`
```js
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
```

**Mot par mot :** 
- `const mongoose = require('mongoose');` → `const` crée une variable constante nommée `mongoose` ; `require('mongoose')` importe le module `mongoose`.
- `new mongoose.Schema({...})` → `new` crée un nouvel objet, `mongoose.Schema` est la classe schéma.
- `module.exports = ...` → expose ce modèle pour l'utiliser dans d'autres fichiers.

---

### `models/Member.js`
```js
// models/Member.js

const mongoose = require('mongoose'); // importe mongoose

// schéma pour un membre de l'équipe
const memberSchema = new mongoose.Schema({
  name: { type: String, required: true }, // nom du membre requis
  email: { type: String, required: true, unique: true }, // email unique requis
  role: { type: String, default: 'member' } // rôle (member, lead, etc)
}, { timestamps: true }); // timestamps automatiques

module.exports = mongoose.model('Member', memberSchema); // exporte le modèle 'Member'
```

**Pourquoi :** on veut stocker les membres et garantir que chaque email est unique pour éviter doublons.

---

### `models/Task.js`
```js
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
```

**Explication courte :** `ref: 'Member'` crée la relation (équivalent d'une clé étrangère) ; `enum` limite les valeurs acceptées.

---

## 5) Middlewares — code et explication

### `middlewares/authMiddleware.js`
```js
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
```

**Note :** si tu veux limiter l'accès à certains rôles, tu peux vérifier `req.user` (par ex. si token contient `role`)

---

### `middlewares/validateMiddleware.js` (optionnel)
Ce middleware centralise l'utilisation de Joi (si tu veux réutiliser la logique de validation).

```js
// middlewares/validateMiddleware.js

module.exports = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body); // valide req.body avec le schéma Joi passé
  if (error) return res.status(400).json({ message: error.details[0].message });
  next(); // si OK, passe à la route suivante
};
```

**Utilité :** évite de répéter la validation dans chaque contrôleur.

---

## 6) Contrôleurs (controllers) — code et commentaires

### `controllers/authController.js`
```js
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
    if (existing) return res.status(400).json({ message: 'Nom d\\'utilisateur déjà utilisé' });

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
};

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
```

**Conseil :** ne jamais renvoyer le mot de passe. Stocke seulement le token côté client (localStorage ou cookie httpOnly selon besoin).

---

### `controllers/memberController.js`
```js
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
```

---

### `controllers/taskController.js`
```js
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
};
```

---

## 7) Routes — code et explications

### `routes/authRoutes.js`
```js
// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register -> inscription
router.post('/register', authController.register);

// POST /api/auth/login -> connexion
router.post('/login', authController.login);

module.exports = router;
```

### `routes/memberRoutes.js`
```js
// routes/memberRoutes.js
const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const authMiddleware = require('../middlewares/authMiddleware');

// toutes ces routes sont protégées par authMiddleware
router.get('/', authMiddleware, memberController.getMembers);
router.post('/', authMiddleware, memberController.createMember);
router.put('/:id', authMiddleware, memberController.updateMember);
router.delete('/:id', authMiddleware, memberController.deleteMember);

module.exports = router;
```

### `routes/taskRoutes.js`
```js
// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, taskController.getTasks); // GET /api/tasks
router.get('/:id', authMiddleware, taskController.getTaskById);
router.post('/', authMiddleware, taskController.createTask);
router.put('/:id', authMiddleware, taskController.updateTask);
router.delete('/:id', authMiddleware, taskController.deleteTask);

module.exports = router;
```

---

## 8) `app.js` — point d'entrée (lignes commentées)

```js
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
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    // démarrage du serveur après connexion DB réussie
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`🚀 Serveur démarré sur http://localhost:${port}`));
  })
  .catch(err => {
    console.error('❌ Impossible de se connecter à MongoDB', err);
  });
```

---

## 9) Tests (Postman - exemples)

1. **Inscription**
- `POST http://localhost:3000/api/auth/register`
- Body JSON:
```json
{ "username": "admin", "password": "pass123" }
```

2. **Connexion**
- `POST http://localhost:3000/api/auth/login`
- Body JSON same as above
- Response: `{ "token": "..." }` → copier le token pour les futures requêtes

3. **Créer membre**
- `POST http://localhost:3000/api/members`
- Headers: `Authorization: Bearer <token>`
- Body JSON:
```json
{ "name": "Alice", "email": "alice@example.com", "role": "lead" }
```

4. **Créer tâche**
- `POST http://localhost:3000/api/tasks`
- Headers: `Authorization: Bearer <token>`
- Body JSON:
```json
{
  "title": "Rédiger le rapport",
  "description": "Préparer le rapport hebdomadaire",
  "priority": "high",
  "status": "todo",
  "assignee": "<memberId>",
  "dueDate": "2025-08-20"
}
```

5. **Lister tâches avec pagination & filtres**
- `GET http://localhost:3000/api/tasks?page=1&limit=10&priority=high&status=todo&sort=dueDate&order=asc`
- Response includes `{ page, limit, total, tasks }`

---

## 10) Déploiement (résumé)

- **MongoDB Atlas** : créer un cluster, whitelist ton IP (ou autorise 0.0.0.0/0 pendant tests), créer un user DB, récupérer l'URI et le coller dans `.env`.
- **Render / Railway / Heroku** :
  - Pousser ton repo sur GitHub.
  - Connecter le repo à la plateforme choisie.
  - Configurer les variables d'environnement (MONGO_URI, JWT_SECRET, etc.).
  - Déployer et vérifier les logs.
- **Procfile** (Heroku) : `web: node app.js` si nécessaire.
- **HTTPS** : la plateforme fournit souvent HTTPS automatiquement.

---

## 11) Bonnes pratiques & améliorations possibles

- Ajouter logs (Winston), monitoring, tests (Jest + Supertest).
- Ajouter pagination progrès (prev/next links), pageCount calculé côté serveur.
- Rafraîchissement des tokens (refresh tokens) pour meilleure UX.
- Limiter la taille des requêtes et des uploads (si images).
- Ajouter roles/permissions (admin vs user).

---

## 12) Besoin d'aide supplémentaire ?

Je peux :
- Générer un `.zip` avec tous les fichiers `.js` prêts à l'emploi.
- Créer le fichier `.md` téléchargeable (je viens de le faire) et te donner le lien.
- Te expliquer **ligne par ligne** un fichier spécifique (ex : `taskController.js`) mot par mot.

Dis-moi ce que tu veux que je fasse ensuite.
