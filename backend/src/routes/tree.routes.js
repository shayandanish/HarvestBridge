const express = require('express');
const router = express.Router();
const treeController = require('../controllers/tree.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/', treeController.getAllTrees);

// Admin only routes
router.use(authorize('admin'));
router.post('/', treeController.createTree);
router.put('/:id', treeController.updateTree);
router.delete('/:id', treeController.deleteTree);

module.exports = router;
