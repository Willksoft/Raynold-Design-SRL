import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, Plus, Trash2, Edit2, X } from 'lucide-react';

export interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  headlineTop: string;
  headlineBottom: string;
}

const defaultSlides: HeroSlide[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=2070&auto=format&fit=crop", 
    title: "Señalización Neon y 3D",
    subtitle: "Iluminamos tu marca con tecnología LED de última generación.",
    headlineTop: "DISEÑAMOS EL",
    headlineBottom: "FUTURO VISUAL"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1621996659490-3275b4d0d951?q=80&w=2070&auto=format&fit=crop", 
    title: "Impresión Gran Formato",
    subtitle: "Calidad fotográfica en dimensiones arquitectónicas.",
    headlineTop: "IMPRESIÓN DE",
    headlineBottom: "ALTO CALIBRE"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1600706432502-79fa6930eb6a?q=80&w=2070&auto=format&fit=crop", 
    title: "Rotulación Vehicular",
    subtitle: "Transforma tu flota en publicidad móvil de alto impacto.",
    headlineTop: "TU MARCA EN",
    headlineBottom: "MOVIMIENTO"
  }
];

const AdminHero = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState<Omit<HeroSlide, 'id'>>({
    image: '',
    title: '',
    subtitle: '',
    headlineTop: '',
    headlineBottom: ''
  });

  useEffect(() => {
    const savedSlides = localStorage.getItem('admin_hero_slides');
    if (savedSlides) {
      setSlides(JSON.parse(savedSlides));
    } else {
      setSlides(defaultSlides);
      localStorage.setItem('admin_hero_slides', JSON.stringify(defaultSlides));
    }
  }, []);

  const saveSlides = (newSlides: HeroSlide[]) => {
    setSlides(newSlides);
    localStorage.setItem('admin_hero_slides', JSON.stringify(newSlides));
  };

  const handleOpenModal = (slide?: HeroSlide) => {
    if (slide) {
      setEditingSlide(slide);
      setFormData({
        image: slide.image,
        title: slide.title,
        subtitle: slide.subtitle,
        headlineTop: slide.headlineTop,
        headlineBottom: slide.headlineBottom
      });
    } else {
      setEditingSlide(null);
      setFormData({
        image: '',
        title: '',
        subtitle: '',
        headlineTop: '',
        headlineBottom: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSlide) {
      const updatedSlides = slides.map(s => 
        s.id === editingSlide.id ? { ...s, ...formData } : s
      );
      saveSlides(updatedSlides);
    } else {
      const newSlide: HeroSlide = {
        id: Date.now(),
        ...formData
      };
      saveSlides([...slides, newSlide]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este slide?')) {
      saveSlides(slides.filter(s => s.id !== id));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Editar Inicio (Hero)</h1>
          <p className="text-gray-400">Gestiona los slides del carrusel principal.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-raynold-red text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-bold"
        >
          <Plus size={18} /> Nuevo Slide
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slides.map((slide) => (
          <div key={slide.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden group">
            <div className="h-48 relative">
              <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-xl font-black text-white font-futuristic leading-tight">
                  {slide.headlineTop}<br/><span className="text-raynold-red">{slide.headlineBottom}</span>
                </h3>
              </div>
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(slide)} className="p-2 bg-black/80 text-blue-400 rounded hover:bg-blue-500 hover:text-black transition-colors backdrop-blur-sm">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(slide.id)} className="p-2 bg-black/80 text-red-400 rounded hover:bg-red-500 hover:text-black transition-colors backdrop-blur-sm">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-white mb-1">{slide.title}</h4>
              <p className="text-sm text-gray-400 line-clamp-2">{slide.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editingSlide ? 'Editar Slide' : 'Nuevo Slide'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Etiqueta Superior</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="Ej. Señalización Neon" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subtítulo Descriptivo</label>
                  <input required type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="Ej. Iluminamos tu marca..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Titular Principal (Arriba)</label>
                  <input required type="text" value={formData.headlineTop} onChange={e => setFormData({...formData, headlineTop: e.target.value})} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="Ej. DISEÑAMOS EL" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Titular Principal (Abajo)</label>
                  <input required type="text" value={formData.headlineBottom} onChange={e => setFormData({...formData, headlineBottom: e.target.value})} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="Ej. FUTURO VISUAL" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Imagen de Fondo</label>
                <div className="flex gap-2">
                  <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="URL de la imagen..." />
                  <label className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center font-bold text-sm">
                    Subir
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
                {formData.image && (
                  <div className="mt-2 h-32 rounded-lg overflow-hidden border border-white/10">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
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
