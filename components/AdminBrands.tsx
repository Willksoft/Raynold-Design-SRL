import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Brand {
  id: string;
  name: string;
  logo: string;
  bg_color: string;
}

const AdminBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchBrands = async () => {
    setLoading(true);
    const { data } = await supabase.from('brands').select('*').order('sort_order');
    if (data) setBrands(data.map(b => ({ id: b.id, name: b.name, logo: b.logo || b.logo_url || '', bg_color: b.bg_color || '#ffffff' })));
    setLoading(false);
  };

  useEffect(() => { fetchBrands(); }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta marca?')) {
      await supabase.from('brands').delete().eq('id', id);
      fetchBrands();
    }
  };

  const handleOpenModal = (brand?: Brand) => {
    setEditingBrand(brand || { id: '', name: '', logo: '', bg_color: '#ffffff' });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingBrand) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede superar los 5MB.');
        return;
      }
      setUploading(true);
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `brands/${Date.now()}-${safeName}`;
      const { data, error } = await supabase.storage.from('raynold-media').upload(path, file);
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('raynold-media').getPublicUrl(data.path);
        setEditingBrand({ ...editingBrand, logo: publicUrl });
      }
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    const row = { name: editingBrand.name, logo: editingBrand.logo || null, bg_color: editingBrand.bg_color || '#ffffff' };
    if (brands.find(b => b.id === editingBrand.id)) {
      await supabase.from('brands').update(row).eq('id', editingBrand.id);
    } else {
      await supabase.from('brands').insert([row]);
    }
    setIsModalOpen(false);
    fetchBrands();
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Marcas / Clientes</h1>
          <p className="text-gray-400">Gestiona los logos de las marcas que confían en nosotros (Carrusel).</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2">
          <Plus size={18} /> Añadir Marca
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 text-gray-500"><Loader2 className="animate-spin mr-2" size={20} /> Cargando marcas...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {brands.map((brand) => (
            <div key={brand.id} className="relative group rounded-xl border border-white/10 overflow-hidden shadow-lg">
              {/* Logo with brand background color */}
              <div
                className="w-full h-28 flex items-center justify-center p-3"
                style={{ backgroundColor: brand.bg_color }}
              >
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <ImageIcon size={32} className="text-gray-400" />
                )}
              </div>
              {/* Name bar */}
              <div className="bg-[#0d0d0d] px-3 py-2 text-center">
                <p className="text-xs font-bold text-white truncate">{brand.name}</p>
              </div>
              {/* Actions overlay on hover */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => handleOpenModal(brand)} className="p-2 bg-blue-500/80 text-white rounded-lg hover:bg-blue-500 transition-colors" title="Editar">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(brand.id)} className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors" title="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {brands.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-500">No hay marcas registradas.</div>
          )}
        </div>
      )}

      {isModalOpen && editingBrand && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-bold text-white font-futuristic">{brands.find(b => b.id === editingBrand.id) ? 'Editar Marca' : 'Nueva Marca'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre de la Marca</label>
                <input required type="text" value={editingBrand.name} onChange={e => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors" placeholder="Ej. Banco Popular" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Color de Fondo</label>
                <div className="flex gap-3 items-center">
                  <input type="color" value={editingBrand.bg_color} onChange={e => setEditingBrand({ ...editingBrand, bg_color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer border border-white/20 bg-transparent" />
                  <input type="text" value={editingBrand.bg_color} onChange={e => setEditingBrand({ ...editingBrand, bg_color: e.target.value })}
                    className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors font-mono" placeholder="#ffffff" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Logo (Max 5MB)</label>
                <div className="flex flex-col gap-3">
                  {editingBrand.logo && (
                    <div className="w-full h-32 rounded-lg border border-white/10 relative group flex items-center justify-center" style={{ backgroundColor: editingBrand.bg_color }}>
                      <img src={editingBrand.logo} alt="Preview" className="max-h-24 object-contain" />
                      <button
                        type="button"
                        onClick={() => setEditingBrand({ ...editingBrand, logo: '' })}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  <label className={`bg-white/5 hover:bg-white/10 border border-white/10 border-dashed text-gray-300 w-full py-4 rounded-lg cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? <Loader2 size={20} className="animate-spin text-gray-500" /> : <Plus size={20} className="text-gray-500" />}
                    <span className="text-sm font-medium">
                      {uploading ? 'Subiendo...' : (editingBrand.logo ? 'Cambiar Logo' : 'Subir Logo')}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
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

export default AdminBrands;
