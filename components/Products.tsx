import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowUpRight, Plus, Star } from 'lucide-react';
import { ProductItem } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { supabase } from '../lib/supabaseClient';
import TiltCard from './TiltCard';

const Products: React.FC = () => {
  const { addToCart, toggleFavorite, favorites } = useShop();
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<(ProductItem & { slug?: string })[]>([]);

  useEffect(() => {
    supabase
      .from('products')
      .select('id, title, description, price, image, category, reference, unit, slug')
      .eq('is_active', true)
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setFeaturedProducts(data.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description || '',
            price: p.price ? `RD$ ${Number(p.price).toLocaleString()}` : 'Consultar',
            image: p.image || `https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600`,
            category: p.category || 'Producto',
            reference: p.reference,
            unit: p.unit,
            slug: p.slug,
          })));
        }
      });
  }, []);

  return (
    <section id="products" className="py-24 bg-raynold-black relative">
      {/* Background accent */}
      <div className="absolute right-0 top-1/4 w-1/3 h-1/2 bg-gradient-to-b from-raynold-red/5 to-transparent blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-raynold-red">
              <ShoppingBag size={20} />
              <span className="font-bold tracking-widest text-sm uppercase">Catálogo</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-futuristic font-bold text-white">
              Productos <span className="text-transparent bg-clip-text animate-gradient-text">Destacados</span>
            </h2>
          </div>
          <Link to="/products" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <span className="text-sm font-medium">Ver todo el catálogo</span>
            <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <TiltCard onClick={() => navigate(`/products/${product.slug || product.id}`)}>
                <div className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-900 border border-white/10 shadow-lg cursor-pointer">
                  {/* Image */}
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                  />

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                    className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-yellow-500 hover:text-white transition-colors"
                  >
                    <Star size={20} fill={favorites.includes(product.id) ? "currentColor" : "none"} className={favorites.includes(product.id) ? "text-yellow-500" : ""} />
                  </button>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-300" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-raynold-red text-xs font-bold tracking-wider uppercase mb-1 block">
                      {product.category}
                    </span>
                    <h3 className="text-2xl font-bold text-white font-futuristic mb-2">{product.title}</h3>
                    <span className="text-white font-medium block mb-4">{product.price}</span>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        className="flex-1 py-2 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus size={16} /> Agregar
                      </button>
                      <a
                        href={`https://wa.me/18295807411?text=Hola,%20me%20interesa%20el%20producto:%20${product.title}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-10 h-10 rounded-lg border border-white/20 text-white flex items-center justify-center hover:bg-raynold-green hover:border-raynold-green transition-colors"
                      >
                        <ArrowUpRight size={20} />
                      </a>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;