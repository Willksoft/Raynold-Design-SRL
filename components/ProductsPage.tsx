import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowUpRight, Plus, Star, Check } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import { ProductItem } from '../types';

const categories = ['Todos', 'Señalización', 'Impresión', 'Promocional', 'Textil', 'Wrapping', 'Exhibición', 'Papelería'];

const ProductsPage: React.FC = () => {
  const [filter, setFilter] = useState('Todos');
  const { products, addToCart, toggleFavorite, favorites, cart } = useShop();
  const navigate = useNavigate();

  const filteredProducts = filter === 'Todos'
    ? products
    : products.filter(p => p.category === filter);

  return (
    <div className="pt-24 min-h-screen bg-raynold-black relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-futuristic font-black text-white mb-4">
              CATÁLOGO <span className="animate-gradient-text">2025</span>
            </h1>
            <p className="text-gray-400">Explora nuestra gama de productos de alta calidad.</p>
          </div>

          <button
            onClick={() => window.open('https://wa.me/18295807411', '_blank')}
            className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2"
          >
            <ShoppingBag size={18} />
            Hacer Pedido Especial
          </button>
        </div>

        {/* Filters */}
        <div className="mb-12 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${filter === cat
                  ? 'bg-white text-black border-white scale-105'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:border-white/30'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredProducts.map((product: ProductItem & { slug?: string }) => {
              const isInCart = cart.some(item => item.id === product.id);

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={product.id}
                  onClick={() => navigate(`/products/${product.slug || product.id}`)}
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
                        className="bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-yellow-500 hover:text-white transition-colors"
                      >
                        <Star size={16} fill={favorites.includes(product.id) ? "currentColor" : "none"} className={favorites.includes(product.id) ? "text-yellow-500" : ""} />
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                      {product.category}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-white font-futuristic mb-2">{product.title}</h3>
                    {product.price && <p className="text-gray-400 text-sm font-mono mb-4">{product.price}</p>}

                    <div className="mt-auto flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        disabled={isInCart}
                        className={`flex-1 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${isInCart
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

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">No se encontraron productos en esta categoría.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductsPage;