import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameData } from '../hooks/useGameData';
import { LeaderboardEntry } from '../types';

type SortBy = 'wins' | 'totalWagered' | 'netProfit' | 'winRate';

const Leaderboard: React.FC = () => {
  const { leaderboard, isLoading } = useGameData();
  const [sortBy, setSortBy] = useState<SortBy>('wins');

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num: number | string, decimals = 2) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    return value.toFixed(decimals);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-yellow-400">🥇</span>;
      case 2:
        return <span className="text-gray-300">🥈</span>;
      case 3:
        return <span className="text-orange-400">🥉</span>;
      default:
        return <span className="text-gray-400">#{rank}</span>;
    }
  };

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    switch (sortBy) {
      case 'wins':
        return b.wins - a.wins;
      case 'totalWagered':
        return parseFloat(b.totalWagered) - parseFloat(a.totalWagered);
      case 'netProfit':
        return parseFloat(b.netProfit) - parseFloat(a.netProfit);
      case 'winRate':
        return b.winRate - a.winRate;
      default:
        return 0;
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
          <div className="w-8 h-8 bg-gradient-to-r from-neon-yellow to-neon-orange rounded-lg flex items-center justify-center">
            <span className="text-lg">🏆</span>
          </div>
          <h2 className="text-2xl font-gaming font-bold text-gradient">Leaderboard</h2>
        </div>

        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 glass-dark rounded-lg">
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              </div>
              <div className="flex-1 animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-16"></div>
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
          <div className="w-8 h-8 bg-gradient-to-r from-neon-yellow to-neon-orange rounded-lg flex items-center justify-center">
            <span className="text-lg">🏆</span>
          </div>
          <h2 className="text-2xl font-gaming font-bold text-gradient">Leaderboard</h2>
        </div>

        {/* Sort Options */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="bg-gaming-light border border-white/20 rounded-lg px-3 py-1 text-sm text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
        >
          <option value="wins">Most Wins</option>
          <option value="totalWagered">Highest Volume</option>
          <option value="netProfit">Biggest Profit</option>
          <option value="winRate">Best Win Rate</option>
        </select>
      </div>

      {sortedLeaderboard.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-neon-yellow to-neon-orange rounded-full flex items-center justify-center opacity-50">
            <span className="text-2xl">🏆</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Leaders Yet</h3>
          <p className="text-gray-400">Be the first to make it to the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedLeaderboard.map((player, index) => (
            <motion.div
              key={player.address}
              className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
                index < 3
                  ? 'glass-dark border-neon-yellow/30 bg-neon-yellow/5'
                  : 'glass-dark border-white/10'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-10 h-10 text-lg font-bold">
                {getRankIcon(index + 1)}
              </div>

              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {player.address.slice(2, 4).toUpperCase()}
                </span>
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">
                    {formatAddress(player.address)}
                  </span>
                  {index < 3 && (
                    <span className="px-2 py-1 text-xs bg-neon-yellow/20 text-neon-yellow rounded-full">
                      Top {index + 1}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  {player.wins} wins • {formatNumber(player.winRate)}% win rate
                </div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="font-bold text-white">
                  {sortBy === 'wins' && `${player.wins} wins`}
                  {sortBy === 'totalWagered' && `${formatNumber(player.totalWagered)} SHM`}
                  {sortBy === 'netProfit' && `${parseFloat(player.netProfit) >= 0 ? '+' : ''}${formatNumber(player.netProfit)} SHM`}
                  {sortBy === 'winRate' && `${formatNumber(player.winRate)}%`}
                </div>
                <div className="text-xs text-gray-400">
                  {sortBy === 'wins' && `${formatNumber(player.totalWagered)} SHM wagered`}
                  {sortBy === 'totalWagered' && `${player.wins} wins`}
                  {sortBy === 'netProfit' && `${formatNumber(player.totalWagered)} SHM wagered`}
                  {sortBy === 'winRate' && `${player.wins} wins`}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Leaderboard;