import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, LayoutGrid, List as ListIcon, X, Save } from 'lucide-react';
import { Category } from '../types';

const AdminProjects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  useEffect(() => {
    const savedProjects = localStorage.getItem('raynold_projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    } else {
      const defaultProjects = [
        { id: 1, title: 'Letrero Neon "CyberBar"', category: 'Señalización', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=1000' },
        { id: 2, title: 'Flotilla Delivery Express', category: 'Wrapping', image: 'https://images.unsplash.com/photo-1600706432502-79fa6930eb6a?q=80&w=1000' },
        { id: 3, title: 'Stand Feria Tecnológica', category: 'Exhibición', image: 'https://images.unsplash.com/photo-1560130958-ad2594a5e076?q=80&w=1000' },
      ];
      setProjects(defaultProjects);
      localStorage.setItem('raynold_projects', JSON.stringify(defaultProjects));
    }

    const savedCategories = localStorage.getItem('raynold_categories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories).filter((c: Category) => c.type === 'project'));
    } else {
      setCategories([
        { id: 'cat-8', name: 'Instalación', type: 'project' },
        { id: 'cat-9', name: 'Diseño', type: 'project' }
      ]);
    }
  }, []);

  const saveProjects = (newProjects: any[]) => {
    setProjects(newProjects);
    localStorage.setItem('raynold_projects', JSON.stringify(newProjects));
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      saveProjects(projects.filter(p => p.id !== id));
    }
  };

  const handleDuplicate = (project: any) => {
    const newId = Math.max(...projects.map(p => p.id), 0) + 1;
    saveProjects([...projects, { ...project, id: newId, title: `${project.title} (Copia)` }]);
  };

  const handleOpenModal = (project?: any) => {
    if (project) {
      setEditingProject(project);
    } else {
      setEditingProject({
        id: Math.max(...projects.map(p => p.id), 0) + 1,
        title: '',
        category: categories.length > 0 ? categories[0].name : 'Instalación',
        image: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    const exists = projects.find(p => p.id === editingProject.id);
    if (exists) {
      saveProjects(projects.map(p => p.id === editingProject.id ? editingProject : p));
    } else {
      saveProjects([...projects, editingProject]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Proyectos (Portafolio)</h1>
          <p className="text-gray-400">Gestiona los trabajos realizados para mostrar en la galería.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-[#0A0A0A] border border-white/10 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Vista de Lista"
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Vista de Cuadrícula"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            Añadir Proyecto
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-4 font-bold">Imagen</th>
                  <th className="p-4 font-bold">Título del Proyecto</th>
                  <th className="p-4 font-bold">Categoría</th>
                  <th className="p-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="w-16 h-12 rounded bg-gray-800 overflow-hidden border border-white/10">
                        <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-4 font-bold text-white">{project.title}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-white/10 text-xs rounded-full text-gray-300">
                        {project.category}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleDuplicate(project)}
                          className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 transition-colors" 
                          title="Duplicar"
                        >
                          <Copy size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(project)}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors" 
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(project.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors" 
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No hay proyectos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors group">
              <div className="h-48 bg-gray-900 relative">
                <img src={project.image} alt={project.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDuplicate(project)}
                    className="p-2 bg-black/80 text-green-400 rounded hover:bg-green-500 hover:text-black transition-colors backdrop-blur-sm"
                    title="Duplicar"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    onClick={() => handleOpenModal(project)}
                    className="p-2 bg-black/80 text-blue-400 rounded hover:bg-blue-500 hover:text-black transition-colors backdrop-blur-sm" 
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(project.id)}
                    className="p-2 bg-black/80 text-red-400 rounded hover:bg-red-500 hover:text-black transition-colors backdrop-blur-sm"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white mb-2 truncate">{project.title}</h3>
                <span className="px-2 py-1 bg-white/10 text-[10px] rounded-full text-gray-400 uppercase tracking-wider">
                  {project.category}
                </span>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full p-12 text-center text-gray-500 bg-[#0A0A0A] border border-white/10 rounded-xl">
              No hay proyectos registrados.
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && editingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-bold text-white font-futuristic">
                {projects.find(p => p.id === editingProject.id) ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Título</label>
                <input 
                  required
                  type="text" 
                  value={editingProject.title}
                  onChange={e => setEditingProject({...editingProject, title: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                  placeholder="Ej. Letrero Neon"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categoría</label>
                <select 
                  value={editingProject.category}
                  onChange={e => setEditingProject({...editingProject, category: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Imagen</label>
                <div className="flex gap-2">
                  <input 
                    required
                    type="text" 
                    value={editingProject.image}
                    onChange={e => setEditingProject({...editingProject, image: e.target.value})}
                    className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                    placeholder="URL de la imagen..."
                  />
                  <label className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center font-bold text-sm">
                    Subir
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditingProject({...editingProject, image: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 btn-animated font-bold rounded-lg flex items-center gap-2"
                >
                  <Save size={18} />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
