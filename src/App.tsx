import React from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import GameInterface from './components/GameInterface';
import StatsPanel from './components/StatsPanel';
import Leaderboard from './components/Leaderboard';
import GameHistory from './components/GameHistory';
import { Web3Provider } from './contexts/Web3Context';

function App() {
  return (
    <Web3Provider>
      <Layout>
        <div className="space-y-12">
          {/* Main Game Section */}
          <section>
            <GameInterface />
          </section>

          {/* Statistics Section */}
          <section>
            <StatsPanel />
          </section>

          {/* Leaderboard and Game History */}
          <section className="grid lg:grid-cols-2 gap-8">
            <Leaderboard />
            <GameHistory />
          </section>
        </div>

        {/* Toast Notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(26, 26, 26, 0.9)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
            },
            success: {
              style: {
                border: '1px solid rgba(57, 255, 20, 0.3)',
                background: 'rgba(57, 255, 20, 0.1)',
              },
            },
            error: {
              style: {
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.1)',
              },
            },
            loading: {
              style: {
                border: '1px solid rgba(0, 245, 255, 0.3)',
                background: 'rgba(0, 245, 255, 0.1)',
              },
            },
          }}
        />
      </Layout>
    </Web3Provider>
  );
}

export default App;