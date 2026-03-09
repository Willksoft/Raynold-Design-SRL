import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, X, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  color: string;
  sort_order: number;
}

interface AboutContent {
  title: string;
  subtitle: string;
  historyTitle: string;
  historyText1: string;
  historyText2: string;
  historyText3: string;
  historyImage: string;
  stats: { projects: string; brands: string; };
}

const INITIAL_ABOUT: AboutContent = {
  title: "NOSOTROS",
  subtitle: "En Raynold Design SRL, no solo imprimimos o fabricamos; materializamos ideas. Somos arquitectos de la imagen corporativa del futuro.",
  historyTitle: "Nuestra Historia",
  historyText1: "Fundada en 2018 y registrada bajo el RNC 131765602, Raynold Design srl comenzó su trayectoria en Santo Domingo y, con el tiempo, se trasladó a el municipio de Verón, en Punta Cana.",
  historyText2: "En Raynold Design srl, nos especializamos en ofrecer soluciones creativas y personalizadas. Nuestro portafolio incluye la creación de letreros innovadores, cajas de luces, letreros en 3D, cortes a láser y CNC, impresiónes de alta calidad, y rotulaciones corporativas.",
  historyText3: "Nuestro compromiso con la calidad, la innovación y la atención al detalle nos permite brindar resultados excepcionales en cada proyecto.",
  historyImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070",
  stats: { projects: "500+", brands: "50+" }
};

const AdminAbout: React.FC = () => {
  const [about, setAbout] = useState<AboutContent>(INITIAL_ABOUT);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<TeamMember> | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedAbout, setSavedAbout] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [settingsResp, teamResp] = await Promise.all([
      supabase.from('site_settings').select('*').eq('key', 'about_content').single(),
      supabase.from('team_members').select('*').order('sort_order')
    ]);
    if (settingsResp.data) {
      setSavedId(settingsResp.data.id);
      setAbout({ ...INITIAL_ABOUT, ...JSON.parse(settingsResp.data.value) });
    }
    if (teamResp.data) setTeam(teamResp.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveAbout = async () => {
    const payload = { key: 'about_content', value: JSON.stringify(about) };
    if (savedId) {
      await supabase.from('site_settings').update(payload).eq('id', savedId);
    } else {
      const { data } = await supabase.from('site_settings').insert([payload]).select().single();
      if (data) setSavedId(data.id);
    }
    setSavedAbout(true);
    setTimeout(() => setSavedAbout(false), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isTeam = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `about/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('raynold-media').upload(path, file);
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from('raynold-media').getPublicUrl(data.path);
      if (isTeam && editingMember) setEditingMember({ ...editingMember, image: publicUrl });
      else setAbout({ ...about, historyImage: publicUrl });
    }
    setUploading(false);
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    const row = { name: editingMember.name, role: editingMember.role, image: editingMember.image, bio: editingMember.bio, color: editingMember.color, sort_order: editingMember.sort_order || 1 };
    if (editingMember.id && team.find(m => m.id === editingMember.id)) {
      await supabase.from('team_members').update(row).eq('id', editingMember.id);
    } else {
      await supabase.from('team_members').insert([row]);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const deleteMember = async (id: string) => {
    if (confirm('¿Eliminar a este miembro del equipo?')) {
      await supabase.from('team_members').delete().eq('id', id);
      setTeam(prev => prev.filter(m => m.id !== id));
    }
  };

  const openModal = (member?: TeamMember) => {
    setEditingMember(member || { name: '', role: '', image: '', bio: '', color: 'border-raynold-red', sort_order: team.length + 1 });
    setIsModalOpen(true);
  };

  if (loading) return <div className="flex justify-center items-center h-48 text-gray-500"><Loader2 className="animate-spin mr-2" size={20} /> Cargando...</div>;

  return (
    <div className="space-y-12">
      {/* About Content Editor */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-futuristic font-black text-white">Editar Página "Nosotros"</h2>
          <button onClick={saveAbout} className="flex items-center gap-2 px-6 py-2 bg-raynold-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
            {savedAbout ? <><CheckCircle size={18} className="text-white" /> ¡Guardado!</> : <><Save size={18} /> Guardar Cambios</>}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Título Principal</label>
              <input type="text" value={about.title} onChange={(e) => setAbout({ ...about, title: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Subtítulo / Introducción</label>
              <textarea rows={3} value={about.subtitle} onChange={(e) => setAbout({ ...about, subtitle: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Stat: Proyectos</label>
                <input type="text" value={about.stats.projects} onChange={(e) => setAbout({ ...about, stats: { ...about.stats, projects: e.target.value } })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Stat: Marcas</label>
                <input type="text" value={about.stats.brands} onChange={(e) => setAbout({ ...about, stats: { ...about.stats, brands: e.target.value } })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Título de Historia</label>
              <input type="text" value={about.historyTitle} onChange={(e) => setAbout({ ...about, historyTitle: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Párrafo 1 (Historia)</label>
              <textarea rows={3} value={about.historyText1} onChange={(e) => setAbout({ ...about, historyText1: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Párrafo 2 (Especialidad)</label>
              <textarea rows={3} value={about.historyText2} onChange={(e) => setAbout({ ...about, historyText2: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Párrafo 3 (Compromiso)</label>
              <textarea rows={3} value={about.historyText3} onChange={(e) => setAbout({ ...about, historyText3: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Imagen de Historia</label>
              <div className="flex gap-2">
                <input type="text" value={about.historyImage} onChange={(e) => setAbout({ ...about, historyImage: e.target.value })} className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="URL de la imagen..." />
                <label className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center font-bold text-sm">
                  {uploading ? 'Subiendo...' : 'Subir'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, false)} />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Editor */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-futuristic font-black text-white">Gestionar Equipo</h2>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-6 py-2 bg-raynold-green text-white font-bold rounded-lg hover:bg-green-700 transition-colors"><Plus size={18} /> Añadir Miembro</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map(member => (
            <div key={member.id} className="bg-black border border-white/10 rounded-xl p-4 flex gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold truncate">{member.name}</h3>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">{member.role}</p>
                <div className="flex gap-2">
                  <button onClick={() => openModal(member)} className="p-1.5 text-gray-400 hover:text-white transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => deleteMember(member.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Modal */}
      {isModalOpen && editingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">{editingMember.id && team.find(m => m.id === editingMember.id) ? 'Editar Miembro' : 'Nuevo Miembro'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleMemberSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nombre</label>
                <input type="text" required value={editingMember.name || ''} onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Rol / Cargo</label>
                <input type="text" required value={editingMember.role || ''} onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Imagen</label>
                <div className="flex gap-2">
                  <input type="text" value={editingMember.image || ''} onChange={(e) => setEditingMember({ ...editingMember, image: e.target.value })} className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" placeholder="URL de la imagen..." />
                  <label className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center font-bold text-sm">
                    {uploading ? '...' : 'Subir'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, true)} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Biografía Corta</label>
                <textarea rows={3} value={editingMember.bio || ''} onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Color de Borde</label>
                <select value={editingMember.color || 'border-raynold-red'} onChange={(e) => setEditingMember({ ...editingMember, color: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none">
                  <option value="border-raynold-red">Rojo Raynold</option>
                  <option value="border-raynold-green">Verde Raynold</option>
                  <option value="border-blue-500">Azul</option>
                  <option value="border-yellow-500">Amarillo</option>
                  <option value="border-purple-500">Púrpura</option>
                  <option value="border-white">Blanco</option>
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-3 bg-raynold-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Guardar Miembro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAbout;
