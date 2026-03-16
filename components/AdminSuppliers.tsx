import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert, Save, X, Search, Phone, Mail, MapPin, Loader2, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { Supplier } from '../types';
import { supabase } from '../lib/supabaseClient';
import { consultarRNC, buscarContribuyentes, DGIIResult } from '../lib/dgiiService';

const AdminSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // DGII lookup
  const [dgiiLoading, setDgiiLoading] = useState(false);
  const [dgiiStatus, setDgiiStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
  const [dgiiResult, setDgiiResult] = useState<DGIIResult | null>(null);
  const [dgiiSearchQ, setDgiiSearchQ] = useState('');
  const [dgiiSearchResults, setDgiiSearchResults] = useState<DGIIResult[]>([]);
  const [dgiiSearchLoading, setDgiiSearchLoading] = useState(false);
  const [showDgiiDD, setShowDgiiDD] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);
  const stRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ddRef.current && !ddRef.current.contains(e.target as Node)) setShowDgiiDD(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  const lookupRNC = async (val: string) => {
    const c = val.replace(/[-\s]/g, '');
    if (c.length < 9) { setDgiiStatus('idle'); setDgiiResult(null); return; }
    setDgiiLoading(true);
    const r = await consultarRNC(c);
    setDgiiLoading(false);
    if (r && r.rnc) { setDgiiResult(r); setDgiiStatus('found'); } else { setDgiiResult(null); setDgiiStatus('not_found'); }
  };

  const applyDGII = (r: DGIIResult) => {
    if (!editingSupplier) return;
    setEditingSupplier({
      ...editingSupplier,
      name: r.nombre_comercial || r.nombre || editingSupplier.name,
      taxId: r.rnc || editingSupplier.taxId,
      address: r.direccion || editingSupplier.address,
      phone: r.telefono || editingSupplier.phone,
    });
    setDgiiResult(r); setDgiiStatus('found'); setShowDgiiDD(false); setDgiiSearchQ('');
  };

  const searchDGII = useCallback((q: string) => {
    setDgiiSearchQ(q);
    if (stRef.current) clearTimeout(stRef.current);
    if (q.length < 3) { setDgiiSearchResults([]); setShowDgiiDD(false); return; }
    stRef.current = setTimeout(async () => {
      setDgiiSearchLoading(true); setShowDgiiDD(true);
      const res = await buscarContribuyentes({ nombre: q, limit: 8 });
      setDgiiSearchResults(res.data || []);
      setDgiiSearchLoading(false);
    }, 400);
  }, []);

  const handleTaxIdChange = (val: string) => {
    if (!editingSupplier) return;
    setEditingSupplier({ ...editingSupplier, taxId: val });
    const c = val.replace(/[-\s]/g, '');
    if (c.length >= 9) lookupRNC(val); else { setDgiiStatus('idle'); setDgiiResult(null); }
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data } = await supabase.from('suppliers').select('*').order('name');
    if (data) setSuppliers(data.map(s => ({
      id: s.id, name: s.name, contactName: s.contact_name || '',
      email: s.email || '', phone: s.phone || '', address: s.address || '', taxId: s.tax_id || ''
    })));
    setLoading(false);
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleOpenModal = (supplier?: Supplier) => {
    setEditingSupplier(supplier || { id: '', name: '', contactName: '', email: '', phone: '', address: '', taxId: '' });
    setDgiiResult(null); setDgiiStatus('idle'); setDgiiSearchQ(''); setDgiiSearchResults([]); setShowDgiiDD(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    const row = { name: editingSupplier.name, contact_name: editingSupplier.contactName, email: editingSupplier.email, phone: editingSupplier.phone, address: editingSupplier.address, tax_id: editingSupplier.taxId };
    if (suppliers.find(s => s.id === editingSupplier.id)) {
      await supabase.from('suppliers').update(row).eq('id', editingSupplier.id);
    } else {
      await supabase.from('suppliers').insert([row]);
    }
    setIsModalOpen(false);
    fetchSuppliers();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      await supabase.from('suppliers').delete().eq('id', id);
      fetchSuppliers();
    }
  };

  const handleDuplicate = (supplier: Supplier) => {
    setEditingSupplier({ ...supplier, id: '', name: supplier.name + ' (Copia)', taxId: '' });
    setDgiiResult(null); setDgiiStatus('idle'); setDgiiSearchQ(''); setDgiiSearchResults([]); setShowDgiiDD(false);
    setIsModalOpen(true);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.contactName && s.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.taxId && s.taxId.includes(searchTerm))
  );

  return (
    <div className="p-6 md:p-10 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="text-raynold-red" size={32} />
              <h1 className="text-4xl md:text-5xl font-futuristic font-black text-white">
                DIRECTORIO DE <span className="animate-gradient-text">PROVEEDORES</span>
              </h1>
            </div>
            <p className="text-gray-400">Gestiona la información de tus proveedores.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text" placeholder="Buscar proveedor..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
              />
            </div>
            <button onClick={() => handleOpenModal()} className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center justify-center gap-2 whitespace-nowrap">
              <Plus size={18} /> Nuevo Proveedor
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48 text-gray-500">
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando proveedores...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <div key={supplier.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors relative group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(supplier)} className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors" title="Editar"><Edit2 size={16} /></button>
                  <button onClick={() => handleDuplicate(supplier)} className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 transition-colors" title="Duplicar"><Copy size={16} /></button>
                  <button onClick={() => handleDelete(supplier.id)} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                </div>
                <h3 className="text-xl font-bold text-white mb-1 pr-16">{supplier.name}</h3>
                {supplier.taxId && <p className="text-xs text-raynold-green font-mono mb-4">RNC/NIT: {supplier.taxId}</p>}
                <div className="space-y-3 mt-4">
                  {supplier.contactName && (<div className="flex items-center gap-3 text-sm text-gray-300"><div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0"><span className="font-bold text-white">{supplier.contactName.charAt(0)}</span></div><span>{supplier.contactName}</span></div>)}
                  {supplier.phone && (<div className="flex items-center gap-3 text-sm text-gray-400"><Phone size={16} className="text-gray-500" /><a href={`tel:${supplier.phone}`} className="hover:text-white transition-colors">{supplier.phone}</a></div>)}
                  {supplier.email && (<div className="flex items-center gap-3 text-sm text-gray-400"><Mail size={16} className="text-gray-500" /><a href={`mailto:${supplier.email}`} className="hover:text-white transition-colors truncate">{supplier.email}</a></div>)}
                  {supplier.address && (<div className="flex items-start gap-3 text-sm text-gray-400"><MapPin size={16} className="text-gray-500 shrink-0 mt-0.5" /><span className="line-clamp-2">{supplier.address}</span></div>)}
                </div>
              </div>
            ))}
            {filteredSuppliers.length === 0 && (
              <div className="col-span-full p-12 text-center text-gray-500 bg-[#0A0A0A] border border-white/10 rounded-xl">
                {searchTerm ? 'No se encontraron proveedores que coincidan.' : 'No hay proveedores registrados.'}
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && editingSupplier && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-bold text-white font-futuristic">{suppliers.find(s => s.id === editingSupplier.id) ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* DGII Search */}
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-4 space-y-3" ref={ddRef}>
                <p className="text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><Search size={13} /> Buscar en DGII</p>
                <div className="relative">
                  <input type="text" value={dgiiSearchQ} onChange={e => searchDGII(e.target.value)} placeholder="Buscar empresa por nombre..." className="w-full bg-black/60 border border-blue-700/40 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-blue-400 transition-colors pl-9" />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                  {dgiiSearchLoading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-400" />}
                  {showDgiiDD && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#111] border border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-30">
                      {dgiiSearchResults.length === 0 && !dgiiSearchLoading && <div className="px-4 py-3 text-gray-500 text-sm">Sin resultados</div>}
                      {dgiiSearchResults.map((r, i) => (
                        <button key={i} type="button" onClick={() => applyDGII(r)} className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0"><p className="text-white text-sm font-bold truncate">{r.nombre_comercial || r.nombre}</p>{r.actividad_economica && <p className="text-gray-600 text-[10px] truncate">{r.actividad_economica}</p>}</div>
                            <div className="text-right flex-shrink-0"><p className="text-blue-400 font-mono text-xs font-bold">{r.rnc}</p><p className={`text-[10px] ${r.estado === 'ACTIVO' ? 'text-green-500' : 'text-red-500'}`}>{r.estado || ''}</p></div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {dgiiStatus === 'found' && dgiiResult && (
                <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-3 flex items-start gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-green-300 text-sm font-bold">{dgiiResult.nombre_comercial || dgiiResult.nombre}</p>
                    <p className="text-green-400/70 text-xs font-mono">{dgiiResult.rnc} · {dgiiResult.estado || ''}</p>
                  </div>
                  <button type="button" onClick={() => applyDGII(dgiiResult)} className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0">Usar</button>
                </div>
              )}
              {dgiiStatus === 'not_found' && (
                <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-400" />
                  <p className="text-amber-300 text-xs">RNC no encontrado en la DGII.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre de la Empresa *</label>
                  <input required type="text" value={editingSupplier.name} onChange={e => setEditingSupplier({ ...editingSupplier, name: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors" placeholder="Ej. Materiales S.A." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">RNC / NIT {dgiiLoading && <Loader2 size={12} className="animate-spin text-blue-400" />}{dgiiStatus === 'found' && <CheckCircle size={12} className="text-green-400" />}</label>
                  <input type="text" value={editingSupplier.taxId || ''} onChange={e => handleTaxIdChange(e.target.value)} className={`w-full bg-black border rounded-lg px-4 py-2 text-white focus:outline-none transition-colors font-mono ${dgiiStatus === 'found' ? 'border-green-600/50 focus:border-green-400' : dgiiStatus === 'not_found' ? 'border-amber-600/50 focus:border-amber-400' : 'border-white/20 focus:border-raynold-red'}`} placeholder="Ej. 130XXXXX" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre del Contacto</label>
                  <input type="text" value={editingSupplier.contactName || ''} onChange={e => setEditingSupplier({ ...editingSupplier, contactName: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Teléfono</label>
                  <input type="tel" value={editingSupplier.phone || ''} onChange={e => setEditingSupplier({ ...editingSupplier, phone: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Correo Electrónico</label>
                  <input type="email" value={editingSupplier.email || ''} onChange={e => setEditingSupplier({ ...editingSupplier, email: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dirección</label>
                  <textarea rows={2} value={editingSupplier.address || ''} onChange={e => setEditingSupplier({ ...editingSupplier, address: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none transition-colors resize-none" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 btn-animated font-bold rounded-lg flex items-center gap-2"><Save size={18} /> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSuppliers;
