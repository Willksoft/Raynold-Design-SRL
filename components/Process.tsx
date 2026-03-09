import React, { useState, useEffect } from 'react';
import { ClipboardList, PenTool, Cog, Truck, Star, Zap, ShieldCheck, Clock, Package, Monitor, Printer, Camera } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const ICONS_MAP: Record<string, React.ElementType> = {
  ClipboardList, PenTool, Cog, Truck, Star, Zap, ShieldCheck, Clock, Package, Monitor, Printer, Camera,
};

interface ProcessStep {
  id: number;
  title: string;
  desc: string;
  icon: string;
}

const defaultSteps: ProcessStep[] = [
  { id: 1, title: 'Consulta', desc: 'Analizamos tus necesidades y definimos el alcance del proyecto.', icon: 'ClipboardList' },
  { id: 2, title: 'Diseño', desc: 'Nuestro equipo creativo desarrolla propuestas visuales impactantes.', icon: 'PenTool' },
  { id: 3, title: 'Producción', desc: 'Fabricación con tecnología láser, impresión UV y materiales premium.', icon: 'Cog' },
  { id: 4, title: 'Entrega', desc: 'Instalación profesional y entrega puntual en todo el país.', icon: 'Truck' },
];

const Process: React.FC = () => {
  const [steps, setSteps] = useState<ProcessStep[]>(defaultSteps);
  const [sectionTitle, setSectionTitle] = useState('Protocolo de Ejecución');
  const [sectionSubtitle, setSectionSubtitle] = useState('Sistema optimizado de 4 fases para garantizar resultados de alta precisión.');

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'process_data').single().then(({ data }) => {
      if (data) {
        const parsed = JSON.parse(data.value);
        if (parsed.steps) setSteps(parsed.steps);
        if (parsed.sectionTitle) setSectionTitle(parsed.sectionTitle);
        if (parsed.sectionSubtitle) setSectionSubtitle(parsed.sectionSubtitle);
      }
    });
  }, []);

  return (
    <section id="process" className="py-32 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none z-0"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24">
          <h2 className="text-3xl md:text-5xl font-futuristic font-bold text-white mb-4 gsap-reveal">
            {sectionTitle.split(' ').map((word, i, arr) =>
              i === arr.length - 1 ? <span key={i} className="text-raynold-green"> {word}</span> : word + ' '
            )}
          </h2>
          <p className="text-gray-400 gsap-reveal max-w-2xl mx-auto">{sectionSubtitle}</p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-[6rem] left-0 w-full h-24 pointer-events-none z-[5]">
            <svg className="w-full h-full overflow-visible gsap-process-line drop-shadow-[0_0_15px_rgba(0,255,85,0.8)]">
              <defs>
                <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="greenBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00ff55" stopOpacity="1" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#00ff55" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path d="M 0 40 L 100% 40" fill="none" stroke="url(#greenBeam)" strokeWidth="6" strokeLinecap="round" filter="url(#neon-glow)" vectorEffect="non-scaling-stroke" className="process-path" />
            </svg>
          </div>

          <div className={`grid grid-cols-1 gap-8 ${steps.length === 3 ? 'md:grid-cols-3' : steps.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
            {steps.map((step, idx) => {
              const IconComp = ICONS_MAP[step.icon] || Star;
              return (
                <div key={idx} className="gsap-process-card relative bg-black/80 backdrop-blur-xl border border-white/10 p-8 rounded-xl flex flex-col items-center text-center transition-all duration-300 z-10">
                  <div className="hidden md:block absolute top-[6rem] -translate-y-1/2 -left-[1px] w-3 h-3 bg-black border border-green-500 rounded-full z-20 shadow-[0_0_10px_#00ff55]"></div>
                  <div className="hidden md:block absolute top-[6rem] -translate-y-1/2 -right-[1px] w-3 h-3 bg-black border border-green-500 rounded-full z-20 shadow-[0_0_10px_#00ff55]"></div>
                  <div className="process-icon-box w-20 h-20 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center mb-6 relative z-10 transition-all duration-500 shadow-lg">
                    <IconComp className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 font-futuristic uppercase tracking-wide">{step.title}</h3>
                  <p className="text-sm text-gray-400 font-light leading-relaxed">{step.desc}</p>
                  <div className="process-number absolute top-2 right-4 text-5xl font-black text-white/5 font-futuristic select-none transition-colors duration-500">
                    0{idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;