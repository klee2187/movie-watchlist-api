const routes = require('express').Router();
const moviesRoutes = require('./movies');
const usersRoutes = require('./users');
const watchlistRoutes = require('./watchlist');
const awardsRoutes = require('./awards');
const authRoutes = require('./auth');
const { optionalAuth } = require('../middleware/auth');

// API routes
routes.use('/movies', optionalAuth, moviesRoutes);
// routes.use('/users', optionalAuth, usersRoutes);
routes.use('/watchlist', optionalAuth, watchlistRoutes);
// routes.use('/awards', optionalAuth, awardsRoutes);
// routes.use('/auth', authRoutes);

module.exports = routes;