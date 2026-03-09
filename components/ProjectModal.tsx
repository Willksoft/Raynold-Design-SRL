import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, Check, Share2, Building2, User } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  category: string;
  image: string;
  client: string;
  description?: string;
}

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, isOpen, onClose }) => {
  
  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!project) return null;

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
            className="relative w-full max-w-5xl bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-raynold-red/10 flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-raynold-red transition-colors"
            >
              <X size={20} />
            </button>

            {/* Image Section */}
            <div className="w-full md:w-2/3 h-64 md:h-auto relative bg-gray-900">
               <img 
                 src={project.image} 
                 alt={project.title} 
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60 md:opacity-0"></div>
            </div>

            {/* Details Section */}
            <div className="w-full md:w-1/3 p-8 flex flex-col overflow-y-auto bg-[#0F0F0F]">
               <div className="mb-2">
                 <span className="px-3 py-1 bg-raynold-red/20 text-raynold-red border border-raynold-red/30 text-xs font-bold uppercase tracking-wider rounded-full">
                    {project.category}
                 </span>
               </div>
               
               <h2 className="text-3xl font-futuristic font-black text-white mb-6 leading-tight">
                 {project.title}
               </h2>

               <div className="space-y-6 mb-8 flex-grow">
                 
                 <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="p-2 bg-black rounded-lg text-raynold-green">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h4 className="text-xs text-gray-400 uppercase tracking-widest font-bold">Cliente</h4>
                        <p className="text-white font-medium">{project.client}</p>
                    </div>
                 </div>

                 <div>
                   <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Sobre el Proyecto</h3>
                   <p className="text-gray-300 leading-relaxed font-light text-sm">
                     {project.description || `Este proyecto para ${project.client} fue desarrollado utilizando nuestras técnicas más avanzadas en ${project.category.toLowerCase()}. Nos enfocamos en la durabilidad, el impacto visual y la fidelidad a la identidad de marca.`}
                   </p>
                 </div>
                 
                 <div className="border-t border-white/10 pt-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Servicios Aplicados</h3>
                    <div className="flex flex-wrap gap-2">
                        {['Diseño', 'Producción', 'Instalación'].map(tag => (
                            <span key={tag} className="text-xs text-gray-500 bg-black px-2 py-1 rounded border border-white/10">{tag}</span>
                        ))}
                    </div>
                 </div>

               </div>

               {/* Actions */}
               <div className="mt-auto space-y-3">
                 <a 
                   href={`https://wa.me/18295807411?text=Hola,%20me%20gustó%20el%20proyecto%20"${project.title}"%20y%20quisiera%20algo%20similar.`}
                   target="_blank"
                   rel="noreferrer"
                   className="w-full py-4 btn-animated font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg text-center"
                 >
                    Cotizar Algo Similar <ArrowUpRight size={18} />
                 </a>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;