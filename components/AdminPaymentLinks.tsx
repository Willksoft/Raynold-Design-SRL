import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, X, Save, Eye, Copy, Check, ChevronDown, ChevronUp,
  Loader2, CreditCard, Landmark, Link2, Bitcoin, GripVertical, ExternalLink,
  QrCode, Globe, User
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { BANK_OPTIONS, BankOption } from './bankOptions';

interface PaymentPage {
  id: string; name: string; username: string; bio: string; avatar_url: string;
  theme: string; accent_color: string; is_active: boolean; slug: string;
}

interface PaymentMethod {
  id: string; page_id: string; type: string; bank_name: string;
  account_type: string; account_number: string; account_holder: string;
  currency: string; logo_url: string; payment_url: string;
  sort_order: number; is_active: boolean;
}

const THEMES = [
  { id: 'dark', label: 'Oscuro', bg: '#0f0f23', card: '#1a1a3e', text: '#fff' },
  { id: 'light', label: 'Claro', bg: '#f8fafc', card: '#ffffff', text: '#1e293b' },
  { id: 'glass', label: 'Cristal', bg: '#0c1222', card: 'rgba(255,255,255,0.08)', text: '#fff' },
];

const ACCENTS = ['#6366f1', '#E60000', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  bank: <Landmark size={14} />, app: <CreditCard size={14} />,
  link: <Link2 size={14} />, crypto: <Bitcoin size={14} />,
};

const TYPE_LABELS: Record<string, string> = {
  bank: 'Banco', app: 'App de Pago', link: 'Link de Pago', crypto: 'Cripto',
};

