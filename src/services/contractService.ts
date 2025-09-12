import { ethers } from 'ethers';
import { GameResult, PlayerStats, GameStats, LeaderboardEntry, CoinSide } from '../types';
import { CONTRACT_ABI, SHARDEUM_UNSTABLE } from '../utils/constants';
import { apiService } from './apiService';
import toast from 'react-hot-toast';

export class ContractService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  constructor(provider?: ethers.BrowserProvider, signer?: ethers.JsonRpcSigner) {
    if (provider && signer) {
      this.initialize(provider, signer);
    }
  }

  initialize(provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner) {
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(
      SHARDEUM_UNSTABLE.contracts.shardFlip,
      CONTRACT_ABI,
      signer
    );
  }

  isInitialized(): boolean {
    return this.contract !== null && this.signer !== null && this.provider !== null;
  }

  async flipCoin(amount: string, choice: CoinSide): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.isInitialized()) {
      return { success: false, error: 'Contract not initialized' };
    }

    try {
      const betAmount = ethers.parseEther(amount);
      const choiceBool = choice === 'heads'; // true for heads, false for tails

      // Check minimum bet amount
      const minBet = await this.contract!.MIN_BET();
      if (betAmount < minBet) {
        throw new Error(`Minimum bet is ${ethers.formatEther(minBet)} SHM`);
      }

      // Check maximum bet amount
      const maxBet = await this.contract!.MAX_BET();
      if (betAmount > maxBet) {
        throw new Error(`Maximum bet is ${ethers.formatEther(maxBet)} SHM`);
      }

      // Check contract balance for potential payout
      const contractBalance = await this.contract!.getContractBalance();
      const payoutMultiplier = await this.contract!.PAYOUT_MULTIPLIER();
      const potentialPayout = betAmount * payoutMultiplier / 100n;
      
      if (contractBalance < potentialPayout) {
        throw new Error('Contract has insufficient balance for this bet');
      }

      // Check if contract is paused
      const isPaused = await this.contract!.paused();
      if (isPaused) {
        throw new Error('Contract is currently paused');
      }

      let gasLimit;
      try {
        // Estimate gas with a more conservative approach
        const gasEstimate = await this.contract!.flipCoin.estimateGas(choiceBool, {
          value: betAmount
        });
        gasLimit = gasEstimate * 150n / 100n; // 50% buffer
      } catch (gasError) {
        console.warn('Gas estimation failed, using fallback:', gasError);
        gasLimit = 500000n; // Fallback gas limit
      }

      // Get current gas price
      const gasPrice = await this.provider!.getFeeData();
      
      const tx = await this.contract!.flipCoin(choiceBool, {
        value: betAmount,
        gasLimit: gasLimit,
        gasPrice: gasPrice.gasPrice
      });

      toast.success('Transaction sent! Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        toast.success('Coin flip completed!');
        
        // Get the game result from transaction receipt
        const gameResult = await this.parseGameResultFromReceipt(receipt);
        
        // Update backend with game result
        if (gameResult && this.signer) {
          try {
            const playerAddress = await this.signer.getAddress();
            await apiService.updateGameResult(
              playerAddress,
              gameResult.won ? 'win' : 'loss',
              parseFloat(ethers.formatEther(gameResult.betAmount)),
              gameResult.won ? parseFloat(ethers.formatEther(gameResult.payout)) : 0
            );
          } catch (backendError) {
            console.error('Failed to update backend with game result:', backendError);
          }
        }
        
        return { success: true, txHash: tx.hash };
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error: any) {
      console.error('Error flipping coin:', error);
      
      let errorMessage = 'Failed to flip coin';
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for bet + gas';
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = 'Cannot estimate gas - contract may be paused or have insufficient balance';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient SHM balance';
      } else if (error.message?.includes('Minimum bet')) {
        errorMessage = error.message;
      } else if (error.message?.includes('Maximum bet')) {
        errorMessage = error.message;
      } else if (error.message?.includes('insufficient balance')) {
        errorMessage = error.message;
      } else if (error.message?.includes('paused')) {
        errorMessage = error.message;
      } else if (error.code === -32603) {
        errorMessage = 'Network error - please try again';
      }

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async getPlayerStats(address: string): Promise<PlayerStats | null> {
    if (!this.isInitialized()) {
      console.error('Contract not initialized');
      return null;
    }

    try {
      const stats = await this.contract!.getPlayerStats(address);
      
      // The contract returns individual values
      const totalGames = Number(stats[0]);
      const totalWins = Number(stats[1]);
      const totalWagered = ethers.formatEther(stats[2]);
      const totalWon = ethers.formatEther(stats[3]);

      return {
        totalGames,
        totalWins,
        winRate: totalGames > 0 ? (totalWins / totalGames) * 100 : 0,
        totalWagered,
        totalWon,
        netProfit: (parseFloat(totalWon) - parseFloat(totalWagered)).toString()
      };

    } catch (error) {
      console.error('Error fetching player stats:', error);
      // Return default stats instead of null to prevent UI issues
      return {
        totalGames: 0,
        totalWins: 0,
        winRate: 0,
        totalWagered: '0',
        totalWon: '0',
        netProfit: '0'
      };
    }
  }

  async getRecentGames(limit: number = 50): Promise<GameResult[]> {
    if (!this.isInitialized()) {
      console.error('Contract not initialized');
      return [];
    }

    try {
      const games = await this.contract!.getRecentGames();
      
      return games.slice(0, limit).map((game: any, index: number) => ({
        id: `${game.player}-${game.timestamp}-${index}`,
        player: game.player,
        betAmount: ethers.formatEther(game.betAmount),
        choice: game.choice ? 'heads' : 'tails',
        result: game.result ? 'heads' : 'tails',
        won: game.won,
        payout: ethers.formatEther(game.payout),
        timestamp: Number(game.timestamp),
        txHash: '' // This would need to be tracked separately or obtained from events
      }));

    } catch (error) {
      console.error('Error fetching recent games:', error);
      return [];
    }
  }

  async getGameStats(): Promise<GameStats | null> {
    if (!this.isInitialized()) {
      console.error('Contract not initialized');
      return null;
    }

    try {
      const stats = await this.contract!.getGameStats();
      
      // The new contract returns individual values, not a struct
      return {
        totalGames: Number(stats[0]),
        totalVolume: ethers.formatEther(stats[1]),
        totalPayout: ethers.formatEther(stats[2]),
        activeUsers: Number(stats[3])
      };

    } catch (error) {
      console.error('Error fetching game stats:', error);
      return null;
    }
  }

  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    if (!this.isInitialized()) {
      console.error('Contract not initialized');
      return [];
    }

    try {
      const [players, wins, wagered] = await this.contract!.getTopPlayers(limit);
      
      return players.map((player: string, index: number) => ({
        address: player,
        wins: Number(wins[index]),
        totalWagered: ethers.formatEther(wagered[index]),
        netProfit: '0', // Would need additional calculation
        winRate: 0 // Would need total games to calculate
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  async waitForTransaction(txHash: string): Promise<boolean> {
    if (!this.provider) return false;

    try {
      const receipt = await this.provider.waitForTransaction(txHash, 1, 30000); // 30 second timeout
      return receipt ? receipt.status === 1 : false;
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      return false;
    }
  }

  // Utility method to parse game events (for real-time updates)
  async parseGameEvents(fromBlock: number = 0): Promise<GameResult[]> {
    if (!this.contract || !this.provider) return [];

    try {
      // This would parse GamePlayed events from the contract
      // Implementation depends on the actual contract events
      const filter = this.contract.filters.GamePlayed();
      const events = await this.contract.queryFilter(filter, fromBlock);
      
      return events.map((event: any) => {
        const args = event.args;
        return {
          id: `${args.player}-${args.timestamp}`,
          player: args.player,
          betAmount: ethers.formatEther(args.betAmount),
          choice: args.choice ? 'heads' : 'tails',
          result: args.result ? 'heads' : 'tails',
          won: args.won,
          payout: ethers.formatEther(args.payout),
          timestamp: Number(args.timestamp),
          txHash: event.transactionHash
        };
      });

    } catch (error) {
      console.error('Error parsing game events:', error);
      return [];
    }
  }

  // Listen for real-time game events
  setupEventListeners(onGamePlayed?: (game: GameResult) => void): () => void {
    if (!this.contract) {
      return () => {};
    }

    const handleGamePlayed = (player: string, betAmount: bigint, choice: boolean, result: boolean, won: boolean, payout: bigint, timestamp: bigint) => {
      const game: GameResult = {
        id: `${player}-${timestamp}`,
        player,
        betAmount: ethers.formatEther(betAmount),
        choice: choice ? 'heads' : 'tails',
        result: result ? 'heads' : 'tails',
        won,
        payout: ethers.formatEther(payout),
        timestamp: Number(timestamp),
        txHash: '' // Would be available in the event context
      };

      if (onGamePlayed) {
        onGamePlayed(game);
      }
    };

    try {
      this.contract.on('GamePlayed', handleGamePlayed);
      
      return () => {
        if (this.contract) {
          this.contract.off('GamePlayed', handleGamePlayed);
        }
      };
    } catch (error) {
      console.error('Error setting up event listeners:', error);
      return () => {};
    }
  }

  disconnect() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
    this.contract = null;
    this.provider = null;
    this.signer = null;
  }

  // Helper method to parse game result from transaction receipt
  private async parseGameResultFromReceipt(receipt: any): Promise<{ won: boolean; betAmount: bigint; payout: bigint } | null> {
    if (!this.contract) return null;

    try {
      // Look for GamePlayed events in the receipt
      const gamePlayedFilter = this.contract.filters.GamePlayed();
      const logs = receipt.logs;
      
      for (const log of logs) {
        try {
          const parsedLog = this.contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'GamePlayed') {
            return {
              won: parsedLog.args.won,
              betAmount: parsedLog.args.betAmount,
              payout: parsedLog.args.payout
            };
          }
        } catch (e) {
          // Skip logs that don't match our contract interface
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing game result from receipt:', error);
      return null;
    }
  }
}

// Singleton instance
export const contractService = new ContractService();