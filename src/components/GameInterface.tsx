import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CoinFlip, { CoinResult } from './CoinFlip';
import { useWeb3 } from '../contexts/Web3Context';
import { useGameActions } from '../hooks/useGameData';
import { CoinSide } from '../types';
import { DEFAULT_BET_AMOUNTS } from '../utils/constants';
import { soundService } from '../services/soundService';
import toast from 'react-hot-toast';

const GameInterface: React.FC = () => {
  const { wallet } = useWeb3();
  const { flipCoin, isFlipping, lastResult, clearLastResult } = useGameActions();
  
  const [betAmount, setBetAmount] = useState<string>('0.1');
  const [selectedSide, setSelectedSide] = useState<CoinSide | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastWon, setLastWon] = useState(false);

  const handleBetAmountChange = (amount: string) => {
    setBetAmount(amount);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBetAmount(value);
    }
  };

  const handleSideSelection = (side: CoinSide) => {
    if (!isFlipping) {
      soundService.play('click');
      setSelectedSide(side);
    }
  };

  const handleFlipCoin = async () => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedSide) {
      toast.error('Please select heads or tails');
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error('Please enter a valid bet amount');
      return;
    }

    if (parseFloat(betAmount) > parseFloat(wallet.balance)) {
      toast.error('Insufficient balance');
      return;
    }

    soundService.play('flip');

    try {
      const result = await flipCoin(betAmount, selectedSide);
      
      if (result.success) {
        // Show result after flip animation completes
        setTimeout(() => {
          const simulatedResult = Math.random() < 0.5 ? 'heads' : 'tails';
          const won = simulatedResult === selectedSide;
          setLastWon(won);
          soundService.play(won ? 'win' : 'lose');
          // Reset selection after successful flip
          setSelectedSide(null);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error flipping coin:', error);
      toast.error(error.message || 'Failed to flip coin');
    }
  };

  const handleAnimationComplete = () => {
    if (lastResult) {
      setShowResult(true);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    clearLastResult();
    setSelectedSide(null);
  };

  const canFlip = wallet.isConnected && 
                  selectedSide && 
                  betAmount && 
                  parseFloat(betAmount) > 0 && 
                  !isFlipping;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Coin Animation Area */}
        <div className="flex flex-col items-center justify-center space-y-8">
          <motion.div
            className="glass rounded-3xl p-8 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-gaming font-bold text-gradient mb-2">
                COIN FLIP
              </h2>
              <p className="text-gray-400">
                Choose your side and flip the coin!
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <CoinFlip
                isFlipping={isFlipping}
                result={lastResult}
                onAnimationComplete={handleAnimationComplete}
              />
            </div>

            {/* Side Selection */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <motion.button
                onClick={() => handleSideSelection('heads')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden ${
                  selectedSide === 'heads'
                    ? 'border-orange-400 bg-gradient-to-br from-orange-500/40 to-red-500/30 text-white shadow-lg shadow-orange-500/30'
                    : 'border-white/20 hover:border-orange-400/50 text-white hover:text-orange-300'
                } ${isFlipping ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                whileHover={!isFlipping ? { scale: 1.02 } : {}}
                whileTap={!isFlipping ? { scale: 0.98 } : {}}
                disabled={isFlipping}
              >
                {selectedSide === 'heads' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/25 to-red-400/15 animate-pulse"></div>
                )}
                <div className="text-3xl mb-2 relative z-10">👑</div>
                <div className="font-bold relative z-10 text-shadow-sm">HEADS</div>
                <div className={`text-xs relative z-10 ${selectedSide === 'heads' ? 'text-orange-100' : 'text-gray-400'}`}>2x Payout</div>
                {selectedSide === 'heads' && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-orange-400 rounded-full animate-pulse shadow-md"></div>
                )}
              </motion.button>

              <motion.button
                onClick={() => handleSideSelection('tails')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden ${
                  selectedSide === 'tails'
                    ? 'border-cyan-400 bg-gradient-to-br from-cyan-500/40 to-blue-500/30 text-white shadow-lg shadow-cyan-500/30'
                    : 'border-white/20 hover:border-cyan-400/50 text-white hover:text-cyan-300'
                } ${isFlipping ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                whileHover={!isFlipping ? { scale: 1.02 } : {}}
                whileTap={!isFlipping ? { scale: 0.98 } : {}}
                disabled={isFlipping}
              >
                {selectedSide === 'tails' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/25 to-blue-400/15 animate-pulse"></div>
                )}
                <div className="text-3xl mb-2 relative z-10">⚡</div>
                <div className="font-bold relative z-10 text-shadow-sm">TAILS</div>
                <div className={`text-xs relative z-10 ${selectedSide === 'tails' ? 'text-cyan-100' : 'text-gray-400'}`}>2x Payout</div>
                {selectedSide === 'tails' && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-md"></div>
                )}
              </motion.button>
            </div>

            {/* Flip Button */}
            <motion.button
              onClick={handleFlipCoin}
              disabled={!canFlip}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                canFlip
                  ? 'btn-primary'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
              whileHover={canFlip ? { scale: 1.02 } : {}}
              whileTap={canFlip ? { scale: 0.98 } : {}}
            >
              {isFlipping ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Flipping...</span>
                </div>
              ) : (
                'FLIP COIN'
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Betting Controls */}
        <div className="space-y-6">
          <motion.div
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-bold text-white mb-6">Bet Amount</h3>
            
            {/* Preset Amounts */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {DEFAULT_BET_AMOUNTS.map((amount) => (
                <motion.button
                  key={amount}
                  onClick={() => handleBetAmountChange(amount)}
                  className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                    betAmount === amount
                      ? 'border-neon-blue bg-neon-blue/20 text-neon-blue'
                      : 'border-white/20 hover:border-white/40 text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-bold">{amount} SHM</div>
                  <div className="text-xs text-gray-400">
                    Win: {(parseFloat(amount) * 2).toFixed(2)} SHM
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-4">
              <label className="text-sm text-gray-400">Custom Amount</label>
              <div className="relative">
                <input
                  type="text"
                  value={betAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="0.1"
                  className="w-full bg-gaming-light border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  SHM
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Potential win: <span className="text-neon-green font-medium">
                  {betAmount ? (parseFloat(betAmount) * 2).toFixed(4) : '0'} SHM
                </span>
              </div>
            </div>
          </motion.div>

          {/* Game Info */}
          <motion.div
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-xl font-bold text-white mb-4">Game Info</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Payout Multiplier</span>
                <span className="text-neon-green font-medium">2x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">House Edge</span>
                <span className="text-white">0%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Min Bet</span>
                <span className="text-white">0.01 SHM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Max Bet</span>
                <span className="text-white">10 SHM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Your Balance</span>
                <span className="text-white">
                  {wallet.isConnected ? `${parseFloat(wallet.balance).toFixed(4)} SHM` : 'Not connected'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Game Rules */}
          <motion.div
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h3 className="text-xl font-bold text-white mb-4">How to Play</h3>
            
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-neon-blue/20 rounded-full flex items-center justify-center text-neon-blue text-xs font-bold">
                  1
                </div>
                <div>Connect your wallet and ensure you have SHM tokens</div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-neon-blue/20 rounded-full flex items-center justify-center text-neon-blue text-xs font-bold">
                  2
                </div>
                <div>Choose your bet amount and select heads or tails</div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-neon-blue/20 rounded-full flex items-center justify-center text-neon-blue text-xs font-bold">
                  3
                </div>
                <div>Click "Flip Coin" to start the game</div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-neon-blue/20 rounded-full flex items-center justify-center text-neon-blue text-xs font-bold">
                  4
                </div>
                <div>Win 2x your bet if you guess correctly!</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Result Modal */}
      <CoinResult
        result={lastResult}
        won={lastWon}
        show={showResult}
        onClose={handleCloseResult}
      />
    </div>
  );
};

export default GameInterface;