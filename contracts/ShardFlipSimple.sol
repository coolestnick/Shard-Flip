// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ShardFlip
 * @dev A simple decentralized coin flip betting game
 * Players can bet native tokens and win 2x their bet amount
 */
contract ShardFlip {
    
    // Owner of the contract
    address public owner;
    
    // Contract state
    bool public paused = false;
    uint256 public contractBalance;
    uint256 public totalActiveUsers;
    
    // Game constants
    uint256 public constant PAYOUT_MULTIPLIER = 2;

    // Allowed bet tiers in SHM (wei)
    uint256[4] public allowedBets = [
        1000 ether,  // 1000 SHM
        1500 ether,  // 1500 SHM
        2000 ether,  // 2000 SHM
        3000 ether   // 3000 SHM
    ];
    
    // Structs
    struct GameResult {
        address player;
        uint256 betAmount;
        bool choice;        // true for heads, false for tails
        bool result;        // true for heads, false for tails
        bool won;
        uint256 payout;
        uint256 timestamp;
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
    
    // Mappings
    mapping(address => PlayerStats) public playerStats;
    mapping(address => bool) public hasPlayed;
    
    // Game history
    GameResult[] public gameHistory;
    
    // Reentrancy guard
    bool private locked;
    
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
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier notPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier validBetAmount() {
        bool isValidBet = false;
        for (uint256 i = 0; i < allowedBets.length; i++) {
            if (msg.value == allowedBets[i]) {
                isValidBet = true;
                break;
            }
        }
        require(isValidBet, "Invalid bet amount. Use 1000, 1500, 2000, or 3000 SHM");
        _;
    }
    
    modifier hasSufficientBalance() {
        uint256 potentialPayout = msg.value * PAYOUT_MULTIPLIER;
        require(address(this).balance >= potentialPayout, "Insufficient contract balance for potential payout");
        _;
    }
    
    modifier noReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
        contractBalance = 0;
        totalActiveUsers = 0;
    }
    
    /**
     * @dev Transfer ownership of the contract
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    /**
     * @dev Pause or unpause the contract
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }
    
    /**
     * @dev Deposit funds to the contract (anyone can fund)
     */
    function depositFunds() external payable {
        require(msg.value > 0, "Must send some funds");
        contractBalance += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Main game function - flip the coin
     */
    function flipCoin(bool choice) 
        external 
        payable 
        noReentrant 
        notPaused 
        validBetAmount 
        hasSufficientBalance 
    {
        uint256 betAmount = msg.value;
        
        // Generate pseudo-random result
        bool result = generateRandomResult();
        bool won = (choice == result);
        uint256 payout = 0;

        if (won) {
            payout = betAmount * PAYOUT_MULTIPLIER;
            // Transfer winnings to player
            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Payout transfer failed");
            contractBalance -= (payout - betAmount);
        } else {
            contractBalance += betAmount;
        }

        // Update player stats
        updatePlayerStats(msg.sender, betAmount, won, payout);
        
        // Track new players
        if (!hasPlayed[msg.sender]) {
            hasPlayed[msg.sender] = true;
            totalActiveUsers++;
        }

        // Store game result
        gameHistory.push(GameResult({
            player: msg.sender,
            betAmount: betAmount,
            choice: choice,
            result: result,
            won: won,
            payout: payout,
            timestamp: block.timestamp
        }));

        emit GamePlayed(msg.sender, betAmount, choice, result, won, payout, block.timestamp);
    }
    
    /**
     * @dev Generate pseudo-random result
     * NOTE: This is NOT cryptographically secure randomness
     * For production use, integrate with Chainlink VRF or similar
     */
    function generateRandomResult() private view returns (bool) {
        uint256 randomHash = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            blockhash(block.number - 1),
            address(this).balance
        )));
        return randomHash % 2 == 0;
    }
    
    /**
     * @dev Update player statistics
     */
    function updatePlayerStats(address player, uint256 betAmount, bool won, uint256 payout) private {
        PlayerStats storage stats = playerStats[player];
        
        stats.totalGames++;
        stats.totalWagered += betAmount;
        stats.lastPlayedTimestamp = block.timestamp;
        
        if (won) {
            stats.totalWins++;
            stats.totalWon += payout;
        }
    }
    
    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address player) external view returns (
        uint256 totalGames,
        uint256 totalWins,
        uint256 totalWagered,
        uint256 totalWon,
        uint256 lastPlayedTimestamp
    ) {
        PlayerStats memory stats = playerStats[player];
        return (
            stats.totalGames,
            stats.totalWins,
            stats.totalWagered,
            stats.totalWon,
            stats.lastPlayedTimestamp
        );
    }
    
    /**
     * @dev Get recent games (up to last 50)
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
    function getGameStats() external view returns (
        uint256 totalGames,
        uint256 totalVolume,
        uint256 totalPayout,
        uint256 activeUsers
    ) {
        uint256 totalVolume_ = 0;
        uint256 totalPayout_ = 0;
        
        for (uint256 i = 0; i < gameHistory.length; i++) {
            totalVolume_ += gameHistory[i].betAmount;
            totalPayout_ += gameHistory[i].payout;
        }
        
        return (
            gameHistory.length,
            totalVolume_,
            totalPayout_,
            totalActiveUsers
        );
    }
    
    /**
     * @dev Get games by specific player
     */
    function getPlayerGames(address player, uint256 limit) external view returns (GameResult[] memory) {
        // Count player games first
        uint256 count = 0;
        for (uint256 i = 0; i < gameHistory.length; i++) {
            if (gameHistory[i].player == player) {
                count++;
            }
        }
        
        uint256 returnCount = count > limit ? limit : count;
        GameResult[] memory playerGames = new GameResult[](returnCount);
        
        // Collect most recent games
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
     * @dev Get total number of games played
     */
    function getTotalGames() external view returns (uint256) {
        return gameHistory.length;
    }
    
    /**
     * @dev Get game by index
     */
    function getGameByIndex(uint256 index) external view returns (
        address player,
        uint256 betAmount,
        bool choice,
        bool result,
        bool won,
        uint256 payout,
        uint256 timestamp
    ) {
        require(index < gameHistory.length, "Game index out of bounds");
        GameResult memory game = gameHistory[index];
        return (
            game.player,
            game.betAmount,
            game.choice,
            game.result,
            game.won,
            game.payout,
            game.timestamp
        );
    }
    
    /**
     * @dev Check if address has played before
     */
    function hasPlayerPlayed(address player) external view returns (bool) {
        return hasPlayed[player];
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get allowed bet amounts
     */
    function getAllowedBets() external view returns (uint256[4] memory) {
        return allowedBets;
    }
    
    /**
     * @dev Withdraw funds (owner only)
     */
    function withdrawFunds(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= address(this).balance, "Insufficient contract balance");
        require(amount <= contractBalance, "Amount exceeds tracked balance");
        
        contractBalance -= amount;
        
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Withdraw failed");
        
        emit FundsWithdrawn(owner, amount);
    }
    
    /**
     * @dev Emergency withdraw all funds (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        contractBalance = 0;
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Emergency withdraw failed");
        
        emit FundsWithdrawn(owner, balance);
    }
    
    /**
     * @dev Get basic leaderboard data (simplified)
     */
    function getTopPlayers(uint256 limit) external view returns (
        address[] memory players,
        uint256[] memory wins,
        uint256[] memory wagered
    ) {
        uint256 returnCount = totalActiveUsers > limit ? limit : totalActiveUsers;
        
        players = new address[](returnCount);
        wins = new uint256[](returnCount);
        wagered = new uint256[](returnCount);
        
        uint256 collected = 0;
        
        // Simple implementation - just return first N unique players
        for (uint256 i = 0; i < gameHistory.length && collected < returnCount; i++) {
            address player = gameHistory[i].player;
            bool alreadyIncluded = false;
            
            // Check if already included
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
                wagered[collected] = stats.totalWagered;
                collected++;
            }
        }
        
        return (players, wins, wagered);
    }
    
    // Receive function to accept direct transfers
    receive() external payable {
        contractBalance += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    // Fallback function
    fallback() external payable {
        contractBalance += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }
}