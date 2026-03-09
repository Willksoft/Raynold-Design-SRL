import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Copy, Check, Search, Image as ImageIcon, X } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  name: string;
  date: string;
  size?: string;
}

const AdminMedia: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const savedMedia = localStorage.getItem('raynold_media_library');
    if (savedMedia) {
      setMedia(JSON.parse(savedMedia));
    }
  }, []);

  const saveMedia = (newMedia: MediaItem[]) => {
    localStorage.setItem('raynold_media_library', JSON.stringify(newMedia));
    setMedia(newMedia);
  };

  // Corrected version of handleFileUpload for multiple files
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    const uploadPromises = Array.from(files).map((file: File) => {
      return new Promise<MediaItem>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            url: reader.result as string,
            name: file.name,
            date: new Date().toISOString(),
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newItems = await Promise.all(uploadPromises);
    saveMedia([...newItems, ...media]);
    setIsUploading(false);
  };

  const deleteMedia = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta imagen?')) {
      saveMedia(media.filter(m => m.id !== id));
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMedia = media.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-futuristic font-black text-white mb-2">MULTIMEDIA</h1>
            <p className="text-gray-400">Gestiona tus imágenes y archivos cargados.</p>
          </div>
          
          <label className="flex items-center gap-2 px-6 py-3 bg-raynold-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors cursor-pointer">
            <Upload size={20} />
            {isUploading ? 'Subiendo...' : 'Subir Imágenes'}
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white focus:border-raynold-red focus:outline-none"
            />
          </div>
        </div>

        {filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-white/10 rounded-2xl">
            <ImageIcon size={64} className="mb-4 opacity-20" />
            <p className="text-xl">No se encontraron imágenes</p>
            <p className="text-sm mt-2">Sube tu primera imagen para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredMedia.map((item) => (
              <div key={item.id} className="group relative bg-black border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all">
                <div className="aspect-square overflow-hidden bg-gray-900">
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="p-3">
                  <p className="text-xs text-white font-medium truncate mb-1">{item.name}</p>
                  <p className="text-[10px] text-gray-500">{item.size || 'N/A'}</p>
                </div>

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => copyToClipboard(item.url, item.id)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    title="Copiar URL"
                  >
                    {copiedId === item.id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                  <button 
                    onClick={() => deleteMedia(item.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMedia;
