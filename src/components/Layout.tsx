import React from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import ParticleBackground from './ParticleBackground';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen text-white relative overflow-x-hidden">
      {/* Futuristic 3D Grid System */}
      <div className="futuristic-grid">
        <div className="grid-3d"></div>
      </div>

      {/* Holographic Scanlines */}
      <div className="scanlines"></div>
      
      {/* Simplified Floating Elements */}
      <div className="geometric-shapes">
        {/* Floating Spheres */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`sphere-${i}`}
            className="shape-3d sphere"
            style={{
              left: `${15 + i * 30}%`,
              top: `${25 + i * 20}%`,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, 
                ${i === 0 ? 'rgba(0, 245, 255, 0.6)' : 
                  i === 1 ? 'rgba(138, 43, 226, 0.6)' : 
                  'rgba(255, 20, 147, 0.6)'
                }, 
                ${i === 0 ? 'rgba(0, 245, 255, 0.1)' : 
                  i === 1 ? 'rgba(138, 43, 226, 0.1)' : 
                  'rgba(255, 20, 147, 0.1)'
                }
              )`,
              boxShadow: `0 0 20px ${
                i === 0 ? 'rgba(0, 245, 255, 0.3)' : 
                i === 1 ? 'rgba(138, 43, 226, 0.3)' : 
                'rgba(255, 20, 147, 0.3)'
              }`
            }}
            animate={{
              y: [0, -20, 0],
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2,
            }}
          />
        ))}

        {/* Simple Energy Ring */}
        <motion.div
          className="shape-3d"
          style={{
            left: '50%',
            top: '60%',
            width: '80px',
            height: '80px',
            border: '1px solid rgba(0, 245, 255, 0.3)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, transparent 70%, rgba(0, 245, 255, 0.05) 100%)',
            boxShadow: '0 0 30px rgba(0, 245, 255, 0.2)',
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      
      {/* Particle Background */}
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
    </div>
  );
};

export default Layout;