const AdminPaymentLinks: React.FC = () => {
  const [pages, setPages] = useState<PaymentPage[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPage, setEditPage] = useState<PaymentPage | null>(null);
  const [isPageModal, setIsPageModal] = useState(false);
  const [isMethodModal, setIsMethodModal] = useState(false);
  const [editMethod, setEditMethod] = useState<PaymentMethod | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [expandedMethod, setExpandedMethod] = useState<string>('');
  const [copied, setCopied] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [bankSearch, setBankSearch] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from('payment_pages').select('*').order('created_at', { ascending: false }),
      supabase.from('payment_methods').select('*').order('sort_order'),
    ]);
    if (p) setPages(p); if (m) setMethods(m);
    if (p && p.length > 0 && !selectedPageId) setSelectedPageId(p[0].id);
    setLoading(false);
  };

  const currentPage = pages.find(p => p.id === selectedPageId);
  const currentMethods = methods
    .filter(m => m.page_id === selectedPageId)
    .filter(m => filterType === 'all' || m.type === filterType);

  const openPageModal = (page?: PaymentPage) => {
    setEditPage(page || { id: '', name: '', username: '', bio: '', avatar_url: '', theme: 'dark', accent_color: '#6366f1', is_active: true, slug: '' });
    setIsPageModal(true);
  };

  const savePage = async () => {
    if (!editPage) return;
    const slug = editPage.slug || editPage.username.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const row = { name: editPage.name, username: editPage.username, bio: editPage.bio, avatar_url: editPage.avatar_url, theme: editPage.theme, accent_color: editPage.accent_color, is_active: editPage.is_active, slug };
    if (pages.find(p => p.id === editPage.id)) {
      await supabase.from('payment_pages').update(row).eq('id', editPage.id);
    } else {
      const { data } = await supabase.from('payment_pages').insert([row]).select();
      if (data) setSelectedPageId(data[0].id);
    }
    setIsPageModal(false); fetchAll();
  };

  const deletePage = async (id: string) => {
    if (!window.confirm('¿Eliminar esta página de pagos?')) return;
    await supabase.from('payment_pages').delete().eq('id', id);
    setSelectedPageId(''); fetchAll();
  };

  const openMethodModal = (method?: PaymentMethod) => {
    setEditMethod(method || {
      id: '', page_id: selectedPageId, type: 'bank', bank_name: '', account_type: 'Ahorros',
      account_number: '', account_holder: currentPage?.name || '', currency: 'DOP',
      logo_url: '', payment_url: '', sort_order: currentMethods.length, is_active: true,
    });
    setIsMethodModal(true); setBankSearch(''); setShowBankPicker(false);
  };

  const selectBank = (bank: BankOption) => {
    if (!editMethod) return;
    setEditMethod({ ...editMethod, bank_name: bank.name, logo_url: bank.logo, type: bank.type, currency: bank.defaultCurrency });
    setShowBankPicker(false); setBankSearch('');
  };

  const saveMethod = async () => {
    if (!editMethod) return;
    const row = { page_id: editMethod.page_id, type: editMethod.type, bank_name: editMethod.bank_name, account_type: editMethod.account_type, account_number: editMethod.account_number, account_holder: editMethod.account_holder, currency: editMethod.currency, logo_url: editMethod.logo_url, payment_url: editMethod.payment_url, sort_order: editMethod.sort_order, is_active: editMethod.is_active };
    if (methods.find(m => m.id === editMethod.id)) {
      await supabase.from('payment_methods').update(row).eq('id', editMethod.id);
    } else {
      await supabase.from('payment_methods').insert([row]);
    }
    setIsMethodModal(false); fetchAll();
  };

  const deleteMethod = async (id: string) => {
    if (!window.confirm('¿Eliminar este método de pago?')) return;
    await supabase.from('payment_methods').delete().eq('id', id);
    fetchAll();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const filteredBanks = BANK_OPTIONS.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
    b.type.includes(bankSearch.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-raynold-red" size={40} /></div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <CreditCard className="text-raynold-red" size={26} />
            <div>
              <h1 className="text-xl font-futuristic font-black text-white">LINKS DE <span className="animate-gradient-text">PAGO</span></h1>
              <p className="text-[10px] text-gray-500">Crea páginas tipo Linktree para compartir tus cuentas bancarias</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openPageModal()} className="px-4 py-2 btn-animated font-bold rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> Nueva Página</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left: Page List + Methods */}
        <div className="flex-1 overflow-y-auto scrollbar-modern p-6">
          {/* Page Selector */}
          {pages.length === 0 ? (
            <div className="text-center py-20">
              <CreditCard className="text-gray-600 mx-auto mb-4" size={48} />
              <p className="text-gray-400 mb-4">No hay páginas de pago creadas</p>
              <button onClick={() => openPageModal()} className="px-6 py-3 btn-animated font-bold rounded-lg">Crear Primera Página</button>
            </div>
          ) : (
            <>
              {/* Page tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {pages.map(p => (
                  <button key={p.id} onClick={() => setSelectedPageId(p.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold whitespace-nowrap transition-all ${selectedPageId === p.id ? 'border-raynold-red bg-raynold-red/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                    <User size={14} /> {p.name}
                  </button>
                ))}
              </div>

              {currentPage && (
                <>
                  {/* Page Actions */}
                  <div className="flex gap-2 mb-6">
                    <button onClick={() => openPageModal(currentPage)} className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold flex items-center gap-2"><Edit2 size={14} /> Editar Página</button>
                    <button onClick={() => setPreviewOpen(true)} className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold flex items-center gap-2"><Eye size={14} /> Vista Previa</button>
                    <button onClick={() => copyToClipboard(`${window.location.origin}/pagar/${currentPage.slug}`, 'link')} className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold flex items-center gap-2">
                      {copied === 'link' ? <Check size={14} /> : <Link2 size={14} />} {copied === 'link' ? 'Copiado!' : 'Copiar Link'}
                    </button>
                    <button onClick={() => deletePage(currentPage.id)} className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold flex items-center gap-2"><Trash2 size={14} /> Eliminar</button>
                  </div>

                  {/* Filter */}
                  <div className="flex gap-2 mb-4">
                    {['all', 'bank', 'app', 'link', 'crypto'].map(t => (
                      <button key={t} onClick={() => setFilterType(t)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filterType === t ? 'bg-raynold-red/20 text-raynold-red' : 'text-gray-500 hover:text-white'}`}>
                        {t === 'all' ? 'Todos' : TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>

                  {/* Methods List */}
                  <div className="space-y-2 mb-6">
                    {currentMethods.map(m => (
                      <div key={m.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                        <button onClick={() => setExpandedMethod(expandedMethod === m.id ? '' : m.id)}
                          className="w-full flex items-center gap-3 p-4 text-left">
                          <img src={m.logo_url} alt={m.bank_name} className="w-10 h-10 rounded-xl object-cover bg-white" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">{m.bank_name}</p>
                            <p className="text-[11px] text-gray-500">{TYPE_LABELS[m.type]} · {m.account_type} · {m.currency}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${m.is_active ? 'bg-green-500' : 'bg-gray-600'}`} />
                            {expandedMethod === m.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </button>
                        {expandedMethod === m.id && (
                          <div className="px-4 pb-4 border-t border-white/5">
                            <div className="grid grid-cols-2 gap-3 my-3">
                              <div className="bg-white/5 rounded-lg p-3">
                                <p className="text-[10px] text-gray-500 uppercase mb-1">Titular</p>
                                <p className="text-sm text-white font-bold">{m.account_holder}</p>
                              </div>
                              <div className="bg-white/5 rounded-lg p-3">
                                <p className="text-[10px] text-gray-500 uppercase mb-1">Número de Cuenta</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-white font-mono font-bold">{m.account_number}</p>
                                  <button onClick={() => copyToClipboard(m.account_number, m.id)} className="p-1 hover:bg-white/10 rounded">
                                    {copied === m.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-400" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => openMethodModal(m)} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-[11px] font-bold flex items-center gap-1"><Edit2 size={12} /> Editar</button>
                              <button onClick={() => deleteMethod(m.id)} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-[11px] font-bold flex items-center gap-1"><Trash2 size={12} /> Eliminar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button onClick={() => openMethodModal()} className="w-full p-4 rounded-xl border-2 border-dashed border-white/10 text-gray-400 hover:border-raynold-red/30 hover:text-raynold-red transition-colors flex items-center justify-center gap-2 font-bold text-sm">
                    <Plus size={18} /> Añadir Método de Pago
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Right: Live Preview */}
        {currentPage && previewOpen && (
          <div className="w-[380px] border-l border-white/10 bg-[#111] flex flex-col shrink-0">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="text-xs font-bold text-gray-400">VISTA PREVIA MOBILE</span>
              <button onClick={() => setPreviewOpen(false)} className="text-gray-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mx-auto" style={{ maxWidth: '360px' }}>
                <PaymentPagePreview page={currentPage} methods={methods.filter(m => m.page_id === currentPage.id && m.is_active)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Page Modal */}
      {isPageModal && editPage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">{editPage.id ? 'Editar Página' : 'Nueva Página'}</h2>
              <button onClick={() => setIsPageModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Nombre Completo</label><input type="text" value={editPage.name} onChange={e => setEditPage({ ...editPage, name: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="Juan Pérez" /></div>
                <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Username</label><input type="text" value={editPage.username} onChange={e => setEditPage({ ...editPage, username: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="juanperez" /></div>
              </div>
              <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Bio / Descripción</label><input type="text" value={editPage.bio} onChange={e => setEditPage({ ...editPage, bio: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="Diseñador & Desarrollador Web" /></div>
              <div><label className="text-[10px] text-gray-500 uppercase block mb-1">URL Avatar</label><input type="text" value={editPage.avatar_url} onChange={e => setEditPage({ ...editPage, avatar_url: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="https://..." /></div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-2">Tema</label>
                <div className="flex gap-2">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setEditPage({ ...editPage, theme: t.id })}
                      className={`flex-1 p-2.5 rounded-xl border-2 text-center ${editPage.theme === t.id ? 'border-raynold-red' : 'border-white/10'}`}>
                      <div className="w-full h-6 rounded-lg mb-1.5" style={{ backgroundColor: t.bg }} />
                      <span className="text-[10px] font-bold text-gray-400">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-2">Color Acento</label>
                <div className="flex gap-2">
                  {ACCENTS.map(c => (
                    <button key={c} onClick={() => setEditPage({ ...editPage, accent_color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${editPage.accent_color === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-3">
                <button onClick={() => setIsPageModal(false)} className="px-5 py-2 text-gray-400 font-bold rounded-lg hover:text-white">Cancelar</button>
                <button onClick={savePage} className="px-5 py-2 btn-animated font-bold rounded-lg flex items-center gap-2"><Save size={16} /> Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Method Modal */}
      {isMethodModal && editMethod && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">{editMethod.id ? 'Editar Método' : 'Nuevo Método de Pago'}</h2>
              <button onClick={() => setIsMethodModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Bank Picker */}
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-2">Seleccionar Banco / App</label>
                {editMethod.bank_name ? (
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <img src={editMethod.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover bg-white" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{editMethod.bank_name}</p>
                      <p className="text-[10px] text-gray-500">{TYPE_LABELS[editMethod.type]}</p>
                    </div>
                    <button onClick={() => { setEditMethod({ ...editMethod, bank_name: '', logo_url: '' }); setShowBankPicker(true); }} className="text-xs text-blue-400 font-bold">Cambiar</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="text" value={bankSearch} onChange={e => { setBankSearch(e.target.value); setShowBankPicker(true); }} onFocus={() => setShowBankPicker(true)}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm" placeholder="Buscar banco o app de pago..." />
                    {showBankPicker && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-[#111] border border-white/10 rounded-xl shadow-2xl max-h-52 overflow-y-auto z-30">
                        {['bank', 'app', 'crypto'].map(type => {
                          const items = filteredBanks.filter(b => b.type === type);
                          if (!items.length) return null;
                          return (
                            <div key={type}>
                              <p className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase bg-white/5 sticky top-0">{TYPE_LABELS[type]}s</p>
                              {items.map(b => (
                                <button key={b.name} onClick={() => selectBank(b)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors">
                                  <img src={b.logo} alt="" className="w-8 h-8 rounded-lg object-cover bg-white" />
                                  <span className="text-sm text-white font-medium">{b.name}</span>
                                  <span className="text-[10px] text-gray-500 ml-auto">{b.defaultCurrency}</span>
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Tipo de Cuenta</label>
                  <select value={editMethod.account_type} onChange={e => setEditMethod({ ...editMethod, account_type: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                    <option>Ahorros</option><option>Corriente</option><option>Nómina</option><option>Wallet</option><option>Otro</option>
                  </select>
                </div>
                <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Moneda</label>
                  <select value={editMethod.currency} onChange={e => setEditMethod({ ...editMethod, currency: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                    <option>DOP</option><option>USD</option><option>EUR</option><option>BTC</option>
                  </select>
                </div>
              </div>
              <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Titular de la Cuenta</label><input type="text" value={editMethod.account_holder} onChange={e => setEditMethod({ ...editMethod, account_holder: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm" /></div>
              <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Número de Cuenta / ID</label><input type="text" value={editMethod.account_number} onChange={e => setEditMethod({ ...editMethod, account_number: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-mono" placeholder="Ej. 830-123456-7" /></div>
              {editMethod.type !== 'bank' && (
                <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Link de Pago (opcional)</label><input type="text" value={editMethod.payment_url} onChange={e => setEditMethod({ ...editMethod, payment_url: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="https://paypal.me/..." /></div>
              )}
              <div className="pt-3 flex justify-end gap-3">
                <button onClick={() => setIsMethodModal(false)} className="px-5 py-2 text-gray-400 font-bold rounded-lg hover:text-white">Cancelar</button>
                <button onClick={saveMethod} disabled={!editMethod.bank_name} className="px-5 py-2 btn-animated font-bold rounded-lg flex items-center gap-2 disabled:opacity-40"><Save size={16} /> Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ────────── PUBLIC PREVIEW COMPONENT ────────── */
const PaymentPagePreview: React.FC<{ page: PaymentPage; methods: PaymentMethod[] }> = ({ page, methods }) => {
  const [expanded, setExpanded] = useState<string>('');
  const [copied, setCopied] = useState('');
  const theme = THEMES.find(t => t.id === page.theme) || THEMES[0];

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const grouped = {
    bank: methods.filter(m => m.type === 'bank'),
    app: methods.filter(m => m.type === 'app'),
    link: methods.filter(m => m.type === 'link'),
    crypto: methods.filter(m => m.type === 'crypto'),
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: theme.bg, borderRadius: '24px', padding: '24px 16px', minHeight: '600px', color: theme.text }}>
      {/* Avatar */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {page.avatar_url ? (
          <img src={page.avatar_url} alt="" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px', border: `3px solid ${page.accent_color}` }} />
        ) : (
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: page.accent_color + '30', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={28} style={{ color: page.accent_color }} />
          </div>
        )}
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px' }}>{page.name}</h2>
        <p style={{ fontSize: '12px', color: page.accent_color, fontWeight: 600 }}>@{page.username} ✓</p>
        {page.bio && <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '6px' }}>{page.bio}</p>}
      </div>

      {/* Link pill */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', border: `1px solid ${page.accent_color}40`, fontSize: '10px', fontWeight: 700, color: page.accent_color }}>
          <Globe size={10} /> {window.location.host}/pagar/{page.slug}
        </div>
      </div>

      {/* Payment Methods */}
      {Object.entries(grouped).map(([type, items]) => {
        if (!items.length) return null;
        return (
          <div key={type} style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.5, marginBottom: '8px', paddingLeft: '4px' }}>
              {TYPE_LABELS[type]}s
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {items.map(m => (
                <div key={m.id}>
                  <button onClick={() => setExpanded(expanded === m.id ? '' : m.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', backgroundColor: theme.card, border: expanded === m.id ? `2px solid ${page.accent_color}` : '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                    <img src={m.logo_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', backgroundColor: '#fff' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: theme.text, margin: 0 }}>{m.bank_name}</p>
                      <p style={{ fontSize: '11px', opacity: 0.5, margin: 0 }}>{m.account_type} · {m.currency}</p>
                    </div>
                    <ChevronDown size={16} style={{ opacity: 0.3, transform: expanded === m.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {expanded === m.id && (
                    <div style={{ padding: '12px 14px', marginTop: '4px', borderRadius: '12px', backgroundColor: `${page.accent_color}10`, border: `1px solid ${page.accent_color}20` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        <div><p style={{ fontSize: '9px', opacity: 0.5, textTransform: 'uppercase', margin: '0 0 2px' }}>Titular</p><p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>{m.account_holder}</p></div>
                        <div><p style={{ fontSize: '9px', opacity: 0.5, textTransform: 'uppercase', margin: '0 0 2px' }}>Tipo</p><p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>{m.account_type}</p></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', backgroundColor: `${page.accent_color}15` }}>
                        <p style={{ flex: 1, fontSize: '14px', fontWeight: 800, fontFamily: 'monospace', margin: 0, letterSpacing: '0.5px' }}>{m.account_number}</p>
                        <button onClick={() => copy(m.account_number, m.id)}
                          style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: page.accent_color, color: '#fff', fontSize: '11px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {copied === m.id ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                        </button>
                      </div>
                      {m.payment_url && (
                        <a href={m.payment_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px', padding: '8px', borderRadius: '10px', backgroundColor: page.accent_color, color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                          <ExternalLink size={14} /> Ir al Link de Pago
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${theme.text}10` }}>
        <p style={{ fontSize: '9px', opacity: 0.3 }}>⚡ Información proporcionada por el titular. Verifica antes de transferir.</p>
      </div>
    </div>
  );
};

export { PaymentPagePreview };
export default AdminPaymentLinks;
