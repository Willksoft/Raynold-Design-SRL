import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Send, ShoppingBag } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Link } from 'react-router-dom';

const CartSidebar: React.FC = () => {
  const { isCartOpen, toggleCart, cart, removeFromCart } = useShop();

  const handleCheckout = () => {
    let message = "Hola Raynold Design, me gustaría cotizar los siguientes productos de su web:%0A%0A";
    
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.title} (${item.category})%0A`;
    });
    
    message += "%0AQuedo atento a su respuesta para coordinar detalles y precios.";
    
    window.open(`https://wa.me/18295807411?text=${message}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0A0A0A] border-l border-white/10 shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50">
              <div className="flex items-center gap-2">
                 <ShoppingBag className="text-raynold-green" />
                 <h2 className="text-xl font-futuristic font-bold text-white">Tu Cotización</h2>
                 <span className="bg-white/10 text-xs px-2 py-1 rounded-full text-gray-400">{cart.length} items</span>
              </div>
              <button onClick={toggleCart} className="text-gray-400 hover:text-white transition-colors">
                <X />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                   <ShoppingBag size={48} className="mb-4 text-gray-600" />
                   <p className="text-gray-400 text-lg">Tu carrito está vacío</p>
                   <p className="text-sm text-gray-600 mt-2">Agrega productos para solicitar una cotización.</p>
                   <Link to="/products" onClick={toggleCart} className="mt-6 px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white text-sm">
                     Ver Productos
                   </Link>
                </div>
              ) : (
                cart.map((item, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={`${item.id}-${index}`} 
                    className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors group"
                  >
                     <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                       <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <h3 className="text-white font-bold truncate">{item.title}</h3>
                       <p className="text-xs text-raynold-red uppercase tracking-wider">{item.category}</p>
                       <p className="text-xs text-gray-500 mt-1">{item.price}</p>
                     </div>
                     <button 
                       onClick={() => removeFromCart(item.id)}
                       className="text-gray-600 hover:text-red-500 transition-colors self-start"
                     >
                       <Trash2 size={18} />
                     </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-black/50">
                 <div className="mb-4">
                    <p className="text-xs text-gray-500 text-center">
                      Al proceder, se abrirá WhatsApp con el detalle de estos productos para que un agente te cotice.
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <Link 
                     to="/products" 
                     onClick={toggleCart}
                     className="py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold text-center transition-colors border border-white/10"
                   >
                     + Añadir Más
                   </Link>
                   <button 
                     onClick={handleCheckout}
                     className="py-3 bg-raynold-green hover:bg-green-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                   >
                     <Send size={18} />
                     Cotizar Lote
                   </button>
                 </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;