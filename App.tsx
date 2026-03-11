import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Clients from './components/Clients';
import Services from './components/Services';
import Products from './components/Products';
import ProductsPage from './components/ProductsPage';
import FavoritesPage from './components/FavoritesPage';
import ProjectsPage from './components/ProjectsPage';
import HomeProjects from './components/HomeProjects';
import ProjectDetailPage from './components/ProjectDetailPage';
import ProductDetailPage from './components/ProductDetailPage';
import AdminLayout from './components/AdminLayout';
import About from './components/About';
import AiConsultant from './components/AiConsultant';
import Contact from './components/Contact';
import ContactPage from './components/ContactPage';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import Process from './components/Process';
import Features from './components/Features';
import ServiceDetail from './components/ServiceDetail';
import FloatingButtons from './components/FloatingButtons';
import CrtTransition from './components/CrtTransition';
import ParallaxParticles from './components/ParallaxParticles';
import GsapController from './components/GsapController';
import { motion, AnimatePresence } from 'framer-motion';

// --- Custom Cursor Component ---
const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      // Check if hovering over clickable elements
      const isClickable = target.closest('a, button, input, select, textarea, [role="button"]');
      setIsHovering(!!isClickable);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1000] hidden md:block mix-blend-difference"
      style={{ overflow: 'hidden' }}
    >
      <motion.div
        className="absolute rounded-full border border-white flex items-center justify-center"
        animate={{
          x: mousePosition.x - (isHovering ? 20 : 10),
          y: mousePosition.y - (isHovering ? 20 : 10),
          width: isHovering ? 40 : 20,
          height: isHovering ? 40 : 20,
          borderColor: isHovering ? '#E60000' : '#FFFFFF',
          rotate: isHovering ? 90 : 0
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.15 }}
      >
        <div className={`w-1 h-1 bg-white rounded-full ${isHovering ? 'bg-red-500' : ''}`} />

        {/* Crosshair Lines */}
        {isHovering && (
          <>
            <motion.div initial={{ width: 0 }} animate={{ width: '150%' }} className="absolute h-[1px] bg-red-500/50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <motion.div initial={{ height: 0 }} animate={{ height: '150%' }} className="absolute w-[1px] bg-red-500/50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </>
        )}
      </motion.div>
    </div>
  );
};

// Wrapper to handle scrolling to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Animated Routes Wrapper
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={
          <CrtTransition><Home /></CrtTransition>
        } />
        <Route path="/products" element={
          <CrtTransition><ProductsPage /></CrtTransition>
        } />
        <Route path="/products/:id" element={
          <CrtTransition><ProductDetailPage /></CrtTransition>
        } />
        <Route path="/favorites" element={
          <CrtTransition><FavoritesPage /></CrtTransition>
        } />
        <Route path="/admin/*" element={
          <CrtTransition><AdminLayout /></CrtTransition>
        } />
        <Route path="/projects" element={
          <CrtTransition><ProjectsPage /></CrtTransition>
        } />
        <Route path="/projects/:id" element={
          <CrtTransition><ProjectDetailPage /></CrtTransition>
        } />
        <Route path="/about" element={
          <CrtTransition><About /></CrtTransition>
        } />
        <Route path="/services/:slug" element={
          <CrtTransition><ServiceDetail /></CrtTransition>
        } />
        <Route path="/contact" element={
          <CrtTransition><ContactPage /></CrtTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
}

// Home Page Component
const Home = () => (
  <>
    <Hero />
    <div id="features"><Features /></div>
    <div id="clients"><Clients /></div>
    <Services />
    <HomeProjects />
    <div id="process"><Process /></div>
    <Products />
    <AiConsultant />
    <Contact />
  </>
);

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={`min-h-screen bg-raynold-black text-white selection:bg-raynold-red selection:text-white font-sans flex flex-col relative overflow-x-hidden opacity-100 transition-opacity duration-1000`}>

      {!isAdminRoute && (
        <>
          <Navbar />
          <CartSidebar />
          <FloatingButtons />
          <ParallaxParticles />
        </>
      )}

      <main className="flex-grow relative z-10">
        <AnimatedRoutes />
      </main>

      {!isAdminRoute && (
        <div className="relative z-20">
          <Footer />
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CustomCursor />

      <BrowserRouter>
        <ScrollToTop />
        <GsapController /> {/* Global Animation Controller */}
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;