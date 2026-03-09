import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ZoomIn, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const HomeProjects: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            const { data } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(6);

            if (data) setProjects(data.map(p => ({ ...p, image: p.image_url || p.image })));
        };
        fetchProjects();
    }, []);

    if (projects.length === 0) return null;

    return (
        <>
            <section className="py-24 bg-black relative">
                <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-futuristic font-bold text-white mb-4 gsap-reveal">
                                Proyectos <span className="text-raynold-red">Recientes</span>
                            </h2>
                            <div className="w-24 h-1 bg-gradient-to-r from-raynold-red to-raynold-green rounded-full gsap-reveal"></div>
                            <p className="mt-4 text-gray-400 max-w-2xl gsap-reveal">
                                Una selección de trabajos donde la creatividad se encuentra con la precisión técnica.
                            </p>
                        </div>
                        <Link
                            to="/projects"
                            className="flex items-center gap-2 text-white hover:text-raynold-red transition-colors font-bold gsap-reveal bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full border border-white/10"
                        >
                            Ver Todos <ArrowRight size={20} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {projects.map((project, index) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={project.id}
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer bg-gray-900 border border-white/5 hover:border-white/20 transition-all gsap-reveal"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <img
                                        src={project.image}
                                        alt={project.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                                        <span className="text-raynold-green text-xs font-bold uppercase tracking-wider mb-2">
                                            {project.category}
                                        </span>
                                        <h3 className="text-xl font-bold text-white font-futuristic mb-1">{project.title}</h3>
                                    </div>
                                    <div className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-100">
                                        <ZoomIn size={18} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </section>
        </>
    );
};

export default HomeProjects;
