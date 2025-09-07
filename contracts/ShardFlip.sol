// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title ShardFlip
 * @dev A decentralized coin flip betting game on Shardeum
 * Players can bet SHM tokens and win 2x their bet amount
 */
contract ShardFlip is ReentrancyGuard, Pausable, Ownable {
    using SafeMath for uint256;

    // Structs
    struct GameResult {
        address player;
        uint256 betAmount;
        bool choice;        // true for heads, false for tails
        bool result;        // true for heads, false for tails
        bool won;
        uint256 payout;
        uint256 timestamp;
        bytes32 requestId;  // For VRF if implemented
    }

    struct PlayerStats {
        uint256 totalGames;
        uint256 totalWins;
        uint256 totalWagered;
        uint256 totalWon;
        uint256 lastPlayedTimestamp;
    }

    struct GameStats {
        uint256 totalGames;
        uint256 totalVolume;
        uint256 totalPayout;
        uint256 activeUsers;
    }

    // Constants
    uint256 public constant MIN_BET = 0.01 ether;  // 0.01 SHM
    uint256 public constant MAX_BET = 10 ether;    // 10 SHM
    uint256 public constant HOUSE_EDGE = 0;        // 0% house edge (50/50 fair game)
    uint256 public constant PAYOUT_MULTIPLIER = 2; // 2x payout for wins

    // State variables
    mapping(address => PlayerStats) public playerStats;
    mapping(address => bool) public hasPlayed;
    
    GameResult[] public gameHistory;
    uint256 public totalActiveUsers;
    uint256 public contractBalance;
    
    // Events
    event GamePlayed(
        address indexed player,
        uint256 betAmount,
        bool choice,
        bool result,
        bool won,
        uint256 payout,
        uint256 timestamp
    );
    
    event FundsDeposited(address indexed depositor, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event EmergencyWithdraw(address indexed owner, uint256 amount);

    // Modifiers
    modifier validBetAmount() {
        require(msg.value >= MIN_BET, "Bet amount too low");
        require(msg.value <= MAX_BET, "Bet amount too high");
        _;
    }

    modifier hasSufficientBalance(uint256 betAmount) {
        uint256 potentialPayout = betAmount.mul(PAYOUT_MULTIPLIER);
        require(address(this).balance >= potentialPayout, "Insufficient contract balance");
        _;
    }

    constructor() {
        contractBalance = 0;
    }

    /**
     * @dev Deposit funds to the contract (owner only)
     */
    function depositFunds() external payable onlyOwner {
        contractBalance = contractBalance.add(msg.value);
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Main game function - flip the coin
     * @param choice true for heads, false for tails
     */
    function flipCoin(bool choice) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        validBetAmount 
        hasSufficientBalance(msg.value) 
    {
        uint256 betAmount = msg.value;
        
        // Generate pseudo-random result (Note: Not cryptographically secure)
        // In production, use Chainlink VRF or similar oracle for true randomness
        bool result = _generateRandomResult();
        
        bool won = (choice == result);
        uint256 payout = 0;

        if (won) {
            payout = betAmount.mul(PAYOUT_MULTIPLIER);
            // Transfer winnings to player
            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Payout transfer failed");
        }

        // Update player stats
        _updatePlayerStats(msg.sender, betAmount, won, payout);
        
        // Track if this is a new player
        if (!hasPlayed[msg.sender]) {
            hasPlayed[msg.sender] = true;
            totalActiveUsers = totalActiveUsers.add(1);
        }

        // Store game result
        GameResult memory game = GameResult({
            player: msg.sender,
            betAmount: betAmount,
            choice: choice,
            result: result,
            won: won,
            payout: payout,
            timestamp: block.timestamp,
            requestId: bytes32(0) // Placeholder for VRF
        });

        gameHistory.push(game);

        // Update contract balance
        if (won) {
            contractBalance = contractBalance.sub(payout.sub(betAmount));
        } else {
            contractBalance = contractBalance.add(betAmount);
        }

        emit GamePlayed(msg.sender, betAmount, choice, result, won, payout, block.timestamp);
    }

    /**
     * @dev Generate pseudo-random result (NOT SECURE - for demo only)
     * In production, use Chainlink VRF for true randomness
     */
    function _generateRandomResult() private view returns (bool) {
        uint256 randomHash = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.difficulty,
                    msg.sender,
                    blockhash(block.number - 1)
                )
            )
        );
        return randomHash % 2 == 0;
    }

    /**
     * @dev Update player statistics
     */
    function _updatePlayerStats(
        address player, 
        uint256 betAmount, 
        bool won, 
        uint256 payout
    ) private {
        PlayerStats storage stats = playerStats[player];
        
        stats.totalGames = stats.totalGames.add(1);
        stats.totalWagered = stats.totalWagered.add(betAmount);
        stats.lastPlayedTimestamp = block.timestamp;
        
        if (won) {
            stats.totalWins = stats.totalWins.add(1);
            stats.totalWon = stats.totalWon.add(payout);
        }
    }

    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    /**
     * @dev Get recent games (last 50)
     */
    function getRecentGames() external view returns (GameResult[] memory) {
        uint256 totalGames = gameHistory.length;
        uint256 returnCount = totalGames > 50 ? 50 : totalGames;
        
        GameResult[] memory recentGames = new GameResult[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            recentGames[i] = gameHistory[totalGames - 1 - i];
        }
        
        return recentGames;
    }

    /**
     * @dev Get global game statistics
     */
    function getGameStats() external view returns (GameStats memory) {
        uint256 totalVolume = 0;
        uint256 totalPayout = 0;
        
        for (uint256 i = 0; i < gameHistory.length; i++) {
            totalVolume = totalVolume.add(gameHistory[i].betAmount);
            totalPayout = totalPayout.add(gameHistory[i].payout);
        }
        
        return GameStats({
            totalGames: gameHistory.length,
            totalVolume: totalVolume,
            totalPayout: totalPayout,
            activeUsers: totalActiveUsers
        });
    }

    /**
     * @dev Get games by player
     */
    function getPlayerGames(address player, uint256 limit) external view returns (GameResult[] memory) {
        uint256 count = 0;
        
        // First pass: count player games
        for (uint256 i = 0; i < gameHistory.length; i++) {
            if (gameHistory[i].player == player) {
                count++;
            }
        }
        
        uint256 returnCount = count > limit ? limit : count;
        GameResult[] memory playerGames = new GameResult[](returnCount);
        
        // Second pass: collect most recent games
        uint256 collected = 0;
        for (uint256 i = gameHistory.length; i > 0 && collected < returnCount; i--) {
            if (gameHistory[i - 1].player == player) {
                playerGames[collected] = gameHistory[i - 1];
                collected++;
            }
        }
        
        return playerGames;
    }

    /**
     * @dev Get leaderboard data
     */
    function getLeaderboardData(uint256 limit) external view returns (
        address[] memory players,
        uint256[] memory wins,
        uint256[] memory totalWagered,
        uint256[] memory winRates
    ) {
        // This is a simplified implementation
        // In production, you'd want to implement proper sorting and pagination
        
        uint256 returnCount = totalActiveUsers > limit ? limit : totalActiveUsers;
        
        players = new address[](returnCount);
        wins = new uint256[](returnCount);
        totalWagered = new uint256[](returnCount);
        winRates = new uint256[](returnCount);
        
        // This is a basic implementation - you'd want to sort by wins or other criteria
        uint256 collected = 0;
        for (uint256 i = 0; i < gameHistory.length && collected < returnCount; i++) {
            address player = gameHistory[i].player;
            bool alreadyIncluded = false;
            
            // Check if player already included
            for (uint256 j = 0; j < collected; j++) {
                if (players[j] == player) {
                    alreadyIncluded = true;
                    break;
                }
            }
            
            if (!alreadyIncluded) {
                PlayerStats memory stats = playerStats[player];
                players[collected] = player;
                wins[collected] = stats.totalWins;
                totalWagered[collected] = stats.totalWagered;
                winRates[collected] = stats.totalGames > 0 ? 
                    stats.totalWins.mul(10000).div(stats.totalGames) : 0; // Win rate in basis points
                collected++;
            }
        }
        
        return (players, wins, totalWagered, winRates);
    }

    /**
     * @dev Emergency withdraw function (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Emergency withdraw failed");
        
        contractBalance = 0;
        emit EmergencyWithdraw(owner(), balance);
    }

    /**
     * @dev Withdraw specific amount (owner only)
     */
    function withdrawFunds(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        require(amount <= contractBalance, "Amount exceeds available funds");
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdraw failed");
        
        contractBalance = contractBalance.sub(amount);
        emit FundsWithdrawn(owner(), amount);
    }

    /**
     * @dev Pause/unpause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get total number of games
     */
    function getTotalGames() external view returns (uint256) {
        return gameHistory.length;
    }

    /**
     * @dev Get game by index
     */
    function getGameByIndex(uint256 index) external view returns (GameResult memory) {
        require(index < gameHistory.length, "Game index out of bounds");
        return gameHistory[index];
    }

    /**
     * @dev Check if player has played before
     */
    function hasPlayerPlayed(address player) external view returns (bool) {
        return hasPlayed[player];
    }

    // Receive function to accept SHM deposits
    receive() external payable {
        contractBalance = contractBalance.add(msg.value);
        emit FundsDeposited(msg.sender, msg.value);
    }

    // Fallback function
    fallback() external payable {
        contractBalance = contractBalance.add(msg.value);
        emit FundsDeposited(msg.sender, msg.value);
    }
}