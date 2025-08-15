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