import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan } from 'lucide-react';
import { useUI } from '../context/UIContext';

// Configuration for drone behavior per section
const sectionConfig: Record<string, { x: string; y: string; text: string; color: string; align: 'left' | 'right' }> = {
  'hero': {
    x: '85vw',
    y: '20vh',
    text: "SISTEMAS EN LÍNEA. BIENVENIDO.",
    color: '#E60000',
    align: 'right'
  },
  'features': {
    x: '10vw',
    y: '30vh',
    text: "ANALIZANDO VENTAJAS TÁCTICAS...",
    color: '#ffffff',
    align: 'left'
  },
  'clients': {
    x: '80vw',
    y: '50vh',
    text: "ALIADOS ESTRATÉGICOS DETECTADOS.",
    color: '#009933',
    align: 'right'
  },
  'services': {
    x: '5vw',
    y: '25vh',
    text: "ESCANEANDO CAPACIDADES DE DISEÑO...",
    color: '#E60000',
    align: 'left'
  },
  'process': {
    x: '85vw',
    y: '40vh',
    text: "PROTOCOLO DE EJECUCIÓN: 4 PASOS.",
    color: '#ffffff',
    align: 'right'
  },
  'products': {
    x: '15vw',
    y: '15vh',
    text: "INVENTARIO DE ALTA CALIDAD.",
    color: '#E60000',
    align: 'left'
  },
  'ai-consultant': {
    x: '50vw',
    y: '80vh',
    text: "ENLACE NEURONAL ACTIVO. HABLEMOS.",
    color: '#009933',
    align: 'right'
  },
  'contact': {
    x: '85vw',
    y: '70vh',
    text: "INICIANDO PROTOCOLO DE COMUNICACIÓN.",
    color: '#ffffff',
    align: 'right'
  }
};

// --- Typewriter Effect Hook ---
const useTypewriter = (text: string, speed = 30) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayText('');
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return displayText;
};

// Side-view propeller animation
const Propeller = ({ cx, cy, color }: { cx: number; cy: number; color: string }) => (
  <g>
    {/* Motor housing */}
    <rect x={cx - 3} y={cy} width="6" height="8" fill={color} opacity="0.8" />
    {/* Spinning Blade */}
    <motion.ellipse
      cx={cx}
      cy={cy}
      rx="28"
      ry="4"
      fill={color}
      fillOpacity="0.6"
      animate={{ scaleX: [1, 0.2, 1], opacity: [0.8, 0.4, 0.8] }}
      transition={{ duration: 0.05, repeat: Infinity, ease: "linear" }}
    />
    {/* Blur effect */}
    <ellipse cx={cx} cy={cy} rx="30" ry="6" stroke={color} strokeWidth="1" strokeOpacity="0.2" fill="none" />
  </g>
);

