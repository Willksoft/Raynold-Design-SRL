import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, LayoutGrid, List as ListIcon, Save, X } from 'lucide-react';
import { servicesData, ServiceDetail } from '../data/services';

const AdminServices = () => {
  const [services, setServices] = useState<ServiceDetail[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDetail | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('admin_services_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Restore icons from servicesData by ID
      const restored = parsed.map((s: any) => {
        const original = servicesData.find(os => os.id === s.id);
        return {
          ...s,
          icon: original ? original.icon : null
        };
      });
      setServices(restored);
    } else {
      setServices(servicesData);
      localStorage.setItem('admin_services_data', JSON.stringify(servicesData));
    }
  }, []);

  const saveServices = (newServices: ServiceDetail[]) => {
    setServices(newServices);
    localStorage.setItem('admin_services_data', JSON.stringify(newServices));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      saveServices(services.filter(s => s.id !== id));
    }
  };

  const handleDuplicate = (service: ServiceDetail) => {
    const newId = Math.random().toString(36).substr(2, 9);
    saveServices([...services, { ...service, id: newId, title: `${service.title} (Copia)`, slug: `${service.slug}-copia` }]);
  };

  const handleOpenModal = (service?: ServiceDetail) => {
    if (service) {
      setEditingService(service);
    } else {
      setEditingService({
        id: Math.random().toString(36).substr(2, 9),
        slug: '',
        title: '',
        description: '',
        fullDescription: '',
        icon: null as any, // We will not edit icons for now, or just keep it simple
        color: 'white',
        image: '',
        features: [],
        benefits: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    const exists = services.find(s => s.id === editingService.id);
    if (exists) {
      saveServices(services.map(s => s.id === editingService.id ? editingService : s));
    } else {
      saveServices([...services, editingService]);
    }
    setIsModalOpen(false);
  };

  const handleFeatureChange = (index: number, value: string) => {
    if (!editingService) return;
    const newFeatures = [...editingService.features];
    newFeatures[index] = value;
    setEditingService({ ...editingService, features: newFeatures });
  };

  const addFeature = () => {
    if (!editingService) return;
    setEditingService({ ...editingService, features: [...editingService.features, ''] });
  };

  const removeFeature = (index: number) => {
    if (!editingService) return;
    const newFeatures = editingService.features.filter((_, i) => i !== index);
    setEditingService({ ...editingService, features: newFeatures });
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
            Añadir Servicio
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-4 font-bold">Servicio</th>
                  <th className="p-4 font-bold">Descripción Corta</th>
                  <th className="p-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">{service.title}</td>
                    <td className="p-4 text-gray-400 text-sm">{service.description}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleDuplicate(service)}
                          className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 transition-colors" 
                          title="Duplicar"
                        >
                          <Copy size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(service)}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors" 
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(service.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors" 
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {services.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">
                      No hay servicios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDuplicate(service)}
                  className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 transition-colors" 
                  title="Duplicar"
                >
                  <Copy size={16} />
                </button>
                <button 
                  onClick={() => handleOpenModal(service)}
                  className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors" 
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(service.id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors" 
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 pr-24">{service.title}</h3>
              <p className="text-gray-400 text-sm">{service.description}</p>
            </div>
          ))}
          {services.length === 0 && (
            <div className="col-span-full p-12 text-center text-gray-500 bg-[#0A0A0A] border border-white/10 rounded-xl">
              No hay servicios registrados.
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && editingService && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl my-8">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0A0A0A] z-10 rounded-t-xl">
              <h3 className="font-bold text-xl text-white">
                {services.find(s => s.id === editingService.id) ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Título del Servicio</label>
                  <input 
                    type="text" 
                    required
                    value={editingService.title}
                    onChange={(e) => setEditingService({...editingService, title: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Slug (URL)</label>
                  <input 
                    type="text" 
                    required
                    value={editingService.slug}
                    onChange={(e) => setEditingService({...editingService, slug: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descripción Corta</label>
                <textarea 
                  required
                  value={editingService.description}
                  onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descripción Completa</label>
                <textarea 
                  required
                  value={editingService.fullDescription}
                  onChange={(e) => setEditingService({...editingService, fullDescription: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none h-32 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Color de Acento</label>
                  <select 
                    value={editingService.color}
                    onChange={(e) => setEditingService({...editingService, color: e.target.value as any})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                  >
                    <option value="red">Rojo</option>
                    <option value="green">Verde</option>
                    <option value="white">Blanco</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Imagen</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={editingService.image}
                      onChange={(e) => setEditingService({...editingService, image: e.target.value})}
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
                              setEditingService({...editingService, image: reader.result as string});
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Características</label>
                  <button type="button" onClick={addFeature} className="text-xs text-raynold-red hover:text-red-400 font-bold flex items-center gap-1"><Plus size={14}/> Añadir</button>
                </div>
                <div className="space-y-2">
                  {editingService.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input 
                        type="text" 
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                      />
                      <button type="button" onClick={() => removeFeature(index)} className="p-2 text-gray-500 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                  ))}
                  {editingService.features.length === 0 && <p className="text-sm text-gray-500 italic">No hay características añadidas.</p>}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-[#0A0A0A] pb-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-raynold-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Save size={18} /> Guardar
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
