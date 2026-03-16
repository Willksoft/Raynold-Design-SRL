import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, ShieldAlert, Copy, LayoutGrid, List as ListIcon } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { ProductItem, Category } from '../types';
import { supabase } from '../lib/supabaseClient';

const AdminPanel: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useShop();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) {
        setCategories((data as Array<{ id: string; name: string; type: string }>).filter(c => c.type === 'product').map(c => ({ id: c.id, name: c.name, type: c.type as Category['type'] })));
      }
    };
    fetchCats();
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    reference: '',
    category: 'Señalización',
    image: '',
    price: '',
    description: '',
    type: 'product' as 'product' | 'service',
    unit: 'Unidad',
    show_price: false
  });

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { data } = await supabase.from('categories').insert([{ name: newCategoryName.trim(), type: 'product' }]).select();
    if (data && data[0]) {
      const newCategory: Category = { id: data[0].id, name: data[0].name, type: 'product' };
      setCategories([...categories, newCategory]);
      setFormData({ ...formData, category: newCategory.name });
    }
    setNewCategoryName('');
    setIsCreatingCategory(false);
  };

  const handleOpenModal = (product?: ProductItem) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        reference: product.reference || '',
        category: product.category,
        image: product.image,
        price: product.price || '',
        description: product.description || '',
        type: product.type || 'product',
        unit: product.unit || 'Unidad',
        show_price: product.show_price ?? false
      });
    } else {
      setEditingProduct(null);
      const generatedRef = `PRD-${Math.floor(1000 + Math.random() * 9000)}`;
      setFormData({
        title: '',
        reference: generatedRef,
        category: categories.length > 0 ? categories[0].name : 'Señalización',
        image: '',
        price: '',
        description: '',
        type: 'product',
        unit: 'Unidad',
        show_price: false
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede superar los 5MB.');
        return;
      }
      setUploading(true);
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `products/${Date.now()}-${safeName}`;
      const { data, error } = await supabase.storage.from('raynold-media').upload(path, file);
      if (error) {
        alert(`Error al subir imagen: ${error.message}`);
      } else if (data) {
        const { data: { publicUrl } } = supabase.storage.from('raynold-media').getPublicUrl(data.path);
        setFormData({ ...formData, image: publicUrl });
      }
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      deleteProduct(id);
    }
  };

  const handleDuplicate = (product: ProductItem) => {
    const { id, ...productWithoutId } = product;
    addProduct({
      ...productWithoutId,
      title: `${product.title} (Copia)`
    });
  };

  return (
    <div className="p-6 md:p-10 relative">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="text-raynold-red" size={32} />
              <h1 className="text-4xl md:text-5xl font-futuristic font-black text-white">
                PANEL DE <span className="animate-gradient-text">ADMIN</span>
              </h1>
            </div>
            <p className="text-gray-400">Gestiona el catálogo de productos (Datos simulados en memoria).</p>
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
              Añadir Producto
            </button>
          </div>
        </div>

        {/* Products Content */}
        {viewMode === 'list' ? (
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                    <th className="p-4 font-bold">Imagen</th>
                    <th className="p-4 font-bold">Ref / ID</th>
                    <th className="p-4 font-bold">Título</th>
                    <th className="p-4 font-bold">Tipo</th>
                    <th className="p-4 font-bold">Categoría</th>
                    <th className="p-4 font-bold">Precio</th>
                    <th className="p-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="w-12 h-12 rounded bg-gray-800 overflow-hidden border border-white/10">
                          <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-4 font-mono text-gray-400 text-sm">{product.reference || product.id.substring(0, 6)}</td>
                      <td className="p-4 font-bold text-white">{product.title}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${product.type === 'service' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {product.type === 'service' ? 'Servicio' : 'Producto'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-white/10 text-xs rounded-full text-gray-300">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-4 text-raynold-green font-mono text-sm">{product.price}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 transition-colors"
                            title="Duplicar"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No hay productos en el catálogo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors group">
                <div className="h-48 bg-gray-900 relative">
                  <img src={product.image} alt={product.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDuplicate(product)}
                      className="p-2 bg-black/80 text-green-400 rounded hover:bg-green-500 hover:text-black transition-colors backdrop-blur-sm"
                      title="Duplicar"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="p-2 bg-black/80 text-blue-400 rounded hover:bg-blue-500 hover:text-black transition-colors backdrop-blur-sm"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 bg-black/80 text-red-400 rounded hover:bg-red-500 hover:text-black transition-colors backdrop-blur-sm"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white truncate pr-2">{product.title}</h3>
                    <span className="text-raynold-green font-mono text-sm shrink-0">{product.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-[10px] rounded-full uppercase tracking-wider ${product.type === 'service' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {product.type === 'service' ? 'Servicio' : 'Producto'}
                      </span>
                      <span className="px-2 py-1 bg-white/10 text-[10px] rounded-full text-gray-400 uppercase tracking-wider">
                        {product.category}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-gray-500">
                      {product.reference || `ID: ${product.id.substring(0, 6)}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="col-span-full p-12 text-center text-gray-500 bg-[#0A0A0A] border border-white/10 rounded-xl">
                No hay productos en el catálogo.
              </div>
            )}
          </div>
        )}

      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                <h2 className="text-xl font-bold text-white font-futuristic">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tipo</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as 'product' | 'service' })}
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                    >
                      <option value="product">Producto</option>
                      <option value="service">Servicio</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Título</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                      placeholder="Ej. Letrero Neon"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Referencia (SKU/ID)</label>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={e => setFormData({ ...formData, reference: e.target.value })}
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                      placeholder="Ej. REF-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categoría</label>
                    {isCreatingCategory ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                          placeholder="Nueva categoría..."
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          className="px-3 bg-raynold-red text-white rounded-lg hover:bg-red-700 transition-colors font-bold"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingCategory(false);
                            setNewCategoryName('');
                          }}
                          className="px-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <select
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value })}
                          className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsCreatingCategory(true)}
                          className="px-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                          title="Crear nueva categoría"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Precio</label>
                    <input
                      required
                      type="text"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                      placeholder="Ej. RD$4,500+ o Cotizar"
                    />
                    <label
                      className="flex items-center gap-3 mt-2 cursor-pointer select-none group"
                      onClick={() => setFormData({ ...formData, show_price: !formData.show_price })}
                    >
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.show_price ? 'bg-raynold-green' : 'bg-white/10'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${formData.show_price ? 'left-[22px]' : 'left-0.5'}`}></div>
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${formData.show_price ? 'text-raynold-green' : 'text-gray-500'}`}>
                        {formData.show_price ? 'Precio Público' : 'Precio Oculto'}
                      </span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unidad de Medida</label>
                    <select
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors"
                    >
                      <option value="Unidad">Unidad</option>
                      <option value="Metro">Metro</option>
                      <option value="Pie">Pie</option>
                      <option value="Pulgada">Pulgada</option>
                      <option value="Kg">Kg</option>
                      <option value="Libra">Libra</option>
                      <option value="Litro">Litro</option>
                      <option value="Galón">Galón</option>
                      <option value="Hora">Hora</option>
                      <option value="Día">Día</option>
                      <option value="Servicio">Servicio</option>
                      <option value="Proyecto">Proyecto</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Imagen (Max 5MB)</label>
                    <div className="flex flex-col gap-3">
                      {formData.image && (
                        <div className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden border border-white/10 relative group">
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image: '' })}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      <label className={`bg-white/5 hover:bg-white/10 border border-white/10 border-dashed text-gray-300 w-full py-4 rounded-lg cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Plus size={20} className="text-gray-500" />
                        <span className="text-sm font-medium">
                          {uploading ? 'Subiendo...' : (formData.image ? 'Cambiar Imagen' : 'Subir Imagen')}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descripción</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors resize-none"
                    placeholder="Descripción detallada del producto..."
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 btn-animated font-bold rounded-lg flex items-center gap-2"
                  >
                    <Save size={18} />
                    Guardar Producto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
