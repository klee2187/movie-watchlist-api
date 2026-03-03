const routes = require('express').Router();
const watchlistController = require('../controllers/watchlist');
const { watchlistValidationRules } = require('../middleware/validation');
const { isAuthenticated } = require('../middleware/auth');

// GET all watchlist items for current user
routes.get('/', watchlistController.getUserWatchlist);

// GET a single watchlist item by ID
routes.get('/:id', watchlistController.getWatchlistItemById );

// POST to add movie to watchlist
routes.post( '/', watchlistController.addToWatchlist );

// PUT to update a watchlist item
routes.put( '/:id', watchlistController.updateWatchlistItem );

// DELETE to remove a watchlist item
routes.delete( '/:id', watchlistController.deleteWatchlistItem );

module.exports = routes;