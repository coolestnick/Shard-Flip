# 🚀 ShardFlip Simple Contract Deployment

This guide will help you deploy the simplified ShardFlip contract to Remic network.

## ✅ What's Different in the Simple Version

The simple contract has **no external dependencies** and includes:
- ✅ All core game functionality (coin flip betting)
- ✅ Player statistics and game history
- ✅ Admin controls (pause, withdraw, funding)
- ✅ Built-in security (reentrancy guard, access control)
- ✅ Complete event logging
- ❌ No OpenZeppelin dependencies (all security implemented manually)

## 🛠️ Prerequisites

1. **Node.js** (v16+) and **npm**
2. **Private key** of your deployer account with funds
3. **Remic RPC URL** and network details

## 📦 Installation & Setup

1. **Navigate to contracts folder:**
```bash
cd contracts
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` file:
```env
PRIVATE_KEY=your_actual_private_key_here
REMIC_RPC_URL=https://your-remic-rpc-url
```

4. **Update Remic network configuration** in `hardhat.config.js`:
```javascript
remic: {
  url: process.env.REMIC_RPC_URL,
  accounts: [process.env.PRIVATE_KEY],
  chainId: YOUR_REMIC_CHAIN_ID, // Update this
  gas: 2100000,
  gasPrice: 8000000000
}
```

## 🧪 Testing (Optional but Recommended)

Test the contract locally:
```bash
npm run test:simple
```

This will run comprehensive tests covering:
- Basic betting functionality
- Win/loss scenarios  
- Statistics tracking
- Admin functions
- Edge cases

## 🚀 Deployment to Remic

1. **Compile the contract:**
```bash
npm run compile
```

2. **Deploy to Remic:**
```bash
npm run deploy:remic
```

The deployment script will:
- ✅ Deploy the ShardFlip contract
- ✅ Add initial funding (1 ETH/token)
- ✅ Display all contract information
- ✅ Generate ABI for frontend integration
- ✅ Test basic contract functions
- ✅ Save deployment info to `deployments/` folder

## 📋 Expected Output

After successful deployment, you'll see:

```
🚀 Starting ShardFlip Simple deployment...

📋 Deployment Details:
├─ Deploying with account: 0x1234...5678
├─ Account balance: 10.0 ETH
├─ Network: remic
└─ Chain ID: 1234

✅ ShardFlip deployed successfully!
├─ Contract Address: 0xAbCdEf1234567890...
├─ Transaction Hash: 0x789...abc
└─ Block Number: 12345

💰 Adding initial funding to contract...
✅ Initial funding added: 1.0 ETH

📊 Contract Information:
├─ MIN_BET: 0.01 ETH
├─ MAX_BET: 10.0 ETH  
├─ PAYOUT_MULTIPLIER: 2x
├─ Owner: 0x1234...5678
├─ Paused: false
└─ Contract Balance: 1.0 ETH

📝 Update your frontend constants.ts file:
contracts: {
  shardFlip: '0xAbCdEf1234567890...',
  token: '0x0000000000000000000000000000000000000000'
}

🎉 Deployment completed successfully!
Ready to start flipping coins! 🪙
```

## 🔧 Frontend Integration

After deployment, update your frontend:

### 1. Update Contract Address
In `src/utils/constants.ts`:
```typescript
export const SHARDEUM_UNSTABLE: NetworkConfig = {
  // ... other config
  contracts: {
    shardFlip: 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE',
    token: '0x0000000000000000000000000000000000000000'
  }
};
```

### 2. Update Network Configuration
Make sure the frontend network config matches Remic:
```typescript
export const REMIC_NETWORK: NetworkConfig = {
  chainId: YOUR_REMIC_CHAIN_ID,
  name: 'Remic Network',
  rpcUrl: 'https://your-remic-rpc-url',
  explorerUrl: 'https://your-remic-explorer-url',
  currency: {
    name: 'Remic',
    symbol: 'RMC', // or whatever Remic's native token is
    decimals: 18
  },
  contracts: {
    shardFlip: 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE',
    token: '0x0000000000000000000000000000000000000000'
  }
};
```

### 3. Contract ABI
The ABI is automatically generated and saved in `deployments/remic-deployment.json`. The key functions are:

- `flipCoin(bool choice)` - Main betting function
- `getPlayerStats(address player)` - Get player statistics
- `getRecentGames()` - Get recent game history
- `getGameStats()` - Get global statistics

## 💰 Post-Deployment Setup

1. **Fund the Contract** (important!):
```bash
# The deployment script adds 1 ETH, but you may want more
# Send funds directly to the contract address or use:
# shardFlip.depositFunds({value: ethers.utils.parseEther("5")})
```

2. **Test a Coin Flip**:
```bash
# In Hardhat console or frontend:
# shardFlip.flipCoin(true, {value: ethers.utils.parseEther("0.1")})
```

3. **Verify Contract** (if Remic supports it):
```bash
npx hardhat verify --network remic CONTRACT_ADDRESS
```

## 🔍 Troubleshooting

### Common Issues:

1. **"Insufficient funds for gas"**
   - Ensure your deployer account has enough native tokens
   - Check gas price settings in hardhat.config.js

2. **"Network not found"**
   - Verify Remic RPC URL is correct
   - Check chainId matches Remic's actual chain ID

3. **"Contract deployment failed"**
   - Check if contract size is within limits
   - Verify Solidity version compatibility with Remic

4. **"Transaction underpriced"**
   - Increase gasPrice in network configuration

### Contract Issues:

1. **"Insufficient contract balance for potential payout"**
   - The contract needs at least 2x the bet amount in balance
   - Add more funds: `shardFlip.depositFunds({value: amount})`

2. **Games not working**
   - Ensure contract is not paused: `shardFlip.paused()`
   - Check minimum bet amount: `shardFlip.MIN_BET()`

## 📊 Contract Management

### Admin Functions (Owner Only):
```solidity
shardFlip.setPaused(true/false)        // Pause/unpause
shardFlip.depositFunds()               // Add more funds  
shardFlip.withdrawFunds(amount)        // Withdraw specific amount
shardFlip.emergencyWithdraw()          // Withdraw all funds
shardFlip.transferOwnership(newOwner)  // Transfer ownership
```

### Monitoring:
```solidity
shardFlip.getContractBalance()         // Check contract balance
shardFlip.getTotalGames()              // Total games played
shardFlip.totalActiveUsers()           // Number of unique players
shardFlip.getGameStats()               // Global statistics
```

## 🎮 Ready to Play!

Once deployed and integrated:
1. Players can connect their wallets
2. Choose bet amount (0.01 - 10 tokens)
3. Pick heads or tails
4. Flip and win 2x their bet!

The contract is fully functional and ready for production use! 🪙✨

---

**Need help?** Check the test files for usage examples or review the contract source code for detailed function documentation.