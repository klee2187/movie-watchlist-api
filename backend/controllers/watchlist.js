const { ObjectId } = require('mongodb');
const mongodb = require('../db/connect');

// To GET all watchlist items
const getUserWatchlist = async (req, res) => {
  try {
    const userId = new ObjectId(req.user._id || req.user.id);

    // now _db is already the 'test' database
    const watchlistItems = await mongodb
      .getDb()
      .collection('watchlist')
      .aggregate([
        { $match: { userId: userId } },
        {
          $lookup: {
            from: 'movies',
            localField: 'movieId',
            foreignField: '_id',
            as: 'movieDetails',
          },
        },
        { $unwind: '$movieDetails' },
      ])
      .toArray();

    res.status(200).json(watchlistItems);
  } catch (err) {
    res.status(500).json({ message: 'err.message' });
  }
};

// To GET a single watchlist item by id
const getWatchlistItemById = async (req, res) => {
  try {
    const watchlistId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.user._id || req.user.id);

    const watchlistItem = await mongodb
      .getDb()
      .collection('watchlist')
      .aggregate([
        { $match: { _id: watchlistId, userId: userId } },
        {
          $lookup: {
            from: 'movies',
            localField: 'movieId',
            foreignField: '_id',
            as: 'movieDetails',
          },
        },
        { $unwind: '$movieDetails' },
      ])
      .toArray();

    if (!watchlistItem || watchlistItem.length === 0) {
      res.status(404).json({ message: 'Watchlist item not found' });
    }

    res.status(200).json(watchlistItem[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Use POST to create a watchlist item
const addToWatchlist = async (req, res) => {
  try {
    const userId = new ObjectId(req.user._id || req.user.id);
    const movieId = new ObjectId(req.body.movieId);

    // Check if movie exists
    const movie = await mongodb
      .getDb()
      .collection('movies')
      .findOne({ _id: movieId });

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    } 
    
    // Check if already in watchlist
    const existing = await mongodb
      .getDb()
      .collection('watchlist')
      .findOne({ userId: userId, movieId: movieId });
    
    if (existing) {
      return res.status(409).json({ 
        message: 'Movie already in watchlist' 
      });
    }
    
    const watchlistItem = {
      userId: userId,
      movieId: movieId,
      addedDate: new Date(),
      // plan-to-watch, watching, completed
      status: req.body.status || 'plan-to-watch', 
      // 0-5 scale
      userRating: req.body.userRating || null, 
      reviewText: req.body.reviewText || '',
      startedWatching: req.body.startedWatching ? new Date(req.body.startedWatching) : null,
      completedDate: req.body.completedDate ? new Date(req.body.completedDate) : null,
      rewatchCount: req.body.rewatchCount || 0,
    };

    // Validation
    if (!watchlistItem.movieId) {
      return res.status(400).json({ message: 'Movie ID is required' });
    }

    const validStatuses = ['plan-to-watch', 'watching', 'completed'];
    if (!validStatuses.includes(watchlistItem.status)) {
      return res.status(400).json({ 
        message: 'Status must be one of: plan-to-watch, watching, completed' 
      });
    }

    if (watchlistItem.userRating !== null && 
        (watchlistItem.userRating < 0 || watchlistItem.userRating > 5)) {
      return res.status(400).json({ 
        message: 'User rating must be between 0 and 5' 
      });
    }

    if (watchlistItem.rewatchCount < 0) {
      return res.status(400).json({ 
        message: 'Rewatch count cannot be negative' 
      });
    }

    const response = await mongodb
      .getDb()
      .collection('watchlist')
      .insertOne(watchlistItem);

    res.status(201).json({
      message: 'Movie added to watchlist successfully',
      id: response.insertedId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Use PUT to update a watchlist item
const updateWatchlistItem = async (req, res) => {
  try {
    const watchlistId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.user._id || req.user.id);

    // Check if item exists and belongs to user
    const existingItem = await mongodb
      .getDb()
      .collection('watchlist')
      .findOne({ _id: watchlistId, userId: userId });
      
      
    if (!existingItem) {
      return res.status(404).json({ 
        message: 'Watchlist item not found or does not belong to you' 
      });
    }

    const updateData = {};

    if (req.body.status) {
      const validStatuses = ['plan-to-watch', 'watching', 'completed'];
      if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({ 
          message: 'Status must be one of: plan-to-watch, watching, completed' 
        });
      }
      updateData.status = req.body.status;
    } 
    
    if (req.body.userRating !== undefined) {
      if (req.body.userRating !== null && 
          (req.body.userRating < 0 || req.body.userRating > 5)) {
        return res.status(400).json({ 
          message: 'User rating must be between 0 and 5' 
        });
      }
      updateData.userRating = req.body.userRating;
    }

    if (req.body.reviewText !== undefined) {
      updateData.reviewText = req.body.reviewText;
    }

    if (req.body.startedWatching) {
      updateData.startedWatching = new Date(req.body.startedWatching);
    }

    if (req.body.completedDate) {
      updateData.completedDate = new Date(req.body.completedDate);
    }

    if (req.body.rewatchCount !== undefined) {
      if (req.body.rewatchCount < 0) {
        return res.status(400).json({ 
          message: 'Rewatch count cannot be negative' 
        });
      }
      updateData.rewatchCount = req.body.rewatchCount;
    }

    const response = await mongodb
      .getDb()
      .collection('watchlist')
      .updateOne(
        { _id: watchlistId, userId: userId }, 
        { $set: updateData }
      );

    if (response.modifiedCount === 0) {
      return res
        .status(200)
        .json({ message: 'Watchlist item is already up to date' });
    }

    res.status(200).json({ message: 'Watchlist item updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE watchlist item
const deleteWatchlistItem = async (req, res) => {
  try {
    const watchlistId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.user._id || req.user.id);

    const response = await mongodb
      .getDb()
      .collection('watchlist')
      .deleteOne({ _id: watchlistId, userId: userId });

    if (response.deletedCount === 0) {
      res.status(404).json({ 
        message: 'Watchlist item not found or does not belong to you' 
      });
    } else {
      res.status(200).json({ message: 'Watchlist item removed successfully' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getUserWatchlist,
  getWatchlistItemById,
  addToWatchlist,
  updateWatchlistItem,
  deleteWatchlistItem,
};