import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Category {
  id: string;
  name: string;
  type: 'product' | 'project';
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data.map(c => ({ id: c.id, name: c.name, type: (c.type || 'product') as 'product' | 'project' })));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleOpenModal = (category?: Category) => {
    setEditingCategory(category || { id: '', name: '', type: 'product' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const row = { name: editingCategory.name, type: editingCategory.type };
    if (categories.find(c => c.id === editingCategory.id)) {
      await supabase.from('categories').update(row).eq('id', editingCategory.id);
    } else {
      await supabase.from('categories').insert([row]);
    }
    setIsModalOpen(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      await supabase.from('categories').delete().eq('id', id);
      fetchCategories();
    }
  };

  return (
    <div className="p-6 md:p-10 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="text-raynold-red" size={32} />
              <h1 className="text-4xl md:text-5xl font-futuristic font-black text-white">
                GESTIÓN DE <span className="animate-gradient-text">CATEGORÍAS</span>
              </h1>
            </div>
            <p className="text-gray-400">Administra las categorías para productos, servicios y proyectos.</p>
          </div>
          <button onClick={() => handleOpenModal()} className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2">
            <Plus size={18} /> Nueva Categoría
          </button>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-4 font-bold">Nombre</th>
                  <th className="p-4 font-bold">Tipo</th>
                  <th className="p-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">{category.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${category.type === 'product' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                        {category.type === 'product' ? 'Productos/Servicios' : 'Proyectos'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(category)} className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors" title="Editar"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(category.id)} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-gray-500">No hay categorías registradas.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-bold text-white font-futuristic">{categories.find(c => c.id === editingCategory.id) ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre</label>
                <input required type="text" value={editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors" placeholder="Ej. Señalización" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tipo</label>
                <select value={editingCategory.type} onChange={e => setEditingCategory({ ...editingCategory, type: e.target.value as 'product' | 'project' })}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors">
                  <option value="product">Productos y Servicios</option>
                  <option value="project">Proyectos</option>
                </select>
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

export default AdminCategories;
