import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ZoomIn } from 'lucide-react';
import ProjectModal from './ProjectModal';

const projects = [
  { 
    id: 1, 
    title: 'Torre Empresarial Neon', 
    category: 'Señalización', 
    image: 'https://images.unsplash.com/photo-1555431189-0fabf2667795?q=80&w=1000&auto=format&fit=crop', 
    client: 'Banco BHD',
    description: 'Instalación de letreros corporativos luminosos en la fachada principal. Utilizamos tecnología LED neon flex de alta resistencia para garantizar visibilidad nocturna y bajo consumo energético.' 
  },
  { 
    id: 2, 
    title: 'Flota Comercial', 
    category: 'Wrapping', 
    image: 'https://images.unsplash.com/photo-1625902377366-41e73e979a40?q=80&w=1000&auto=format&fit=crop', 
    client: 'Coca Cola',
    description: 'Rotulación integral de flota de camiones de distribución. Vinilo cast de alto rendimiento con laminado UV para protección contra el sol y rayaduras.'
  },
  { 
    id: 3, 
    title: 'Interior Corporativo', 
    category: 'Diseño', 
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop', 
    client: 'Altice',
    description: 'Diseño y ambientación de oficinas centrales. Incluye señalética interna, vinilos esmerilados para privacidad y murales decorativos impresos en alta resolución.'
  },
  { 
    id: 4, 
    title: 'Stand de Feria', 
    category: 'Exhibición', 
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1000&auto=format&fit=crop', 
    client: 'Ministerio de Turismo',
    description: 'Fabricación de stand modular para feria internacional. Estructuras ligeras, counters personalizados y back-panels iluminados.'
  },
  { 
    id: 5, 
    title: 'Letras 3D Lobby', 
    category: 'Señalización', 
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=1000&auto=format&fit=crop', 
    client: 'Hotel Barceló',
    description: 'Logotipo corpóreo en acero inoxidable con acabado espejo. Instalación flotante en pared de mármol para el lobby principal.'
  },
  { 
    id: 6, 
    title: 'Menú Digital', 
    category: 'Diseño', 
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop', 
    client: 'TGI Fridays',
    description: 'Diseño de contenido animado para pantallas de menú (Digital Signage). Fotografía de producto y animación de ofertas para aumentar la interacción.'
  },
];

const categories = ['Todos', 'Señalización', 'Wrapping', 'Diseño', 'Exhibición'];

const ProjectsPage: React.FC = () => {
  const [filter, setFilter] = useState('Todos');
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null);

  const filteredProjects = filter === 'Todos' 
    ? projects 
    : projects.filter(p => p.category === filter);

  return (
    <>
    <div className="pt-24 min-h-screen bg-raynold-black relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-7xl font-futuristic font-black text-white mb-6">
            NUESTROS <span className="animate-gradient-text">PROYECTOS</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Una selección de trabajos donde la creatividad se encuentra con la precisión técnica.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center flex-wrap gap-4 mb-16">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${
                filter === cat 
                ? 'bg-raynold-red border-raynold-red text-white shadow-lg shadow-red-900/50' 
                : 'bg-transparent border-white/20 text-gray-400 hover:border-white hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredProjects.map((project) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer bg-gray-900 border border-white/5 hover:border-white/20 transition-colors"
              >
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                  <span className="text-raynold-green text-xs font-bold uppercase tracking-wider mb-2">
                    {project.category}
                  </span>
                  <h3 className="text-2xl font-bold text-white font-futuristic mb-1">{project.title}</h3>
                  <p className="text-gray-300 text-sm">Cliente: {project.client}</p>
                </div>

                {/* Icon */}
                <div className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-100">
                   <ZoomIn size={18} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-20">
             <Layers size={48} className="mx-auto text-gray-600 mb-4" />
             <p className="text-gray-500">No hay proyectos para mostrar en esta categoría.</p>
          </div>
        )}

      </div>
    </div>
    
    <ProjectModal 
      project={selectedProject} 
      isOpen={!!selectedProject} 
      onClose={() => setSelectedProject(null)} 
    />
    </>
  );
};

export default ProjectsPage;