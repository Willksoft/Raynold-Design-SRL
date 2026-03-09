import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Instagram, ChevronDown, ArrowRight, ShoppingCart, Star, Search, Package, ShieldAlert } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import SearchOverlay from './SearchOverlay';
import { servicesData } from '../data/services';

// Official WhatsApp Logo Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const { cart, favorites, toggleCart } = useShop();

  const handleScrollTo = (id: string) => {
    if (location.pathname !== '/') {
      window.location.href = `/${id}`;
    } else {
      const element = document.querySelector(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  const waLink = "https://wa.me/18295807411?text=Hola,%20quisiera%20cotizar%20un%20servicio.";

  return (
    <>
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-3 cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center relative overflow-hidden border border-white/20 shadow-[0_0_15px_rgba(230,0,0,0.3)]">
               <span className="font-futuristic font-black text-white text-3xl italic tracking-tighter pr-1 z-10">R</span>
               <div className="absolute top-0 right-0 w-1/2 h-full bg-raynold-red/20 blur-md"></div>
               <div className="absolute bottom-0 left-0 w-1/2 h-full bg-raynold-green/20 blur-md"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-futuristic font-bold text-xl tracking-widest text-white leading-none">
                RAYNOLD
              </span>
              <span className="font-sans text-[0.65rem] tracking-[0.3em] text-raynold-red font-bold uppercase">
                Design SRL
              </span>
            </div>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="font-sans text-sm font-medium text-gray-300 hover:text-white transition-colors">INICIO</Link>
            
            {/* Mega Menu Trigger (Merged Solutions) */}
            <div 
              className="relative group h-24 flex items-center"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <button 
                className="flex items-center gap-1 font-sans text-sm font-medium text-gray-300 hover:text-white transition-colors focus:outline-none cursor-pointer"
              >
                SOLUCIONES <ChevronDown size={14} />
              </button>

              <AnimatePresence>
                {megaMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 w-[900px] max-w-[95vw] bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60] backdrop-blur-xl flex"
                  >
                     {/* Services Column */}
                     <div className="flex-1 p-6 border-r border-white/5">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="text-xs text-gray-500 font-bold uppercase tracking-widest">Nuestros Servicios</h3>
                           <Link to="/#services" onClick={() => setMegaMenuOpen(false)} className="text-[10px] text-raynold-red hover:text-white transition-colors uppercase font-bold flex items-center gap-1">Ver todos <ArrowRight size={10} /></Link>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           {servicesData.map((s, idx) => (
                             <Link 
                                key={idx} 
                                to={`/services/${s.slug}`}
                                onClick={() => setMegaMenuOpen(false)}
                                className="group/item flex flex-col p-3 rounded-lg hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/5"
                             >
                               <div className="flex items-center justify-between mb-1">
                                  <span className="text-white font-futuristic font-bold text-sm group-hover/item:text-raynold-red transition-colors">
                                    {s.title}
                                  </span>
                               </div>
                               <p className="text-[10px] text-gray-500 font-sans leading-relaxed line-clamp-2">
                                 {s.description}
                               </p>
                             </Link>
                           ))}
                        </div>
                     </div>

                     {/* Products Column */}
                     <div className="w-1/3 p-6 bg-white/5 flex flex-col">
                        <h3 className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Productos</h3>
                        <div className="flex-1 space-y-4">
                            <Link to="/products" onClick={() => setMegaMenuOpen(false)} className="block p-4 rounded-xl bg-black/40 border border-white/10 hover:border-raynold-green/50 transition-all group/prod">
                                <div className="flex items-center gap-3 mb-2">
                                   <div className="p-2 bg-raynold-green/10 rounded-lg text-raynold-green border border-raynold-green/20">
                                      <Package size={20} />
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="font-bold text-white group-hover/prod:text-raynold-green transition-colors text-sm">Catálogo Completo</span>
                                      <span className="text-[10px] text-gray-500">Ver todos los productos</span>
                                   </div>
                                </div>
                            </Link>
                            
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-2">Categorías Populares</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Neon', 'Impresión', 'Textil', 'Promocional'].map(cat => (
                                        <Link key={cat} to="/products" onClick={() => setMegaMenuOpen(false)} className="px-3 py-2 bg-black/20 rounded border border-white/5 text-xs text-gray-300 hover:text-white hover:border-white/20 transition-colors text-center">
                                            {cat}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-auto pt-6 border-t border-white/10">
                           <a href={waLink} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full py-3 bg-white text-black font-bold text-xs rounded-lg hover:bg-gray-200 transition-colors shadow-lg">
                              COTIZAR PROYECTO &rarr;
                           </a>
                        </div>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/projects" className="font-sans text-sm font-medium text-gray-300 hover:text-white transition-colors">PROYECTOS</Link>
            <Link to="/about" className="font-sans text-sm font-medium text-gray-300 hover:text-white transition-colors">NOSOTROS</Link>
            <Link to="/contact" className="font-sans text-sm font-medium text-gray-300 hover:text-white transition-colors">CONTACTO</Link>
            
            {/* Shop Icons */}
            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
               {/* Admin Link */}
               <Link to="/admin" className="text-gray-400 hover:text-raynold-red transition-colors" title="Panel de Admin">
                 <ShieldAlert size={20} />
               </Link>

               {/* Search Button */}
               <button onClick={() => setIsSearchOpen(true)} className="text-gray-400 hover:text-white transition-colors">
                 <Search size={20} />
               </button>

               <Link to="/favorites" className="relative text-gray-400 hover:text-raynold-red transition-colors">
                 <Star size={20} />
                 {favorites.length > 0 && (
                   <span className="absolute -top-2 -right-2 w-4 h-4 bg-raynold-red text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                     {favorites.length}
                   </span>
                 )}
               </Link>
               <button onClick={toggleCart} className="relative text-gray-400 hover:text-raynold-green transition-colors">
                 <ShoppingCart size={20} />
                 {cart.length > 0 && (
                   <span className="absolute -top-2 -right-2 w-4 h-4 bg-raynold-green text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                     {cart.length}
                   </span>
                 )}
               </button>
            </div>

            <a href={waLink} target="_blank" rel="noreferrer" className="hidden lg:inline-flex px-6 py-2 btn-animated font-bold text-sm text-center">
              COTIZAR
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden gap-4 items-center">
             <button onClick={() => setIsSearchOpen(true)} className="text-gray-400 hover:text-white transition-colors">
                <Search size={24} />
             </button>

             <Link to="/admin" className="text-gray-400 hover:text-raynold-red transition-colors" title="Panel de Admin">
                <ShieldAlert size={24} />
             </Link>

             <button onClick={toggleCart} className="relative text-gray-400 hover:text-raynold-green transition-colors">
                 <ShoppingCart size={24} />
                 {cart.length > 0 && (
                   <span className="absolute -top-2 -right-2 w-4 h-4 bg-raynold-green text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                     {cart.length}
                   </span>
                 )}
               </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 border-b border-raynold-red/30 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="px-4 py-6 space-y-4">
              <Link to="/" onClick={() => setIsOpen(false)} className="block text-lg font-bold text-white">INICIO</Link>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Soluciones</span>
                 </div>
                 
                 <div className="pl-4 space-y-3 border-l border-white/10 ml-1">
                     <Link to="/products" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-white font-bold py-1 hover:text-raynold-red transition-colors">
                         <Package size={16} className="text-raynold-green" /> Catálogo de Productos
                     </Link>
                     
                     {servicesData.map((s) => (
                       <Link 
                         key={s.title} 
                         to={`/services/${s.slug}`}
                         onClick={() => setIsOpen(false)} 
                         className="block text-gray-400 py-1 hover:text-white text-sm transition-colors"
                       >
                         {s.title}
                       </Link>
                     ))}
                 </div>
              </div>

              <Link to="/projects" onClick={() => setIsOpen(false)} className="block text-lg font-bold text-white">PROYECTOS</Link>
              <Link to="/about" onClick={() => setIsOpen(false)} className="block text-lg font-bold text-white">NOSOTROS</Link>
              <Link to="/contact" onClick={() => setIsOpen(false)} className="block text-lg font-bold text-white">CONTACTO</Link>
              <a href={waLink} target="_blank" rel="noreferrer" onClick={() => setIsOpen(false)} className="block text-lg font-bold text-raynold-red">COTIZAR</a>
              
              <div className="flex gap-4 pt-4 mt-4 border-t border-white/10">
                 <a href="https://instagram.com/raynolddesignsrl" className="text-gray-400 hover:text-white"><Instagram /></a>
                 <a href={waLink} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-green-500"><WhatsAppIcon className="w-6 h-6" /></a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>

    {/* Search Overlay */}
    <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Navbar;