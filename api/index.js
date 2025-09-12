const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'https://shard-flip.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
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

const User = mongoose.model('User', userSchema);

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
app.post('/api/register-wallet', validateSecretKey, async (req, res) => {
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

// Update game result
app.post('/api/update-game', validateSecretKey, async (req, res) => {
  try {
    const { walletAddress, gameResult, amountWagered, amountWon } = req.body;
    
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

    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wallet not found. Please register first.' 
      });
    }

    // Update user stats
    user.hasPlayedGame = true;
    user.totalGamesPlayed += 1;
    user.totalAmountWagered += amountWagered;
    user.lastGameResult = gameResult;
    user.lastUpdated = new Date();

    if (gameResult === 'win') {
      user.totalWins += 1;
      user.totalAmountWon += (amountWon || amountWagered * 2);
    } else {
      user.totalLosses += 1;
    }

    await user.save();

    res.json({ 
      success: true, 
      message: 'Game result updated successfully',
      user: {
        walletAddress: user.walletAddress,
        hasPlayedGame: user.hasPlayedGame,
        totalGamesPlayed: user.totalGamesPlayed,
        totalWins: user.totalWins,
        totalLosses: user.totalLosses,
        lastGameResult: user.lastGameResult
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

// Get user by wallet address
app.get('/api/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const user = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    }).select('-__v');
    
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

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { type = 'wins', limit = 20 } = req.query;
    
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
      .limit(parseInt(limit));
    
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

    res.json({
      success: true,
      data: leaderboard,
      meta: {
        type,
        totalPlayers: users.length
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

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPlayers = await User.countDocuments({ hasPlayedGame: true });
    
    const aggregateStats = await User.aggregate([
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
    ]);

    const stats = aggregateStats[0] || {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalAmountWagered: 0,
      totalAmountWon: 0
    };

    res.json({
      success: true,
      data: {
        totalRegisteredUsers: totalUsers,
        totalActivePlayers: totalPlayers,
        totalGamesPlayed: stats.totalGames,
        totalWins: stats.totalWins,
        totalLosses: stats.totalLosses,
        overallWinRate: stats.totalGames > 0 ? ((stats.totalWins / stats.totalGames) * 100).toFixed(1) : '0.0',
        totalAmountWagered: stats.totalAmountWagered,
        totalAmountWon: stats.totalAmountWon,
        houseEdge: stats.totalAmountWagered > 0 ? (((stats.totalAmountWagered - stats.totalAmountWon) / stats.totalAmountWagered) * 100).toFixed(2) : '0.00'
      }
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
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Shard Flip API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
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