import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, Copy, Check, ExternalLink, Globe, User, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface PaymentPage {
  id: string; name: string; username: string; bio: string; avatar_url: string;
  theme: string; accent_color: string; slug: string;
}

interface PaymentMethod {
  id: string; type: string; bank_name: string; account_type: string;
  account_number: string; account_holder: string; currency: string;
  logo_url: string; payment_url: string; sort_order: number;
}

const THEMES: Record<string, { bg: string; card: string; text: string }> = {
  dark: { bg: '#0f0f23', card: '#1a1a3e', text: '#ffffff' },
  light: { bg: '#f8fafc', card: '#ffffff', text: '#1e293b' },
  glass: { bg: '#0c1222', card: 'rgba(255,255,255,0.08)', text: '#ffffff' },
  midnight: { bg: '#1a1a2e', card: '#16213e', text: '#eeeeee' },
  sunset: { bg: '#2d1b69', card: '#3d2d7a', text: '#ffffff' },
  forest: { bg: '#0a211a', card: '#0d2b22', text: '#d4edda' },
};

const TYPE_LABELS: Record<string, string> = {
  bank: 'Cuenta Bancaria', app: 'App de Pago', link: 'Link de Pago', crypto: 'Cripto',
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
      const { data: p } = await supabase.from('payment_pages').select('*').eq('slug', slug).eq('is_active', true).single();
      if (!p) { setNotFound(true); setLoading(false); return; }
      setPage(p);
      const { data: m } = await supabase.from('payment_methods').select('*').eq('page_id', p.id).eq('is_active', true).order('sort_order');
      if (m) setMethods(m);
      setLoading(false);
    };
    fetch();
  }, [slug]);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
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
  const grouped = {
    bank: methods.filter(m => m.type === 'bank'),
    app: methods.filter(m => m.type === 'app'),
    link: methods.filter(m => m.type === 'link'),
    crypto: methods.filter(m => m.type === 'crypto'),
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, fontFamily: "'Inter',sans-serif", display: 'flex', justifyContent: 'center', padding: '20px 12px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Profile */}
        <div style={{ textAlign: 'center', padding: '30px 0 20px' }}>
          {page.avatar_url ? (
            <img src={page.avatar_url} alt="" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 14px', border: `3px solid ${page.accent_color}`, boxShadow: `0 0 20px ${page.accent_color}30` }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: page.accent_color + '20', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${page.accent_color}40` }}>
              <User size={32} style={{ color: page.accent_color }} />
            </div>
          )}
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: '0 0 4px' }}>{page.name}</h1>
          <p style={{ fontSize: '13px', color: page.accent_color, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>@{page.username} <img src="/verified-badge.svg" alt="Verificado" style={{ width: '16px', height: '16px' }} /></p>
          {page.bio && <p style={{ fontSize: '13px', color: theme.text, opacity: 0.5, marginTop: '8px', lineHeight: 1.4 }}>{page.bio}</p>}
        </div>

        {/* URL Pill */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '20px', border: `1px solid ${page.accent_color}40`, fontSize: '11px', fontWeight: 700, color: page.accent_color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Globe size={11} /> {window.location.host}/pagar/{page.slug}
          </div>
        </div>

        {/* Methods */}
        {Object.entries(grouped).map(([type, items]) => {
          if (!items.length) return null;
          return (
            <div key={type} style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: theme.text, opacity: 0.35, marginBottom: '10px', paddingLeft: '6px' }}>
                {TYPE_LABELS[type]}s
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map(m => (
                  <div key={m.id} style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <button onClick={() => setExpanded(expanded === m.id ? '' : m.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: expanded === m.id ? '16px 16px 0 0' : '16px', backgroundColor: theme.card, border: expanded === m.id ? `2px solid ${page.accent_color}30` : '1px solid rgba(255,255,255,0.06)', borderBottom: expanded === m.id ? 'none' : undefined, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                      <img src={m.logo_url} alt="" style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: theme.text, margin: 0 }}>{m.bank_name}</p>
                        <p style={{ fontSize: '12px', color: theme.text, opacity: 0.4, margin: '2px 0 0' }}>{m.account_type}</p>
                      </div>
                      <ChevronDown size={18} style={{ color: theme.text, opacity: 0.25, transform: expanded === m.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
                    </button>

                    {expanded === m.id && (
                      <div style={{ padding: '16px', backgroundColor: `${page.accent_color}08`, border: `2px solid ${page.accent_color}30`, borderTop: 'none', borderRadius: '0 0 16px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: `${page.accent_color}10` }}>
                            <p style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: theme.text, opacity: 0.4, margin: '0 0 3px' }}>Titular</p>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: theme.text, margin: 0 }}>{m.account_holder}</p>
                          </div>
                          <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: `${page.accent_color}10` }}>
                            <p style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: theme.text, opacity: 0.4, margin: '0 0 3px' }}>Moneda</p>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: theme.text, margin: 0 }}>{m.currency}</p>
                          </div>
                        </div>

                        {/* Account number with copy */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '12px', backgroundColor: `${page.accent_color}12`, border: `1px solid ${page.accent_color}20` }}>
                          <p style={{ flex: 1, fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', color: theme.text, margin: 0, letterSpacing: '1px' }}>{m.account_number}</p>
                          <button onClick={() => copy(m.account_number, m.id)}
                            style={{ padding: '8px 16px', borderRadius: '10px', backgroundColor: page.accent_color, color: '#fff', fontSize: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'transform 0.1s', whiteSpace: 'nowrap' }}>
                            {copied === m.id ? <><Check size={14} /> ¡Copiado!</> : <><Copy size={14} /> Copiar</>}
                          </button>
                        </div>

                        {m.payment_url && (
                          <a href={m.payment_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px', padding: '10px', borderRadius: '12px', backgroundColor: page.accent_color, color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none', transition: 'opacity 0.2s' }}>
                            <ExternalLink size={15} /> Ir al Link de Pago
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
