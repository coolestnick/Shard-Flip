import { useState, useEffect, useCallback } from 'react';
import { GameResult, PlayerStats, GameStats, LeaderboardEntry } from '../types';
import { contractService } from '../services/contractService';
import { apiService } from '../services/apiService';
import { useWeb3 } from '../contexts/Web3Context';
import { REFRESH_INTERVAL } from '../utils/constants';

export const useGameData = () => {
  const { wallet, provider, signer } = useWeb3();
  const [recentGames, setRecentGames] = useState<GameResult[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initialize contract service when web3 is ready
  useEffect(() => {
    if (provider && signer) {
      contractService.initialize(provider, signer);
    }
  }, [provider, signer]);

  const fetchRecentGames = useCallback(async () => {
    try {
      const games = await contractService.getRecentGames(50);
      setRecentGames(games);
    } catch (error) {
      console.error('Error fetching recent games:', error);
    }
  }, []);

  const fetchPlayerStats = useCallback(async () => {
    if (!wallet.address) {
      setPlayerStats(null);
      return;
    }

    try {
      const stats = await contractService.getPlayerStats(wallet.address);
      setPlayerStats(stats);
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }
  }, [wallet.address]);

  const fetchGameStats = useCallback(async () => {
    try {
      const stats = await contractService.getGameStats();
      setGameStats(stats);
    } catch (error) {
      console.error('Error fetching game stats:', error);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const board = await contractService.getLeaderboard(10);
      setLeaderboard(board);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }, []);

  const refreshAllData = useCallback(async (showLoading: boolean = true) => {
    if (!contractService.isInitialized()) return;

    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchRecentGames(),
        fetchPlayerStats(),
        fetchGameStats(),
        fetchLeaderboard()
      ]);
      setLastUpdate(new Date());
    } catch (error: any) {
      setError(error.message || 'Failed to fetch data');
      console.error('Error refreshing data:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [fetchRecentGames, fetchPlayerStats, fetchGameStats, fetchLeaderboard]);

  // Initial data fetch
  useEffect(() => {
    if (contractService.isInitialized()) {
      refreshAllData();
    }
  }, [refreshAllData]);

  // Auto-refresh data (background refresh without loading indicators)
  useEffect(() => {
    if (!contractService.isInitialized()) return;

    const interval = setInterval(() => {
      refreshAllData(false); // Silent refresh without loading spinner
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [refreshAllData]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!contractService.isInitialized()) return;

    const cleanup = contractService.setupEventListeners((newGame) => {
      setRecentGames(prev => [newGame, ...prev.slice(0, 49)]);
      
      // Refresh stats when new game is played
      if (wallet.address) {
        fetchPlayerStats();
        fetchGameStats();
      }
    });

    return cleanup;
  }, [wallet.address, fetchPlayerStats, fetchGameStats]);

  return {
    recentGames,
    playerStats,
    gameStats,
    leaderboard,
    isLoading,
    error,
    lastUpdate,
    refreshData: refreshAllData,
    refreshPlayerStats: fetchPlayerStats
  };
};

export const useGameActions = () => {
  const { wallet, provider, signer, refreshBalance } = useWeb3();
  const [isFlipping, setIsFlipping] = useState(false);
  const [lastResult, setLastResult] = useState<'heads' | 'tails' | null>(null);

  // Initialize contract service when web3 is ready
  useEffect(() => {
    if (provider && signer) {
      console.log('🔗 Initializing contract service for game actions...');
      contractService.initialize(provider, signer);
    }
  }, [provider, signer]);

  const flipCoin = useCallback(async (amount: string, choice: 'heads' | 'tails') => {
    if (!contractService.isInitialized()) {
      throw new Error('Contract not initialized');
    }

    if (!wallet.isConnected || !wallet.address) {
      throw new Error('Wallet not connected');
    }

    setIsFlipping(true);

    try {
      console.log('🎮 Attempting to flip coin with:', { amount, choice, wallet: wallet.address });
      const result = await contractService.flipCoin(amount, choice);
      console.log('🎯 Contract service result:', result);

      if (result.success) {
        // Wait for transaction confirmation and get result
        if (result.txHash) {
          try {
            const confirmed = await contractService.waitForTransaction(result.txHash);
            if (confirmed) {
              // The actual result would come from contract events
              // For now, we'll simulate it (in real implementation, parse from events)
              const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
              setLastResult(coinResult);

              // Update backend after successful flip
              try {
                const betAmountNum = parseFloat(amount);
                const won = coinResult === choice;

                await apiService.updateGameResult(
                  wallet.address!,
                  won ? 'win' : 'loss',
                  betAmountNum,
                  won ? betAmountNum * 2 : 0
                );
              } catch (apiError) {
                console.error('Failed to update backend:', apiError);
              }
            }
          } catch (waitError) {
            console.error('Error waiting for transaction:', waitError);
          }
        }

        // Refresh balance after successful transaction
        try {
          await refreshBalance();
        } catch (refreshError) {
          console.error('Error refreshing balance:', refreshError);
        }

        return result;
      } else {
        console.error('❌ Contract service returned failure:', result.error);
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Error in flipCoin:', error);
      throw error;
    } finally {
      setIsFlipping(false);
    }
  }, [wallet.isConnected, wallet.address, refreshBalance]);

  const forceResetFlipping = useCallback(() => {
    console.log('🔄 Force resetting flipping state...');
    setIsFlipping(false);
    setLastResult(null);
  }, []);

  return {
    flipCoin,
    isFlipping,
    lastResult,
    clearLastResult: () => setLastResult(null),
    forceResetFlipping
  };
};

// Hook for managing sound effects
export const useSounds = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('soundEnabled');
    return stored ? JSON.parse(stored) : true;
  });

  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem('soundVolume');
    return stored ? parseFloat(stored) : 0.5;
  });

  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('soundVolume', volume.toString());
  }, [volume]);

  const playSound = useCallback((soundName: string) => {
    if (!soundEnabled) return;

    try {
      const audio = new Audio(`/sounds/${soundName}.mp3`);
      audio.volume = volume;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [soundEnabled, volume]);

  return {
    soundEnabled,
    setSoundEnabled,
    volume,
    setVolume,
    playSound
  };
};

// Hook for managing app settings
export const useSettings = () => {
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem('gameSettings');
    return stored ? JSON.parse(stored) : {
      sound: { enabled: true, volume: 0.5 },
      autoRefresh: true,
      refreshInterval: REFRESH_INTERVAL,
      showAnimations: true
    };
  });

  useEffect(() => {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<typeof settings>) => {
    setSettings((prev: any) => ({ ...prev, ...updates }));
  }, []);

  return {
    settings,
    updateSettings
  };
};