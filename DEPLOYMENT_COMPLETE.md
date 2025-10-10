# Shard Flip - Bet Tier System Update Complete ✅

## Contract Deployment Summary

**Contract Address**: `0x7de88096d0AaAB4C9323C0cDFD21ff2Eec64EeC0`
**Network**: Shardeum EVM Testnet (Chain ID: 8119)
**Deployment Date**: 2025-10-10

## Updated Bet Tier System

The contract now uses **fixed bet tiers** instead of a min/max range:

| Tier | Amount | Win Amount | Required Contract Balance |
|------|--------|------------|---------------------------|
| 1    | 1,000 SHM  | 2,000 SHM  | 2,000 SHM |
| 2    | 1,500 SHM  | 3,000 SHM  | 3,000 SHM |
| 3    | 2,000 SHM  | 4,000 SHM  | 4,000 SHM |
| 4    | 3,000 SHM  | 6,000 SHM  | 6,000 SHM |

## Configuration Applied

### ✅ Smart Contract (ShardFlipSimple.sol)
- Removed: `MIN_BET` and `MAX_BET` constants
- Added: `allowedBets` array with 4 fixed amounts
- Updated: `validBetAmount` modifier to enforce tier validation
- Added: `getAllowedBets()` view function

### ✅ Frontend Configuration (constants.ts)
- Updated contract address to: `0x7de88096d0AaAB4C9323C0cDFD21ff2Eec64EeC0`
- Updated DEFAULT_BET_AMOUNTS: `['1000', '1500', '2000', '3000']`
- ABI includes new functions: `getAllowedBets()` and `allowedBets()`

### ✅ Contract Service (contractService.ts)
- Added client-side validation for bet tiers
- Removed MIN_BET/MAX_BET contract calls
- Error message: "Invalid bet amount. Please use: 1000, 1500, 2000, 3000 SHM"

### ✅ UI Updates (GameInterface.tsx)
- Default bet amount: `1000 SHM`
- Preset buttons show: 1000, 1500, 2000, 3000 SHM
- Game Info displays: "Allowed Bets: 1000, 1500, 2000, 3000 SHM"
- Placeholder text updated to `1000`

## Contract Features

✅ 2x Payout Multiplier (unchanged)
✅ 0% House Edge
✅ On-chain randomness (block-based)
✅ Player statistics tracking
✅ Game history (last 50 games)
✅ Leaderboard functionality
✅ Owner controls (pause, withdraw, emergency withdraw)
✅ Anti-reentrancy protection

## Important Notes

### Contract Funding
**CRITICAL**: The contract needs to be funded with SHM before players can play.

**Recommended minimum**: 10,000 SHM
**Why**: To handle multiple maximum bets (3000 SHM bet requires 6000 SHM payout)

**How to fund**:
1. **Direct MetaMask Transfer**: Send SHM directly to contract address
2. **Using deposit-funds.html**: Use the utility file in the project root
3. **Via Contract Function**: Call `depositFunds()` with value

### Validation
- ✅ **On-chain**: Contract validates bet amounts in `validBetAmount` modifier
- ✅ **Client-side**: Frontend validates before sending transaction
- ✅ **Error handling**: Clear error messages for invalid amounts

### Testing Checklist

Before going live, verify:
- [ ] Contract is funded with at least 10,000 SHM
- [ ] Can place 1000 SHM bet and receive 2000 SHM payout
- [ ] Can place 1500 SHM bet and receive 3000 SHM payout
- [ ] Can place 2000 SHM bet and receive 4000 SHM payout
- [ ] Can place 3000 SHM bet and receive 6000 SHM payout
- [ ] Invalid amounts (e.g., 500, 2500) are rejected
- [ ] Game stats are updating correctly
- [ ] Leaderboard shows correct data
- [ ] Win/loss results display properly

## Local Testing

Both frontend and backend are currently running locally:

```bash
# Terminal 1 - Backend API
cd api && npm start
# Running on http://localhost:3001

# Terminal 2 - Frontend
npm start
# Running on http://localhost:3000
```

## Deployment to Production

When ready to deploy:

```bash
# Commit changes
git add .
git commit -m "Update to bet tier system with new contract"
git push

# Vercel will auto-deploy
# Frontend: https://shard-flip-three.vercel.app
# Backend: https://shard-flip-backend.vercel.app
```

### Environment Variables (Vercel)
Make sure these are set in Vercel dashboard for the backend:

- `MONGODB_URI`: Your Digital Ocean MongoDB connection string
- `FRONTEND_URL`: `https://shard-flip-three.vercel.app`
- `API_SECRET_KEY`: Your API secret key

## Explorer Links

- Contract: https://explorer-mezame.shardeum.org/address/0x7de88096d0AaAB4C9323C0cDFD21ff2Eec64EeC0
- Transactions: View all game transactions on Shardeum Explorer
- Stats: Check contract balance and interactions

## Rollback Plan

If issues occur, you can quickly revert to the previous contract:

```typescript
// In src/utils/constants.ts line 15
shardFlip: '0x798C6537cC8B924167B1250772eC4191D9668cb4' // Previous contract
```

Then redeploy via git push.

## Contract Owner Functions

As the contract owner, you have access to:

1. **Pause/Unpause**: `setPaused(bool)`
2. **Withdraw Funds**: `withdrawFunds(uint256 amount)`
3. **Emergency Withdraw**: `emergencyWithdraw()` - withdraws all funds
4. **Transfer Ownership**: `transferOwnership(address newOwner)`

## Support

For issues or questions:
- Check console logs for detailed error messages
- Verify contract has sufficient balance
- Ensure wallet is connected to Shardeum EVM Testnet
- Check transaction status on Shardeum Explorer

---

**Status**: ✅ Configuration Complete - Ready for Funding & Testing
**Next Step**: Fund contract with 10,000+ SHM and test all bet tiers
