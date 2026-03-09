import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ZoomIn } from 'lucide-react';
import ProjectModal from './ProjectModal';
import { supabase } from '../lib/supabaseClient';

const ProjectsPage: React.FC = () => {
  const [filter, setFilter] = useState('Todos');
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setProjects(data.map(p => ({ ...p, image: p.image_url || p.image })));
        const uniqueCategories = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
        setCategories(['Todos', ...uniqueCategories]);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

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
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${filter === cat
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