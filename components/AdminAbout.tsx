import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Image as ImageIcon, X } from 'lucide-react';
import { AboutContent, TeamMember } from '../types';

const INITIAL_ABOUT: AboutContent = {
  title: "NOSOTROS",
  subtitle: "En Raynold Design SRL, no solo imprimimos o fabricamos; materializamos ideas. Somos arquitectos de la imagen corporativa del futuro.",
  historyTitle: "Nuestra Historia",
  historyText1: "Fundada en 2018 y registrada bajo el RNC 131765602, Raynold Design srl comenzó su trayectoria en Santo Domingo y, con el tiempo, se trasladó a el municipio de Verón, en Punta Cana.",
  historyText2: "En Raynold Design srl, nos especializamos en ofrecer soluciones creativas y personalizadas. Nuestro portafolio incluye la creación de letreros innovadores, cajas de luces, letreros en 3D, cortes a láser y CNC, impresiónes de alta calidad, y rotulaciones corporativas. Además, ofrecemos una amplia gama de artículos de merchandising para potenciar la identidad de marca de nuestros clientes.",
  historyText3: "Nuestro compromiso con la calidad, la innovación y la atención al detalle nos permite brindar resultados excepcionales en cada proyecto.",
  historyImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
  stats: {
    projects: "500+",
    brands: "50+"
  }
};

const INITIAL_TEAM: TeamMember[] = [
  {
    id: "1",
    name: "Raynold",
    role: "CEO & Fundador",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop",
    bio: "Visionario de la estética digital y la manufactura avanzada.",
    color: "border-raynold-red"
  },
  {
    id: "2",
    name: "Elena V.",
    role: "Directora Creativa",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop",
    bio: "Experta en transformar conceptos abstractos en identidades visuales.",
    color: "border-raynold-green"
  }
];

const AdminAbout: React.FC = () => {
  const [about, setAbout] = useState<AboutContent>(INITIAL_ABOUT);
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    const savedAbout = localStorage.getItem('raynold_about_content');
    if (savedAbout) setAbout(JSON.parse(savedAbout));

    const savedTeam = localStorage.getItem('raynold_team_members');
    if (savedTeam) setTeam(JSON.parse(savedTeam));
  }, []);

  const saveAbout = () => {
    localStorage.setItem('raynold_about_content', JSON.stringify(about));
    alert('Información de "Nosotros" guardada correctamente');
  };

  const saveTeam = (newTeam: TeamMember[]) => {
    localStorage.setItem('raynold_team_members', JSON.stringify(newTeam));
    setTeam(newTeam);
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    let newTeam;
    const exists = team.find(m => m.id === editingMember.id);
    if (exists) {
      newTeam = team.map(m => m.id === editingMember.id ? editingMember : m);
    } else {
      newTeam = [...team, editingMember];
    }

    saveTeam(newTeam);
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const deleteMember = (id: string) => {
    if (confirm('¿Estás seguro de eliminar a este miembro del equipo?')) {
      const newTeam = team.filter(m => m.id !== id);
      saveTeam(newTeam);
    }
  };

  const openModal = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
    } else {
      setEditingMember({
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        role: '',
        image: '',
        bio: '',
        color: 'border-raynold-red'
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-12">
      {/* About Content Editor */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-futuristic font-black text-white">Editar Página "Nosotros"</h2>
          <button 
            onClick={saveAbout}
            className="flex items-center gap-2 px-6 py-2 bg-raynold-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
          >
            <Save size={18} />
            Guardar Cambios
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Título Principal</label>
              <input 
                type="text"
                value={about.title}
                onChange={(e) => setAbout({...about, title: e.target.value})}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Subtítulo / Introducción</label>
              <textarea 
                rows={3}
                value={about.subtitle}
                onChange={(e) => setAbout({...about, subtitle: e.target.value})}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Stat: Proyectos</label>
                <input 
                  type="text"
                  value={about.stats.projects}
                  onChange={(e) => setAbout({...about, stats: {...about.stats, projects: e.target.value}})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Stat: Marcas</label>
                <input 
                  type="text"
                  value={about.stats.brands}
                  onChange={(e) => setAbout({...about, stats: {...about.stats, brands: e.target.value}})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Título de Historia</label>
              <input 
                type="text"
                value={about.historyTitle}
                onChange={(e) => setAbout({...about, historyTitle: e.target.value})}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Párrafo 1 (Historia)</label>
              <textarea 
                rows={3}
                value={about.historyText1}
                onChange={(e) => setAbout({...about, historyText1: e.target.value})}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Párrafo 2 (Especialidad)</label>
              <textarea 
                rows={3}
                value={about.historyText2}
                onChange={(e) => setAbout({...about, historyText2: e.target.value})}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Párrafo 3 (Compromiso)</label>
              <textarea 
                rows={3}
                value={about.historyText3}
                onChange={(e) => setAbout({...about, historyText3: e.target.value})}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Imagen de Historia</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={about.historyImage}
                  onChange={(e) => setAbout({...about, historyImage: e.target.value})}
                  className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
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
                          setAbout({...about, historyImage: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
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
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-6 py-2 bg-raynold-green text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={18} />
            Añadir Miembro
          </button>
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
                  <button 
                    onClick={() => openModal(member)}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteMember(member.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
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
              <h3 className="font-bold text-lg text-white">
                {team.find(m => m.id === editingMember.id) ? 'Editar Miembro' : 'Nuevo Miembro'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleMemberSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nombre</label>
                <input 
                  type="text" required
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Rol / Cargo</label>
                <input 
                  type="text" required
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({...editingMember, role: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Imagen</label>
                <div className="flex gap-2">
                  <input 
                    type="text" required
                    value={editingMember.image}
                    onChange={(e) => setEditingMember({...editingMember, image: e.target.value})}
                    className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
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
                            setEditingMember({...editingMember, image: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Biografía Corta</label>
                <textarea 
                  rows={3}
                  value={editingMember.bio}
                  onChange={(e) => setEditingMember({...editingMember, bio: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Color de Borde</label>
                <select 
                  value={editingMember.color}
                  onChange={(e) => setEditingMember({...editingMember, color: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                >
                  <option value="border-raynold-red">Rojo Raynold</option>
                  <option value="border-raynold-green">Verde Raynold</option>
                  <option value="border-blue-500">Azul</option>
                  <option value="border-yellow-500">Amarillo</option>
                  <option value="border-purple-500">Púrpura</option>
                  <option value="border-white">Blanco</option>
                </select>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-3 bg-raynold-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
                  Guardar Miembro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAbout;
