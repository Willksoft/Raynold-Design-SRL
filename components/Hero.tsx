import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  headlineTop: string;
  headlineBottom: string;
}

const defaultSlides: HeroSlide[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=2070&auto=format&fit=crop", 
    title: "Señalización Neon y 3D",
    subtitle: "Iluminamos tu marca con tecnología LED de última generación.",
    headlineTop: "DISEÑAMOS EL",
    headlineBottom: "FUTURO VISUAL"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1621996659490-3275b4d0d951?q=80&w=2070&auto=format&fit=crop", 
    title: "Impresión Gran Formato",
    subtitle: "Calidad fotográfica en dimensiones arquitectónicas.",
    headlineTop: "IMPRESIÓN DE",
    headlineBottom: "ALTO CALIBRE"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1600706432502-79fa6930eb6a?q=80&w=2070&auto=format&fit=crop", 
    title: "Rotulación Vehicular",
    subtitle: "Transforma tu flota en publicidad móvil de alto impacto.",
    headlineTop: "TU MARCA EN",
    headlineBottom: "MOVIMIENTO"
  }
];

// --- Main Hero Component ---

const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<HeroSlide[]>(defaultSlides);

  useEffect(() => {
    const savedSlides = localStorage.getItem('admin_hero_slides');
    if (savedSlides) {
      setSlides(JSON.parse(savedSlides));
    }
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const waLink = "https://wa.me/18295807411?text=Hola,%20me%20gustaría%20cotizar%20un%20proyecto%20con%20ustedes.";

  if (slides.length === 0) return null;

  return (
    <section id="hero" className="relative h-screen w-full overflow-hidden bg-black">
      
      {/* Background Slider with GSAP Parallax Class */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 z-0 gsap-hero-bg" // Added class for GSAP
        >
          <div className="absolute inset-0 bg-black/70 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10" />
          <img 
            src={slides[currentSlide].image} 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Floating Tech Elements (Decor) */}
      <motion.div 
        className="absolute bottom-1/3 right-[10%] z-10 text-white/10 hidden lg:block"
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <Cpu size={48} strokeWidth={1} />
      </motion.div>

      {/* Content */}
      <div className="relative z-20 h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          
          <motion.div
            key={`content-${currentSlide}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 relative group">
              {/* Pulse effect on label */}
              <span className="absolute -left-1 -top-1 w-2 h-2 bg-raynold-red rounded-full animate-ping" />
              <Zap size={14} className="text-raynold-red fill-raynold-red" />
              <span className="text-xs uppercase tracking-[0.2em] text-white font-futuristic">
                {slides[currentSlide].title}
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-futuristic mb-6 tracking-tight leading-[1.1] text-white drop-shadow-2xl">
              <span className="group relative inline-block gsap-reveal">
                <span className="relative z-10 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-colors">
                  {slides[currentSlide].headlineTop}
                </span>
              </span>
              <br />
              <span className="animate-gradient-text relative inline-block gsap-reveal">
                {slides[currentSlide].headlineBottom}
              </span>
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-300 font-light font-sans tracking-wide gsap-reveal">
              {slides[currentSlide].subtitle}
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center items-center gsap-reveal">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="min-w-[200px] px-8 py-4 btn-animated font-bold tracking-widest text-sm uppercase flex items-center justify-center gap-2"
              >
                Cotizar Proyecto <ArrowRight size={16} />
              </motion.a>
              
              <Link to="/products">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="min-w-[200px] px-8 py-4 btn-border-glow font-bold tracking-widest text-sm uppercase relative overflow-hidden"
                >
                  <span className="relative z-10">Ver Catálogo</span>
                  {/* Scan effect inside button */}
                  <motion.div 
                    className="absolute inset-0 bg-white/20 -skew-x-12"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Slider Indicators */}
      <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'w-12 bg-raynold-red shadow-[0_0_10px_#E60000]' : 'w-4 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;