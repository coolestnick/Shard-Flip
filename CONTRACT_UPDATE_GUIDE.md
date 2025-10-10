# Smart Contract Update Guide - Bet Tier System

## Overview
The smart contract has been updated to use a fixed bet tier system instead of allowing any bet amount within a range.

## Changes Made

### 1. Smart Contract (contracts/ShardFlipSimple.sol)
- **Removed**: MIN_BET and MAX_BET constants
- **Added**: Bet tier array with 4 fixed amounts: 1000, 1500, 2000, 3000 SHM
- **Updated**: `validBetAmount` modifier to validate against allowed tiers only
- **Added**: `getAllowedBets()` view function to retrieve allowed bet amounts

#### Key Contract Changes:
```solidity
// Old
uint256 public constant MIN_BET = 0.01 ether;
uint256 public constant MAX_BET = 10 ether;

// New
uint256[4] public allowedBets = [
    1000 ether,  // 1000 SHM
    1500 ether,  // 1500 SHM
    2000 ether,  // 2000 SHM
    3000 ether   // 3000 SHM
];
```

### 2. Frontend Constants (src/utils/constants.ts)
- **Updated**: DEFAULT_BET_AMOUNTS from ['0.01', '0.1', '0.5', '1'] to ['1000', '1500', '2000', '3000']
- **Added**: New ABI entries for `getAllowedBets()` and `allowedBets` array accessor

### 3. Contract Service (src/services/contractService.ts)
- **Updated**: Validation logic to check against allowed bet tiers
- **Removed**: MIN_BET and MAX_BET contract calls
- **Added**: Client-side validation for bet amounts

### 4. Game UI (src/components/GameInterface.tsx)
- **Updated**: Default bet amount from '0.1' to '1000'
- **Updated**: Placeholder text from '0.1' to '1000'
- **Updated**: Game Info section to show "Allowed Bets: 1000, 1500, 2000, 3000 SHM"
- **Updated**: Preset bet buttons to show new amounts

## Deployment Steps

### Step 1: Deploy the Updated Contract
1. Open [Remix IDE](https://remix.ethereum.org/)
2. Create a new file `ShardFlip.sol` and paste the updated contract code from `contracts/ShardFlipSimple.sol`
3. Compile the contract (Solidity 0.8.0+)
4. Connect to **Shardeum EVM Testnet** via MetaMask
   - Network: Shardeum EVM Testnet
   - Chain ID: 8119
   - RPC URL: https://api-mezame.shardeum.org
5. Deploy the contract
6. **IMPORTANT**: Copy the new contract address

### Step 2: Fund the Contract
The contract needs sufficient SHM to cover potential payouts:
- Minimum recommended: **10,000 SHM** (to handle multiple max bets)
- For 3000 SHM bet: Contract needs 6000 SHM for payout
- Use the deposit-funds.html utility or direct MetaMask transfer

### Step 3: Update Frontend Configuration
Update the contract address in `src/utils/constants.ts`:
```typescript
export const SHARDEUM_TESTNET: NetworkConfig = {
  // ... other config
  contracts: {
    shardFlip: 'YOUR_NEW_CONTRACT_ADDRESS', // Update this!
    token: '0x0000000000000000000000000000000000000000'
  }
};
```

### Step 4: Test Locally
```bash
# Terminal 1 - Backend
cd api
npm start

# Terminal 2 - Frontend
npm start
```

Test all bet tiers:
- ✅ 1000 SHM bet works
- ✅ 1500 SHM bet works
- ✅ 2000 SHM bet works
- ✅ 3000 SHM bet works
- ❌ Any other amount (e.g., 500, 2500) should fail with validation error

### Step 5: Deploy to Production
```bash
# Push changes to git
git add .
git commit -m "Update bet tier system to 1000/1500/2000/3000 SHM"
git push

# Vercel will auto-deploy both frontend and backend
```

### Step 6: Update Backend Environment Variables
In Vercel dashboard for backend API:
- Set `FRONTEND_URL` to include your frontend domains
- Redeploy if needed

## Bet Tier Details

| Tier | Bet Amount | Win Amount | Required Contract Balance |
|------|------------|------------|---------------------------|
| 1    | 1000 SHM   | 2000 SHM   | 2000 SHM                  |
| 2    | 1500 SHM   | 3000 SHM   | 3000 SHM                  |
| 3    | 2000 SHM   | 4000 SHM   | 4000 SHM                  |
| 4    | 3000 SHM   | 6000 SHM   | 6000 SHM                  |

## Testing Checklist
- [ ] Contract deployed to Shardeum EVM Testnet
- [ ] Contract funded with at least 10,000 SHM
- [ ] Frontend updated with new contract address
- [ ] Local testing completed for all bet tiers
- [ ] Invalid bet amounts properly rejected
- [ ] UI shows correct bet options
- [ ] Game Info section displays correct allowed bets
- [ ] Win calculations show 2x payout correctly
- [ ] Backend API handles new bet amounts
- [ ] Production deployment successful
- [ ] CORS configured for deployed frontend

## Rollback Plan
If issues arise, you can revert to the previous contract:
```typescript
// In src/utils/constants.ts
shardFlip: '0x798C6537cC8B924167B1250772eC4191D9668cb4' // Previous contract
```
And revert the frontend changes via git:
```bash
git revert HEAD
git push
```

## Notes
- The payout multiplier remains 2x
- The contract validates bet amounts on-chain
- Frontend also validates for better UX
- Contract owner can withdraw funds at any time
- Emergency withdraw function available for owner
