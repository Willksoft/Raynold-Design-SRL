import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Save, Users, Loader2, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabaseClient';
import { clientSchema } from '../lib/schemas';
import { useDGIILookup, useDGIISearch } from '../hooks/useDGII';
import { DGIIResult } from '../lib/dgiiService';
import { z } from 'zod';

type ClientFormData = z.infer<typeof clientSchema>;

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

interface SupabaseClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  rnc: string | null;
  type: string;
}

const toui = (c: SupabaseClient): Client => ({
  id: c.id,
  type: c.type === 'Juridica' ? 'EMPRESA' : 'FISICA',
  name: c.type === 'Natural' ? c.name : '',
  company: c.type === 'Juridica' ? c.name : '',
  rnc: c.rnc || '',
  phone: c.phone || '',
  email: c.email || '',
  address: c.address || '',
});

const AdminClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  // DGII state
  const [rncInput, setRncInput] = useState('');
  const [dgiiSearchQuery, setDgiiSearchQuery] = useState('');
  const [showDgiiDropdown, setShowDgiiDropdown] = useState(false);
  const [dgiiApplied, setDgiiApplied] = useState<DGIIResult | null>(null);
  const dgiiDropdownRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  // React Query hooks for DGII
  const { data: dgiiLookupResult, isLoading: dgiiLookupLoading, status: dgiiLookupStatus } = useDGIILookup(rncInput);
  const { data: dgiiSearchData, isLoading: dgiiSearchLoading } = useDGIISearch(dgiiSearchQuery);

  const dgiiSearchResults = dgiiSearchData?.data || [];

  // Determine DGII status from React Query
  const dgiiStatus = (() => {
    if (dgiiApplied) return 'found' as const;
    const clean = rncInput.replace(/[-\s]/g, '');
    if (clean.length < 9) return 'idle' as const;
    if (dgiiLookupLoading) return 'loading' as const;
    if (dgiiLookupStatus === 'success' && dgiiLookupResult?.rnc) return 'found' as const;
    if (dgiiLookupStatus === 'success' && !dgiiLookupResult) return 'not_found' as const;
    return 'idle' as const;
  })();

  const dgiiResult = dgiiApplied || dgiiLookupResult;

  // React Hook Form with Zod
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      type: 'Persona Física',
      rnc: '',
      company: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  const clientType = watch('type');

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (!error && data) setClients(data.map(toui));
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dgiiDropdownRef.current && !dgiiDropdownRef.current.contains(e.target as Node)) {
        setShowDgiiDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpenModal = (client?: Client) => {
    setDgiiApplied(null);
    setRncInput('');
    setDgiiSearchQuery('');
    setShowDgiiDropdown(false);

    if (client) {
      setEditingClient(client);
      reset({
        name: client.name || client.company,
        type: client.type === 'EMPRESA' ? 'Empresa' : 'Persona Física',
        rnc: client.rnc,
        company: client.company,
        email: client.email,
        phone: client.phone,
        address: client.address,
      });
      setRncInput(client.rnc);
    } else {
      setEditingClient(null);
      reset({
        name: '',
        type: 'Persona Física',
        rnc: '',
        company: '',
        email: '',
        phone: '',
        address: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setDgiiApplied(null);
    setRncInput('');
  };

  const onSubmit = async (data: ClientFormData) => {
    setSaving(true);
    const isEmpresa = data.type === 'Empresa';
    const dbRecord = {
      name: isEmpresa ? (data.company || data.name) : data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      rnc: data.rnc?.replace(/[-\s]/g, '') || null,
      type: isEmpresa ? 'Juridica' : 'Natural',
    };
    if (editingClient) {
      await supabase.from('clients').update(dbRecord).eq('id', editingClient.id);
    } else {
      await supabase.from('clients').insert([dbRecord]);
    }
    setSaving(false);
    handleCloseModal();
    fetchClients();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      await supabase.from('clients').delete().eq('id', id);
      fetchClients();
    }
  };

  const applyDGIIResult = (r: DGIIResult) => {
    const isJuridica = r.tipo?.toLowerCase().includes('juridica') || (r.rnc?.replace(/[-\s]/g, '').length === 9);
    const newType: 'Empresa' | 'Persona Física' = isJuridica ? 'Empresa' : 'Persona Física';

    setValue('type', newType, { shouldValidate: true });
    setValue('rnc', r.rnc || '', { shouldValidate: true });
    setRncInput(r.rnc || '');

    if (isJuridica) {
      setValue('company', r.nombre_comercial || r.nombre || '', { shouldValidate: true });
    } else {
      setValue('name', r.nombre || '', { shouldValidate: true });
    }

    if (r.direccion) setValue('address', r.direccion);
    if (r.telefono) setValue('phone', r.telefono);

    setDgiiApplied(r);
    setShowDgiiDropdown(false);
    setDgiiSearchQuery('');
  };

  // Handle RNC input change — triggers React Query lookup
  const handleRncChange = (val: string) => {
    setValue('rnc', val, { shouldValidate: true });
    setRncInput(val);
    setDgiiApplied(null);
  };

  // Debounced DGII name search
  const handleSearchChange = (query: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (query.length < 3) {
      setDgiiSearchQuery('');
      setShowDgiiDropdown(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      setDgiiSearchQuery(query);
      setShowDgiiDropdown(true);
    }, 400);
  };

  // Field error helper
  const fieldError = (field: keyof ClientFormData) =>
    errors[field] ? (
      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
        <AlertCircle size={12} /> {errors[field]?.message}
      </p>
    ) : null;

  const inputClass = (field: keyof ClientFormData, extra = '') =>
    `w-full bg-black border rounded-lg px-4 py-2 text-white focus:outline-none transition-colors ${errors[field] ? 'border-red-500/60 focus:border-red-400' : 'border-white/20 focus:border-raynold-red'} ${extra}`;

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
          <button onClick={() => handleOpenModal()} className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2">
            <Plus size={18} /> Nuevo Cliente
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
                {loading && (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-500"><Loader2 className="animate-spin inline" size={20} /> Cargando clientes...</td></tr>
                )}
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
                        <button onClick={() => handleOpenModal(client)} className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(client.id)} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && clients.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hay clientes registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════ MODAL ══════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white font-futuristic">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

              {/* ── DGII Smart Search ── */}
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-4 space-y-3" ref={dgiiDropdownRef}>
                <p className="text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Search size={13} /> Buscar en DGII (Autocompletado)
                </p>

                {/* Search by name */}
                <div className="relative">
                  <input
                    type="text"
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder="Buscar por nombre de empresa o persona..."
                    className="w-full bg-black/60 border border-blue-700/40 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-blue-400 transition-colors pl-10"
                  />
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                  {dgiiSearchLoading && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-400" />}

                  {/* Results dropdown */}
                  {showDgiiDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#111] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-30">
                      {dgiiSearchResults.length === 0 && !dgiiSearchLoading && (
                        <div className="px-4 py-3 text-gray-500 text-sm">Sin resultados</div>
                      )}
                      {dgiiSearchResults.map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => applyDGIIResult(r)}
                          className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="text-white text-sm font-bold truncate">{r.nombre_comercial || r.nombre}</p>
                              {r.nombre_comercial && r.nombre && r.nombre !== r.nombre_comercial && (
                                <p className="text-gray-500 text-xs truncate">{r.nombre}</p>
                              )}
                              {r.actividad_economica && (
                                <p className="text-gray-600 text-[10px] truncate mt-0.5">{r.actividad_economica}</p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-blue-400 font-mono text-xs font-bold">{r.rnc}</p>
                              <p className={`text-[10px] mt-0.5 ${r.estado === 'ACTIVO' ? 'text-green-500' : 'text-red-500'}`}>
                                {r.estado || ''}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-blue-400/60 text-[10px]">
                  O escribe el RNC/Cédula directamente en el campo de abajo para consultar automáticamente.
                </p>
              </div>

              {/* ─── DGII Result Banner ─── */}
              {dgiiStatus === 'found' && dgiiResult && (
                <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-3 flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-green-300 text-sm font-bold">{dgiiResult.nombre_comercial || dgiiResult.nombre}</p>
                    <p className="text-green-400/70 text-xs font-mono">{dgiiResult.rnc} · {dgiiResult.estado || ''}</p>
                    {dgiiResult.actividad_economica && <p className="text-green-400/50 text-[10px] mt-0.5">{dgiiResult.actividad_economica}</p>}
                  </div>
                  {!dgiiApplied && (
                    <button
                      type="button"
                      onClick={() => applyDGIIResult(dgiiResult)}
                      className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0"
                    >
                      Usar datos
                    </button>
                  )}
                </div>
              )}
              {dgiiStatus === 'not_found' && (
                <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
                  <p className="text-amber-300 text-xs">Este RNC/Cédula no fue encontrado en el registro de la DGII. Puede ser un contribuyente informal.</p>
                </div>
              )}

              {/* ─── Type selector ─── */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="Persona Física" {...register('type')} className="accent-raynold-red" />
                  <span className="text-white font-medium">Persona Física</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="Empresa" {...register('type')} className="accent-raynold-red" />
                  <span className="text-white font-medium">Empresa</span>
                </label>
              </div>
              {fieldError('type')}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientType === 'Empresa' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Razón Social (Empresa)</label>
                      <input {...register('company')} className={inputClass('company')} />
                      {fieldError('company')}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        RNC
                        {dgiiLookupLoading && <Loader2 size={12} className="animate-spin text-blue-400" />}
                        {dgiiStatus === 'found' && <CheckCircle size={12} className="text-green-400" />}
                      </label>
                      <input
                        {...register('rnc')}
                        onChange={e => handleRncChange(e.target.value)}
                        placeholder="Ej: 131123456"
                        className={inputClass('rnc', `font-mono ${dgiiStatus === 'found' ? '!border-green-600/50 focus:!border-green-400' : dgiiStatus === 'not_found' ? '!border-amber-600/50 focus:!border-amber-400' : ''}`)}
                      />
                      {fieldError('rnc')}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre del Contacto (Opcional)</label>
                      <input {...register('name')} className={inputClass('name')} />
                      {fieldError('name')}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre Completo</label>
                      <input {...register('name')} className={inputClass('name')} />
                      {fieldError('name')}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        Cédula
                        {dgiiLookupLoading && <Loader2 size={12} className="animate-spin text-blue-400" />}
                        {dgiiStatus === 'found' && <CheckCircle size={12} className="text-green-400" />}
                      </label>
                      <input
                        {...register('rnc')}
                        onChange={e => handleRncChange(e.target.value)}
                        placeholder="Ej: 00112345678"
                        className={inputClass('rnc', `font-mono ${dgiiStatus === 'found' ? '!border-green-600/50 focus:!border-green-400' : dgiiStatus === 'not_found' ? '!border-amber-600/50 focus:!border-amber-400' : ''}`)}
                      />
                      {fieldError('rnc')}
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Teléfono</label>
                  <input {...register('phone')} className={inputClass('phone')} />
                  {fieldError('phone')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Correo Electrónico</label>
                  <input type="email" {...register('email')} className={inputClass('email')} />
                  {fieldError('email')}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dirección</label>
                  <textarea rows={2} {...register('address')} className={`${inputClass('address')} resize-none`} />
                  {fieldError('address')}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2 btn-animated font-bold rounded-lg flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {saving ? 'Guardando...' : 'Guardar Cliente'}
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
