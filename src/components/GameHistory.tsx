import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameData } from '../hooks/useGameData';
import { GameResult } from '../types';
import { SHARDEUM_UNSTABLE } from '../utils/constants';

const GameHistory: React.FC = () => {
  const { recentGames, isLoading } = useGameData();
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatNumber = (num: string, decimals = 4) => {
    return parseFloat(num).toFixed(decimals);
  };

  const filteredGames = recentGames.filter(game => {
    switch (filter) {
      case 'wins':
        return game.won;
      case 'losses':
        return !game.won;
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <motion.div
        className="glass rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-gaming font-bold text-gradient">Recent Games</h2>
        </div>

        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 glass-dark rounded-lg animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-700 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="glass rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-gaming font-bold text-gradient">Recent Games</h2>
        </div>

        {/* Filter Options */}
        <div className="flex space-x-2">
          {(['all', 'wins', 'losses'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === filterType
                  ? 'bg-neon-blue text-white'
                  : 'bg-gaming-light text-gray-400 hover:text-white'
              }`}
            >
              {filterType === 'all' ? 'All' : filterType === 'wins' ? 'Wins' : 'Losses'}
            </button>
          ))}
        </div>
      </div>

      {filteredGames.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-neon-green to-neon-blue rounded-full flex items-center justify-center opacity-50">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Games Found</h3>
          <p className="text-gray-400">
            {filter === 'all' ? 'No games have been played yet.' : `No ${filter} found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  game.won
                    ? 'glass-dark border-neon-green/30 hover:border-neon-green/50'
                    : 'glass-dark border-red-500/30 hover:border-red-500/50'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Player Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {game.player.slice(2, 4).toUpperCase()}
                      </span>
                    </div>

                    {/* Game Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-white">
                          {formatAddress(game.player)}
                        </span>
                        <span className="text-sm text-gray-400">bet</span>
                        <span className="font-medium text-neon-blue">
                          {formatNumber(game.betAmount)} SHM
                        </span>
                        <span className="text-sm text-gray-400">on</span>
                        <span className={`font-medium ${
                          game.choice === 'heads' ? 'text-yellow-400' : 'text-gray-300'
                        }`}>
                          {game.choice === 'heads' ? '👑 Heads' : '⚡ Tails'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-400">Result:</span>
                        <span className={`font-medium ${
                          game.result === 'heads' ? 'text-yellow-400' : 'text-gray-300'
                        }`}>
                          {game.result === 'heads' ? '👑' : '⚡'} {game.result}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className={`font-medium ${game.won ? 'text-neon-green' : 'text-red-400'}`}>
                          {game.won ? `Won ${formatNumber(game.payout)} SHM` : 'Lost'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${game.won ? 'text-neon-green' : 'text-red-400'}`}>
                      {game.won ? '+' : '-'}{formatNumber(game.won ? game.payout : game.betAmount)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTime(game.timestamp)}
                    </div>
                  </div>
                </div>

                {/* Transaction Link */}
                {game.txHash && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <a
                      href={`${SHARDEUM_UNSTABLE.explorerUrl}/tx/${game.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm text-neon-blue hover:text-neon-blue/80 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>View Transaction</span>
                    </a>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default GameHistory;