import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck, Zap } from 'lucide-react';

const Features: React.FC = () => {
  return (
    <section className="py-20 bg-raynold-black border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center text-center p-6"
          >
            <div className="w-12 h-12 bg-raynold-red/10 rounded-full flex items-center justify-center mb-4 text-raynold-red">
               <Zap size={24} />
            </div>
            <h3 className="text-lg font-bold text-white font-futuristic mb-2">Entrega Rápida</h3>
            <p className="text-sm text-gray-500">Optimizamos tiempos de producción sin sacrificar calidad.</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center text-center p-6"
          >
            <div className="w-12 h-12 bg-raynold-green/10 rounded-full flex items-center justify-center mb-4 text-raynold-green">
               <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-white font-futuristic mb-2">Garantía de Calidad</h3>
            <p className="text-sm text-gray-500">Materiales premium resistentes a exteriores y desgaste.</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center text-center p-6"
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400">
               <Clock size={24} />
            </div>
            <h3 className="text-lg font-bold text-white font-futuristic mb-2">Soporte 24/7</h3>
            <p className="text-sm text-gray-500">Atención personalizada vía WhatsApp para tus urgencias.</p>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Features;