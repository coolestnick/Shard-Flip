import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { WalletState, NetworkConfig } from '../types';
import { ACTIVE_NETWORK } from '../utils/constants';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

interface Web3ContextType {
  wallet: WalletState;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<boolean>;
  refreshBalance: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: '0',
    isConnecting: false,
    isConnected: false,
    chainId: null
  });

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const formatBalance = (balance: bigint): string => {
    return ethers.formatEther(balance);
  };

  const refreshBalance = async () => {
    if (!provider || !wallet.address) return;

    try {
      const balance = await provider.getBalance(wallet.address);
      setWallet(prev => ({
        ...prev,
        balance: formatBalance(balance)
      }));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const switchNetwork = async (): Promise<boolean> => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${ACTIVE_NETWORK.chainId.toString(16)}` }],
      });
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${ACTIVE_NETWORK.chainId.toString(16)}`,
              chainName: ACTIVE_NETWORK.name,
              rpcUrls: [ACTIVE_NETWORK.rpcUrl],
              blockExplorerUrls: [ACTIVE_NETWORK.explorerUrl],
              nativeCurrency: {
                name: ACTIVE_NETWORK.currency.name,
                symbol: ACTIVE_NETWORK.currency.symbol,
                decimals: ACTIVE_NETWORK.currency.decimals
              }
            }]
          });
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          toast.error('Failed to add Shardeum network');
          return false;
        }
      } else {
        console.error('Error switching network:', switchError);
        toast.error('Failed to switch to Shardeum network');
        return false;
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not found! Please install MetaMask.');
      return;
    }

    setWallet(prev => ({ ...prev, isConnecting: true }));

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        toast.error('No accounts found');
        return;
      }

      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await newProvider.getNetwork();
      
      // Check if we're on the correct network
      if (Number(network.chainId) !== ACTIVE_NETWORK.chainId) {
        const switched = await switchNetwork();
        if (!switched) {
          setWallet(prev => ({ ...prev, isConnecting: false }));
          return;
        }
      }

      const newSigner = await newProvider.getSigner();
      const address = await newSigner.getAddress();
      const balance = await newProvider.getBalance(address);

      setProvider(newProvider);
      setSigner(newSigner);
      setWallet({
        address,
        balance: formatBalance(balance),
        isConnecting: false,
        isConnected: true,
        chainId: Number(network.chainId)
      });

      toast.success('Wallet connected successfully!');
      
      // Store connection state
      localStorage.setItem('walletConnected', 'true');

      // Register wallet with backend
      try {
        const registerResult = await apiService.registerWallet(address);
        if (registerResult.success) {
          console.log('Wallet registered with backend:', registerResult.message);
        } else {
          console.warn('Failed to register wallet:', registerResult.error);
        }
      } catch (error) {
        console.error('Error registering wallet with backend:', error);
      }
      
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else {
        toast.error('Failed to connect wallet');
      }
      setWallet(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const disconnectWallet = () => {
    setWallet({
      address: null,
      balance: '0',
      isConnecting: false,
      isConnected: false,
      chainId: null
    });
    setProvider(null);
    setSigner(null);
    localStorage.removeItem('walletConnected');
    toast.success('Wallet disconnected');
  };

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (localStorage.getItem('walletConnected') === 'true' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Error auto-connecting:', error);
        }
      }
    };

    autoConnect();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== wallet.address) {
        // Account changed, reconnect
        connectWallet();
      }
    };

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      setWallet(prev => ({ ...prev, chainId: newChainId }));
      
      if (newChainId !== ACTIVE_NETWORK.chainId && wallet.isConnected) {
        toast.error(`Please switch to ${ACTIVE_NETWORK.name}`);
      }
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [wallet.address, wallet.isConnected]);

  // Auto-refresh balance
  useEffect(() => {
    if (!wallet.isConnected || !provider || !wallet.address) return;

    const interval = setInterval(refreshBalance, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [wallet.isConnected, provider, wallet.address]);

  const value = {
    wallet,
    provider,
    signer,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshBalance
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}