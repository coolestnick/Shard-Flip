const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Cache configuration for performance optimization
const cache = new NodeCache({
  stdTTL: 30, // 30 seconds default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Better performance, but be careful with object mutations
  maxKeys: 1000 // Limit cache size
});

// Cache keys
const CACHE_KEYS = {
  STATS: 'global_stats',
  LEADERBOARD: (type, limit) => `leaderboard_${type}_${limit}`,
  USER: (wallet) => `user_${wallet.toLowerCase()}`,
  USER_COUNT: 'user_counts'
};

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 API calls per windowMs
  message: { success: false, message: 'Too many API requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 game actions per minute
  message: { success: false, message: 'Too many game requests, please wait before trying again' },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || [
    'http://localhost:3000',
    'https://shard-flip.vercel.app',
    'https://shard-flip-three.vercel.app'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use(generalLimiter);
app.use('/api', apiLimiter);

// MongoDB Connection with optimized settings
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,        // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false,  // Disable mongoose buffering
  maxIdleTimeMS: 30000,   // Close connections after 30 seconds of inactivity
  family: 4               // Use IPv4, skip trying IPv6
})
.then(() => console.log('MongoDB connected successfully with connection pooling'))
.catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  hasPlayedGame: {
    type: Boolean,
    default: false
  },
  totalGamesPlayed: {
    type: Number,
    default: 0
  },
  totalWins: {
    type: Number,
    default: 0
  },
  totalLosses: {
    type: Number,
    default: 0
  },
  totalAmountWagered: {
    type: Number,
    default: 0
  },
  totalAmountWon: {
    type: Number,
    default: 0
  },
  lastGameResult: {
    type: String,
    enum: ['win', 'loss', null],
    default: null
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for performance
userSchema.index({ walletAddress: 1 }, { unique: true }); // Unique index on wallet address
userSchema.index({ hasPlayedGame: 1 }); // Index for filtering active players
userSchema.index({ totalWins: -1 }); // Index for leaderboard queries (descending)
userSchema.index({ totalAmountWon: -1 }); // Index for winnings leaderboard (descending)
userSchema.index({ totalGamesPlayed: -1 }); // Index for games leaderboard (descending)
userSchema.index({ lastUpdated: -1 }); // Index for recent activity

const User = mongoose.model('User', userSchema, 'shard-game');

// Cache helper functions
const invalidateUserCache = (walletAddress) => {
  const userKey = CACHE_KEYS.USER(walletAddress);
  cache.del([userKey, CACHE_KEYS.STATS, CACHE_KEYS.USER_COUNT]);
  // Invalidate all leaderboard caches
  ['wins', 'games', 'winnings'].forEach(type => {
    [10, 20, 50].forEach(limit => {
      cache.del(CACHE_KEYS.LEADERBOARD(type, limit));
    });
  });
};

const getCachedData = (key, fallbackFn, ttl = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Try to get from cache first
      const cached = cache.get(key);
      if (cached !== undefined) {
        return resolve(cached);
      }

      // If not in cache, fetch from database
      const data = await fallbackFn();

      // Store in cache with TTL
      if (ttl) {
        cache.set(key, data, ttl);
      } else {
        cache.set(key, data);
      }

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};

// Middleware to validate secret key for POST routes
const validateSecretKey = (req, res, next) => {
  const secretKey = req.headers['x-api-key'] || req.body.apiKey;
  
  if (!secretKey || secretKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Invalid API key' 
    });
  }
  
  next();
};

// POST Routes (Protected with secret key)

