import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Lightbulb, Rocket, Linkedin, Instagram, Twitter, Eye } from 'lucide-react';
import { AboutContent, TeamMember } from '../types';
import { supabase } from '../lib/supabaseClient';

const INITIAL_ABOUT: AboutContent = {
  title: "NOSOTROS",
  subtitle: "En Raynold Design SRL, no solo imprimimos o fabricamos; materializamos ideas. Somos arquitectos de la imagen corporativa del futuro.",
  historyTitle: "Nuestra Historia",
  historyText1: "Fundada en 2018 y registrada bajo el RNC 131765602, Raynold Design srl comenzó su trayectoria en Santo Domingo y, con el tiempo, se trasladó a el municipio de Verón, en Punta Cana.",
  historyText2: "En Raynold Design srl, nos especializamos en ofrecer soluciones creativas y personalizadas. Nuestro portafolio incluye la creación de letreros innovadores, cajas de luces, letreros en 3D, cortes a láser y CNC, impresiónes de alta calidad, y rotulaciones corporativas. Además, ofrecemos una amplia gama de artículos de merchandising para potenciar la identidad de marca de nuestros clientes.",
  historyText3: "Nuestro compromiso con la calidad, la innovación y la atención al detalle nos permite brindar resultados excepcionales en cada proyecto.",
  historyImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
  stats: { projects: "500+", brands: "50+" }
};

