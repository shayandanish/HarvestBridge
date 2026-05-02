const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favorites.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // All routes protected

router.post('/', favoritesController.addFavorite);
router.get('/', favoritesController.getFavorites);
router.delete('/:id', favoritesController.removeFavorite);

module.exports = router;
