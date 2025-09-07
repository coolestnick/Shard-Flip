import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../contexts/Web3Context';
import { SHARDEUM_UNSTABLE } from '../utils/constants';
import { soundService } from '../services/soundService';

const Header: React.FC = () => {
  const { wallet, connectWallet, disconnectWallet, switchNetwork } = useWeb3();
  const [showDropdown, setShowDropdown] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    return parseFloat(balance).toFixed(4);
  };

  const isWrongNetwork = wallet.chainId !== null && wallet.chainId !== SHARDEUM_UNSTABLE.chainId;

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundService.setEnabled(newState);
    soundService.play('click');
  };

  return (
    <header className="relative z-50 bg-gaming-gradient border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center">
                <span className="text-xl lg:text-2xl font-bold text-white">⚡</span>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple blur animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-gaming font-bold text-gradient">
                SHARD FLIP
              </h1>
              <p className="text-xs text-gray-400 hidden lg:block">
                Web3 Coin Flip Game
              </p>
            </div>
          </motion.div>

          {/* Network Status & Wallet */}
          <motion.div
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Sound Toggle */}
            <motion.button
              onClick={toggleSound}
              className="p-2 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {soundEnabled ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11.829 15.17l.707-.707L12 14V9l-.536-.465M8 8H6a2 2 0 00-2 2v4a2 2 0 002 2h2l3 3.5v-15L8 8z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586L8 6.414A1 1 0 0110 7v10a1 1 0 01-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                )}
              </svg>
            </motion.button>

            {/* Network Indicator */}
            {wallet.isConnected && (
              <div className={`hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
                isWrongNetwork 
                  ? 'border-red-500 bg-red-500/10 text-red-400' 
                  : 'border-neon-green bg-neon-green/10 text-neon-green'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isWrongNetwork ? 'bg-red-500' : 'bg-neon-green'
                } animate-pulse`}></div>
                <span className="text-sm font-medium">
                  {isWrongNetwork ? 'Wrong Network' : 'Shardeum'}
                </span>
              </div>
            )}

            {/* Wallet Connection */}
            {!wallet.isConnected ? (
              <motion.button
                onClick={connectWallet}
                disabled={wallet.isConnecting}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {wallet.isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>Connect Wallet</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </>
                )}
              </motion.button>
            ) : (
              <div className="relative">
                {isWrongNetwork && (
                  <motion.button
                    onClick={switchNetwork}
                    className="btn-primary mr-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Switch Network
                  </motion.button>
                )}
                
                <motion.button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="glass-dark px-4 py-2 rounded-lg flex items-center space-x-3 hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-white">
                      {formatBalance(wallet.balance)} SHM
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatAddress(wallet.address!)}
                    </span>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {wallet.address?.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 glass-dark rounded-lg border border-white/20 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {wallet.address?.slice(2, 4).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {formatAddress(wallet.address!)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatBalance(wallet.balance)} SHM
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <a
                          href={`${SHARDEUM_UNSTABLE.explorerUrl}/address/${wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span>View on Explorer</span>
                        </a>
                        
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(wallet.address!);
                            setShowDropdown(false);
                          }}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors w-full text-left"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy Address</span>
                        </button>

                        <div className="border-t border-white/10 my-2"></div>

                        <button
                          onClick={() => {
                            disconnectWallet();
                            setShowDropdown(false);
                          }}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Disconnect</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  );
};

export default Header;