# 🪙 ShardFlip Smart Contract

A decentralized coin flip betting game smart contract built for the Remic blockchain.

## 📋 Overview

The ShardFlip contract allows players to bet cryptocurrency on a coin flip outcome with a 2x payout for correct guesses. The contract features:

- **Fair Gaming**: 0% house edge with 50/50 odds
- **Secure**: Uses OpenZeppelin security standards
- **Transparent**: All game results are stored on-chain
- **Statistics**: Comprehensive player and global statistics
- **Admin Controls**: Pausable, funding management, emergency controls

## 🏗️ Contract Features

### Core Functions
- `flipCoin(bool choice)`: Main betting function
- `getPlayerStats(address player)`: Get player statistics
- `getRecentGames()`: Get last 50 games
- `getGameStats()`: Get global statistics
- `getPlayerGames(address player, uint256 limit)`: Get games by player

### Admin Functions (Owner Only)
- `depositFunds()`: Add funds to contract
- `withdrawFunds(uint256 amount)`: Withdraw specific amount
- `emergencyWithdraw()`: Withdraw all funds
- `pause()` / `unpause()`: Pause/resume contract

### Game Parameters
- **Minimum Bet**: 0.01 ETH/SHM
- **Maximum Bet**: 10 ETH/SHM
- **Payout Multiplier**: 2x
- **House Edge**: 0%

## 🚀 Deployment Instructions

### Prerequisites
1. Install dependencies:
```bash
cd contracts
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your private key and RPC URL
```

### Deploy to Remic

1. **Compile the contract:**
```bash
npm run compile
```

2. **Run tests:**
```bash
npm test
```

3. **Deploy to Remic:**
```bash
npm run deploy:remic
```

The deployment script will:
- Deploy the ShardFlip contract
- Add initial funding (1 ETH/SHM)
- Display contract information
- Generate ABI and deployment data
- Save deployment info to `deployments/` folder

### Manual Deployment Steps

If you prefer manual deployment:

1. **Set up Hardhat config** with Remic network details
2. **Deploy with funding:**
```solidity
ShardFlip shardFlip = new ShardFlip();
shardFlip.depositFunds{value: 1 ether}();
```

3. **Verify contract** (if Remic supports verification)

## 📊 Contract Information

After deployment, you'll get:
- **Contract Address**: The deployed contract address
- **ABI**: JSON interface for frontend integration
- **Bytecode**: Contract bytecode
- **Transaction Hash**: Deployment transaction

## 🔧 Frontend Integration

Update your frontend constants with the deployment information:

```typescript
// src/utils/constants.ts
export const SHARDEUM_UNSTABLE: NetworkConfig = {
  // ... other config
  contracts: {
    shardFlip: 'YOUR_DEPLOYED_CONTRACT_ADDRESS',
    token: '0x0000000000000000000000000000000000000000' // Native token
  }
};

export const CONTRACT_ABI = [
  // Paste the generated ABI here
];
```

## 🧪 Testing

The contract includes comprehensive tests covering:

- Basic betting functionality
- Win/loss scenarios
- Statistical tracking
- Admin functions
- Edge cases and security

Run tests:
```bash
npm test
```

## 🔒 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Pausable**: Can be paused in emergencies
- **Ownable**: Admin functions restricted to owner
- **SafeMath**: Overflow protection (though less needed in Solidity 0.8+)

## 💰 Economics

The contract is designed with:
- **0% House Edge**: Fair 50/50 game
- **2x Payout**: Winners receive double their bet
- **Minimum Viability**: Requires funding for payouts

### Funding Requirements
For sustainable operation, the contract should maintain:
- At least 2x the maximum bet amount
- Ideally 10-20x max bet for multiple concurrent games

## 🔄 Game Flow

1. **Player places bet** with `flipCoin(choice)`
2. **Contract generates result** (pseudo-random)
3. **Payout processed** if player wins
4. **Statistics updated** for player and global stats
5. **Event emitted** for frontend updates

## 📈 Randomness

**⚠️ Important**: The current implementation uses pseudo-randomness which is NOT cryptographically secure. For production use, integrate with:

- **Chainlink VRF** (if available on Remic)
- **Commit-Reveal scheme**
- **External entropy sources**

## 🛠️ Maintenance

### Regular Tasks
- Monitor contract balance
- Ensure adequate funding for payouts
- Monitor for unusual activity

### Emergency Procedures
- `pause()`: Stop all betting
- `emergencyWithdraw()`: Recover all funds
- Upgrade to new contract if needed

## 📝 Events

The contract emits events for:
- `GamePlayed`: Every game result
- `FundsDeposited`: When funds are added
- `FundsWithdrawn`: When funds are withdrawn
- `EmergencyWithdraw`: Emergency fund recovery

## 🔍 Verification

If Remic supports contract verification:
```bash
npx hardhat verify --network remic <CONTRACT_ADDRESS>
```

## 📚 Dependencies

- OpenZeppelin Contracts v4.9.3
- Hardhat development environment
- Ethers.js for deployment

## 🤝 Support

For issues or questions:
1. Check the test files for usage examples
2. Review OpenZeppelin documentation
3. Test on local network first
4. Ensure adequate funding before mainnet deployment

## ⚠️ Disclaimers

- Test thoroughly before mainnet deployment
- Gambling regulations may apply in your jurisdiction
- Smart contracts are immutable once deployed
- Ensure you understand all functions before deployment
- The contract owner has significant control powers

---

**Ready to deploy and start the coin flipping fun!** 🪙✨