const INITIAL_TEAM: TeamMember[] = [
  { id: "1", name: "Raynold", role: "CEO & Fundador", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop", bio: "Visionario de la estética digital y la manufactura avanzada.", color: "border-raynold-red" },
  { id: "2", name: "Elena V.", role: "Directora Creativa", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop", bio: "Experta en transformar conceptos abstractos en identidades visuales.", color: "border-raynold-green" },
  { id: "3", name: "Marcus D.", role: "Jefe de Producción", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop", bio: "Maestro del CNC y la tecnología láser. Si se puede dibujar, él lo fabrica.", color: "border-blue-500" },
  { id: "4", name: "Sarah L.", role: "Lead Designer", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop", bio: "Especialista en UI/UX y tendencias gráficas futuristas.", color: "border-yellow-500" }
];

const About: React.FC = () => {
  const [about, setAbout] = useState<AboutContent>(INITIAL_ABOUT);
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);

  useEffect(() => {
    // Fetch about content from site_settings
    supabase.from('site_settings').select('key, value').then(({ data }) => {
      if (data && data.length > 0) {
        const map: Record<string, string> = {};
        data.forEach(r => { map[r.key] = r.value; });
        setAbout(prev => ({
          ...prev,
          title: map['about_title'] || prev.title,
          subtitle: map['about_subtitle'] || prev.subtitle,
          historyTitle: map['about_history_title'] || prev.historyTitle,
          historyText1: map['about_history_text1'] || prev.historyText1,
          historyText2: map['about_history_text2'] || prev.historyText2,
          historyText3: map['about_history_text3'] || prev.historyText3,
          historyImage: map['about_history_image'] || prev.historyImage,
          stats: {
            projects: map['about_stat_projects'] || prev.stats.projects,
            brands: map['about_stat_brands'] || prev.stats.brands,
          }
        }));
      }
    });

    // Fetch team members
    supabase.from('team_members').select('*').order('sort_order').then(({ data }) => {
      if (data && data.length > 0) {
        setTeam(data.map(m => ({
          id: m.id,
          name: m.name,
          role: m.role,
          image: m.image || INITIAL_TEAM[0].image,
          bio: m.bio || '',
          color: m.color || 'border-raynold-red',
        })));
      }
    });
  }, []);

  return (
    <div className="pt-24 min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-raynold-red/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">

        {/* Header */}
        <div className="text-center mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-futuristic font-black text-white mb-6"
          >
            {about.title}
          </motion.h1>
          <div className="w-32 h-2 bg-gradient-to-r from-raynold-red via-white to-raynold-green mx-auto rounded-full mb-8"></div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            {about.subtitle}
          </p>
        </div>

        {/* History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden border border-white/10 relative group bg-gray-900">
              <img
                src={about.historyImage || INITIAL_ABOUT.historyImage}
                alt="Historia de Raynold Design"
                className="w-full h-auto max-h-[600px] object-contain transition-all duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-6 left-6">
                <h3 className="text-3xl font-futuristic font-bold text-white">{about.historyTitle}</h3>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border-r-2 border-b-2 border-raynold-red rounded-br-3xl"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <p className="text-gray-400 text-lg leading-relaxed">{about.historyText1}</p>
            <p className="text-gray-400 text-lg leading-relaxed">{about.historyText2}</p>
            <p className="text-gray-400 text-lg leading-relaxed">{about.historyText3}</p>

            <div className="flex gap-4 pt-4">
              <div className="px-6 py-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <span className="block text-3xl font-black text-raynold-red font-futuristic">{about.stats.projects}</span>
                <span className="text-xs uppercase tracking-wider text-gray-500">Proyectos</span>
              </div>
              <div className="px-6 py-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <span className="block text-3xl font-black text-raynold-green font-futuristic">{about.stats.brands}</span>
                <span className="text-xs uppercase tracking-wider text-gray-500">Marcas</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Misión y Visión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 bg-white/5 border border-white/10 rounded-3xl hover:border-raynold-red/50 transition-colors group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-raynold-red/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <Target className="w-12 h-12 text-raynold-red mb-6" />
            <h3 className="text-3xl font-bold font-futuristic text-white mb-4">Nuestra Misión</h3>
            <p className="text-gray-400 leading-relaxed text-lg">
              Transformar ideas en realidades visuales de alto impacto. Nos dedicamos a proporcionar soluciones integrales de diseño, impresión y rotulación que eleven la identidad de las marcas, garantizando calidad excepcional, creatividad y un servicio personalizado en cada proyecto comercial o corporativo.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-10 bg-white/5 border border-white/10 rounded-3xl hover:border-raynold-green/50 transition-colors group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-raynold-green/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <Eye className="w-12 h-12 text-raynold-green mb-6" />
            <h3 className="text-3xl font-bold font-futuristic text-white mb-4">Nuestra Visión</h3>
            <p className="text-gray-400 leading-relaxed text-lg">
              Ser la empresa líder en innovación publicitaria a nivel nacional, reconocida por nuestra capacidad de ejecutar proyectos complejos con precisión métrica y entregar resultados que no solo cumplen, sino que redefinen los estándares de calidad de la industria del diseño y la señalización.
            </p>
          </motion.div>
        </div>

        {/* Values */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-futuristic font-black text-white">NUESTROS <span className="text-transparent bg-clip-text bg-gradient-to-r from-raynold-red to-raynold-green">VALORES</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Innovación',
                icon: Lightbulb,
                desc: 'Adoptamos nuevas tecnologías y metodologías antes que nadie para ofrecer siempre lo más vanguardista del mercado, manteniendo a nuestros clientes a la cabeza de las tendencias visuales y tecnológicas.',
                color: 'text-yellow-400'
              },
              {
                title: 'Precisión',
                icon: Target,
                desc: 'Mantenemos una atención obsesiva a cada milímetro, textura y color. Nos aseguramos de que cada proyecto cumpla con los estándares más estrictos de calidad desde la fase de diseño inicial hasta su instalación final.',
                color: 'text-raynold-red'
              },
              {
                title: 'Compromiso',
                icon: Users,
                desc: 'Tu marca es nuestra prioridad absoluta. Trabajamos codo a codo contigo en cada etapa del proceso, garantizando responsabilidad, puntualidad, transparencia y excelencia para superar siempre tus expectativas.',
                color: 'text-raynold-green'
              }
            ].map((val, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <val.icon className={`w-10 h-10 mb-6 ${val.color}`} />
                <h3 className="text-xl font-bold font-futuristic text-white mb-3">{val.title}</h3>
                <p className="text-gray-400 leading-relaxed font-light">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-24">
          <div className="flex flex-col items-center mb-16">
            <h2 className="text-4xl font-futuristic font-black text-white text-center">
              NUESTRO <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">EQUIPO</span>
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] max-w-sm"
              >
                <div className={`relative overflow-hidden rounded-2xl bg-gray-900 border border-white/10 group-hover:${member.color} transition-colors duration-500`}>
                  <div className="aspect-[3/4] overflow-hidden relative">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-6">
                    <div className={`w-10 h-1 mb-4 ${member.color.replace('border', 'bg')}`}></div>
                    <h3 className="text-2xl font-bold text-white font-futuristic mb-1">{member.name}</h3>
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-3 font-bold">{member.role}</p>
                    <p className="text-sm text-gray-500 leading-tight mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                      {member.bio}
                    </p>
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                      <a href="#" className="text-gray-400 hover:text-white"><Linkedin size={16} /></a>
                      <a href="#" className="text-gray-400 hover:text-white"><Twitter size={16} /></a>
                      <a href="#" className="text-gray-400 hover:text-white"><Instagram size={16} /></a>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-1">
                    <div className={`w-1 h-1 rounded-full ${member.color.replace('border', 'bg')}`}></div>
                    <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">¿Listo para transformar tu marca?</h2>
          <a
            href="https://wa.me/18295807411?text=Hola,%20vi%20su%20página%20y%20quiero%20conocer%20más%20sobre%20sus%20servicios."
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-raynold-green text-white font-bold rounded-full hover:bg-green-600 transition-all shadow-[0_0_20px_rgba(0,153,51,0.4)]"
          >
            <Rocket size={20} />
            AGENDAR REUNIÓN
          </a>
        </div>

      </div>
    </div>
  );
};

export default About;