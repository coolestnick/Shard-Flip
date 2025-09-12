import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameData } from '../hooks/useGameData';
import { LeaderboardEntry } from '../types';
import { apiService, LeaderboardEntry as ApiLeaderboardEntry } from '../services/apiService';

type SortBy = 'wins' | 'games' | 'winnings';

const Leaderboard: React.FC = () => {
  const { leaderboard, isLoading } = useGameData();
  const [sortBy, setSortBy] = useState<SortBy>('wins');
  const [backendLeaderboard, setBackendLeaderboard] = useState<ApiLeaderboardEntry[]>([]);
  const [loadingBackend, setLoadingBackend] = useState(true);
  const [useBackendData, setUseBackendData] = useState(true);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num: number | string, decimals = 2) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    return value.toFixed(decimals);
  };

  // Fetch backend leaderboard data
  useEffect(() => {
    const fetchBackendLeaderboard = async () => {
      setLoadingBackend(true);
      try {
        const result = await apiService.getLeaderboard(sortBy, 20);
        if (result.success && result.data) {
          setBackendLeaderboard(result.data);
        } else {
          console.warn('Failed to fetch backend leaderboard:', result.error);
          setUseBackendData(false);
        }
      } catch (error) {
        console.error('Error fetching backend leaderboard:', error);
        setUseBackendData(false);
      } finally {
        setLoadingBackend(false);
      }
    };

    fetchBackendLeaderboard();
  }, [sortBy]);

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

  // Use backend data if available, otherwise fallback to contract data
  const displayLeaderboard = useBackendData && !loadingBackend ? backendLeaderboard : leaderboard;
  const displayLoading = useBackendData ? loadingBackend : isLoading;

  if (displayLoading) {
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
        <div className="flex items-center space-x-4">
          {useBackendData && (
            <span className="text-xs text-neon-green">● Live Data</span>
          )}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="bg-gaming-light border border-white/20 rounded-lg px-3 py-1 text-sm text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
          >
            <option value="wins">Most Wins</option>
            <option value="games">Most Games</option>
            <option value="winnings">Highest Winnings</option>
          </select>
        </div>
      </div>

      {displayLeaderboard.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-neon-yellow to-neon-orange rounded-full flex items-center justify-center opacity-50">
            <span className="text-2xl">🏆</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Leaders Yet</h3>
          <p className="text-gray-400">Be the first to make it to the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayLeaderboard.map((player, index) => {
            // Handle both backend API data and contract data
            const isBackendData = 'walletAddress' in player;
            const address = isBackendData ? player.walletAddress : player.address;
            const wins = isBackendData ? player.totalWins : player.wins;
            const totalWagered = isBackendData ? player.totalAmountWagered : parseFloat(player.totalWagered || '0');
            const netProfit = isBackendData ? player.netProfit : parseFloat(player.netProfit || '0');
            const winRate = isBackendData ? parseFloat(player.winRate) : player.winRate;
            const totalGames = isBackendData ? player.totalGamesPlayed : (player as any).totalGames || 0;
            const totalWon = isBackendData ? player.totalAmountWon : 0;

            return (
              <motion.div
                key={address}
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
                  {getRankIcon(isBackendData ? player.rank : index + 1)}
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {address.slice(2, 4).toUpperCase()}
                  </span>
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">
                      {formatAddress(address)}
                    </span>
                    {index < 3 && (
                      <span className="px-2 py-1 text-xs bg-neon-yellow/20 text-neon-yellow rounded-full">
                        Top {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {wins} wins • {formatNumber(winRate)}% win rate
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="font-bold text-white">
                    {sortBy === 'wins' && `${wins} wins`}
                    {sortBy === 'games' && `${totalGames} games`}
                    {sortBy === 'winnings' && `${formatNumber(totalWon)} SHM`}
                  </div>
                  <div className="text-xs text-gray-400">
                    {sortBy === 'wins' && `${formatNumber(totalWagered)} SHM wagered`}
                    {sortBy === 'games' && `${wins} wins`}
                    {sortBy === 'winnings' && `${formatNumber(totalWagered)} SHM wagered`}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default Leaderboard;