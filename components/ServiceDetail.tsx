import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Zap, Loader2 } from 'lucide-react';
import { servicesData, ServiceDetail as ServiceDetailType } from '../data/services';
import { supabase } from '../lib/supabaseClient';

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const ServiceDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [service, setService] = useState<ServiceDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      const { data } = await supabase.from('services').select('*').eq('slug', slug).single();

      if (data) {
        const original = servicesData.find(os => os.slug === slug);
        setService({
          ...data,
          icon: original?.icon || null,
          features: Array.isArray(data.features) ? data.features : [],
          benefits: data.benefits || original?.benefits || [],
          fullDescription: data.full_description || data.description || '',
        } as ServiceDetailType);
      } else {
        setService(null);
      }
      setLoading(false);
    };

    fetchService();
  }, [slug]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-raynold-red animate-spin mb-4" />
        <p className="text-gray-400 font-futuristic">Cargando...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h2 className="text-4xl font-futuristic mb-4">Servicio no encontrado</h2>
        <Link to="/" className="text-raynold-red hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  const isRed = service.color === 'red';
  const isGreen = service.color === 'green';
  const accentColor = isRed ? 'text-raynold-red' : isGreen ? 'text-raynold-green' : 'text-white';
  const bgAccent = isRed ? 'bg-raynold-red' : isGreen ? 'bg-raynold-green' : 'bg-white';
  const borderAccent = isRed ? 'border-raynold-red' : isGreen ? 'border-raynold-green' : 'border-white';

  return (
    <div className="min-h-screen bg-raynold-black pt-20">

      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-raynold-black via-raynold-black/80 to-transparent"></div>
        </div>

        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16">
          <Link to="/#services" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={20} /> Volver a Servicios
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${borderAccent}/30 ${bgAccent}/10 backdrop-blur-md mb-4`}>
              <Zap size={14} className={accentColor} />
              <span className={`text-xs uppercase tracking-widest font-bold ${accentColor}`}>Servicio Profesional</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-futuristic font-black text-white mb-4">
              {service.title}
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl font-light">
              {service.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

            {/* Main Description */}
            <div className="lg:col-span-2 space-y-12">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-bold text-white font-futuristic mb-6 flex items-center gap-3">
                  <span className={`w-2 h-8 ${bgAccent} rounded-full`}></span>
                  Descripción del Servicio
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed whitespace-pre-line">
                  {service.fullDescription}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {service.benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <h3 className={`text-lg font-bold ${accentColor} mb-2 font-futuristic`}>{benefit.title}</h3>
                    <p className="text-sm text-gray-400">{benefit.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sidebar / Features */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-8">

                <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                  <h3 className="text-xl font-bold text-white font-futuristic mb-6">Incluye</h3>
                  <ul className="space-y-4">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-300">
                        <CheckCircle2 className={`${accentColor} shrink-0`} size={20} />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-full h-1 ${bgAccent}`}></div>
                  <h3 className="text-2xl font-bold text-white font-futuristic mb-4">¿Te interesa?</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Cotiza este servicio ahora mismo vía WhatsApp. Respuesta inmediata.
                  </p>
                  <a
                    href={`https://wa.me/18295807411?text=Hola,%20me%20interesa%20más%20información%20sobre%20el%20servicio%20de%20${encodeURIComponent(service.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 ${isRed ? 'bg-raynold-red text-white' : isGreen ? 'bg-raynold-green text-white' : 'bg-white text-black'}`}
                  >
                    <WhatsAppIcon className="w-6 h-6" />
                    Solicitar Cotización
                  </a>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default ServiceDetail;