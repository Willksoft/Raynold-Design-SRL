import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Users } from 'lucide-react';

export interface Client {
  id: string;
  type: 'FISICA' | 'EMPRESA';
  name: string;
  company: string;
  rnc: string;
  phone: string;
  email: string;
  address: string;
}

const AdminClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState<Client>({
    id: '',
    type: 'FISICA',
    name: '',
    company: '',
    rnc: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('raynold_clients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setClients(parsed);
        } else {
          // Default client
          setClients([{
            id: 'default-cf',
            type: 'FISICA',
            name: 'Consumidor Final',
            company: '',
            rnc: '00000000000',
            phone: '',
            email: '',
            address: ''
          }]);
        }
      } catch (e) {
        console.error('Error loading clients', e);
      }
    } else {
      // Default client if no saved data
      setClients([{
        id: 'default-cf',
        type: 'FISICA',
        name: 'Consumidor Final',
        company: '',
        rnc: '00000000000',
        phone: '',
        email: '',
        address: ''
      }]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('raynold_clients', JSON.stringify(clients));
  }, [clients]);

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({
        id: Math.random().toString(36).substr(2, 9),
        type: 'FISICA',
        name: '',
        company: '',
        rnc: '',
        phone: '',
        email: '',
        address: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? formData : c));
    } else {
      setClients([...clients, formData]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  return (
    <div className="p-6 md:p-10 relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
           <div>
              <div className="flex items-center gap-3 mb-4">
                 <Users className="text-raynold-red" size={32} />
                 <h1 className="text-4xl md:text-5xl font-futuristic font-black text-white">
                   DIRECTORIO DE <span className="animate-gradient-text">CLIENTES</span>
                 </h1>
              </div>
              <p className="text-gray-400">Gestiona la información de tus clientes para facturación y cotizaciones.</p>
           </div>
           
           <button 
             onClick={() => handleOpenModal()}
             className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2"
           >
             <Plus size={18} />
             Nuevo Cliente
           </button>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-4 font-bold">Cliente / Empresa</th>
                  <th className="p-4 font-bold">RNC / Cédula</th>
                  <th className="p-4 font-bold">Contacto</th>
                  <th className="p-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{client.company || client.name}</div>
                      {client.company && client.name && <div className="text-xs text-gray-400">{client.name}</div>}
                    </td>
                    <td className="p-4 text-gray-300 font-mono text-sm">{client.rnc || '-'}</td>
                    <td className="p-4">
                      <div className="text-sm text-gray-300">{client.phone}</div>
                      <div className="text-xs text-gray-500">{client.email}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(client)}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No hay clientes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-bold text-white font-futuristic">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="clientType" 
                    value="FISICA" 
                    checked={formData.type === 'FISICA'} 
                    onChange={() => setFormData({...formData, type: 'FISICA'})}
                    className="accent-raynold-red"
                  />
                  <span className="text-white font-medium">Persona Física</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="clientType" 
                    value="EMPRESA" 
                    checked={formData.type === 'EMPRESA'} 
                    onChange={() => setFormData({...formData, type: 'EMPRESA'})}
                    className="accent-raynold-red"
                  />
                  <span className="text-white font-medium">Empresa</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.type === 'EMPRESA' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Razón Social (Empresa)</label>
                      <input 
                        required
                        type="text" 
                        value={formData.company}
                        onChange={e => setFormData({...formData, company: e.target.value})}
                        className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">RNC</label>
                      <input 
                        required
                        type="text" 
                        value={formData.rnc}
                        onChange={e => setFormData({...formData, rnc: e.target.value})}
                        className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre del Contacto (Opcional)</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre Completo</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cédula</label>
                      <input 
                        type="text" 
                        value={formData.rnc}
                        onChange={e => setFormData({...formData, rnc: e.target.value})}
                        className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Teléfono</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dirección</label>
                  <textarea 
                    rows={2}
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 btn-animated font-bold rounded-lg flex items-center gap-2">
                  <Save size={18} />
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClients;
