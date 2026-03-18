import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, Copy, Check, ExternalLink, Globe, User, Loader2, AlertCircle, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface PaymentPage {
  id: string; name: string; username: string; bio: string; avatar_url: string;
  theme: string; accent_color: string; slug: string; rnc: string;
}

interface PaymentMethod {
  id: string; type: string; bank_name: string; account_type: string;
  account_number: string; account_holder: string; currency: string;
  logo_url: string; payment_url: string; sort_order: number; rnc: string;
}

const THEMES: Record<string, { bg: string; card: string; text: string }> = {
  dark: { bg: '#0f0f23', card: '#1a1a3e', text: '#ffffff' },
  light: { bg: '#f8fafc', card: '#ffffff', text: '#1e293b' },
  glass: { bg: '#0c1222', card: 'rgba(255,255,255,0.08)', text: '#ffffff' },
  midnight: { bg: '#1a1a2e', card: '#16213e', text: '#eeeeee' },
  sunset: { bg: '#2d1b69', card: '#3d2d7a', text: '#ffffff' },
  forest: { bg: '#0a211a', card: '#0d2b22', text: '#d4edda' },
};

const PublicPaymentPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PaymentPage | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expanded, setExpanded] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const { data: p } = await supabase.from('payment_pages').select('*').eq('slug', slug?.toLowerCase()).eq('is_active', true).single();
      if (!p) { setNotFound(true); setLoading(false); return; }
      setPage(p);
      const { data: m } = await supabase.from('payment_methods').select('*').eq('page_id', p.id).eq('is_active', true).order('sort_order');
      if (m) setMethods(m);
      setLoading(false);
    };
    fetch();
  }, [slug]);

  // Dynamic metadata
  useEffect(() => {
    if (!page) return;
    const pageUrl = window.location.href;
    document.title = `${page.name} — Datos de Pago`;

    const setMeta = (name: string, content: string, property?: boolean) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.content = content;
    };

    setMeta('description', `Datos bancarios y métodos de pago de ${page.name}. Copia los números de cuenta fácilmente.`);
    setMeta('theme-color', page.accent_color);
    setMeta('og:title', `${page.name} — Datos de Pago`, true);
    setMeta('og:description', `Realiza pagos y transferencias a ${page.name}. Verifica los datos antes de transferir.`, true);
    setMeta('og:url', pageUrl, true);
    setMeta('og:type', 'website', true);
    if (page.avatar_url) setMeta('og:image', page.avatar_url, true);
    setMeta('twitter:card', 'summary');
    setMeta('twitter:title', `${page.name} — Datos de Pago`);
    setMeta('twitter:description', `Datos de pago de ${page.name}`);

    return () => { document.title = 'Raynold Design SRL'; };
  }, [page]);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: page?.name || 'Cuentas de Pago',
          text: `Datos de pago de ${page?.name}`,
          url: window.location.href,
        });
      } catch {}
    } else {
      copy(window.location.href, 'share');
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f23' }}>
      <Loader2 size={32} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  if (notFound || !page) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f23', color: '#fff', fontFamily: "'Inter',sans-serif" }}>
      <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
      <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Página no encontrada</h1>
      <p style={{ fontSize: '14px', opacity: 0.5, marginTop: '8px' }}>El link de pago que buscas no existe o fue desactivado.</p>
    </div>
  );

  const theme = THEMES[page.theme] || THEMES.dark;
  const isLight = page.theme === 'light';

  // Group methods by bank_name
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
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, fontFamily: "'Inter',sans-serif", display: 'flex', justifyContent: 'center', padding: '20px 12px', position: 'relative' }}>
      {/* Share Button - Top Right */}
      <button onClick={handleShare}
        style={{ position: 'fixed', top: '16px', right: '16px', width: '44px', height: '44px', borderRadius: '50%', backgroundColor: `${page.accent_color}20`, border: `1px solid ${page.accent_color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 50, backdropFilter: 'blur(10px)', transition: 'transform 0.2s' }}>
        <Share2 size={18} style={{ color: page.accent_color }} />
      </button>

      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Profile */}
        <div style={{ textAlign: 'center', padding: '30px 0 16px' }}>
          {page.avatar_url ? (
            <img src={page.avatar_url} alt="" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 14px', border: `3px solid ${page.accent_color}`, boxShadow: `0 0 20px ${page.accent_color}30` }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: page.accent_color + '20', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${page.accent_color}40` }}>
              <User size={32} style={{ color: page.accent_color }} />
            </div>
          )}
          {/* Copyable Name */}
          <button onClick={() => copy(page.name, 'name')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '8px', transition: 'background 0.2s' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: 0 }}>{page.name}</h1>
            {copied === 'name' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={12} style={{ color: theme.text, opacity: 0.25 }} />}
          </button>
          <p style={{ fontSize: '13px', color: page.accent_color, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>@{page.username} <img src="/verified-badge.svg" alt="Verificado" style={{ width: '20px', height: '20px' }} /></p>
          {page.bio && <p style={{ fontSize: '13px', color: theme.text, opacity: 0.5, marginTop: '8px', lineHeight: 1.4 }}>{page.bio}</p>}
        </div>

        {/* RNC / Cédula */}
        {page.rnc && (
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <button onClick={() => copy(page.rnc, 'rnc')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '12px', backgroundColor: `${page.accent_color}10`, border: `1px solid ${page.accent_color}20`, cursor: 'pointer', transition: 'background 0.2s' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: theme.text, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>RNC:</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: theme.text, fontFamily: 'monospace', letterSpacing: '0.5px' }}>{page.rnc}</span>
              {copied === 'rnc' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} style={{ color: page.accent_color }} />}
            </button>
          </div>
        )}

        {/* URL Pill + Copy */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <button onClick={() => copy(`${window.location.origin}/pagar/${page.slug}`, 'pagelink')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '20px', border: `1px solid ${page.accent_color}40`, fontSize: '11px', fontWeight: 700, color: page.accent_color, letterSpacing: '0.5px', backgroundColor: 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}>
            <Globe size={11} /> {window.location.host.toLowerCase()}/pagar/{page.slug.toLowerCase()}
            {copied === 'pagelink' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={10} style={{ opacity: 0.5 }} />}
          </button>
        </div>

        {/* BANKS - Grouped by bank_name */}
        {Object.keys(bankGroups).length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: theme.text, opacity: 0.35, marginBottom: '10px', paddingLeft: '6px' }}>
              Cuentas Bancarias
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(bankGroups).map(([bankName, accounts]) => {
                const firstAccount = accounts[0];
                const isOpen = expanded === `bank-${bankName}`;
                return (
                  <div key={bankName} style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)'}`, transition: 'border-color 0.2s' }}>
                    {/* Bank Header - toggleable */}
                    <button onClick={() => setExpanded(isOpen ? '' : `bank-${bankName}`)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', backgroundColor: theme.card, cursor: 'pointer', textAlign: 'left', border: 'none', transition: 'all 0.2s' }}>
                      <img src={firstAccount.logo_url} alt="" style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: 0 }}>{bankName}</p>
                        <p style={{ fontSize: '11px', color: theme.text, opacity: 0.4, margin: '2px 0 0' }}>
                          {accounts.length} cuenta{accounts.length > 1 ? 's' : ''} · {accounts.map(a => a.currency).filter((v,i,a)=>a.indexOf(v)===i).join(' / ')}
                        </p>
                      </div>
                      <ChevronRight size={18} style={{ color: theme.text, opacity: 0.25, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.25s' }} />
                    </button>

                    {/* Sub-accounts - fully expanded when bank is open */}
                    <div style={{
                      display: 'grid',
                      gridTemplateRows: isOpen ? '1fr' : '0fr',
                      opacity: isOpen ? 1 : 0,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ borderTop: `1px solid ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)'}` }}>
                          {accounts.map((m, idx) => (
                            <div key={m.id} style={{ borderTop: idx > 0 ? `1px solid ${isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)'}` : 'none', padding: '12px 16px', backgroundColor: `${page.accent_color}03` }}>
                              {/* Info grid - always visible */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                                <div style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: `${page.accent_color}10` }}>
                                  <p style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: theme.text, opacity: 0.4, margin: '0 0 2px' }}>Tipo</p>
                                  <p style={{ fontSize: '12px', fontWeight: 700, color: theme.text, margin: 0 }}>{m.account_type}</p>
                                </div>
                                <button onClick={() => copy(m.account_holder, `holder-${m.id}`)} style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: `${page.accent_color}10`, border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                                  <p style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: theme.text, opacity: 0.4, margin: '0 0 2px' }}>Titular</p>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: theme.text, margin: 0, flex: 1 }}>{m.account_holder}</p>
                                    {copied === `holder-${m.id}` ? <Check size={10} style={{ color: '#10b981' }} /> : <Copy size={10} style={{ color: page.accent_color, opacity: 0.5 }} />}
                                  </div>
                                </button>
                                <div style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: `${page.accent_color}10` }}>
                                  <p style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: theme.text, opacity: 0.4, margin: '0 0 2px' }}>Moneda</p>
                                  <p style={{ fontSize: '12px', fontWeight: 700, color: theme.text, margin: 0 }}>{m.currency}</p>
                                </div>
                              </div>
                              {/* RNC if exists (method-level or page-level) */}
                              {(m.rnc || page.rnc) && (
                                <button onClick={() => copy(m.rnc || page.rnc, `rnc-${m.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: '6px 10px', borderRadius: '8px', backgroundColor: `${page.accent_color}08`, border: `1px solid ${page.accent_color}15`, cursor: 'pointer', width: '100%' }}>
                                  <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: theme.text, opacity: 0.4 }}>RNC:</span>
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: theme.text, fontFamily: 'monospace', flex: 1, textAlign: 'left' }}>{m.rnc || page.rnc}</span>
                                  {copied === `rnc-${m.id}` ? <Check size={10} style={{ color: '#10b981' }} /> : <Copy size={10} style={{ color: page.accent_color, opacity: 0.4 }} />}
                                </button>
                              )}
                              {/* Account number - always visible */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', backgroundColor: `${page.accent_color}12`, border: `1px solid ${page.accent_color}20` }}>
                                <p style={{ flex: 1, fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: theme.text, margin: 0, letterSpacing: '1px' }}>{m.account_number}</p>
                                <button onClick={() => copy(m.account_number, m.id)}
                                  style={{ padding: '7px 14px', borderRadius: '10px', backgroundColor: page.accent_color, color: '#fff', fontSize: '11px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                  {copied === m.id ? <><Check size={12} /> ¡Copiado!</> : <><Copy size={12} /> Copiar</>}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* OTHER METHODS (Apps, Links, Crypto) */}
        {otherMethods.length > 0 && (() => {
          const otherGrouped: Record<string, PaymentMethod[]> = {};
          otherMethods.forEach(m => {
            const label = m.type === 'app' ? 'Apps de Pago' : m.type === 'link' ? 'Links de Pago' : 'Cripto';
            if (!otherGrouped[label]) otherGrouped[label] = [];
            otherGrouped[label].push(m);
          });
          return Object.entries(otherGrouped).map(([label, items]) => (
            <div key={label} style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: theme.text, opacity: 0.35, marginBottom: '10px', paddingLeft: '6px' }}>{label}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map(m => (
                  <div key={m.id} style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <button onClick={() => setExpanded(expanded === m.id ? '' : m.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: expanded === m.id ? '16px 16px 0 0' : '16px', backgroundColor: theme.card, border: expanded === m.id ? `2px solid ${page.accent_color}30` : `1px solid ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)'}`, borderBottom: expanded === m.id ? 'none' : undefined, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                      <img src={m.logo_url} alt="" style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: 0 }}>{m.bank_name}</p>
                        <p style={{ fontSize: '12px', color: theme.text, opacity: 0.4, margin: '2px 0 0' }}>{m.account_type} · {m.currency}</p>
                      </div>
                      <ChevronDown size={18} style={{ color: theme.text, opacity: 0.25, transform: expanded === m.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
                    </button>
                    <div style={{
                      display: 'grid',
                      gridTemplateRows: expanded === m.id ? '1fr' : '0fr',
                      opacity: expanded === m.id ? 1 : 0,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '16px', backgroundColor: `${page.accent_color}08`, border: `2px solid ${page.accent_color}30`, borderTop: 'none', borderRadius: '0 0 16px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '12px', backgroundColor: `${page.accent_color}12`, border: `1px solid ${page.accent_color}20` }}>
                            <p style={{ flex: 1, fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: theme.text, margin: 0, letterSpacing: '1px' }}>{m.account_number || m.payment_url}</p>
                            <button onClick={() => copy(m.account_number || m.payment_url, m.id)}
                              style={{ padding: '7px 14px', borderRadius: '10px', backgroundColor: page.accent_color, color: '#fff', fontSize: '11px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                              {copied === m.id ? <><Check size={12} /> ¡Copiado!</> : <><Copy size={12} /> Copiar</>}
                            </button>
                          </div>
                          {m.payment_url && (
                            <a href={m.payment_url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px', padding: '10px', borderRadius: '12px', backgroundColor: page.accent_color, color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                              <ExternalLink size={15} /> Ir al Link de Pago
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ));
        })()}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px 0 30px' }}>
          <p style={{ fontSize: '10px', color: theme.text, opacity: 0.2, lineHeight: 1.5 }}>
            ⚡ Información proporcionada por el titular.<br />Verifica antes de transferir.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicPaymentPage;
