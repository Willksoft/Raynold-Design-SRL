import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  headline_top: string;
  headline_bottom: string;
  sort_order: number;
}

const defaultSlides = [
  { image: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=2070", title: "Señalización Neon y 3D", subtitle: "Iluminamos tu marca con tecnología LED de última generación.", headline_top: "DISEÑAMOS EL", headline_bottom: "FUTURO VISUAL", sort_order: 1 },
  { image: "https://images.unsplash.com/photo-1621996659490-3275b4d0d951?q=80&w=2070", title: "Impresión Gran Formato", subtitle: "Calidad fotográfica en dimensiones arquitectónicas.", headline_top: "IMPRESIÓN DE", headline_bottom: "ALTO CALIBRE", sort_order: 2 },
  { image: "https://images.unsplash.com/photo-1600706432502-79fa6930eb6a?q=80&w=2070", title: "Rotulación Vehicular", subtitle: "Transforma tu flota en publicidad móvil de alto impacto.", headline_top: "TU MARCA EN", headline_bottom: "MOVIMIENTO", sort_order: 3 },
];

const AdminHero = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchSlides = async () => {
    setLoading(true);
    const { data } = await supabase.from('hero_slides').select('*').order('sort_order');
    if (data && data.length > 0) {
      setSlides(data);
    } else {
      // Seed defaults if table is empty
      const { data: inserted } = await supabase.from('hero_slides').insert(defaultSlides).select();
      if (inserted) setSlides(inserted);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este slide?')) {
      await supabase.from('hero_slides').delete().eq('id', id);
      fetchSlides();
    }
  };

  const handleOpenModal = (slide?: HeroSlide) => {
    setEditingSlide(slide || { image: '', title: '', subtitle: '', headline_top: '', headline_bottom: '', sort_order: slides.length + 1 });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingSlide) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede superar los 5MB.');
        return;
      }
      setUploading(true);
      const path = `hero/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('raynold-media').upload(path, file);
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('raynold-media').getPublicUrl(data.path);
        setEditingSlide({ ...editingSlide, image: publicUrl });
      }
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;
    const row = { image: editingSlide.image, title: editingSlide.title, subtitle: editingSlide.subtitle, headline_top: editingSlide.headline_top, headline_bottom: editingSlide.headline_bottom, sort_order: editingSlide.sort_order };
    if (editingSlide.id) {
      await supabase.from('hero_slides').update(row).eq('id', editingSlide.id);
    } else {
      await supabase.from('hero_slides').insert([row]);
    }
    setIsModalOpen(false);
    fetchSlides();
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Editar Inicio (Hero)</h1>
          <p className="text-gray-400">Gestiona los slides del carrusel principal.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-raynold-red text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-bold">
          <Plus size={18} /> Nuevo Slide
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 text-gray-500"><Loader2 className="animate-spin mr-2" size={20} /> Cargando slides...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slides.map((slide) => (
            <div key={slide.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden group">
              <div className="h-48 relative">
                <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-xl font-black text-white font-futuristic leading-tight">{slide.headline_top}<br /><span className="text-raynold-red">{slide.headline_bottom}</span></h3>
                </div>
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(slide)} className="p-2 bg-black/80 text-blue-400 rounded hover:bg-blue-500 hover:text-black transition-colors backdrop-blur-sm"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(slide.id)} className="p-2 bg-black/80 text-red-400 rounded hover:bg-red-500 hover:text-black transition-colors backdrop-blur-sm"><Trash2 size={16} /></button>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">Orden: {slide.sort_order}</div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-white mb-1">{slide.title}</h4>
                <p className="text-sm text-gray-400 line-clamp-2">{slide.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editingSlide.id ? 'Editar Slide' : 'Nuevo Slide'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Etiqueta</label>
                  <input required type="text" value={editingSlide.title || ''} onChange={e => setEditingSlide({ ...editingSlide, title: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="Ej. Señalización Neon" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subtítulo</label>
                  <input required type="text" value={editingSlide.subtitle || ''} onChange={e => setEditingSlide({ ...editingSlide, subtitle: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="Ej. Iluminamos tu marca..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Titular (Arriba)</label>
                  <input required type="text" value={editingSlide.headline_top || ''} onChange={e => setEditingSlide({ ...editingSlide, headline_top: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="Ej. DISEÑAMOS EL" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Titular (Abajo)</label>
                  <input required type="text" value={editingSlide.headline_bottom || ''} onChange={e => setEditingSlide({ ...editingSlide, headline_bottom: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="Ej. FUTURO VISUAL" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Orden</label>
                  <input type="number" value={editingSlide.sort_order || 1} onChange={e => setEditingSlide({ ...editingSlide, sort_order: parseInt(e.target.value) })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
                </div>
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Imagen de Fondo (Max 5MB)</label>
                <div className="flex flex-col gap-3">
                  {editingSlide.image && (
                    <div className="w-full h-40 bg-gray-900 rounded-lg overflow-hidden border border-white/10 relative group">
                      <img src={editingSlide.image} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditingSlide({ ...editingSlide, image: '' })}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  <label className={`bg-white/5 hover:bg-white/10 border border-white/10 border-dashed text-gray-300 w-full py-4 rounded-lg cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? <Loader2 size={20} className="animate-spin text-gray-500" /> : <Plus size={20} className="text-gray-500" />}
                    <span className="text-sm font-medium">
                      {uploading ? 'Subiendo...' : (editingSlide.image ? 'Cambiar Imagen' : 'Subir Imagen')}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-white/5">Cancelar</button>
                <button type="submit" className="bg-raynold-red hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"><Save size={18} /> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHero;
