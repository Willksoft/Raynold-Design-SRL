import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, LayoutGrid, List as ListIcon, X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
}

const AdminProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [uploading, setUploading] = useState(false);

  const PROJECT_CATEGORIES = ['Señalización', 'Wrapping', 'Exhibición', 'Rotulación', 'Impresión', 'Diseño', 'Instalación', 'Otro'];

  const fetchProjects = async () => {
    setLoading(true);
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (data) setProjects(data.map(p => ({ id: p.id, title: p.title, category: p.category || '', image: p.image_url || '' })));
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      await supabase.from('projects').delete().eq('id', id);
      fetchProjects();
    }
  };

  const handleDuplicate = async (project: Project) => {
    await supabase.from('projects').insert([{ title: `${project.title} (Copia)`, category: project.category, image_url: project.image }]);
    fetchProjects();
  };

  const handleOpenModal = (project?: Project) => {
    setEditingProject(project || { id: '', title: '', category: PROJECT_CATEGORIES[0], image: '' });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProject) {
      setUploading(true);
      const path = `projects/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('raynold-media').upload(path, file);
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('raynold-media').getPublicUrl(data.path);
        setEditingProject({ ...editingProject, image: publicUrl });
      }
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    const row = { title: editingProject.title, category: editingProject.category, image_url: editingProject.image };
    if (projects.find(p => p.id === editingProject.id)) {
      await supabase.from('projects').update(row).eq('id', editingProject.id);
    } else {
      await supabase.from('projects').insert([row]);
    }
    setIsModalOpen(false);
    fetchProjects();
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
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`} title="Vista de Lista"><ListIcon size={18} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`} title="Vista de Cuadrícula"><LayoutGrid size={18} /></button>
          </div>
          <button onClick={() => handleOpenModal()} className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2">
            <Plus size={18} /> Añadir Proyecto
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 text-gray-500"><Loader2 className="animate-spin mr-2" size={20} /> Cargando proyectos...</div>
      ) : viewMode === 'list' ? (
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
                        {project.image && <img src={project.image} alt={project.title} className="w-full h-full object-cover" />}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-white">{project.title}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-white/10 text-xs rounded-full text-gray-300">{project.category}</span></td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleDuplicate(project)} className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 transition-colors" title="Duplicar"><Copy size={16} /></button>
                        <button onClick={() => handleOpenModal(project)} className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors" title="Editar"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(project.id)} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hay proyectos registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors group">
              <div className="h-48 bg-gray-900 relative">
                {project.image && <img src={project.image} alt={project.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDuplicate(project)} className="p-2 bg-black/80 text-green-400 rounded hover:bg-green-500 hover:text-black transition-colors backdrop-blur-sm" title="Duplicar"><Copy size={16} /></button>
                  <button onClick={() => handleOpenModal(project)} className="p-2 bg-black/80 text-blue-400 rounded hover:bg-blue-500 hover:text-black transition-colors backdrop-blur-sm" title="Editar"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(project.id)} className="p-2 bg-black/80 text-red-400 rounded hover:bg-red-500 hover:text-black transition-colors backdrop-blur-sm" title="Eliminar"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white mb-2 truncate">{project.title}</h3>
                <span className="px-2 py-1 bg-white/10 text-[10px] rounded-full text-gray-400 uppercase tracking-wider">{project.category}</span>
              </div>
            </div>
          ))}
          {projects.length === 0 && <div className="col-span-full p-12 text-center text-gray-500 bg-[#0A0A0A] border border-white/10 rounded-xl">No hay proyectos registrados.</div>}
        </div>
      )}

      {isModalOpen && editingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-bold text-white font-futuristic">{projects.find(p => p.id === editingProject.id) ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Título</label>
                <input required type="text" value={editingProject.title} onChange={e => setEditingProject({ ...editingProject, title: e.target.value })}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors" placeholder="Ej. Letrero Neon" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categoría</label>
                <select value={editingProject.category} onChange={e => setEditingProject({ ...editingProject, category: e.target.value })}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors">
                  {PROJECT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Imagen</label>
                <div className="flex gap-2">
                  <input type="text" value={editingProject.image} onChange={e => setEditingProject({ ...editingProject, image: e.target.value })}
                    className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors" placeholder="URL de la imagen..." />
                  <label className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center font-bold text-sm">
                    {uploading ? 'Subiendo...' : 'Subir'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
                {editingProject.image && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-white/10 h-32">
                    <img src={editingProject.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 btn-animated font-bold rounded-lg flex items-center gap-2"><Save size={18} /> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
