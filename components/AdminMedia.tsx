import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, Copy, Check, Search, Image as ImageIcon, Loader2, Folder, FolderOpen, Download, ExternalLink, FileText, File, Eye, X, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const BUCKET = 'raynold-media';

interface MediaItem {
  id: string;
  url: string;
  name: string;
  fullPath: string;
  folder: string;
  date: string;
  size?: number;
  mimeType?: string;
}

interface FolderInfo {
  name: string;
  label: string;
  icon: string;
  count: number;
}

// Friendly folder names
const FOLDER_LABELS: Record<string, string> = {
  about: 'Nosotros',
  brand: 'Logo / Marca',
  brands: 'Marcas (Clientes)',
  hero: 'Hero (Portada)',
  products: 'Productos',
  projects: 'Proyectos',
  services: 'Servicios',
  site: 'Sitio Web',
  team: 'Equipo',
  uploads: 'Subidas',
  invoices: 'Facturas',
  quotations: 'Cotizaciones',
};

const AdminMedia: React.FC = () => {
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ─── Fetch all media from all folders ───────────────────────────────
  const fetchAllMedia = useCallback(async () => {
    setLoading(true);
    try {
      // First list top-level folders
      const { data: topLevel } = await supabase.storage.from(BUCKET).list('', {
        sortBy: { column: 'name', order: 'asc' }
      });

      if (!topLevel) { setLoading(false); return; }

      const folderNames = topLevel
        .filter(f => f.id === null || !f.name.includes('.')) // folders have no extension
        .map(f => f.name);

      // Also add items at root level (files without folder)
      const rootFiles = topLevel.filter(f => f.id !== null && f.name.includes('.'));

      let items: MediaItem[] = [];
      const folderCounts: Record<string, number> = {};

      // Fetch files from each folder
      for (const folder of folderNames) {
        const { data: files } = await supabase.storage.from(BUCKET).list(folder, {
          sortBy: { column: 'created_at', order: 'desc' },
          limit: 200,
        });
        if (files) {
          const folderFiles = files
            .filter(f => !f.name.startsWith('.') && f.name.includes('.'))
            .map(f => {
              const fullPath = `${folder}/${f.name}`;
              const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fullPath);
              return {
                id: f.id || `${folder}-${f.name}`,
                url: publicUrl,
                name: f.name,
                fullPath,
                folder,
                date: f.created_at || new Date().toISOString(),
                size: f.metadata?.size || undefined,
                mimeType: f.metadata?.mimetype || undefined,
              };
            });
          items = [...items, ...folderFiles];
          folderCounts[folder] = folderFiles.length;
        }
      }

      // Root files
      if (rootFiles.length > 0) {
        for (const f of rootFiles) {
          const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
          items.push({
            id: f.id || f.name,
            url: publicUrl,
            name: f.name,
            fullPath: f.name,
            folder: 'root',
            date: f.created_at || new Date().toISOString(),
            size: f.metadata?.size || undefined,
            mimeType: f.metadata?.mimetype || undefined,
          });
        }
        if (rootFiles.length > 0) folderCounts['root'] = rootFiles.length;
      }

      // Build folder list
      const folderList: FolderInfo[] = Object.entries(folderCounts)
        .filter(([, count]) => count > 0)
        .map(([name, count]) => ({
          name,
          label: FOLDER_LABELS[name] || name.charAt(0).toUpperCase() + name.slice(1),
          icon: name,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      setFolders(folderList);
      setAllMedia(items);
    } catch (err) {
      console.error('Error fetching media:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAllMedia(); }, [fetchAllMedia]);

  // ─── Upload ─────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsUploading(true);
    const targetFolder = selectedFolder || 'uploads';
    for (const file of Array.from(files) as File[]) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${targetFolder}/${Date.now()}-${safeName}`;
      await supabase.storage.from(BUCKET).upload(path, file);
    }
    await fetchAllMedia();
    setIsUploading(false);
    e.target.value = '';
  };

  // ─── Delete ─────────────────────────────────────────────────────────
  const deleteMedia = async (item: MediaItem) => {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return;
    await supabase.storage.from(BUCKET).remove([item.fullPath]);
    setAllMedia(prev => prev.filter(m => m.id !== item.id));
    if (previewItem?.id === item.id) setPreviewItem(null);
  };

  // ─── Copy ───────────────────────────────────────────────────────────
  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── Format helpers ─────────────────────────────────────────────────
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const isImage = (item: MediaItem) => {
    const ext = item.name.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp'].includes(ext);
  };

  const isPDF = (item: MediaItem) => {
    return item.name.toLowerCase().endsWith('.pdf');
  };

  // ─── Filtered media ─────────────────────────────────────────────────
  const filteredMedia = allMedia.filter(m => {
    const matchFolder = !selectedFolder || m.folder === selectedFolder;
    const matchSearch = !searchTerm || m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.folder.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFolder && matchSearch;
  });

  const totalSize = allMedia.reduce((s, m) => s + (m.size || 0), 0);

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ImageIcon className="text-raynold-red" size={32} />
              <h1 className="text-4xl font-futuristic font-black text-white">
                MULTIMEDIA <span className="animate-gradient-text">STORAGE</span>
              </h1>
            </div>
            <p className="text-gray-400 flex items-center gap-4">
              <span>{allMedia.length} archivos</span>
              <span className="text-white/20">|</span>
              <span>{folders.length} carpetas</span>
              <span className="text-white/20">|</span>
              <span>{formatSize(totalSize)} total</span>
            </p>
          </div>
          <label className="flex items-center gap-2 px-6 py-3 btn-animated font-bold rounded-lg cursor-pointer whitespace-nowrap">
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {isUploading ? 'Subiendo...' : 'Subir Archivos'}
            <input type="file" multiple accept="image/*,application/pdf,.doc,.docx,.xlsx,.xls" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>

        {/* Folder pills + Search */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 mb-6 space-y-3">
          {/* Folders */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFolder('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${!selectedFolder ? 'bg-raynold-red text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
            >
              <FolderOpen size={12} /> Todas ({allMedia.length})
            </button>
            {folders.map(f => (
              <button
                key={f.name}
                onClick={() => setSelectedFolder(selectedFolder === f.name ? '' : f.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${selectedFolder === f.name ? 'bg-raynold-red text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
              >
                <Folder size={12} /> {f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Search + View toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text" placeholder="Buscar por nombre..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:border-raynold-red focus:outline-none"
              />
            </div>
            <div className="flex border border-white/20 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-xs font-bold ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>Cuadrícula</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-xs font-bold ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>Lista</button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando multimedia...
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-white/10 rounded-2xl">
            <ImageIcon size={64} className="mb-4 opacity-20" />
            <p className="text-xl font-bold">No se encontraron archivos</p>
            <p className="text-sm mt-2">{searchTerm ? 'Intenta con otra búsqueda' : 'Sube tu primer archivo para comenzar'}</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMedia.map(item => (
              <div key={item.id} className="group relative bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all cursor-pointer" onClick={() => setPreviewItem(item)}>
                <div className="aspect-square overflow-hidden bg-gray-900 flex items-center justify-center">
                  {isImage(item) ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : isPDF(item) ? (
                    <FileText size={40} className="text-red-400 opacity-50" />
                  ) : (
                    <File size={40} className="text-gray-500 opacity-50" />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[10px] text-white font-medium truncate">{item.name}</p>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-[9px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">{FOLDER_LABELS[item.folder] || item.folder}</span>
                    <span className="text-[9px] text-gray-600">{formatSize(item.size)}</span>
                  </div>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setPreviewItem(item)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Ver"><Eye size={16} /></button>
                  <button onClick={() => copyUrl(item.url, item.id)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Copiar URL">
                    {copiedId === item.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                  <a href={item.url} download={item.name} target="_blank" rel="noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Descargar"><Download size={16} /></a>
                  <button onClick={() => deleteMedia(item)} className="p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Archivo</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Carpeta</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Tamaño</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Fecha</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedia.map(item => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setPreviewItem(item)}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-900 shrink-0 flex items-center justify-center">
                          {isImage(item) ? (
                            <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : isPDF(item) ? (
                            <FileText size={18} className="text-red-400" />
                          ) : (
                            <File size={18} className="text-gray-500" />
                          )}
                        </div>
                        <span className="text-sm text-white font-medium truncate max-w-[200px]">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{FOLDER_LABELS[item.folder] || item.folder}</span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">{formatSize(item.size)}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{new Date(item.date).toLocaleDateString('es-DO')}</td>
                    <td className="px-4 py-2 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => copyUrl(item.url, item.id)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                          {copiedId === item.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                        <a href={item.url} download target="_blank" rel="noreferrer" className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"><Download size={14} /></a>
                        <button onClick={() => deleteMedia(item)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">{previewItem.name}</p>
                <p className="text-gray-500 text-xs flex items-center gap-2">
                  <span>{FOLDER_LABELS[previewItem.folder] || previewItem.folder}</span>
                  <ChevronRight size={10} />
                  <span>{formatSize(previewItem.size)}</span>
                  <span className="text-white/20">|</span>
                  <span>{new Date(previewItem.date).toLocaleDateString('es-DO')}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => copyUrl(previewItem.url, previewItem.id)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Copiar URL">
                  {copiedId === previewItem.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
                <a href={previewItem.url} target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Abrir"><ExternalLink size={16} /></a>
                <a href={previewItem.url} download={previewItem.name} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Descargar"><Download size={16} /></a>
                <button onClick={() => deleteMedia(previewItem)} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                <button onClick={() => setPreviewItem(null)} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
              </div>
            </div>
            {/* Preview content */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-[300px]">
              {isImage(previewItem) ? (
                <img src={previewItem.url} alt={previewItem.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              ) : isPDF(previewItem) ? (
                <iframe src={previewItem.url} className="w-full h-[70vh] rounded-lg bg-white" title={previewItem.name} />
              ) : (
                <div className="text-center text-gray-500">
                  <File size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="font-bold">Vista previa no disponible</p>
                  <a href={previewItem.url} download className="text-raynold-red hover:underline text-sm mt-2 inline-block">Descargar archivo</a>
                </div>
              )}
            </div>
            {/* URL bar */}
            <div className="p-3 border-t border-white/10 shrink-0">
              <div className="flex items-center gap-2 bg-black rounded-lg px-3 py-2 border border-white/10">
                <span className="text-[10px] text-gray-500 font-mono truncate flex-1">{previewItem.url}</span>
                <button onClick={() => copyUrl(previewItem.url, previewItem.id + '-bar')} className="text-gray-400 hover:text-white shrink-0">
                  {copiedId === previewItem.id + '-bar' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMedia;
