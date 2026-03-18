import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, X, Save, Eye, Copy, Check, ChevronDown, ChevronUp,
  Loader2, CreditCard, Landmark, Link2, Bitcoin, ExternalLink,
  Globe, User, Sparkles, Smartphone, Upload, Camera, QrCode, Download, FileText
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabaseClient';
import { BANK_OPTIONS, BankOption } from './bankOptions';

const VerifiedBadge: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <img src="/verified-badge.svg" alt="Verificado" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }} />
);

interface PaymentPage {
  id: string; name: string; username: string; bio: string; avatar_url: string;
  theme: string; accent_color: string; is_active: boolean; slug: string; rnc: string;
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
  { id: 'midnight', label: 'Midnight', bg: '#1a1a2e', card: '#16213e', text: '#eee' },
  { id: 'sunset', label: 'Sunset', bg: '#2d1b69', card: '#3d2d7a', text: '#fff' },
  { id: 'forest', label: 'Forest', bg: '#0a211a', card: '#0d2b22', text: '#d4edda' },
];

const ACCENTS = ['#6366f1', '#E60000', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#a855f7'];

const TYPE_LABELS: Record<string, string> = {
  bank: 'Banco', app: 'App de Pago', link: 'Link de Pago', crypto: 'Cripto',
};

/* ────────── PLANTILLAS / TEMPLATES ────────── */
interface PaymentTemplate {
  id: string; name: string; description: string;
  theme: string; accent_color: string; bio: string;
  preview_bg: string; preview_accent: string;
}

const PAYMENT_TEMPLATES: PaymentTemplate[] = [
  { id: 'elegante', name: 'Elegante Oscuro', description: 'Tema oscuro con acento indigo, ideal para profesionales', theme: 'dark', accent_color: '#6366f1', bio: 'Profesional · Pagos Seguros', preview_bg: '#0f0f23', preview_accent: '#6366f1' },
  { id: 'corporativo', name: 'Corporativo Rojo', description: 'Estilo corporativo con rojo intenso', theme: 'dark', accent_color: '#E60000', bio: 'Empresa · Pagos Corporativos', preview_bg: '#0f0f23', preview_accent: '#E60000' },
  { id: 'minimalista', name: 'Minimalista Claro', description: 'Diseño limpio y moderno sobre fondo claro', theme: 'light', accent_color: '#6366f1', bio: 'Pagos rápidos y seguros', preview_bg: '#f8fafc', preview_accent: '#6366f1' },
  { id: 'neón', name: 'Neón Cristal', description: 'Efecto glassmorphism con brillo cyan', theme: 'glass', accent_color: '#06b6d4', bio: '✨ Transferencias Instantáneas', preview_bg: '#0c1222', preview_accent: '#06b6d4' },
  { id: 'dorado', name: 'Premium Dorado', description: 'Estilo lujoso con acentos dorados', theme: 'midnight', accent_color: '#f59e0b', bio: 'Premium · VIP Payments', preview_bg: '#1a1a2e', preview_accent: '#f59e0b' },
  { id: 'rosa', name: 'Rosa Moderno', description: 'Diseño fresco y vibrante en rosa', theme: 'sunset', accent_color: '#ec4899', bio: '💅 Pagos con Estilo', preview_bg: '#2d1b69', preview_accent: '#ec4899' },
  { id: 'natura', name: 'Naturaleza', description: 'Tonos verdes inspirados en la naturaleza', theme: 'forest', accent_color: '#10b981', bio: '🌿 Eco-Friendly Payments', preview_bg: '#0a211a', preview_accent: '#10b981' },
  { id: 'sunset', name: 'Sunset Purple', description: 'Degradado violeta con acento naranja', theme: 'sunset', accent_color: '#f97316', bio: '🌅 Pagos al Instante', preview_bg: '#2d1b69', preview_accent: '#f97316' },
];

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
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrStyle, setQrStyle] = useState<'classic'|'modern'|'card'>('card');
  const [qrAccent, setQrAccent] = useState('#E60000');
  const [qrBg, setQrBg] = useState('#ffffff');
  const [qrFg, setQrFg] = useState('#000000');
  const [qrSize, setQrSize] = useState(240);
  const [qrShowLogo, setQrShowLogo] = useState(true);
  const [qrShowPhoto, setQrShowPhoto] = useState(true);
  const [qrShowName, setQrShowName] = useState(true);
  const [qrShowUser, setQrShowUser] = useState(true);
  const [qrShowLink, setQrShowLink] = useState(true);
  const [qrCustomText, setQrCustomText] = useState('Escanea para pagar');
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const [savedQrs, setSavedQrs] = useState<any[]>([]);
  const [qrName, setQrName] = useState('Mi QR');
  const [selectedQrId, setSelectedQrId] = useState('');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editPage) return;
    const ext = file.name.split('.').pop();
    const path = `payment-avatars/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('raynold-media').upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('raynold-media').getPublicUrl(path);
      setEditPage({ ...editPage, avatar_url: publicUrl });
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (selectedPageId) fetchSavedQrs(selectedPageId); }, [selectedPageId]);

  const fetchAll = async () => {
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from('payment_pages').select('*').order('created_at', { ascending: false }),
      supabase.from('payment_methods').select('*').order('sort_order'),
    ]);
    if (p) setPages(p); if (m) setMethods(m);
    if (p && p.length > 0 && !selectedPageId) setSelectedPageId(p[0].id);
    setLoading(false);
  };

  const fetchSavedQrs = async (pageId: string) => {
    const { data } = await supabase.from('saved_qr_codes').select('*').eq('page_id', pageId).order('created_at', { ascending: false });
    if (data) setSavedQrs(data);
  };

  const saveQr = async () => {
    if (!currentPage) return;
    const row = { page_id: currentPage.id, name: qrName, style: qrStyle, accent_color: qrAccent, bg_color: qrBg, fg_color: qrFg, qr_size: qrSize, show_logo: qrShowLogo, show_photo: qrShowPhoto, show_name: qrShowName, show_user: qrShowUser, show_link: qrShowLink, custom_text: qrCustomText };
    if (selectedQrId) {
      await supabase.from('saved_qr_codes').update({ ...row, updated_at: new Date().toISOString() }).eq('id', selectedQrId);
    } else {
      const { data } = await supabase.from('saved_qr_codes').insert([row]).select();
      if (data) setSelectedQrId(data[0].id);
    }
    fetchSavedQrs(currentPage.id);
  };

  const loadQr = (qr: any) => {
    setSelectedQrId(qr.id); setQrName(qr.name); setQrStyle(qr.style); setQrAccent(qr.accent_color); setQrBg(qr.bg_color); setQrFg(qr.fg_color); setQrSize(qr.qr_size); setQrShowLogo(qr.show_logo); setQrShowPhoto(qr.show_photo); setQrShowName(qr.show_name); setQrShowUser(qr.show_user); setQrShowLink(qr.show_link); setQrCustomText(qr.custom_text || '');
  };

  const deleteQr = async (id: string) => {
    if (!window.confirm('¿Eliminar este QR guardado?')) return;
    await supabase.from('saved_qr_codes').delete().eq('id', id);
    if (selectedQrId === id) setSelectedQrId('');
    if (currentPage) fetchSavedQrs(currentPage.id);
  };

  const currentPage = pages.find(p => p.id === selectedPageId);
  const currentMethods = methods
    .filter(m => m.page_id === selectedPageId)
    .filter(m => filterType === 'all' || m.type === filterType);

  const openPageModal = (page?: PaymentPage) => {
    setEditPage(page || { id: '', name: '', username: '', bio: '', avatar_url: '', theme: 'light', accent_color: '#E60000', is_active: true, slug: '', rnc: '' });
    setIsPageModal(true);
  };

  const applyTemplate = (tpl: PaymentTemplate) => {
    if (editPage) {
      setEditPage({ ...editPage, theme: tpl.theme, accent_color: tpl.accent_color, bio: tpl.bio });
    }
  };

  const savePage = async () => {
    if (!editPage) return;
    const slug = editPage.slug || editPage.username.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const row = { name: editPage.name, username: editPage.username, bio: editPage.bio, avatar_url: editPage.avatar_url, theme: editPage.theme, accent_color: editPage.accent_color, is_active: editPage.is_active, slug, rnc: editPage.rnc };
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
                  <div className="flex gap-2 mb-6 flex-wrap">
                    <button onClick={() => openPageModal(currentPage)} className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold flex items-center gap-2"><Edit2 size={14} /> Editar</button>
                    <a href={`/pagar/${currentPage.slug}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold flex items-center gap-2"><ExternalLink size={14} /> Ir al Link</a>
                    <button onClick={() => { setQrAccent(currentPage.accent_color); setShowQrModal(true); fetchSavedQrs(currentPage.id); setSelectedQrId(''); }} className="px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-bold flex items-center gap-2"><QrCode size={14} /> Generar QR</button>
                    <button onClick={() => copyToClipboard(`${window.location.origin}/pagar/${currentPage.slug}`, 'link')} className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold flex items-center gap-2">
                      {copied === 'link' ? <Check size={14} /> : <Link2 size={14} />} {copied === 'link' ? '¡Copiado!' : 'Copiar Link'}
                    </button>
                    <button onClick={() => deletePage(currentPage.id)} className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold flex items-center gap-2"><Trash2 size={14} /> Eliminar</button>
                  </div>

                  {/* Saved QR Codes List */}
                  {savedQrs.length > 0 && (
                    <div className="mb-6">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">QR Guardados ({savedQrs.length})</p>
                      <div className="grid grid-cols-2 gap-2">
                        {savedQrs.map(q => (
                          <div key={q.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl p-3 hover:border-white/20 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 rounded-md" style={{ backgroundColor: q.accent_color }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{q.name}</p>
                                <p className="text-[9px] text-gray-500">{q.style === 'card' ? 'Tarjeta' : q.style === 'modern' ? 'Moderno' : 'Clásico'}</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={() => { loadQr(q); setShowQrModal(true); }} className="flex-1 px-2 py-1.5 bg-cyan-500/15 text-cyan-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-cyan-500/25"><Edit2 size={10} /> Editar</button>
                              <button onClick={() => { loadQr(q); setShowQrModal(true); }} className="flex-1 px-2 py-1.5 bg-purple-500/15 text-purple-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-purple-500/25"><Download size={10} /> Descargar</button>
                              <button onClick={() => deleteQr(q.id)} className="px-2 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-[10px] font-bold hover:bg-red-500/25"><Trash2 size={10} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

        {/* Right: Always Visible Mobile Preview */}
        {currentPage && (
          <div className="w-[400px] border-l border-white/10 bg-[#0A0A0A] flex flex-col shrink-0">
            <div className="flex items-center gap-2 p-3 border-b border-white/10">
              <Smartphone size={14} className="text-raynold-red" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vista Previa Mobile</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex justify-center">
              {/* Phone Frame */}
              <div style={{ width: '320px', minHeight: '580px', borderRadius: '32px', border: '3px solid #333', backgroundColor: '#1a1a1a', padding: '8px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
                {/* Notch */}
                <div style={{ width: '100px', height: '6px', backgroundColor: '#333', borderRadius: '10px', margin: '0 auto 6px' }} />
                <div style={{ borderRadius: '24px', overflow: 'hidden', height: 'calc(100% - 12px)' }}>
                  <div style={{ overflowY: 'auto', height: '100%' }}>
                    <PaymentPagePreview page={currentPage} methods={methods.filter(m => m.page_id === currentPage.id && m.is_active)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Page Modal with Templates */}
      {isPageModal && editPage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <h2 className="text-lg font-bold text-white">{editPage.id ? 'Editar Página' : 'Nueva Página de Pago'}</h2>
              <button onClick={() => setIsPageModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Templates Section */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Sparkles size={14} className="text-raynold-red" /> Plantillas</h3>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_TEMPLATES.map(tpl => (
                    <button key={tpl.id} onClick={() => applyTemplate(tpl)}
                      className={`rounded-xl border-2 overflow-hidden text-left transition-all hover:scale-[1.02] ${editPage.theme === tpl.theme && editPage.accent_color === tpl.accent_color ? 'border-raynold-red shadow-[0_0_12px_rgba(230,0,0,0.2)]' : 'border-white/10 hover:border-white/20'}`}>
                      {/* Mini preview */}
                      <div className="h-20 relative" style={{ backgroundColor: tpl.preview_bg }}>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: tpl.preview_accent + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                            <User size={12} style={{ color: tpl.preview_accent }} />
                          </div>
                          <div style={{ width: '40px', height: '3px', borderRadius: '2px', backgroundColor: tpl.preview_accent + '60', marginBottom: '3px' }} />
                          <div style={{ width: '30px', height: '2px', borderRadius: '2px', backgroundColor: tpl.preview_accent + '30' }} />
                          <div className="absolute bottom-2 left-2 right-2 space-y-1">
                            <div style={{ height: '4px', borderRadius: '2px', backgroundColor: tpl.preview_accent + '15' }} />
                            <div style={{ height: '4px', borderRadius: '2px', backgroundColor: tpl.preview_accent + '10' }} />
                          </div>
                        </div>
                        {editPage.theme === tpl.theme && editPage.accent_color === tpl.accent_color && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-raynold-red rounded-full flex items-center justify-center"><Check size={10} className="text-white" /></div>
                        )}
                      </div>
                      <div className="p-2 bg-[#111]">
                        <p className="text-[10px] font-bold text-white truncate">{tpl.name}</p>
                        <p className="text-[8px] text-gray-500 truncate">{tpl.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Nombre</label><input type="text" value={editPage.name} onChange={e => setEditPage({ ...editPage, name: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="Juan Pérez" /></div>
                    <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Username</label><input type="text" value={editPage.username} onChange={e => setEditPage({ ...editPage, username: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="juanperez" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Bio</label><input type="text" value={editPage.bio} onChange={e => setEditPage({ ...editPage, bio: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="Diseñador Web" /></div>
                    <div><label className="text-[10px] text-gray-500 uppercase block mb-1">RNC / Cédula</label><input type="text" value={editPage.rnc || ''} onChange={e => setEditPage({ ...editPage, rnc: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-mono" placeholder="130-00000-0" /></div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Foto de Perfil</label>
                    <div className="flex items-center gap-3">
                      {editPage.avatar_url ? (
                        <img src={editPage.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white/20" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><User size={20} className="text-gray-500" /></div>
                      )}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => avatarInputRef.current?.click()} className="px-3 py-1.5 bg-raynold-red/20 text-raynold-red rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-raynold-red/30"><Camera size={12} /> Subir Foto</button>
                          {editPage.avatar_url && <button type="button" onClick={() => setEditPage({ ...editPage, avatar_url: '' })} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold">Quitar</button>}
                        </div>
                        <input type="text" value={editPage.avatar_url} onChange={e => setEditPage({ ...editPage, avatar_url: e.target.value })} className="w-full bg-black border border-white/20 rounded px-2 py-1 text-white text-[10px] font-mono" placeholder="o pegar URL de imagen..." />
                      </div>
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-2">Tema</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {THEMES.map(t => (
                        <button key={t.id} onClick={() => setEditPage({ ...editPage, theme: t.id })}
                          className={`p-2 rounded-xl border-2 text-center ${editPage.theme === t.id ? 'border-raynold-red' : 'border-white/10'}`}>
                          <div className="w-full h-5 rounded-lg mb-1" style={{ backgroundColor: t.bg }} />
                          <span className="text-[9px] font-bold text-gray-400">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-2">Color Acento</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {ACCENTS.map(c => (
                        <button key={c} onClick={() => setEditPage({ ...editPage, accent_color: c })}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${editPage.accent_color === c ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Live Preview in Modal */}
                <div className="bg-[#111] rounded-2xl p-3 flex items-start justify-center overflow-hidden">
                  <div style={{ width: '260px', borderRadius: '24px', overflow: 'hidden', border: '2px solid #333', backgroundColor: '#1a1a1a', padding: '6px' }}>
                    <div style={{ width: '60px', height: '4px', backgroundColor: '#333', borderRadius: '10px', margin: '0 auto 4px' }} />
                    <div style={{ borderRadius: '18px', overflow: 'hidden' }}>
                      <PaymentPagePreviewMini page={editPage} />
                    </div>
                  </div>
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
                    <option>Ahorros</option><option>Corriente</option><option>Empresarial</option><option>Nómina</option><option>Wallet</option><option>Otro</option>
                  </select>
                </div>
                <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Moneda</label>
                  <select value={editMethod.currency} onChange={e => setEditMethod({ ...editMethod, currency: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                    <option>DOP</option><option>USD</option><option>EUR</option><option>BTC</option>
                  </select>
                </div>
              </div>
              <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Titular</label><input type="text" value={editMethod.account_holder} onChange={e => setEditMethod({ ...editMethod, account_holder: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm" /></div>
              <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Número de Cuenta / ID</label><input type="text" value={editMethod.account_number} onChange={e => setEditMethod({ ...editMethod, account_number: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-mono" placeholder="830-123456-7" /></div>
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

      {/* QR Studio Pro Modal */}
      {showQrModal && currentPage && (() => {
        const QR_THEMES = [
          ['#1a1a2e','#6366f1'],['#1a1a2e','#06b6d4'],['#1a1a2e','#3b82f6'],['#1a1a2e','#8b5cf6'],['#1a1a2e','#ec4899'],
          ['#ffffff','#E60000'],['#ffffff','#10b981'],['#ffffff','#f59e0b'],['#ffffff','#6366f1'],['#ffffff','#000000'],
          ['#0f0f23','#E60000'],['#0f0f23','#06b6d4'],['#0f0f23','#f97316'],['#0f0f23','#10b981'],['#0f0f23','#a855f7'],
          ['#f8fafc','#6366f1'],['#f8fafc','#E60000'],['#f8fafc','#10b981'],['#f8fafc','#f59e0b'],['#f8fafc','#ec4899'],
          ['#0a211a','#10b981'],['#2d1b69','#f97316'],['#0c1222','#06b6d4'],['#1e293b','#f59e0b'],['#1e1e1e','#ffffff'],
        ];
        const qrLink = `${window.location.origin}/pagar/${currentPage.slug}`;
        const isLight = qrBg === '#ffffff' || qrBg === '#f8fafc';
        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-[900px] overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <QrCode size={20} className="text-cyan-400" />
                <h2 className="text-base font-bold text-white">QR Studio</h2>
                <span className="px-2 py-0.5 bg-raynold-red/20 text-raynold-red rounded-full text-[9px] font-black uppercase">Pro</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={saveQr} className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-green-500/30"><Save size={14} /> {selectedQrId ? 'Actualizar' : 'Guardar'}</button>
                <button onClick={() => downloadQr('png')} className="px-4 py-2 btn-animated font-bold rounded-lg text-xs flex items-center gap-2"><Download size={14} /> PNG</button>
                <button onClick={() => setShowQrModal(false)}><X size={18} className="text-gray-400" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex">
              {/* Left: Controls */}
              <div className="w-[380px] shrink-0 overflow-y-auto scrollbar-modern p-4 space-y-4 border-r border-white/10">
                {/* Saved QRs */}
                {savedQrs.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-2">QR Guardados</label>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {savedQrs.map(q => (
                        <div key={q.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${selectedQrId === q.id ? 'bg-raynold-red/15 border border-raynold-red/30' : 'hover:bg-white/5'}`}>
                          <button onClick={() => loadQr(q)} className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: q.accent_color }} />
                              <span className="text-xs text-white font-medium">{q.name}</span>
                            </div>
                          </button>
                          <button onClick={() => deleteQr(q.id)} className="text-gray-600 hover:text-red-400"><Trash2 size={11} /></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { setSelectedQrId(''); setQrName('Nuevo QR'); }} className="mt-1.5 w-full px-3 py-1.5 border border-dashed border-white/15 rounded-lg text-[10px] text-gray-500 hover:text-white flex items-center justify-center gap-1"><Plus size={10} /> Nuevo QR</button>
                  </div>
                )}

                {/* QR Name */}
                <div className="bg-white/5 rounded-xl p-3">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-1.5">Nombre del QR</label>
                  <input type="text" value={qrName} onChange={e => setQrName(e.target.value)} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-xs" placeholder="Mi QR" />
                </div>
                {/* Style Tabs */}
                <div className="flex rounded-xl bg-white/5 p-1">
                  {([['classic','Clásico'],['modern','Moderno'],['card','Tarjeta']] as const).map(([v,l]) => (
                    <button key={v} onClick={() => setQrStyle(v)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${qrStyle === v ? 'bg-raynold-red text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>{l}</button>
                  ))}
                </div>

                {/* Page Selector */}
                <div className="bg-white/5 rounded-xl p-3">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-1.5">Enlace de Pago</label>
                  <select value={selectedPageId} onChange={e => setSelectedPageId(e.target.value)} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                    {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* Toggle Elements */}
                <div className="bg-white/5 rounded-xl p-3">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-2">Elementos Visibles</label>
                  <div className="space-y-1">
                    {([
                      { k: 'qrShowLogo', l: 'Logo en QR', v: qrShowLogo, s: setQrShowLogo, icon: <QrCode size={12}/> },
                      { k: 'qrShowPhoto', l: 'Foto de Perfil', v: qrShowPhoto, s: setQrShowPhoto, icon: <Camera size={12}/> },
                      { k: 'qrShowName', l: 'Nombre', v: qrShowName, s: setQrShowName, icon: <User size={12}/> },
                      { k: 'qrShowUser', l: 'Usuario', v: qrShowUser, s: setQrShowUser, icon: <Globe size={12}/> },
                      { k: 'qrShowLink', l: 'Link Completo', v: qrShowLink, s: setQrShowLink, icon: <Link2 size={12}/> },
                    ]).map(o => (
                      <button key={o.k} onClick={() => o.s(!o.v)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5">
                        <span className="text-gray-500">{o.icon}</span>
                        <span className="flex-1 text-left text-xs text-white font-medium">{o.l}</span>
                        <div className={`w-8 h-4 rounded-full transition-colors ${o.v ? 'bg-raynold-red' : 'bg-gray-700'}`}>
                          <div className={`w-3.5 h-3.5 rounded-full bg-white mt-[1px] transition-transform ${o.v ? 'translate-x-[17px]' : 'translate-x-[1px]'}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Text */}
                <div className="bg-white/5 rounded-xl p-3">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-1.5">Texto Personalizado</label>
                  <input type="text" value={qrCustomText} onChange={e => setQrCustomText(e.target.value)} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-xs" placeholder="Escanea para pagar" />
                  <p className="text-[8px] text-gray-600 mt-1">Aparece encima del código QR.</p>
                </div>

                {/* Predefined Themes */}
                <div className="bg-white/5 rounded-xl p-3">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-2">Temas Predefinidos</label>
                  <div className="grid grid-cols-5 gap-2">
                    {QR_THEMES.map(([bg, accent], i) => (
                      <button key={i} onClick={() => { setQrBg(bg); setQrAccent(accent); setQrFg(bg === '#ffffff' || bg === '#f8fafc' ? '#000000' : '#ffffff'); }}
                        className={`w-full aspect-square rounded-xl border-2 overflow-hidden ${qrBg === bg && qrAccent === accent ? 'border-white shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}>
                        <div className="w-full h-full relative" style={{ backgroundColor: bg }}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div style={{ width: '16px', height: '16px', borderRadius: '3px', backgroundColor: accent }} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color + Background */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-2">Color Principal</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {ACCENTS.map(c => (
                        <button key={c} onClick={() => setQrAccent(c)} className={`w-6 h-6 rounded-full border-2 ${qrAccent === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                      ))}
                      <label className="w-6 h-6 rounded-full border border-dashed border-white/30 flex items-center justify-center cursor-pointer">
                        <Plus size={10} className="text-gray-500" />
                        <input type="color" value={qrAccent} onChange={e => setQrAccent(e.target.value)} className="sr-only" />
                      </label>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-2">Fondo</label>
                    <div className="flex gap-2">
                      {[{c:'#ffffff',l:'⬜'},{c:'#f8fafc',l:'🔲'},{c:'#1a1a2e',l:'🌙'}].map(bg => (
                        <button key={bg.c} onClick={() => { setQrBg(bg.c); setQrFg(bg.c === '#ffffff' || bg.c === '#f8fafc' ? '#000000' : '#ffffff'); }}
                          className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm ${qrBg === bg.c ? 'border-raynold-red' : 'border-white/10'}`}
                          style={{ backgroundColor: bg.c }}>{bg.l}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Size */}
                <div className="bg-white/5 rounded-xl p-3">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-1.5">Tamaño QR: {qrSize}px</label>
                  <input type="range" min="160" max="360" value={qrSize} onChange={e => setQrSize(Number(e.target.value))} className="w-full accent-raynold-red" />
                </div>
              </div>

              {/* Right: QR Preview */}
              <div className="flex-1 flex flex-col items-center justify-center bg-[#111] p-6 overflow-auto">
                <div ref={qrContainerRef} className="flex flex-col items-center" style={{
                  backgroundColor: qrBg,
                  borderRadius: qrStyle === 'card' ? '24px' : qrStyle === 'modern' ? '16px' : '0',
                  padding: qrStyle === 'card' ? '32px 28px' : qrStyle === 'modern' ? '24px 20px' : '20px',
                  boxShadow: qrStyle === 'card' ? `0 20px 60px ${qrAccent}15, 0 4px 20px rgba(0,0,0,0.3)` : 'none',
                  border: qrStyle === 'card' ? `1px solid ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.1)'}` : 'none',
                  minWidth: '300px',
                }}>
                  {/* Photo */}
                  {qrShowPhoto && currentPage.avatar_url && (
                    <img src={currentPage.avatar_url} alt="" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${qrAccent}`, marginBottom: '12px', boxShadow: `0 4px 12px ${qrAccent}25` }} />
                  )}
                  {/* Name + Badge */}
                  {qrShowName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: qrFg, fontFamily: "'Inter',sans-serif" }}>{currentPage.name}</span>
                      <img src="/verified-badge.svg" alt="" style={{ width: '18px', height: '18px' }} />
                    </div>
                  )}
                  {/* Username */}
                  {qrShowUser && (
                    <p style={{ fontSize: '12px', color: qrAccent, fontWeight: 600, marginBottom: '16px', fontFamily: "'Inter',sans-serif" }}>@{currentPage.username}</p>
                  )}
                  {/* Custom text */}
                  {qrCustomText && (
                    <p style={{ fontSize: '10px', color: qrFg, opacity: 0.4, marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Inter',sans-serif" }}>{qrCustomText}</p>
                  )}
                  {/* QR */}
                  <div style={{
                    padding: qrStyle === 'card' ? '14px' : '10px',
                    borderRadius: qrStyle === 'classic' ? '0' : '16px',
                    border: `3px solid ${qrAccent}`,
                    backgroundColor: '#ffffff',
                  }}>
                    <QRCodeSVG
                      value={qrLink}
                      size={qrSize}
                      level="H"
                      fgColor={qrAccent}
                      bgColor="#ffffff"
                      imageSettings={qrShowLogo && currentPage.avatar_url ? { src: currentPage.avatar_url, height: 36, width: 36, excavate: true } : undefined}
                    />
                  </div>
                  {/* Link */}
                  {qrShowLink && (
                    <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 16px', borderRadius: '20px', border: `1.5px solid ${qrAccent}30`, backgroundColor: `${qrAccent}08` }}>
                      <Globe size={10} style={{ color: qrAccent }} />
                      <span style={{ fontSize: '10px', fontWeight: 700, color: qrAccent, letterSpacing: '0.3px', fontFamily: "'Inter',sans-serif", textTransform: 'uppercase' }}>{window.location.host}/pagar/{currentPage.slug}</span>
                    </div>
                  )}
                </div>

                {/* Download Buttons */}
                <div className="flex gap-2 mt-6">
                  <button onClick={() => downloadQr('png')} className="px-4 py-2.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-[11px] font-bold flex items-center gap-2 hover:bg-cyan-500/30"><Download size={13} /> PNG</button>
                  <button onClick={() => downloadQr('jpg')} className="px-4 py-2.5 bg-amber-500/20 text-amber-400 rounded-lg text-[11px] font-bold flex items-center gap-2 hover:bg-amber-500/30"><Download size={13} /> JPG</button>
                  <button onClick={() => downloadQr('pdf')} className="px-4 py-2.5 bg-rose-500/20 text-rose-400 rounded-lg text-[11px] font-bold flex items-center gap-2 hover:bg-rose-500/30"><FileText size={13} /> PDF</button>
                  <button onClick={() => downloadQr('svg')} className="px-4 py-2.5 bg-purple-500/20 text-purple-400 rounded-lg text-[11px] font-bold flex items-center gap-2 hover:bg-purple-500/30"><Download size={13} /> SVG</button>
                </div>

                {/* Pro Tip */}
                <div className="mt-4 p-3 bg-[#1a1a2e] rounded-xl max-w-xs">
                  <p className="text-[10px] font-bold text-cyan-400 mb-1">💡 Consejo Pro</p>
                  <p className="text-[9px] text-gray-400 leading-relaxed">Usa el estilo "Tarjeta" para imprimir y colocar en tu mostrador. Incluye tu foto para generar más confianza.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );

  async function downloadQr(format: 'png' | 'svg' | 'jpg' | 'pdf') {
    const container = qrContainerRef.current;
    if (!container) return;
    const slug = currentPage?.slug || 'pago';

    if (format === 'svg') {
      const svgEl = container.querySelector('svg');
      if (!svgEl) return;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `qr-${slug}.svg`; a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Use html2canvas for pixel-perfect rendering
    const canvas = await html2canvas(container, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });

    if (format === 'pdf') {
      const imgData = canvas.toDataURL('image/png');
      const pxW = canvas.width;
      const pxH = canvas.height;
      const pdfW = pxW * 0.264583; // px to mm at 96dpi
      const pdfH = pxH * 0.264583;
      const pdf = new jsPDF({ orientation: pdfW > pdfH ? 'l' : 'p', unit: 'mm', format: [pdfW, pdfH] });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`qr-${slug}.pdf`);
      return;
    }

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `qr-${slug}.${format}`; a.click();
      URL.revokeObjectURL(url);
    }, mimeType, 0.95);
  }
};

/* ────────── MINI PREVIEW (for modal) ────────── */
const PaymentPagePreviewMini: React.FC<{ page: PaymentPage }> = ({ page }) => {
  const theme = THEMES.find(t => t.id === page.theme) || THEMES[0];
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", backgroundColor: theme.bg, padding: '20px 12px', minHeight: '350px', color: theme.text }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        {page.avatar_url ? (
          <img src={page.avatar_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px', border: `2px solid ${page.accent_color}` }} />
        ) : (
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: page.accent_color + '30', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} style={{ color: page.accent_color }} />
          </div>
        )}
        <h3 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 2px' }}>{page.name || 'Tu Nombre'}</h3>
        <p style={{ fontSize: '10px', color: page.accent_color, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>@{page.username || 'usuario'} <VerifiedBadge size={12} /></p>
        {page.bio && <p style={{ fontSize: '9px', opacity: 0.5, marginTop: '4px' }}>{page.bio}</p>}
      </div>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', border: `1px solid ${page.accent_color}30`, fontSize: '8px', fontWeight: 700, color: page.accent_color }}>
          <Globe size={8} /> /pagar/{page.slug || 'slug'}
        </div>
      </div>
      {/* Placeholder cards */}
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', backgroundColor: theme.card, border: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: `${page.accent_color}20` }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: `${50 + i * 15}px`, height: '6px', borderRadius: '3px', backgroundColor: `${theme.text}20`, marginBottom: '4px' }} />
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: `${theme.text}10` }} />
          </div>
          <ChevronDown size={10} style={{ opacity: 0.2 }} />
        </div>
      ))}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <p style={{ fontSize: '7px', opacity: 0.2 }}>⚡ Verifica antes de transferir.</p>
      </div>
    </div>
  );
};

/* ────────── FULL PREVIEW COMPONENT (matches PublicPaymentPage) ────────── */
const PaymentPagePreview: React.FC<{ page: PaymentPage; methods: PaymentMethod[] }> = ({ page, methods }) => {
  const [expanded, setExpanded] = useState<string>('');
  const [copied, setCopied] = useState('');
  const theme = THEMES.find(t => t.id === page.theme) || THEMES[0];
  const isLight = page.theme === 'light';

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  // Group banks
  const bankGroups: Record<string, PaymentMethod[]> = {};
  const otherMethods: PaymentMethod[] = [];
  methods.forEach(m => {
    if (m.type === 'bank') {
      if (!bankGroups[m.bank_name]) bankGroups[m.bank_name] = [];
      bankGroups[m.bank_name].push(m);
    } else {
      otherMethods.push(m);
    }
  });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: theme.bg, padding: '24px 14px', minHeight: '500px', color: theme.text }}>
      {/* Profile */}
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        {page.avatar_url ? (
          <img src={page.avatar_url} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px', border: `3px solid ${page.accent_color}`, boxShadow: `0 0 15px ${page.accent_color}30` }} />
        ) : (
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: page.accent_color + '30', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} style={{ color: page.accent_color }} />
          </div>
        )}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>{page.name}</h2>
          <Copy size={10} style={{ opacity: 0.2 }} />
        </div>
        <p style={{ fontSize: '11px', color: page.accent_color, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>@{page.username} <VerifiedBadge size={14} /></p>
        {page.bio && <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '5px' }}>{page.bio}</p>}
      </div>

      {/* RNC */}
      {page.rnc && (
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '10px', backgroundColor: `${page.accent_color}10`, border: `1px solid ${page.accent_color}15` }}>
            <span style={{ fontSize: '8px', fontWeight: 700, opacity: 0.4, textTransform: 'uppercase' }}>RNC:</span>
            <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'monospace' }}>{page.rnc}</span>
            <Copy size={8} style={{ opacity: 0.3 }} />
          </div>
        </div>
      )}

      {/* URL pill */}
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '16px', border: `1px solid ${page.accent_color}35`, fontSize: '9px', fontWeight: 700, color: page.accent_color }}>
          <Globe size={9} /> /pagar/{page.slug}
        </div>
      </div>

      {/* BANKS - Grouped */}
      {Object.keys(bankGroups).length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <p style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.35, marginBottom: '6px', paddingLeft: '4px' }}>Cuentas Bancarias</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(bankGroups).map(([bankName, accounts]) => {
              const first = accounts[0];
              const isOpen = expanded === `bank-${bankName}`;
              return (
                <div key={bankName} style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)'}` }}>
                  {/* Bank Header - toggleable */}
                  <button onClick={() => setExpanded(isOpen ? '' : `bank-${bankName}`)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: theme.card, cursor: 'pointer', textAlign: 'left', border: 'none', color: theme.text, transition: 'all 0.2s' }}>
                    <img src={first.logo_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', backgroundColor: '#fff' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>{bankName}</p>
                      <p style={{ fontSize: '9px', opacity: 0.4, margin: 0 }}>{accounts.length} cuenta{accounts.length > 1 ? 's' : ''} · {accounts.map(a => a.currency).filter((v,i,a)=>a.indexOf(v)===i).join(' / ')}</p>
                    </div>
                    <ChevronDown size={14} style={{ opacity: 0.25, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
                  </button>
                  {/* Sub-accounts - fully expanded when bank is open */}
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)'}` }}>
                      {accounts.map((m, idx) => (
                        <div key={m.id} style={{ borderTop: idx > 0 ? `1px solid ${isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)'}` : 'none', padding: '8px 12px', backgroundColor: `${page.accent_color}03` }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                            <div style={{ padding: '6px 8px', borderRadius: '8px', backgroundColor: `${page.accent_color}10` }}>
                              <p style={{ fontSize: '7px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.4, margin: '0 0 1px' }}>Tipo</p>
                              <p style={{ fontSize: '10px', fontWeight: 700, margin: 0 }}>{m.account_type}</p>
                            </div>
                            <div style={{ padding: '6px 8px', borderRadius: '8px', backgroundColor: `${page.accent_color}10` }}>
                              <p style={{ fontSize: '7px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.4, margin: '0 0 1px' }}>Titular</p>
                              <p style={{ fontSize: '10px', fontWeight: 700, margin: 0 }}>{m.account_holder}</p>
                            </div>
                            <div style={{ padding: '6px 8px', borderRadius: '8px', backgroundColor: `${page.accent_color}10` }}>
                              <p style={{ fontSize: '7px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.4, margin: '0 0 1px' }}>Moneda</p>
                              <p style={{ fontSize: '10px', fontWeight: 700, margin: 0 }}>{m.currency}</p>
                            </div>
                          </div>
                          {page.rnc && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', padding: '5px 8px', borderRadius: '6px', backgroundColor: `${page.accent_color}08`, border: `1px solid ${page.accent_color}12` }}>
                              <span style={{ fontSize: '7px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>RNC:</span>
                              <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', flex: 1 }}>{page.rnc}</span>
                              <Copy size={8} style={{ opacity: 0.3 }} />
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '8px', backgroundColor: `${page.accent_color}12`, border: `1px solid ${page.accent_color}20` }}>
                            <p style={{ flex: 1, fontSize: '12px', fontWeight: 800, fontFamily: 'monospace', margin: 0, letterSpacing: '0.5px' }}>{m.account_number}</p>
                            <button onClick={() => copy(m.account_number, m.id)}
                              style={{ padding: '5px 10px', borderRadius: '6px', backgroundColor: page.accent_color, color: '#fff', fontSize: '9px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                              {copied === m.id ? <><Check size={10} /> ¡Copiado!</> : <><Copy size={10} /> Copiar</>}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other methods */}
      {otherMethods.length > 0 && (() => {
        const otherGrouped: Record<string, PaymentMethod[]> = {};
        otherMethods.forEach(m => {
          const label = m.type === 'app' ? 'Apps de Pago' : m.type === 'link' ? 'Links de Pago' : 'Cripto';
          if (!otherGrouped[label]) otherGrouped[label] = [];
          otherGrouped[label].push(m);
        });
        return Object.entries(otherGrouped).map(([label, items]) => (
          <div key={label} style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.35, marginBottom: '6px', paddingLeft: '4px' }}>{label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {items.map(m => (
                <div key={m.id}>
                  <button onClick={() => setExpanded(expanded === m.id ? '' : m.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', backgroundColor: theme.card, border: expanded === m.id ? `2px solid ${page.accent_color}30` : `1px solid ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', color: theme.text }}>
                    <img src={m.logo_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', backgroundColor: '#fff' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>{m.bank_name}</p>
                      <p style={{ fontSize: '9px', opacity: 0.4, margin: 0 }}>{m.account_type} · {m.currency}</p>
                    </div>
                    <ChevronDown size={14} style={{ opacity: 0.25, transform: expanded === m.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {expanded === m.id && (
                    <div style={{ padding: '10px 12px', marginTop: '3px', borderRadius: '10px', backgroundColor: `${page.accent_color}08`, border: `1px solid ${page.accent_color}18` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '8px', backgroundColor: `${page.accent_color}12` }}>
                        <p style={{ flex: 1, fontSize: '12px', fontWeight: 800, fontFamily: 'monospace', margin: 0, letterSpacing: '0.5px' }}>{m.account_number || m.payment_url}</p>
                        <button onClick={() => copy(m.account_number || m.payment_url, m.id)}
                          style={{ padding: '5px 10px', borderRadius: '6px', backgroundColor: page.accent_color, color: '#fff', fontSize: '9px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                          {copied === m.id ? <><Check size={10} /> ¡Copiado!</> : <><Copy size={10} /> Copiar</>}
                        </button>
                      </div>
                      {m.payment_url && (
                        <a href={m.payment_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '6px', padding: '7px', borderRadius: '8px', backgroundColor: page.accent_color, color: '#fff', fontSize: '10px', fontWeight: 700, textDecoration: 'none' }}>
                          <ExternalLink size={12} /> Link de Pago
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ));
      })()}

      {methods.length === 0 && (
        <div style={{ textAlign: 'center', padding: '30px 0', opacity: 0.3 }}>
          <CreditCard size={28} style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '10px' }}>Añade métodos de pago</p>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '12px', borderTop: `1px solid ${theme.text}08` }}>
        <p style={{ fontSize: '8px', opacity: 0.2 }}>⚡ Información del titular. Verifica antes de transferir.</p>
      </div>
    </div>
  );
};

export { PaymentPagePreview };
export default AdminPaymentLinks;