// Register wallet
app.post('/api/register-wallet', strictLimiter, validateSecretKey, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wallet address is required' 
      });
    }

    // Check if user already exists
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (user) {
      return res.json({ 
        success: true, 
        message: 'Wallet already registered',
        user: {
          walletAddress: user.walletAddress,
          hasPlayedGame: user.hasPlayedGame,
          totalGamesPlayed: user.totalGamesPlayed,
          registeredAt: user.registeredAt
        }
      });
    }

    // Create new user
    user = new User({
      walletAddress: walletAddress.toLowerCase()
    });

    await user.save();

    res.status(201).json({ 
      success: true, 
      message: 'Wallet registered successfully',
      user: {
        walletAddress: user.walletAddress,
        hasPlayedGame: user.hasPlayedGame,
        totalGamesPlayed: user.totalGamesPlayed,
        registeredAt: user.registeredAt
      }
    });

  } catch (error) {
    console.error('Error registering wallet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Update game result - OPTIMIZED FOR SPEED
app.post('/api/update-game', strictLimiter, validateSecretKey, async (req, res) => {
  try {
    const { walletAddress, gameResult, amountWagered, amountWon } = req.body;

    // Fast validation
    if (!walletAddress || !gameResult || typeof amountWagered !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: walletAddress, gameResult, amountWagered'
      });
    }

    if (!['win', 'loss'].includes(gameResult)) {
      return res.status(400).json({
        success: false,
        message: 'gameResult must be either "win" or "loss"'
      });
    }

    const lowerWalletAddress = walletAddress.toLowerCase();

    // Use atomic update operation for better performance and concurrency
    const updateData = {
      $set: {
        hasPlayedGame: true,
        lastGameResult: gameResult,
        lastUpdated: new Date()
      },
      $inc: {
        totalGamesPlayed: 1,
        totalAmountWagered: amountWagered,
        ...(gameResult === 'win' ? {
          totalWins: 1,
          totalAmountWon: (amountWon || amountWagered * 2)
        } : {
          totalLosses: 1
        })
      }
    };

    // Use findOneAndUpdate for atomic operation - much faster than find + save
    const updatedUser = await User.findOneAndUpdate(
      { walletAddress: lowerWalletAddress },
      updateData,
      {
        new: true, // Return updated document
        upsert: false, // Don't create if not exists
        select: 'walletAddress hasPlayedGame totalGamesPlayed totalWins totalLosses lastGameResult' // Only return needed fields
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found. Please register first.'
      });
    }

    // Invalidate caches for this user and global data
    invalidateUserCache(lowerWalletAddress);

    // Send response immediately
    res.json({
      success: true,
      message: 'Game result updated successfully',
      user: {
        walletAddress: updatedUser.walletAddress,
        hasPlayedGame: updatedUser.hasPlayedGame,
        totalGamesPlayed: updatedUser.totalGamesPlayed,
        totalWins: updatedUser.totalWins,
        totalLosses: updatedUser.totalLosses,
        lastGameResult: updatedUser.lastGameResult
      }
    });

  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET Routes (Public)

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = 'registeredAt', order = 'desc' } = req.query;
    
    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;
    
    const users = await User.find({})
      .select('-__v')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments();
    
    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasMore: skip + users.length < total
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get user by wallet address - CACHED
app.get('/api/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const lowerWalletAddress = walletAddress.toLowerCase();
    const cacheKey = CACHE_KEYS.USER(lowerWalletAddress);

    const user = await getCachedData(cacheKey, async () => {
      return await User.findOne({
        walletAddress: lowerWalletAddress
      }).select('-__v').lean(); // .lean() for better performance
    }, 60); // Cache for 60 seconds

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get leaderboard - CACHED
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { type = 'wins', limit = 20 } = req.query;
    const cacheKey = CACHE_KEYS.LEADERBOARD(type, limit);

    const leaderboardData = await getCachedData(cacheKey, async () => {
      let sortField;
      switch(type) {
        case 'wins':
          sortField = 'totalWins';
          break;
        case 'games':
          sortField = 'totalGamesPlayed';
          break;
        case 'winnings':
          sortField = 'totalAmountWon';
          break;
        default:
          sortField = 'totalWins';
      }

      const users = await User.find({ hasPlayedGame: true })
        .select('walletAddress totalWins totalLosses totalGamesPlayed totalAmountWon totalAmountWagered registeredAt')
        .sort({ [sortField]: -1, registeredAt: 1 })
        .limit(parseInt(limit))
        .lean(); // .lean() for better performance

      // Add win rate calculation
      const leaderboard = users.map((user, index) => ({
        rank: index + 1,
        walletAddress: user.walletAddress,
        totalWins: user.totalWins,
        totalLosses: user.totalLosses,
        totalGamesPlayed: user.totalGamesPlayed,
        winRate: user.totalGamesPlayed > 0 ? ((user.totalWins / user.totalGamesPlayed) * 100).toFixed(1) : '0.0',
        totalAmountWon: user.totalAmountWon,
        totalAmountWagered: user.totalAmountWagered,
        netProfit: user.totalAmountWon - user.totalAmountWagered,
        registeredAt: user.registeredAt
      }));

      return {
        leaderboard,
        totalPlayers: users.length,
        type
      };
    }, 45); // Cache for 45 seconds

    res.json({
      success: true,
      data: leaderboardData.leaderboard,
      meta: {
        type: leaderboardData.type,
        totalPlayers: leaderboardData.totalPlayers
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get statistics - HEAVILY CACHED
app.get('/api/stats', async (req, res) => {
  try {
    const statsData = await getCachedData(CACHE_KEYS.STATS, async () => {
      // Use Promise.all for parallel execution
      const [totalUsers, totalPlayers, aggregateStats] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ hasPlayedGame: true }),
        User.aggregate([
          { $match: { hasPlayedGame: true } },
          {
            $group: {
              _id: null,
              totalGames: { $sum: '$totalGamesPlayed' },
              totalWins: { $sum: '$totalWins' },
              totalLosses: { $sum: '$totalLosses' },
              totalAmountWagered: { $sum: '$totalAmountWagered' },
              totalAmountWon: { $sum: '$totalAmountWon' }
            }
          }
        ])
      ]);

      const stats = aggregateStats[0] || {
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        totalAmountWagered: 0,
        totalAmountWon: 0
      };

      return {
        totalRegisteredUsers: totalUsers,
        totalActivePlayers: totalPlayers,
        totalGamesPlayed: stats.totalGames,
        totalWins: stats.totalWins,
        totalLosses: stats.totalLosses,
        overallWinRate: stats.totalGames > 0 ? ((stats.totalWins / stats.totalGames) * 100).toFixed(1) : '0.0',
        totalAmountWagered: stats.totalAmountWagered,
        totalAmountWon: stats.totalAmountWon,
        houseEdge: stats.totalAmountWagered > 0 ? (((stats.totalAmountWagered - stats.totalAmountWon) / stats.totalAmountWagered) * 100).toFixed(2) : '0.00'
      };
    }, 30); // Cache for 30 seconds

    res.json({
      success: true,
      data: statsData
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Health check
app.get('/api/health', (_, res) => {
  res.json({ 
    success: true, 
    message: 'Shard Flip API is running',
    timestamp: new Date().toISOString()
  });
});

// Admin endpoint to reset user (temporary - for development)
app.post('/api/admin/reset-user', strictLimiter, validateSecretKey, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wallet address is required' 
      });
    }

    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Reset user to initial state
    user.hasPlayedGame = false;
    user.totalGamesPlayed = 0;
    user.totalWins = 0;
    user.totalLosses = 0;
    user.totalAmountWagered = 0;
    user.totalAmountWon = 0;
    user.lastGameResult = null;
    user.lastUpdated = new Date();

    await user.save();

    res.json({ 
      success: true, 
      message: 'User reset successfully',
      user: {
        walletAddress: user.walletAddress,
        hasPlayedGame: user.hasPlayedGame,
        totalGamesPlayed: user.totalGamesPlayed
      }
    });

  } catch (error) {
    console.error('Error resetting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// 404 handler
app.use('*', (_, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handler
app.use((err, _, res, __) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Shard Flip API server running on port ${PORT}`);
});

module.exports = app;