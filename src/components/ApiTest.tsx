import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { useWeb3 } from '../contexts/Web3Context';

const ApiTest: React.FC = () => {
  const { wallet } = useWeb3();
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testWalletRegistration = async () => {
    if (!wallet.address) {
      setTestResult('❌ No wallet connected');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.registerWallet(wallet.address);
      setTestResult(`✅ Wallet Registration: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testGameUpdate = async () => {
    if (!wallet.address) {
      setTestResult('❌ No wallet connected');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.updateGameResult(
        wallet.address,
        'win',
        1.5,
        3.0
      );
      setTestResult(`✅ Game Update: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testGetUser = async () => {
    if (!wallet.address) {
      setTestResult('❌ No wallet connected');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.getUser(wallet.address);
      setTestResult(`✅ Get User: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-md z-50">
      <h3 className="text-sm font-bold mb-2">🧪 API Test Panel</h3>
      
      {wallet.address && (
        <p className="text-xs text-gray-400 mb-2">
          Wallet: {wallet.address.slice(0, 10)}...
        </p>
      )}

      <div className="space-y-2 mb-3">
        <button
          onClick={testWalletRegistration}
          disabled={isLoading || !wallet.address}
          className="w-full text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded disabled:opacity-50"
        >
          Test Register Wallet
        </button>
        
        <button
          onClick={testGameUpdate}
          disabled={isLoading || !wallet.address}
          className="w-full text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded disabled:opacity-50"
        >
          Test Game Update
        </button>
        
        <button
          onClick={testGetUser}
          disabled={isLoading || !wallet.address}
          className="w-full text-xs bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded disabled:opacity-50"
        >
          Test Get User
        </button>
      </div>

      {testResult && (
        <div className="bg-gray-800 p-2 rounded text-xs max-h-40 overflow-y-auto">
          <pre className="whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest;