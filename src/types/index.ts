export interface GameResult {
  id: string;
  player: string;
  betAmount: string;
  choice: 'heads' | 'tails';
  result: 'heads' | 'tails';
  won: boolean;
  payout: string;
  timestamp: number;
  txHash: string;
}

export interface PlayerStats {
  totalGames: number;
  totalWins: number;
  winRate: number;
  totalWagered: string;
  totalWon: string;
  netProfit: string;
}

export interface GameStats {
  totalGames: number;
  totalVolume: string;
  totalPayout: string;
  activeUsers: number;
}

export interface LeaderboardEntry {
  address: string;
  wins: number;
  totalWagered: string;
  netProfit: string;
  winRate: number;
}

export interface WalletState {
  address: string | null;
  balance: string;
  isConnecting: boolean;
  isConnected: boolean;
  chainId: number | null;
}

export interface GameState {
  isFlipping: boolean;
  lastResult: 'heads' | 'tails' | null;
  currentBet: {
    amount: string;
    choice: 'heads' | 'tails' | null;
  };
  isProcessing: boolean;
  showResult: boolean;
}

export interface SoundSettings {
  enabled: boolean;
  volume: number;
}

export interface AppSettings {
  sound: SoundSettings;
  autoRefresh: boolean;
  refreshInterval: number;
  showAnimations: boolean;
}

export type CoinSide = 'heads' | 'tails';
export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface Transaction {
  hash: string;
  status: TransactionStatus;
  type: 'flip' | 'approve' | 'other';
  timestamp: number;
}

export interface ContractAddresses {
  shardFlip: string;
  token: string;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: ContractAddresses;
}