import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck, Zap, Star, Package, Monitor, Printer, Camera, Truck, PenTool, Cog, ClipboardList } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const ICONS_MAP: Record<string, React.ElementType> = {
  Zap, ShieldCheck, Clock, Star, Package, Monitor, Printer, Camera, Truck, PenTool, Cog, ClipboardList,
};

const COLOR_MAP: Record<string, string> = {
  red: 'bg-raynold-red/10 text-raynold-red',
  green: 'bg-raynold-green/10 text-raynold-green',
  blue: 'bg-blue-500/10 text-blue-400',
  yellow: 'bg-yellow-500/10 text-yellow-400',
  purple: 'bg-purple-500/10 text-purple-400',
  white: 'bg-white/10 text-white',
};

interface Feature {
  title: string;
  desc: string;
  icon: string;
  color: string;
}

const defaultFeatures: Feature[] = [
  { title: 'Entrega Rápida', desc: 'Optimizamos tiempos de producción sin sacrificar calidad.', icon: 'Zap', color: 'red' },
  { title: 'Garantía de Calidad', desc: 'Materiales premium resistentes a exteriores y desgaste.', icon: 'ShieldCheck', color: 'green' },
  { title: 'Soporte 24/7', desc: 'Atención personalizada vía WhatsApp para tus urgencias.', icon: 'Clock', color: 'blue' },
];

const Features: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>(defaultFeatures);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'features_data').single().then(({ data }) => {
      if (data) {
        const parsed = JSON.parse(data.value);
        if (parsed.features) setFeatures(parsed.features);
      }
    });
  }, []);

  return (
    <section className="py-20 bg-raynold-black border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(features.length, 3)} gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10`}>
          {features.map((f, i) => {
            const IconComp = ICONS_MAP[f.icon] || Zap;
            const colorClass = COLOR_MAP[f.color] || COLOR_MAP.white;
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center text-center p-6"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${colorClass}`}>
                  <IconComp size={24} />
                </div>
                <h3 className="text-lg font-bold text-white font-futuristic mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;