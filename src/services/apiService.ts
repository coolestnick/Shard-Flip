const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://shard-flip-9nvm.vercel.app/api';
const API_SECRET_KEY = process.env.REACT_APP_API_SECRET_KEY;

// Debug environment variables
console.log('🔧 API Service Config:', {
  baseUrl: API_BASE_URL,
  hasApiKey: !!API_SECRET_KEY,
  envApiUrl: process.env.REACT_APP_API_URL,
  envHasKey: !!process.env.REACT_APP_API_SECRET_KEY
});

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface User {
  walletAddress: string;
  hasPlayedGame: boolean;
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalAmountWagered: number;
  totalAmountWon: number;
  lastGameResult: 'win' | 'loss' | null;
  registeredAt: string;
  lastUpdated: string;
}

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  totalWins: number;
  totalLosses: number;
  totalGamesPlayed: number;
  winRate: string;
  totalAmountWon: number;
  totalAmountWagered: number;
  netProfit: number;
  registeredAt: string;
}

interface PlatformStats {
  totalRegisteredUsers: number;
  totalActivePlayers: number;
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  overallWinRate: string;
  totalAmountWagered: number;
  totalAmountWon: number;
  houseEdge: string;
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log('🔗 API Request:', options.method || 'GET', url);
      
      const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add API key for POST requests
      if (options.method === 'POST' && API_SECRET_KEY) {
        defaultHeaders['x-api-key'] = API_SECRET_KEY;
        console.log('🔑 API key added to request');
      } else if (options.method === 'POST') {
        console.warn('⚠️ No API key found for POST request!');
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // POST Routes (Protected)
  async registerWallet(walletAddress: string): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/register-wallet', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async updateGameResult(
    walletAddress: string,
    gameResult: 'win' | 'loss',
    amountWagered: number,
    amountWon?: number
  ): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/update-game', {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        gameResult,
        amountWagered,
        amountWon,
      }),
    });
  }

  // GET Routes (Public)
  async getUser(walletAddress: string): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(`/user/${walletAddress}`);
  }

  async getLeaderboard(
    type: 'wins' | 'games' | 'winnings' = 'wins',
    limit: number = 20
  ): Promise<ApiResponse<LeaderboardEntry[]>> {
    return this.makeRequest<LeaderboardEntry[]>(
      `/leaderboard?type=${type}&limit=${limit}`
    );
  }

  async getPlatformStats(): Promise<ApiResponse<PlatformStats>> {
    return this.makeRequest<PlatformStats>('/stats');
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 50,
    sortBy: string = 'registeredAt',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<ApiResponse<{
    data: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      hasMore: boolean;
    };
  }>> {
    return this.makeRequest(
      `/users?page=${page}&limit=${limit}&sortBy=${sortBy}&order=${order}`
    );
  }

  async healthCheck(): Promise<ApiResponse<{ message: string; timestamp: string }>> {
    return this.makeRequest('/health');
  }
}

export const apiService = new ApiService();
export type { User, LeaderboardEntry, PlatformStats, ApiResponse };