import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, LayoutGrid, List as ListIcon, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  full_description: string;
  color: string;
  image: string;
  features: string[];
  sort_order: number;
  is_active: boolean;
}

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const loadServices = async () => {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').order('sort_order');
    if (data) setServices(data.map(s => ({ ...s, features: Array.isArray(s.features) ? s.features : [] })));
    setLoading(false);
  };

  useEffect(() => { loadServices(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    await supabase.from('services').delete().eq('id', id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleOpenModal = (service?: Service) => {
    setEditingService(service ?? {
      id: '', slug: '', title: '', description: '', full_description: '',
      color: 'white', image: '', features: [], sort_order: services.length + 1, is_active: true
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setSaving(true);
    const payload = {
      title: editingService.title, slug: editingService.slug,
      description: editingService.description, full_description: editingService.full_description,
      color: editingService.color, image: editingService.image,
      features: editingService.features, sort_order: editingService.sort_order,
      is_active: editingService.is_active,
    };
    if (editingService.id) {
      await supabase.from('services').update(payload).eq('id', editingService.id);
    } else {
      await supabase.from('services').insert(payload);
    }
    setSaving(false);
    setIsModalOpen(false);
    loadServices();
  };

  const handleImageUpload = async (file: File) => {
    if (!editingService) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar los 5MB.');
      return;
    }
    const ext = file.name.split('.').pop();
    const path = `services/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('raynold-media').upload(path, file, { upsert: true });
    if (error) { alert('Error al subir imagen: ' + error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from('raynold-media').getPublicUrl(data.path);
    setEditingService({ ...editingService, image: publicUrl });
  };

  const updateFeature = (i: number, val: string) => {
    if (!editingService) return;
    const f = [...editingService.features]; f[i] = val;
    setEditingService({ ...editingService, features: f });
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Servicios</h1>
          <p className="text-gray-400">Gestiona los servicios que ofrece la empresa.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-[#0A0A0A] border border-white/10 rounded-lg p-1">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}><ListIcon size={18} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}><LayoutGrid size={18} /></button>
          </div>
          <button onClick={() => handleOpenModal()} className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2"><Plus size={18} /> Añadir Servicio</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-raynold-red" size={40} /></div>
      ) : viewMode === 'list' ? (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <th className="p-4 font-bold">Servicio</th>
                <th className="p-4 font-bold">Descripción</th>
                <th className="p-4 font-bold text-center">Activo</th>
                <th className="p-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {s.image && <img src={s.image} alt={s.title} className="w-12 h-12 rounded-lg object-cover" />}
                      <span className="font-bold text-white">{s.title}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 text-sm max-w-xs truncate">{s.description}</td>
                  <td className="p-4 text-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {s.is_active ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(s)} className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors" title="Editar"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hay servicios.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map(s => (
            <div key={s.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors relative group">
              {s.image && <img src={s.image} alt={s.title} className="w-full h-40 object-cover" />}
              <div className="p-6">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(s)} className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors"><Trash2 size={16} /></button>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.description}</p>
              </div>
            </div>
          ))}
          {services.length === 0 && <div className="col-span-full p-12 text-center text-gray-500 bg-[#0A0A0A] border border-white/10 rounded-xl">No hay servicios registrados.</div>}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && editingService && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl my-8">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0A0A0A] z-10 rounded-t-xl">
              <h3 className="font-bold text-xl text-white">{editingService.id ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Título</label>
                  <input type="text" required value={editingService.title} onChange={e => setEditingService({ ...editingService, title: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Slug (URL)</label>
                  <input type="text" required value={editingService.slug} onChange={e => setEditingService({ ...editingService, slug: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descripción corta</label>
                <textarea required value={editingService.description} onChange={e => setEditingService({ ...editingService, description: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none h-20 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descripción completa</label>
                <textarea value={editingService.full_description} onChange={e => setEditingService({ ...editingService, full_description: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none h-28 resize-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Color de Acento</label>
                  <select value={editingService.color} onChange={e => setEditingService({ ...editingService, color: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none">
                    <option value="red">Rojo</option>
                    <option value="green">Verde</option>
                    <option value="white">Blanco</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Orden</label>
                  <input type="number" value={editingService.sort_order} onChange={e => setEditingService({ ...editingService, sort_order: +e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Imagen (Max 5MB)</label>
                <div className="flex flex-col gap-3">
                  {editingService.image && (
                    <div className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden border border-white/10 relative group">
                      <img src={editingService.image} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditingService({ ...editingService, image: '' })}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  <label className="bg-white/5 hover:bg-white/10 border border-white/10 border-dashed text-gray-300 w-full py-4 rounded-lg cursor-pointer transition-colors flex flex-col items-center justify-center gap-2">
                    <Plus size={20} className="text-gray-500" />
                    <span className="text-sm font-medium">{editingService.image ? 'Cambiar Imagen' : 'Subir Imagen'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                  </label>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Características</label>
                  <button type="button" onClick={() => setEditingService({ ...editingService, features: [...editingService.features, ''] })} className="text-xs text-raynold-red hover:text-red-400 font-bold flex items-center gap-1"><Plus size={14} /> Añadir</button>
                </div>
                <div className="space-y-2">
                  {editingService.features.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={f} onChange={e => updateFeature(i, e.target.value)} className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
                      <button type="button" onClick={() => setEditingService({ ...editingService, features: editingService.features.filter((_, j) => j !== i) })} className="p-2 text-gray-500 hover:text-red-500"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_active" checked={editingService.is_active} onChange={e => setEditingService({ ...editingService, is_active: e.target.checked })} className="w-4 h-4 accent-raynold-red" />
                <label htmlFor="is_active" className="text-sm text-gray-300">Activo (visible en el sitio público)</label>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-raynold-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
