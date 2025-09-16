import React from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import ParticleBackground from './ParticleBackground';
import ApiTest from './ApiTest';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen text-white relative overflow-x-hidden">
      {/* 3D Rotating Grid System */}
      <div className="futuristic-grid">
        <div className="grid-3d"></div>
      </div>

      {/* 3D Data Cubes */}
      <div className="data-cubes">
        {[...Array(6)].map((_, i) => (
          <div
            key={`cube-${i}`}
            className="data-cube"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + i * 12}%`,
              animationDelay: `${i * 3}s`,
              animationDuration: `${20 + i * 5}s`
            }}
          >
            <div className="cube-face front"></div>
            <div className="cube-face back"></div>
            <div className="cube-face right"></div>
            <div className="cube-face left"></div>
            <div className="cube-face top"></div>
            <div className="cube-face bottom"></div>
          </div>
        ))}
      </div>

      {/* 3D Energy Rings */}
      <div className="energy-rings">
        <div className="energy-ring ring-1"></div>
        <div className="energy-ring ring-2"></div>
        <div className="energy-ring ring-3"></div>
      </div>

      {/* 3D Particle System */}
      <div className="particle-system">
        {[...Array(20)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className={`particle-3d ${
              i % 3 === 0 ? '' : i % 3 === 1 ? 'purple' : 'pink'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${20 + i * 2}s`
            }}
          />
        ))}
      </div>

      {/* Advanced Floating Elements */}
      <div className="geometric-shapes">
        {/* Animated Spheres with 3D movement */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`sphere-${i}`}
            className="shape-3d sphere"
            style={{
              left: `${15 + i * 20}%`,
              top: `${25 + i * 15}%`,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, 
                ${i % 3 === 0 ? 'rgba(0, 245, 255, 0.8)' : 
                  i % 3 === 1 ? 'rgba(138, 43, 226, 0.8)' : 
                  'rgba(255, 20, 147, 0.8)'
                }, 
                ${i % 3 === 0 ? 'rgba(0, 245, 255, 0.2)' : 
                  i % 3 === 1 ? 'rgba(138, 43, 226, 0.2)' : 
                  'rgba(255, 20, 147, 0.2)'
                }
              )`,
              boxShadow: `0 0 20px ${
                i % 3 === 0 ? 'rgba(0, 245, 255, 0.4)' : 
                i % 3 === 1 ? 'rgba(138, 43, 226, 0.4)' : 
                'rgba(255, 20, 147, 0.4)'
              }`
            }}
            animate={{
              x: [0, Math.sin(i) * 50, -Math.cos(i) * 30, 0],
              y: [0, -Math.cos(i) * 40, Math.sin(i) * 25, 0],
              z: [0, 100, 200, 50, 0],
              scale: [1, 1.3, 0.8, 1.1, 1],
              rotateY: [0, 180, 360],
              opacity: [0.5, 0.9, 0.3, 0.7, 0.5],
            }}
            transition={{
              duration: 18 + i * 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2,
            }}
          />
        ))}
      </div>

      {/* Holographic Scanlines */}
      <div className="scanlines"></div>
      
      {/* Original Particle Background */}
      <ParticleBackground />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/10 py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <span>&copy; 2024 Shard Flip</span>
                <a 
                  href="#" 
                  className="hover:text-neon-blue transition-colors"
                >
                  Terms
                </a>
                <a 
                  href="#" 
                  className="hover:text-neon-blue transition-colors"
                >
                  Privacy
                </a>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">Powered by</span>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">S</span>
                  </div>
                  <span className="text-sm font-semibold text-neon-blue">Shardeum</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Loading overlay for page transitions */}
      <motion.div
        className="fixed inset-0 bg-gaming-dark z-50 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        onAnimationComplete={() => {
          // Remove from DOM after animation
        }}
      >
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-neon-blue/30 border-t-neon-blue rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.h2
            className="text-2xl font-gaming font-bold text-gradient"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            SHARD FLIP
          </motion.h2>
          <motion.p
            className="text-gray-400 mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Loading the game...
          </motion.p>
        </div>
      </motion.div>

      {/* API Test Panel - Only show in development */}
      {process.env.NODE_ENV === 'development' && <ApiTest />}
    </div>
  );
};

export default Layout;