import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CoinSide } from '../types';

interface CoinFlipProps {
  isFlipping: boolean;
  result: CoinSide | null;
  onAnimationComplete: () => void;
  size?: 'small' | 'medium' | 'large';
}

const CoinFlip: React.FC<CoinFlipProps> = ({ 
  isFlipping, 
  result, 
  onAnimationComplete,
  size = 'large'
}) => {
  const [currentSide, setCurrentSide] = useState<CoinSide>('heads');
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32 lg:w-40 lg:h-40'
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-xl lg:text-2xl'
  };

  useEffect(() => {
    if (isFlipping) {
      setIsAnimating(true);
      
      // Simulate the flipping animation duration
      const flipDuration = 2000;
      
      // Randomize the coin face during flipping
      const flipInterval = setInterval(() => {
        setCurrentSide(Math.random() < 0.5 ? 'heads' : 'tails');
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(flipInterval);
        if (result) {
          setCurrentSide(result);
        }
        setIsAnimating(false);
        onAnimationComplete();
      }, flipDuration);

      return () => {
        clearInterval(flipInterval);
        clearTimeout(timeout);
      };
    }
  }, [isFlipping, result, onAnimationComplete]);

  return (
    <div className="coin-container flex items-center justify-center">
      <motion.div
        className={`coin relative ${sizeClasses[size]}`}
        animate={isAnimating ? {
          rotateY: [0, 1800],
          rotateX: [0, 360],
          scale: [1, 1.2, 1],
        } : {}}
        transition={{
          duration: 2,
          ease: "easeInOut",
          times: [0, 0.5, 1]
        }}
      >
        {/* Heads Side */}
        <motion.div
          className={`coin-face coin-heads ${textSizes[size]}`}
          style={{
            transform: currentSide === 'heads' ? 'rotateY(0deg)' : 'rotateY(180deg)',
            opacity: currentSide === 'heads' ? 1 : 0,
          }}
        >
          <div className="text-center">
            <div className="font-bold mb-1">👑</div>
            <div className="font-bold text-xs uppercase tracking-wider">Heads</div>
          </div>
        </motion.div>

        {/* Tails Side */}
        <motion.div
          className={`coin-face coin-tails ${textSizes[size]}`}
          style={{
            transform: currentSide === 'tails' ? 'rotateY(0deg)' : 'rotateY(180deg)',
            opacity: currentSide === 'tails' ? 1 : 0,
          }}
        >
          <div className="text-center">
            <div className="font-bold mb-1">⚡</div>
            <div className="font-bold text-xs uppercase tracking-wider">Tails</div>
          </div>
        </motion.div>

        {/* Glow Effect */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple opacity-50 blur-lg"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.3, opacity: 0.8 }}
              exit={{ scale: 1, opacity: 0 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>

        {/* Sparkle Effects */}
        <AnimatePresence>
          {isAnimating && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-neon-blue rounded-full"
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 0,
                  }}
                  animate={{
                    x: Math.cos(i * 45 * Math.PI / 180) * 60,
                    y: Math.sin(i * 45 * Math.PI / 180) * 60,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.5 + i * 0.1,
                    ease: "easeOut"
                  }}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Coin Shadow */}
      <motion.div
        className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-black/20 rounded-full blur-sm"
        animate={isAnimating ? {
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.5, 0.2],
        } : {}}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
    </div>
  );
};

// Result Display Component
interface CoinResultProps {
  result: CoinSide | null;
  won: boolean;
  show: boolean;
  onClose: () => void;
}

export const CoinResult: React.FC<CoinResultProps> = ({
  result,
  won,
  show,
  onClose
}) => {
  return (
    <AnimatePresence>
      {show && result && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`glass-dark rounded-2xl p-8 max-w-sm w-full text-center border-2 ${
              won ? 'border-neon-green' : 'border-red-500'
            }`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 12, stiffness: 200 }}
            >
              <div className={`text-6xl mb-4 ${won ? 'text-neon-green' : 'text-red-500'}`}>
                {won ? '🎉' : '😔'}
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${
                won ? 'text-neon-green' : 'text-red-500'
              }`}>
                {won ? 'You Won!' : 'You Lost!'}
              </h2>
              <p className="text-gray-300">
                The coin landed on <span className="font-bold text-white">{result}</span>
              </p>
            </motion.div>

            <motion.div
              className="flex justify-center mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <CoinFlip
                isFlipping={false}
                result={result}
                onAnimationComplete={() => {}}
                size="medium"
              />
            </motion.div>

            <motion.button
              onClick={onClose}
              className="btn-primary w-full"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Play Again
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CoinFlip;