import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowUpRight, Plus, Star, Check, Trash2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import ProductModal from './ProductModal';
import { ProductItem } from '../types';
import { Link } from 'react-router-dom';

const FavoritesPage: React.FC = () => {
  const { products, addToCart, toggleFavorite, favorites, cart } = useShop();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  return (
    <>
    <div className="pt-24 min-h-screen bg-raynold-black relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
           <div>
              <h1 className="text-4xl md:text-6xl font-futuristic font-black text-white mb-4">
                MIS <span className="animate-gradient-text">FAVORITOS</span>
              </h1>
              <p className="text-gray-400">Tus productos seleccionados y guardados.</p>
           </div>
           
           <Link 
             to="/products"
             className="px-6 py-3 border border-white/20 rounded-lg flex items-center gap-2 hover:bg-white/5 transition-colors"
           >
             <ShoppingBag size={18} />
             Ver Catálogo Completo
           </Link>
        </div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {favoriteProducts.map((product) => {
              const isInCart = cart.some(item => item.id === product.id);
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="group relative bg-gray-900 rounded-xl overflow-hidden border border-white/10 hover:border-raynold-red/50 transition-colors flex flex-col cursor-pointer"
                >
                  <div className="aspect-square relative overflow-hidden bg-gray-800">
                     <img 
                       src={product.image} 
                       alt={product.title} 
                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                     />
                     <div className="absolute top-2 right-2 flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                          className="bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-red-500 hover:text-white transition-colors"
                          title="Eliminar de favoritos"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                     <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                        {product.category}
                     </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                     <h3 className="text-lg font-bold text-white font-futuristic mb-2">{product.title}</h3>
                     <p className="text-gray-400 text-sm font-mono mb-4">{product.price}</p>
                     
                     <div className="mt-auto flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                          disabled={isInCart}
                          className={`flex-1 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                            isInCart 
                            ? 'bg-green-900/50 text-green-400 border border-green-500/30 cursor-default' 
                            : 'bg-white text-black hover:bg-gray-200'
                          }`}
                        >
                           {isInCart ? <><Check size={16} /> Agregado</> : <><Plus size={16} /> Añadir</>}
                        </button>
                        <a 
                          href={`https://wa.me/18295807411?text=Hola,%20me%20interesa%20el%20producto:%20${product.title}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2.5 border border-white/20 text-white rounded-lg hover:bg-raynold-green hover:border-raynold-green transition-colors"
                        >
                           <ArrowUpRight size={18} />
                        </a>
                     </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {favoriteProducts.length === 0 && (
           <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <Star size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No tienes favoritos aún</h3>
              <p className="text-gray-400 mb-6">Explora nuestro catálogo y guarda los productos que te gusten.</p>
              <Link 
                to="/products"
                className="px-6 py-3 btn-animated inline-block font-bold rounded-lg"
              >
                Explorar Productos
              </Link>
           </div>
        )}

      </div>
    </div>
    <ProductModal 
      product={selectedProduct} 
      isOpen={!!selectedProduct} 
      onClose={() => setSelectedProduct(null)} 
    />
    </>
  );
};

export default FavoritesPage;
