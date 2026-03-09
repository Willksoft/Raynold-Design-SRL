import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const CrtTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const transitionKey = location.pathname.startsWith('/admin') ? '/admin' : location.pathname;

  return (
    <div className="relative w-full h-full">
      {/* CRT Overlay Effect */}
      <motion.div
        key={transitionKey}
        initial={{ scaleY: 0.005, scaleX: 0, opacity: 1 }}
        animate={{
          scaleY: [0.005, 1],
          scaleX: [0.1, 1],
          opacity: [1, 0] // Fix: Fade out opacity to 0 to restore normal colors
        }}
        exit={{
          scaleY: [1, 0.005, 0],
          scaleX: [1, 1, 0],
          opacity: [0, 1, 0] // Flash in then disappear
        }}
        transition={{
          duration: 0.6,
          ease: "easeInOut",
          times: [0, 1]
        }}
        className="fixed inset-0 z-[10000] bg-white pointer-events-none mix-blend-difference"
      />

      {/* Actual Content Fade */}
      <motion.div
        key={`content-${transitionKey}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default CrtTransition;