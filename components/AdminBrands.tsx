import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Save } from 'lucide-react';

interface Brand {
  id: number;
  name: string;
  logoUrl: string;
}

const AdminBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  useEffect(() => {
    const savedBrands = localStorage.getItem('raynold_brands');
    if (savedBrands) {
      setBrands(JSON.parse(savedBrands));
    } else {
      const defaultBrands = [
        { id: 1, name: 'Banco Popular', logoUrl: '' },
        { id: 2, name: 'Claro', logoUrl: '' },
        { id: 3, name: 'Presidente', logoUrl: '' },
        { id: 4, name: 'Banreservas', logoUrl: '' },
        { id: 5, name: 'Altice', logoUrl: '' },
        { id: 6, name: 'Nestlé', logoUrl: '' },
        { id: 7, name: 'Coca Cola', logoUrl: '' },
      ];
      setBrands(defaultBrands);
      localStorage.setItem('raynold_brands', JSON.stringify(defaultBrands));
    }
  }, []);

  const saveBrands = (newBrands: Brand[]) => {
    setBrands(newBrands);
    localStorage.setItem('raynold_brands', JSON.stringify(newBrands));
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta marca?')) {
      saveBrands(brands.filter(b => b.id !== id));
    }
  };

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
    } else {
      setEditingBrand({
        id: Date.now(),
        name: '',
        logoUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;

    const exists = brands.find(b => b.id === editingBrand.id);
    if (exists) {
      saveBrands(brands.map(b => b.id === editingBrand.id ? editingBrand : b));
    } else {
      saveBrands([...brands, editingBrand]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Marcas / Clientes</h1>
          <p className="text-gray-400">Gestiona los logos de las marcas que confían en nosotros (Carrusel).</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Añadir Marca
        </button>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <th className="p-4 font-bold">Logo</th>
                <th className="p-4 font-bold">Nombre de la Marca</th>
                <th className="p-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="w-16 h-16 rounded bg-black flex items-center justify-center border border-white/10 text-gray-500 overflow-hidden">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} className="max-w-full max-h-full object-contain p-2" />
                      ) : (
                        <ImageIcon size={24} />
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-white">{brand.name}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(brand)}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors" 
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(brand.id)}
                        className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors" 
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">No hay marcas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingBrand && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-bold text-white font-futuristic">
                {brands.find(b => b.id === editingBrand.id) ? 'Editar Marca' : 'Nueva Marca'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre de la Marca</label>
                <input 
                  required
                  type="text" 
                  value={editingBrand.name}
                  onChange={e => setEditingBrand({...editingBrand, name: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                  placeholder="Ej. Banco Popular"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Logo</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={editingBrand.logoUrl}
                    onChange={e => setEditingBrand({...editingBrand, logoUrl: e.target.value})}
                    className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                    placeholder="URL del logo..."
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
                            setEditingBrand({...editingBrand, logoUrl: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                </div>
              </div>

              {editingBrand.logoUrl && (
                <div className="p-4 bg-black border border-white/10 rounded-xl flex items-center justify-center">
                  <img src={editingBrand.logoUrl} alt="Preview" className="max-h-24 object-contain" />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 btn-animated font-bold rounded-lg flex items-center gap-2"
                >
                  <Save size={18} />
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

export default AdminBrands;

