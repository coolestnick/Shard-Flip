import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../contexts/Web3Context';
import { ACTIVE_NETWORK } from '../utils/constants';
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

  const isWrongNetwork = wallet.chainId !== null && wallet.chainId !== ACTIVE_NETWORK.chainId;

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
                  className="glass-dark px-4 py-2 rounded-xl flex items-center space-x-3 hover:bg-white/20 transition-all duration-300 border border-neon-blue/30 hover:border-neon-blue/60 shadow-lg shadow-neon-blue/20 hover:shadow-neon-blue/40"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-white">
                      {formatBalance(wallet.balance)} SHM
                    </span>
                    <span className="text-xs text-neon-blue/80 font-medium">
                      {formatAddress(wallet.address!)}
                    </span>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink rounded-full flex items-center justify-center shadow-lg shadow-neon-blue/50 animate-pulse">
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
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-2 w-56 glass-dark rounded-xl border border-neon-blue/30 py-2 z-50 shadow-2xl shadow-neon-blue/20 backdrop-blur-xl"
                    >
                      <div className="px-3 py-2 border-b border-neon-blue/20">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink rounded-full flex items-center justify-center shadow-lg shadow-neon-blue/50 animate-pulse">
                            <span className="text-xs font-bold text-white">
                              {wallet.address?.slice(2, 4).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-white mb-0.5">
                              {formatAddress(wallet.address!)}
                            </p>
                            <p className="text-xs font-bold text-neon-green">
                              {formatBalance(wallet.balance)} SHM
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-2 space-y-1">
                        {/* View on Explorer Button */}
                        <motion.a
                          href={`${ACTIVE_NETWORK.explorerUrl}/address/${wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative mx-2 block"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/15 to-neon-blue/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          <div className="relative flex items-center space-x-3 px-3 py-2.5 rounded-lg border border-transparent group-hover:border-neon-blue/30 transition-all duration-200">
                            <div className="w-8 h-8 bg-gradient-to-br from-neon-blue/25 to-neon-blue/10 rounded-lg flex items-center justify-center group-hover:shadow-md group-hover:shadow-neon-blue/20 transition-all duration-200">
                              <svg className="w-4 h-4 text-neon-blue group-hover:scale-105 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-white group-hover:text-neon-blue transition-colors duration-200">View on Explorer</p>
                            </div>
                            <div className="w-5 h-5 rounded-full bg-neon-blue/10 flex items-center justify-center group-hover:bg-neon-blue/20 transition-all duration-200">
                              <svg className="w-2.5 h-2.5 text-neon-blue/60 group-hover:text-neon-blue group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </motion.a>
                        
                        {/* Copy Address Button */}
                        <motion.button
                          onClick={() => {
                            navigator.clipboard.writeText(wallet.address!);
                            setShowDropdown(false);
                          }}
                          className="group relative mx-2 block"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/15 to-neon-pink/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          <div className="relative flex items-center space-x-3 px-3 py-2.5 rounded-lg border border-transparent group-hover:border-neon-purple/30 transition-all duration-200">
                            <div className="w-8 h-8 bg-gradient-to-br from-neon-purple/25 to-neon-pink/10 rounded-lg flex items-center justify-center group-hover:shadow-md group-hover:shadow-neon-purple/20 transition-all duration-200">
                              <svg className="w-4 h-4 text-neon-purple group-hover:scale-105 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-white group-hover:text-neon-purple transition-colors duration-200">Copy Address</p>
                            </div>
                            <div className="w-5 h-5 rounded-full bg-neon-purple/10 flex items-center justify-center group-hover:bg-neon-purple/20 transition-all duration-200">
                              <svg className="w-2.5 h-2.5 text-neon-purple/60 group-hover:text-neon-purple group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </motion.button>

                        {/* Elegant Divider */}
                        <div className="mx-4 my-3 relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gradient-to-r from-transparent via-neon-blue/30 to-transparent"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <div className="w-1.5 h-1.5 bg-neon-blue/50 rounded-full animate-pulse"></div>
                          </div>
                        </div>

                        {/* Disconnect Button */}
                        <motion.button
                          onClick={() => {
                            disconnectWallet();
                            setShowDropdown(false);
                          }}
                          className="group relative mx-2 block"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-red-500/15 to-red-600/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          <div className="relative flex items-center space-x-3 px-3 py-2.5 rounded-lg border border-transparent group-hover:border-red-500/30 transition-all duration-200">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500/25 to-red-600/10 rounded-lg flex items-center justify-center group-hover:shadow-md group-hover:shadow-red-500/20 transition-all duration-200">
                              <svg className="w-4 h-4 text-red-400 group-hover:scale-105 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-white group-hover:text-red-400 transition-colors duration-200">Disconnect</p>
                            </div>
                            <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-all duration-200">
                              <svg className="w-2.5 h-2.5 text-red-400/60 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </motion.button>

                        {/* Additional Quick Actions */}
                        <div className="pt-2">
                          <p className="text-xs text-gray-500 px-4 mb-2 font-medium uppercase tracking-wider">Quick Actions</p>
                          <div className="flex space-x-2 px-2">
                            <motion.button
                              onClick={() => setShowDropdown(false)}
                              className="flex-1 flex items-center justify-center space-x-1 py-2 px-2 rounded-lg bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/20 hover:border-neon-blue/40 transition-all duration-200 group"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <svg className="w-3.5 h-3.5 text-neon-blue group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="text-xs font-semibold text-neon-blue">Refresh</span>
                            </motion.button>
                            
                            <motion.button
                              onClick={() => {
                                window.open(`${ACTIVE_NETWORK.explorerUrl}/address/${wallet.address}`, '_blank');
                                setShowDropdown(false);
                              }}
                              className="flex-1 flex items-center justify-center space-x-1 py-2 px-2 rounded-lg bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/20 hover:border-neon-purple/40 transition-all duration-200 group"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <svg className="w-3.5 h-3.5 text-neon-purple group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              <span className="text-xs font-semibold text-neon-purple">Stats</span>
                            </motion.button>
                          </div>
                        </div>
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