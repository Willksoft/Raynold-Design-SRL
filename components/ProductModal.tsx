import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ArrowUpRight, Check, Share2, ShieldCheck, Star } from 'lucide-react';
import { ProductItem } from '../types';
import { useShop } from '../context/ShopContext';

interface ProductModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const { addToCart, cart, toggleFavorite, favorites } = useShop();

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!product) return null;

  const isInCart = cart.some(item => item.id === product.id);
  const isFavorite = favorites.includes(product.id);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          onClick={handleBackdropClick}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-raynold-red/10 flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-raynold-red transition-colors"
            >
              <X size={20} />
            </button>

            {/* Image Section */}
            <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-gray-900">
               <img 
                 src={product.image} 
                 alt={product.title} 
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent opacity-60 md:opacity-0 md:hover:opacity-30 transition-opacity"></div>
               <div className="absolute top-4 left-4">
                 <span className="px-3 py-1 bg-raynold-red text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                    {product.category}
                 </span>
               </div>
               
               {/* Favorite Button */}
               <div className="absolute top-4 right-16 z-20">
                  <button 
                    onClick={() => toggleFavorite(product.id)}
                    className="p-2 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-yellow-500 hover:text-white transition-colors"
                  >
                     <Star size={20} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-yellow-500" : ""} />
                  </button>
               </div>
            </div>

            {/* Details Section */}
            <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
               <h2 className="text-3xl md:text-4xl font-futuristic font-black text-white mb-2 leading-tight">
                 {product.title}
               </h2>
               <p className="text-xl text-raynold-green font-mono mb-6">{product.price}</p>

               <div className="space-y-6 mb-8 flex-grow">
                 <div>
                   <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción</h3>
                   <p className="text-gray-300 leading-relaxed font-light">
                     {product.description || "Este producto es fabricado con los más altos estándares de calidad de Raynold Design. Contáctanos para personalizarlo a tu medida."}
                   </p>
                 </div>

                 <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                       <ShieldCheck size={16} className="text-raynold-green" />
                       <span>Garantía de Calidad</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                       <Check size={16} className="text-raynold-green" />
                       <span>Personalización Total</span>
                    </div>
                 </div>
               </div>

               {/* Actions */}
               <div className="mt-auto space-y-3">
                 <button 
                   onClick={() => addToCart(product)}
                   disabled={isInCart}
                   className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                     isInCart 
                     ? 'bg-green-900/30 text-green-500 border border-green-500/30 cursor-default' 
                     : 'btn-animated shadow-raynold-red/20'
                   }`}
                 >
                    {isInCart ? (
                      <>Agregado al Carrito <Check size={20} /></>
                    ) : (
                      <>Añadir a Cotización <ShoppingBag size={20} /></>
                    )}
                 </button>

                 <div className="grid grid-cols-2 gap-3">
                   <a 
                     href={`https://wa.me/18295807411?text=Hola,%20me%20interesa%20el%20producto:%20${product.title}`}
                     target="_blank"
                     rel="noreferrer"
                     className="py-3 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                   >
                     WhatsApp Directo <ArrowUpRight size={16} />
                   </a>
                   <button 
                     onClick={() => {
                        // Dummy share
                        alert("Enlace copiado al portapapeles");
                     }}
                     className="py-3 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                   >
                     Compartir <Share2 size={16} />
                   </button>
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;