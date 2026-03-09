import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ParallaxParticles: React.FC = () => {
  const { scrollY } = useScroll();
  
  // Create different movement speeds for depth perception
  const y1 = useTransform(scrollY, [0, 3000], [0, -1000]); // Fast (Foreground)
  const y2 = useTransform(scrollY, [0, 3000], [0, -500]);  // Medium (Midground)
  const y3 = useTransform(scrollY, [0, 3000], [0, -200]);  // Slow (Background)

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      
      {/* Layer 1: Foreground (Fast, Blurry, Large) */}
      <motion.div style={{ y: y1 }} className="absolute inset-0 w-full h-full">
        <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-raynold-red rounded-full blur-[2px] opacity-40"></div>
        <div className="absolute top-[50%] right-[15%] w-3 h-3 bg-white rounded-full blur-[3px] opacity-20"></div>
        <div className="absolute top-[80%] left-[30%] w-2 h-2 bg-raynold-green rounded-full blur-[2px] opacity-30"></div>
        <div className="absolute top-[120%] right-[40%] w-4 h-4 bg-raynold-red rounded-full blur-[4px] opacity-20"></div>
      </motion.div>

      {/* Layer 2: Midground (Medium speed) */}
      <motion.div style={{ y: y2 }} className="absolute inset-0 w-full h-full">
         <div className="absolute top-[10%] right-[30%] w-1 h-1 bg-white rounded-full opacity-30"></div>
         <div className="absolute top-[40%] left-[5%] w-1.5 h-1.5 bg-raynold-green rounded-full opacity-20 blur-[1px]"></div>
         <div className="absolute top-[70%] right-[5%] w-1 h-1 bg-white rounded-full opacity-30"></div>
         <div className="absolute top-[150%] left-[50%] w-2 h-2 bg-white/20 rounded-full blur-[1px]"></div>
      </motion.div>

      {/* Layer 3: Digital Noise/Dust (Slow, Small) */}
      <motion.div style={{ y: y3 }} className="absolute inset-0 w-full h-full">
        {Array.from({ length: 20 }).map((_, i) => (
            <div 
               key={i}
               className="absolute w-[2px] h-[2px] bg-white rounded-full opacity-10"
               style={{
                   top: `${Math.random() * 200}%`,
                   left: `${Math.random() * 100}%`
               }}
            />
        ))}
      </motion.div>
    </div>
  );
};

export default ParallaxParticles;