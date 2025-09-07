# 🪙 Shard Flip - Web3 Coin Flip Gaming dApp

A beautiful, modern coin flip betting game built for the Shardeum blockchain. Experience the thrill of Web3 gaming with smooth animations, particle effects, and real-time blockchain interactions.

![Shard Flip](https://via.placeholder.com/800x400/0a0a0a/00f5ff?text=SHARD+FLIP+🪙)

## 🌟 Features

### 🎮 Game Features
- **Interactive Coin Flipping**: Smooth 3D CSS animations with realistic physics
- **Real-time Betting**: Place bets in SHM tokens with 2x payout for wins
- **Particle Effects**: Dynamic background particles and win celebrations
- **Sound System**: Immersive audio feedback with toggleable sound controls
- **Live Statistics**: Real-time player and global game statistics
- **Game History**: Complete history of all games with transaction links
- **Leaderboard**: Top players by wins, volume, and win rate

### 🎨 Design & UX
- **Gaming Aesthetic**: Modern neon design with glassmorphism effects
- **Responsive Design**: Mobile-first approach with perfect tablet/desktop scaling
- **Dark Theme**: Eye-friendly dark theme with neon accents
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Loading States**: Skeleton screens and loading animations
- **Toast Notifications**: Real-time feedback for all user actions

### ⚡ Web3 Integration
- **Shardeum Network**: Built for Shardeum Unstablenet (Chain ID: 8080)
- **MetaMask Integration**: Seamless wallet connection and network switching
- **Real-time Updates**: Live balance updates and transaction monitoring
- **Smart Contract Integration**: Direct interaction with ShardFlip contract
- **Transaction Tracking**: Links to Shardeum explorer for all transactions
- **Error Handling**: Comprehensive error handling for all blockchain interactions

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MetaMask browser extension
- SHM tokens on Shardeum Unstablenet

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/shard-flip.git
cd shard-flip

# Install dependencies
npm install

# Start the development server
npm start
```

The application will open at `http://localhost:3000`

### Network Configuration
The app is configured for Shardeum Unstablenet:
- **RPC URL**: https://api-unstable.shardeum.org
- **Chain ID**: 8080
- **Explorer**: https://explorer-unstable.shardeum.org

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom gaming theme
- **Animations**: Framer Motion
- **Web3**: Ethers.js v6
- **Particles**: react-tsparticles
- **Notifications**: react-hot-toast
- **Build Tool**: Create React App

### Project Structure
```
src/
├── components/          # React components
│   ├── CoinFlip.tsx    # 3D coin animation
│   ├── GameInterface.tsx # Main game controls
│   ├── Header.tsx      # Navigation header
│   ├── Layout.tsx      # App layout wrapper
│   ├── StatsPanel.tsx  # Statistics display
│   ├── Leaderboard.tsx # Player rankings
│   ├── GameHistory.tsx # Game history list
│   └── ParticleBackground.tsx # Particle effects
├── contexts/           # React contexts
│   └── Web3Context.tsx # Web3 state management
├── hooks/              # Custom hooks
│   └── useGameData.ts  # Game data hooks
├── services/           # Business logic
│   ├── contractService.ts # Smart contract integration
│   └── soundService.ts    # Audio management
├── types/              # TypeScript types
│   └── index.ts        # Type definitions
├── utils/              # Utilities
│   └── constants.ts    # App constants
└── styles/
    └── index.css       # Global styles
```

## 🎯 Game Mechanics

### How to Play
1. **Connect Wallet**: Connect your MetaMask wallet with SHM tokens
2. **Choose Bet**: Select or enter your bet amount (0.01 - 10 SHM)
3. **Pick Side**: Choose Heads (👑) or Tails (⚡)
4. **Flip Coin**: Click "Flip Coin" and watch the animation
5. **Win/Lose**: Get 2x payout if you guess correctly!

### Smart Contract Functions
- `flipCoin(bool choice)`: Place bet and flip coin
- `getPlayerStats(address player)`: Get player statistics
- `getRecentGames()`: Get recent game history
- `getGameStats()`: Get global game statistics

## 🎨 Customization

### Theme Colors
The app uses a custom gaming color palette:
- **Neon Blue**: `#00f5ff`
- **Neon Purple**: `#8a2be2`
- **Neon Pink**: `#ff1493`
- **Neon Green**: `#39ff14`
- **Gaming Dark**: `#0a0a0a`

### Sound Effects
Audio files should be placed in `public/sounds/`:
- `coin-flip.wav`: Coin flipping sound
- `win.wav`: Victory sound
- `lose.wav`: Loss sound
- `click.wav`: UI interaction sound

### Contract Integration
Update contract address and ABI in `src/utils/constants.ts`:
```typescript
export const SHARDEUM_UNSTABLE: NetworkConfig = {
  // ... network config
  contracts: {
    shardFlip: '0xYourContractAddress',
    token: '0xTokenAddress' // if using separate token
  }
};
```

## 📱 Mobile Optimization

The app is fully responsive with:
- Touch-friendly interface
- Optimized animations for mobile devices
- Adaptive layouts for all screen sizes
- Mobile-specific UI considerations

## 🔧 Development

### Available Scripts
- `npm start`: Start development server
- `npm build`: Create production build
- `npm test`: Run test suite
- `npm eject`: Eject from Create React App

### Environment Variables
Create a `.env` file for custom configuration:
```env
REACT_APP_CONTRACT_ADDRESS=0xYourContractAddress
REACT_APP_RPC_URL=https://api-unstable.shardeum.org
REACT_APP_CHAIN_ID=8080
```

## 🐛 Troubleshooting

### Common Issues
1. **MetaMask not connecting**: Refresh page and try again
2. **Wrong network**: App will prompt to switch to Shardeum
3. **Transaction failing**: Check SHM balance and gas fees
4. **Sounds not playing**: Enable sound in browser and app settings

### Development Issues
- **Port 3000 in use**: Use `npm start -- --port 3001`
- **Build errors**: Clear node_modules and reinstall
- **TypeScript errors**: Check all imports and type definitions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shardeum**: For the fast, scalable blockchain platform
- **React Team**: For the amazing React framework
- **Tailwind CSS**: For the utility-first CSS framework
- **Framer Motion**: For smooth animations
- **Ethers.js**: For Web3 integration

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/shard-flip/issues)
- **Discord**: [Join our Discord](https://discord.gg/shardeum)
- **Documentation**: [Shardeum Docs](https://docs.shardeum.org)

---

**Built with ❤️ for the Shardeum ecosystem**

*Experience the future of Web3 gaming with Shard Flip!* 🚀