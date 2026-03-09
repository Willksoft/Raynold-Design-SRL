import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Building2, MapPin, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Project {
    id: number | string;
    title: string;
    category: string;
    image: string;
    client?: string;
    description?: string;
    location?: string;
    completion_date?: string;
    gallery?: string[];
}

const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Scroll to top when page loads
        window.scrollTo(0, 0);

        const fetchProject = async () => {
            if (!id) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single();

            if (data) {
                setProject({ ...data, image: data.image_url || data.image });
            } else {
                // Handle error or redirect
                if (error) console.error("Error fetching project:", error);
            }
            setLoading(false);
        };

        fetchProject();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-raynold-black flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-raynold-red animate-spin" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-raynold-black flex flex-col items-center justify-center text-center p-6">
                <h1 className="text-4xl font-bold font-futuristic text-white mb-4">Proyecto no encontrado</h1>
                <p className="text-gray-400 mb-8">El proyecto que buscas no existe o ha sido eliminado.</p>
                <button onClick={() => navigate('/projects')} className="btn-animated px-8 py-3 rounded-full font-bold">
                    Volver a Proyectos
                </button>
            </div>
        );
    }

    return (
        <div className="pt-24 min-h-screen bg-raynold-black relative">
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">

                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold text-sm uppercase tracking-widest">Atrás</span>
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row"
                >
                    {/* Image Section */}
                    <div className="w-full lg:w-2/3 flex flex-col bg-[#050505]">
                        <div className="relative w-full shrink-0">
                            <img
                                src={project.image}
                                alt={project.title}
                                className="w-full h-[50vh] lg:h-[70vh] object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-80 lg:opacity-60"></div>
                        </div>

                        {project.gallery && project.gallery.length > 0 && (
                            <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-6">
                                {project.gallery.map((img, idx) => (
                                    <div key={idx} className="rounded-xl overflow-hidden shadow-lg border border-white/10 aspect-video">
                                        <img src={img} alt={`${project.title} gallery ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="w-full lg:w-1/3 p-8 lg:p-12 flex flex-col bg-[#0F0F0F] border-l border-white/5">
                        <div className="mb-4">
                            <span className="px-4 py-2 bg-raynold-red/20 text-raynold-red border border-raynold-red/30 text-xs font-bold uppercase tracking-wider rounded-full shadow-[0_0_15px_rgba(230,0,0,0.3)]">
                                {project.category}
                            </span>
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-futuristic font-black text-white mb-8 leading-tight">
                            {project.title}
                        </h1>

                        <div className="space-y-8 mb-12 flex-grow">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 bg-black/40 p-6 rounded-2xl border border-white/5">
                                {project.client && (
                                    <div className="flex flex-col gap-2">
                                        <h4 className="text-xs text-gray-500 uppercase tracking-widest font-bold flex items-center gap-2"><Building2 size={14} className="text-raynold-green" /> Cliente</h4>
                                        <p className="text-white font-medium">{project.client}</p>
                                    </div>
                                )}
                                {project.location && (
                                    <div className="flex flex-col gap-2">
                                        <h4 className="text-xs text-gray-500 uppercase tracking-widest font-bold flex items-center gap-2"><MapPin size={14} className="text-raynold-red" /> Ubicación</h4>
                                        <p className="text-white font-medium">{project.location}</p>
                                    </div>
                                )}
                                {project.completion_date && (
                                    <div className="flex flex-col gap-2">
                                        <h4 className="text-xs text-gray-500 uppercase tracking-widest font-bold flex items-center gap-2"><Calendar size={14} className="text-gray-400" /> Mes</h4>
                                        <p className="text-white font-medium capitalize">
                                            {new Date(project.completion_date).toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-raynold-red"></span>
                                    Sobre el Proyecto
                                </h3>
                                <p className="text-gray-300 leading-relaxed font-light text-base">
                                    {project.description || `Este proyecto${project.client ? ' para ' + project.client : ''} fue desarrollado utilizando nuestras técnicas más avanzadas en ${project.category.toLowerCase()}. Nos enfocamos en la durabilidad, el impacto visual y la fidelidad a la identidad de marca.`}
                                </p>
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Servicios Aplicados</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['Diseño', 'Producción', 'Instalación'].map(tag => (
                                        <span key={tag} className="text-xs font-bold text-gray-400 bg-black px-3 py-2 rounded-lg border border-white/10 hover:border-raynold-red/50 hover:text-white transition-colors cursor-default">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto">
                            <a
                                href={`https://wa.me/18295807411?text=Hola,%20me%20gustó%20el%20proyecto%20"${project.title}"%20y%20quisiera%20algo%20similar.`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-4 btn-animated font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(230,0,0,0.5)] rounded-xl"
                            >
                                Cotizar Algo Similar <ArrowUpRight size={18} />
                            </a>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default ProjectDetailPage;
