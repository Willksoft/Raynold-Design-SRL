import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { servicesData, ServiceDetail } from '../data/services';
import TiltCard from './TiltCard';
import { useUI } from '../context/UIContext';
import { supabase } from '../lib/supabaseClient';
import { Monitor, Printer, Image as ImageIcon, Wrench, Truck, Gift, Building2, PenTool, Video, Smartphone, Palette, Camera, Briefcase, Layers, Layout, Megaphone } from 'lucide-react';

const ICONS_MAP: Record<string, React.ElementType> = {
  Monitor, Printer, Image: ImageIcon, Wrench, Truck, Gift, Building2,
  PenTool, Video, Smartphone, Palette, Camera, Briefcase, Layers, Layout, Megaphone
};

// Helper for specific color styles to ensure Tailwind detects them
const getColorStyles = (color: 'red' | 'green' | 'white') => {
  switch (color) {
    case 'red':
      return {
        wrapper: 'bg-raynold-red/10 border-raynold-red/20 shadow-[0_0_15px_rgba(230,0,0,0.2)]',
        icon: 'text-raynold-red',
        corner: 'from-raynold-red/20',
        hoverBorder: 'group-hover:border-raynold-red'
      };
    case 'green':
      return {
        wrapper: 'bg-raynold-green/10 border-raynold-green/20 shadow-[0_0_15px_rgba(0,153,51,0.2)]',
        icon: 'text-raynold-green',
        corner: 'from-raynold-green/20',
        hoverBorder: 'group-hover:border-raynold-green'
      };
    case 'white':
    default:
      return {
        wrapper: 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]',
        icon: 'text-white',
        corner: 'from-gray-500/20',
        hoverBorder: 'group-hover:border-white'
      };
  }
};

const Services: React.FC = () => {
  const { setDroneTarget } = useUI();
  const [services, setServices] = useState<ServiceDetail[]>(servicesData);

  useEffect(() => {
    supabase.from('services').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data && data.length > 0) {
        setServices(data.map((s: any) => {
          const original = servicesData.find(os => os.slug === s.slug);
          const IconComponent = s.icon && ICONS_MAP[s.icon] ? ICONS_MAP[s.icon] : (original?.icon ?? Monitor);
          return {
            ...s,
            icon: IconComponent,
            color: (s.color || 'white') as 'red' | 'green' | 'white',
            features: Array.isArray(s.features) ? s.features : [],
            benefits: s.benefits || original?.benefits || [],
            fullDescription: s.full_description || s.description || '',
          };
        }));
      }
    });
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, title: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    setDroneTarget({
      x,
      y,
      active: true,
      text: `ANALIZANDO: ${title.toUpperCase()}`
    });
  };

  const handleMouseLeave = () => {
    setDroneTarget(null);
  };

  return (
    <section id="services" className="py-24 bg-raynold-black relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-futuristic font-bold text-white mb-4 gsap-reveal">
            Nuestros <span className="text-raynold-red">Servicios</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-raynold-red to-raynold-green mx-auto rounded-full gsap-reveal"></div>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto gsap-reveal">
            Soluciones integrales de diseño y producción publicitaria bajo un mismo techo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const styles = getColorStyles(service.color);

            return (
              <Link to={`/services/${service.slug}`} key={service.id} className="gsap-reveal">
                <motion.div
                  onMouseEnter={(e) => handleMouseEnter(e, service.title)}
                  onMouseLeave={handleMouseLeave}
                >
                  <TiltCard className="h-full">
                    <div className="group relative p-8 bg-black/90 border border-white/10 rounded-2xl overflow-hidden hover:border-white/30 transition-all duration-300 shadow-xl h-full">
                      {/* Background Image Overlay */}
                      {service.image && (
                        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                          <img
                            src={service.image}
                            alt={service.title}
                            className="w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
                        </div>
                      )}

                      {/* Corner Gradient */}
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${styles.corner} to-transparent rounded-bl-[100px] -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110 opacity-60 z-10`}></div>

                      <div className="relative z-10">
                        {/* Icon Container */}
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-8 border transition-all duration-300 ${styles.wrapper} ${styles.hoverBorder} group-hover:scale-105 backdrop-blur-md`}>
                          {service.icon && <service.icon className={`w-10 h-10 ${styles.icon}`} strokeWidth={1.5} />}
                        </div>

                        <h3 className="text-2xl font-bold text-white font-futuristic mb-4 group-hover:text-raynold-red transition-colors">
                          {service.title}
                        </h3>

                        <p className="text-gray-400 leading-relaxed text-base font-light">
                          {service.description}
                        </p>

                        <div className="mt-6 flex items-center text-sm font-bold text-gray-500 group-hover:text-white transition-colors">
                          Ver Detalles &rarr;
                        </div>
                      </div>

                      {/* Hover Bottom Line */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-raynold-red via-white to-raynold-green transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                    </div>
                  </TiltCard>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;