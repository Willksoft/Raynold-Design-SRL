import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, User } from 'lucide-react';

export interface Seller {
  id: string;
  name: string;
}

const AdminSellers = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    const savedSellers = localStorage.getItem('admin_sellers');
    if (savedSellers) {
      setSellers(JSON.parse(savedSellers));
    }
  }, []);

  const saveSellers = (newSellers: Seller[]) => {
    setSellers(newSellers);
    localStorage.setItem('admin_sellers', JSON.stringify(newSellers));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSeller) {
      const updatedSellers = sellers.map(s => 
        s.id === editingSeller.id ? { ...s, name: formData.name } : s
      );
      saveSellers(updatedSellers);
    } else {
      const newSeller: Seller = {
        id: Date.now().toString(),
        name: formData.name
      };
      saveSellers([...sellers, newSeller]);
    }
    setIsModalOpen(false);
    setEditingSeller(null);
    setFormData({ name: '' });
  };

  const handleEdit = (seller: Seller) => {
    setEditingSeller(seller);
    setFormData({ name: seller.name });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este vendedor?')) {
      saveSellers(sellers.filter(s => s.id !== id));
    }
  };

  const filteredSellers = sellers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="text-raynold-red" />
          Vendedores
        </h1>
        <button
          onClick={() => {
            setEditingSeller(null);
            setFormData({ name: '' });
            setIsModalOpen(true);
          }}
          className="bg-raynold-red hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Vendedor
        </button>
      </div>

      <div className="bg-[#141414] rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-300">
            <thead className="bg-black/50 text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Nombre</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredSellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">{seller.name}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(seller)}
                      className="text-blue-400 hover:text-blue-300 p-2 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(seller.id)}
                      className="text-red-400 hover:text-red-300 p-2 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSellers.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron vendedores.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {editingSeller ? 'Editar Vendedor' : 'Nuevo Vendedor'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Trash2 size={24} className="hidden" />
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre del Vendedor</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-raynold-red hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellers;