const ScrollDrone: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [currentConfig, setCurrentConfig] = useState(sectionConfig['hero']);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isIdle, setIsIdle] = useState(false);
  const [patrolTime, setPatrolTime] = useState(0);

  // Connect to UI Context for override targets (scanning)
  const { droneTarget } = useUI();
  const isScanning = droneTarget?.active;

  // Typewriter effect for current text
  const displayText = isScanning
    ? (droneTarget.text || "ESCANEANDO OBJETIVO...")
    : (isIdle ? "MODO VIGILANCIA: PATRULLANDO..." : currentConfig.text);

  const typedText = useTypewriter(displayText);

  const [isMobile, setIsMobile] = useState(false);

  // Detect active section and mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    window.addEventListener('resize', checkMobile);

    const handleScroll = () => {
      // If scanning or idle, priority changes
      if (isIdle || isScanning) return;

      const sections = Object.keys(sectionConfig);
      let maxVisibleSection = activeSection;
      let maxVisibility = 0;

      sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const viewHeight = window.innerHeight;
          const visibleHeight = Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0);
          const visibility = Math.max(0, visibleHeight / viewHeight);

          if (visibility > maxVisibility && visibility > 0.3) {
            maxVisibility = visibility;
            maxVisibleSection = sectionId;
          }
        }
      });

      if (maxVisibleSection !== activeSection) {
        setActiveSection(maxVisibleSection);
        setCurrentConfig(sectionConfig[maxVisibleSection]);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, [activeSection, isIdle, isScanning]);

  // Track Mouse & Idle Logic
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const resetIdle = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!isScanning) setIsIdle(true);
      }, 5000); // 5 seconds to patrol
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      resetIdle();
    };

    // Initial timer
    idleTimer = setTimeout(() => setIsIdle(true), 5000);

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(idleTimer);
    };
  }, [isScanning]);

  // Patrol Animation Loop
  useEffect(() => {
    if (!isIdle) {
      setPatrolTime(0);
      return;
    }
    const interval = setInterval(() => {
      setPatrolTime(prev => prev + 0.02);
    }, 16);
    return () => clearInterval(interval);
  }, [isIdle]);


  // Calculate Physics (Repulsion) or Patrol Position
  const calculatePosition = () => {
    if (typeof window === 'undefined') return { x: '85vw', y: '20vh', isRepelling: false };

    // PRIORITY 1: Scanning (Hover)
    if (isScanning && droneTarget) {
      // Adjust Y to hover slightly above the target
      return {
        x: `${droneTarget.x}px`,
        y: `${droneTarget.y - 120}px`, // Float 120px above target
        isRepelling: false
      };
    }

    // PRIORITY 2: Patrol (Idle)
    if (isIdle) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const scaleX = window.innerWidth * 0.35;
      const scaleY = window.innerHeight * 0.25;

      const patrolX = centerX + Math.cos(patrolTime) * scaleX;
      const patrolY = centerY + Math.sin(patrolTime * 2) * scaleY;

      return {
        x: `${patrolX}px`,
        y: `${patrolY}px`,
        isRepelling: false
      };
    }

    // PRIORITY 3: Scroll Section Follow & Repulsion
    const targetX = (parseFloat(currentConfig.x) * window.innerWidth) / 100;
    const targetY = (parseFloat(currentConfig.y) * window.innerHeight) / 100;

    const dx = targetX - mousePosition.x;
    const dy = targetY - mousePosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let repulsionX = 0;
    let repulsionY = 0;
    const repulsionRadius = 250;
    const maxRepulsion = 150;

    if (distance < repulsionRadius) {
      const force = Math.pow((repulsionRadius - distance) / repulsionRadius, 2);
      const angle = Math.atan2(dy, dx);
      repulsionX = Math.cos(angle) * force * maxRepulsion;
      repulsionY = Math.sin(angle) * force * maxRepulsion;
    }

    return {
      x: `calc(${currentConfig.x} + ${repulsionX}px)`,
      y: `calc(${currentConfig.y} + ${repulsionY}px)`,
      isRepelling: Math.abs(repulsionX) > 10 || Math.abs(repulsionY) > 10
    };
  };

  const { x, y, isRepelling } = calculatePosition();

  if (isMobile) return null;

  // Dynamic Color Logic
  const droneColor = isRepelling ? '#ff0000' : (isScanning ? '#00ff00' : (isIdle ? '#0099ff' : currentConfig.color));

  return (
    <motion.div
      className="fixed z-[50] pointer-events-none hidden md:block"
      initial={{ x: '85vw', y: '20vh' }}
      animate={{ x, y }}
      transition={{
        type: "spring",
        stiffness: isScanning ? 40 : (isIdle ? 20 : (isRepelling ? 120 : 60)), // Faster movement when scanning
        damping: isScanning ? 25 : (isIdle ? 50 : (isRepelling ? 15 : 20)),
        mass: 1
      }}
    >
      {/* Floating Animation Wrapper */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex items-center justify-center"
      >

        {/* --- HOLOGRAPHIC DRONE SVG (FRONTAL VIEW) --- */}
        <motion.div
          className="relative w-80 h-80 -ml-28 -mt-28"
          animate={{ rotate: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-visible">
            <defs>
              <filter id="holo-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="body-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={droneColor} stopOpacity="0.8" />
                <stop offset="50%" stopColor="#000" stopOpacity="0.9" />
                <stop offset="100%" stopColor={droneColor} stopOpacity="0.8" />
              </linearGradient>
              {/* Scanning Beam Gradient */}
              <linearGradient id="beam-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={droneColor} stopOpacity="0.4" />
                <stop offset="100%" stopColor={droneColor} stopOpacity="0" />
              </linearGradient>
            </defs>

            <g filter="url(#holo-glow)">
              {/* --- SCANNING BEAM --- */}
              {/* Only show beam when scanning or patrolling */}
              <motion.path
                d="M85 130 L40 250 L160 250 L115 130 Z"
                fill="url(#beam-grad)"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: isScanning ? [0.2, 0.5, 0.2] : (isIdle ? [0.1, 0.2, 0.1] : 0),
                  scaleY: isScanning ? [1, 1.2, 1] : 1,
                  height: isScanning ? 200 : 0
                }}
                transition={{ duration: isScanning ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "100px 130px" }}
              />

              {/* Scan Line effect inside the beam */}
              {isScanning && (
                <motion.rect
                  x="40" y="130" width="120" height="2" fill={droneColor}
                  animate={{ y: [0, 120, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              )}

              {/* --- PROPELLERS --- */}
              <Propeller cx={35} cy={80} color={droneColor} />
              <Propeller cx={165} cy={80} color={droneColor} />

              {/* --- LEGS --- */}
              <path d="M70 100 L60 140 L50 145" stroke={droneColor} strokeWidth="5" strokeLinecap="round" fill="none" className="opacity-80" />
              <path d="M130 100 L140 140 L150 145" stroke={droneColor} strokeWidth="5" strokeLinecap="round" fill="none" className="opacity-80" />

              {/* --- MAIN BODY SILHOUETTE --- */}
              <path
                d="M80 75 Q100 60 120 75 L165 85 L165 92 L130 90 L125 105 L75 105 L70 90 L35 92 L35 85 Z"
                fill="url(#body-grad)"
                stroke={droneColor}
                strokeWidth="1.5"
              />

              {/* --- CAMERA GIMBAL --- */}
              <g transform="translate(0, 5)">
                <path d="M85 105 L85 115 H115 L115 105" stroke={droneColor} strokeWidth="2" fill="none" />
                <rect x="90" y="115" width="20" height="15" rx="3" fill="#111" stroke={droneColor} strokeWidth="1" />
                <circle cx="100" cy="122.5" r="5" fill="#000" stroke={droneColor} strokeWidth="1" />
                <circle cx="100" cy="122.5" r="2.5" fill={droneColor} className="animate-pulse" />
              </g>

              {/* --- SENSORS & DETAILS --- */}
              <circle cx="90" cy="85" r="1.5" fill="#000" />
              <circle cx="110" cy="85" r="1.5" fill="#000" />

              <circle cx="60" cy="140" r="2" fill={isRepelling ? "#ff0000" : "#00ff00"} className="animate-pulse" />
              <circle cx="140" cy="140" r="2" fill={isRepelling ? "#ff0000" : "#00ff00"} className="animate-pulse" />

            </g>
          </svg>

        </motion.div>

        {/* --- HOLOGRAPHIC MESSAGE BOX --- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isRepelling ? 'warning' : (isScanning ? 'scanning' : (isIdle ? 'idle' : activeSection))}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute top-10 ${currentConfig.align === 'left' && !isScanning ? 'left-[60%] ml-4' : 'right-[60%] mr-4'} w-52 pointer-events-none`}
          >
            <div className={`relative p-3 border rounded-lg backdrop-blur-md shadow-2xl transition-colors duration-300 ${isRepelling ? 'bg-red-950/80 border-red-500/50' : (isScanning ? 'bg-green-950/80 border-green-500/50' : (isIdle ? 'bg-blue-950/80 border-blue-500/50' : 'bg-black/80 border-white/20'))}`}>

              {/* Decor corners */}
              <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-white/50" />
              <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-white/50" />

              {/* Header */}
              <div className={`flex items-center gap-2 mb-2 border-b pb-1 ${isRepelling ? 'border-red-500/30' : (isScanning ? 'border-green-500/30' : 'border-white/10')}`}>
                <Scan size={12} className={isRepelling ? 'text-red-500 animate-pulse' : (isScanning ? 'text-green-400 animate-spin' : 'text-blue-400')} />
                <span className={`text-[9px] font-mono uppercase tracking-widest ${isRepelling ? 'text-red-400 font-bold' : (isScanning ? 'text-green-300 font-bold' : 'text-gray-400')}`}>
                  {isRepelling ? 'OBSTÁCULO' : (isScanning ? 'ANALIZANDO OBJETO' : 'PHANTOM-AI v5')}
                </span>
              </div>

              {/* Text with Typewriter Effect */}
              <p className={`text-[11px] font-futuristic leading-relaxed ${isRepelling ? 'text-red-200' : 'text-white'}`}>
                {isRepelling ? "MANIOBRA DE EVASIÓN ACTIVADA." : typedText}
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-1.5 h-3 bg-white ml-0.5 align-middle"
                />
              </p>

              {/* Data Lines */}
              {!isRepelling && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-[8px] font-mono text-gray-500 border-t border-white/5 pt-1">
                  <span>BAT: {Math.floor(Math.random() * 20) + 80}%</span>
                  <span>ALT: {isScanning ? '2.5m' : '15m'}</span>
                  <span>SCN: {isScanning ? 'ACTIVE' : 'IDLE'}</span>
                  <span>LNK: OK</span>
                </div>
              )}

              {/* Connector Line to Drone */}
              <div className={`absolute top-1/2 -translate-y-1/2 w-8 h-[1px] ${isRepelling ? 'bg-red-500/50' : 'bg-white/20'} ${currentConfig.align === 'left' && !isScanning ? '-left-8' : '-right-8'}`}></div>
              <div className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 ${isRepelling ? 'bg-red-500' : 'bg-white'} rounded-full ${currentConfig.align === 'left' && !isScanning ? '-left-8' : '-right-8'} shadow-[0_0_10px_currentColor]`}></div>
            </div>
          </motion.div>
        </AnimatePresence>

      </motion.div>
    </motion.div>
  );
};

export default ScrollDrone;