import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Package, Layers } from 'lucide-react';
import { allProducts } from '../data/products';
import { Link } from 'react-router-dom';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const services = [
  { title: 'Diseño Gráfico', href: '/#services' },
  { title: 'Letreros 3D & Neon', href: '/#services' },
  { title: 'Servicio de Impresión', href: '/#services' },
  { title: 'Rótulos Corporativos', href: '/#services' },
  { title: 'Wrapping Vehicular', href: '/#services' },
  { title: 'Artículos Personalizados', href: '/#services' },
];

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const filteredProducts = query 
    ? allProducts.filter(p => p.title.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredServices = query
    ? services.filter(s => s.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  const hasResults = filteredProducts.length > 0 || filteredServices.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 max-w-5xl mx-auto w-full">
             <div className="flex items-center gap-2 text-raynold-green">
               <Search size={20} />
               <span className="font-futuristic font-bold tracking-widest uppercase text-sm">Buscador Inteligente</span>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
               <X size={24} />
             </button>
          </div>

          {/* Search Input */}
          <div className="max-w-3xl mx-auto w-full px-6 mt-12">
            <div className="relative group">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca servicios o productos..."
                className="w-full bg-transparent border-b-2 border-white/20 py-4 text-3xl md:text-5xl font-futuristic text-white placeholder-gray-600 focus:outline-none focus:border-raynold-red transition-all"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                <span className="text-xs text-gray-500 font-mono">ESC para cerrar</span>
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto mt-8 px-6 pb-20">
             <div className="max-w-4xl mx-auto">
                {!query && (
                  <div className="text-center text-gray-600 mt-20">
                    <p className="font-futuristic text-lg">Escribe para comenzar la búsqueda...</p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                       {['Neon', 'Tarjetas', 'Wrapping', 'Impresión'].map(tag => (
                         <button 
                           key={tag}
                           onClick={() => setQuery(tag)}
                           className="px-4 py-2 rounded-full border border-white/10 text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                         >
                           {tag}
                         </button>
                       ))}
                    </div>
                  </div>
                )}

                {query && !hasResults && (
                   <div className="text-center mt-20">
                     <p className="text-gray-500">No encontramos resultados para "{query}"</p>
                   </div>
                )}

                <div className="space-y-8">
                  {/* Products Results */}
                  {filteredProducts.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Package size={14} /> Productos Encontrados ({filteredProducts.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProducts.map(product => (
                          <Link 
                            key={product.id} 
                            to="/products" 
                            onClick={onClose}
                            className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-raynold-red/50 transition-all group"
                          >
                            <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                               <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div>
                               <h4 className="text-white font-bold font-futuristic group-hover:text-raynold-red transition-colors">{product.title}</h4>
                               <span className="text-xs text-gray-500">{product.category}</span>
                            </div>
                            <ArrowRight className="ml-auto text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" size={18} />
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Services Results */}
                  {filteredServices.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                         <Layers size={14} /> Servicios Relacionados ({filteredServices.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {filteredServices.map((service, idx) => (
                          <a 
                            key={idx}
                            href={service.href} 
                            onClick={onClose}
                            className="px-4 py-3 bg-white/5 border border-white/5 rounded-lg text-white hover:bg-raynold-green/20 hover:border-raynold-green/50 transition-all text-sm font-medium flex items-center justify-between group"
                          >
                            {service.title}
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-raynold-green" />
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;