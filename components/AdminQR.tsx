import React, { useState, useRef, useEffect, useCallback } from 'react';
import { QrCode, Download, Copy, Check, Link2, Palette, Image as ImageIcon, Trash2, RotateCcw, Sparkles, Save, FolderOpen, Clock, ExternalLink, Plus, X, Camera, User, Globe, FileText, Type, Eye } from 'lucide-react';
import QRCode from 'qrcode';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabaseClient';

type QRStyle = 'classic' | 'modern' | 'card' | 'banner' | 'badge' | 'sticker' | 'phone' | 'minimal';

interface QRConfig {
  url: string;
  style: QRStyle;
  accentColor: string;
  bgColor: string;
  fgColor: string;
  qrSize: number;
  showLogo: boolean;
  showPhoto: boolean;
  showName: boolean;
  showLink: boolean;
  customText: string;
  logoUrl: string;
  photoUrl: string;
  displayName: string;
}

interface SavedQR {
  id: string;
  name: string;
  url: string;
  fg_color: string;
  bg_color: string;
  logo_url: string | null;
  style: string;
  size: number;
  error_correction: string;
  preview_image: string | null;
  created_at: string;
  // Pro fields
  accent_color?: string;
  show_logo?: boolean;
  show_photo?: boolean;
  show_name?: boolean;
  show_link?: boolean;
  custom_text?: string;
  photo_url?: string;
  display_name?: string;
  qr_size?: number;
}

const QR_THEMES = [
  ['#1a1a2e','#6366f1'],['#1a1a2e','#06b6d4'],['#1a1a2e','#3b82f6'],['#1a1a2e','#8b5cf6'],['#1a1a2e','#ec4899'],
  ['#ffffff','#E60000'],['#ffffff','#10b981'],['#ffffff','#f59e0b'],['#ffffff','#6366f1'],['#ffffff','#000000'],
  ['#0f0f23','#E60000'],['#0f0f23','#06b6d4'],['#0f0f23','#f97316'],['#0f0f23','#10b981'],['#0f0f23','#a855f7'],
  ['#f8fafc','#6366f1'],['#f8fafc','#E60000'],['#f8fafc','#10b981'],['#f8fafc','#f59e0b'],['#f8fafc','#ec4899'],
  ['#0a211a','#10b981'],['#2d1b69','#f97316'],['#0c1222','#06b6d4'],['#1e293b','#f59e0b'],['#1e1e1e','#ffffff'],
];

const ACCENTS = ['#E60000', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#a855f7'];

const QUICK_LINKS = [
  { label: 'Sitio Web', url: 'https://raynolddesignssrl.com' },
  { label: 'WhatsApp', url: 'https://wa.me/18295807411' },
  { label: 'Catálogo', url: 'https://raynolddesignssrl.com/products' },
  { label: 'Instagram', url: 'https://instagram.com/raynolddesignssrl' },
  { label: 'Contacto', url: 'https://raynolddesignssrl.com/#contact' },
];

const AdminQR: React.FC = () => {
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [saveName, setSaveName] = useState('Mi QR');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedQRs, setSavedQRs] = useState<SavedQR[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [selectedQrId, setSelectedQrId] = useState('');

  const [config, setConfig] = useState<QRConfig>({
    url: 'https://raynolddesignssrl.com',
    style: 'card',
    accentColor: '#E60000',
    bgColor: '#ffffff',
    fgColor: '#000000',
    qrSize: 240,
    showLogo: true,
    showPhoto: false,
    showName: true,
    showLink: true,
    customText: 'Escanea para visitar',
    logoUrl: '',
    photoUrl: '',
    displayName: 'Raynold Design SRL',
  });

  // Load saved QRs
  useEffect(() => {
    const fetchSaved = async () => {
      const { data } = await supabase
        .from('saved_qr_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setSavedQRs(data as SavedQR[]);
      setLoadingSaved(false);
    };
    fetchSaved();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setConfig({ ...config, logoUrl: ev.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setConfig({ ...config, photoUrl: ev.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSaveQR = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    const row = {
      name: saveName.trim(),
      url: config.url,
      fg_color: config.fgColor,
      bg_color: config.bgColor,
      logo_url: config.logoUrl || null,
      style: config.style,
      size: config.qrSize,
      error_correction: 'H',
      accent_color: config.accentColor,
      show_logo: config.showLogo,
      show_photo: config.showPhoto,
      show_name: config.showName,
      show_link: config.showLink,
      custom_text: config.customText,
      photo_url: config.photoUrl || null,
      display_name: config.displayName,
      qr_size: config.qrSize,
      preview_image: null,
    };

    if (selectedQrId) {
      await supabase.from('saved_qr_codes').update({ ...row, updated_at: new Date().toISOString() }).eq('id', selectedQrId);
    } else {
      const { data } = await supabase.from('saved_qr_codes').insert([row]).select();
      if (data) setSelectedQrId(data[0].id);
    }

    const { data: refreshed } = await supabase.from('saved_qr_codes').select('*').order('created_at', { ascending: false });
    if (refreshed) setSavedQRs(refreshed as SavedQR[]);

    setSaving(false);
    setIsSaveModalOpen(false);
  };

  const loadSavedQR = (qr: SavedQR) => {
    setSelectedQrId(qr.id);
    setSaveName(qr.name);
    setConfig({
      url: qr.url,
      style: (qr.style as QRStyle) || 'card',
      accentColor: qr.accent_color || qr.fg_color,
      bgColor: qr.bg_color,
      fgColor: qr.fg_color,
      qrSize: qr.qr_size || qr.size || 240,
      showLogo: qr.show_logo ?? true,
      showPhoto: qr.show_photo ?? false,
      showName: qr.show_name ?? true,
      showLink: qr.show_link ?? true,
      customText: qr.custom_text || '',
      logoUrl: qr.logo_url || '',
      photoUrl: qr.photo_url || '',
      displayName: qr.display_name || 'Raynold Design SRL',
    });
  };

  const deleteSavedQR = async (id: string) => {
    if (!window.confirm('¿Eliminar este QR guardado?')) return;
    await supabase.from('saved_qr_codes').delete().eq('id', id);
    if (selectedQrId === id) setSelectedQrId('');
    setSavedQRs(savedQRs.filter(q => q.id !== id));
  };

  const downloadQr = async (format: 'png' | 'svg' | 'jpg' | 'pdf') => {
    const container = qrContainerRef.current;
    if (!container) return;
    const fname = `QR-${saveName.replace(/\s+/g, '-')}-${Date.now()}`;

    if (format === 'svg') {
      const svgEl = container.querySelector('svg');
      if (!svgEl) return;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${fname}.svg`; a.click();
      URL.revokeObjectURL(url);
      return;
    }

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
      const pdfW = pxW * 0.264583;
      const pdfH = pxH * 0.264583;
      const pdf = new jsPDF({ orientation: pdfW > pdfH ? 'l' : 'p', unit: 'mm', format: [pdfW, pdfH] });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`${fname}.pdf`);
      return;
    }

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${fname}.${format}`; a.click();
      URL.revokeObjectURL(url);
    }, mimeType, 0.95);
  };

  const copyToClipboard = async () => {
    const container = qrContainerRef.current;
    if (!container) return;
    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null, logging: false });
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      downloadQr('png');
    }
  };

  const resetConfig = () => {
    setSelectedQrId('');
    setSaveName('Mi QR');
    setConfig({
      url: 'https://raynolddesignssrl.com',
      style: 'card',
      accentColor: '#E60000',
      bgColor: '#ffffff',
      fgColor: '#000000',
      qrSize: 240,
      showLogo: true,
      showPhoto: false,
      showName: true,
      showLink: true,
      customText: 'Escanea para visitar',
      logoUrl: '',
      photoUrl: '',
      displayName: 'Raynold Design SRL',
    });
  };

  const isLight = config.bgColor === '#ffffff' || config.bgColor === '#f8fafc';
  const urlClean = config.url.replace('https://', '').replace('http://', '').replace(/\/$/, '');
  const qrValue = config.url || 'https://raynolddesignssrl.com';
  const qrImgSettings = config.showLogo && config.logoUrl ? { src: config.logoUrl, height: 36, width: 36, excavate: true } : undefined;

  /* ─────── Shared sub-components ─────── */
  const QR = ({ size, accent }: { size?: number; accent?: string }) => (
    <QRCodeSVG value={qrValue} size={size || config.qrSize} level="H" fgColor={accent || config.accentColor} bgColor="#ffffff" imageSettings={qrImgSettings} />
  );

  const PhotoEl = () => config.showPhoto && config.photoUrl ? (
    <img src={config.photoUrl} alt="" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${config.accentColor}`, boxShadow: `0 4px 12px ${config.accentColor}25` }} />
  ) : null;

  const NameEl = ({ size, color }: { size?: string; color?: string }) => config.showName && config.displayName ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: size || '18px', fontWeight: 800, color: color || config.fgColor, fontFamily: "'Inter',sans-serif" }}>{config.displayName}</span>
      <img src="/verified-badge.svg" alt="" style={{ width: '18px', height: '18px' }} />
    </div>
  ) : null;

  const CustomTextEl = ({ color }: { color?: string }) => config.customText ? (
    <p style={{ fontSize: '10px', color: color || config.fgColor, opacity: 0.4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Inter',sans-serif", margin: 0 }}>{config.customText}</p>
  ) : null;

  const LinkEl = ({ accent }: { accent?: string }) => config.showLink ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 16px', borderRadius: '20px', border: `1.5px solid ${(accent || config.accentColor)}30`, backgroundColor: `${(accent || config.accentColor)}08` }}>
      <Globe size={10} style={{ color: accent || config.accentColor }} />
      <span style={{ fontSize: '10px', fontWeight: 700, color: accent || config.accentColor, letterSpacing: '0.3px', fontFamily: "'Inter',sans-serif" }}>{urlClean}</span>
    </div>
  ) : null;

  /* ─────── Render QR Design ─────── */
  const renderQrDesign = () => {
    const S = config.style;

    // ── CLASSIC ──
    if (S === 'classic') return (
      <div ref={qrContainerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: config.bgColor, padding: '20px' }}>
        <PhotoEl />
        {config.showPhoto && config.photoUrl && <div style={{ height: '12px' }} />}
        <NameEl />
        {config.showName && <div style={{ height: '4px' }} />}
        <CustomTextEl />
        {config.customText && <div style={{ height: '12px' }} />}
        <div style={{ padding: '10px', border: `3px solid ${config.accentColor}`, backgroundColor: '#fff' }}><QR /></div>
        <div style={{ height: '14px' }} />
        <LinkEl />
      </div>
    );

    // ── MODERN ──
    if (S === 'modern') return (
      <div ref={qrContainerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: config.bgColor, borderRadius: '16px', padding: '24px 20px' }}>
        <PhotoEl />
        {config.showPhoto && config.photoUrl && <div style={{ height: '12px' }} />}
        <NameEl />
        {config.showName && <div style={{ height: '4px' }} />}
        <CustomTextEl />
        {config.customText && <div style={{ height: '12px' }} />}
        <div style={{ padding: '10px', borderRadius: '16px', border: `3px solid ${config.accentColor}`, backgroundColor: '#fff' }}><QR /></div>
        <div style={{ height: '14px' }} />
        <LinkEl />
      </div>
    );

    // ── CARD ──
    if (S === 'card') return (
      <div ref={qrContainerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: config.bgColor, borderRadius: '24px', padding: '32px 28px', boxShadow: `0 20px 60px ${config.accentColor}15, 0 4px 20px rgba(0,0,0,0.3)`, border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.1)'}`, minWidth: '300px' }}>
        <PhotoEl />
        {config.showPhoto && config.photoUrl && <div style={{ height: '12px' }} />}
        <NameEl />
        {config.showName && <div style={{ height: '4px' }} />}
        <CustomTextEl />
        {config.customText && <div style={{ height: '12px' }} />}
        <div style={{ padding: '14px', borderRadius: '16px', border: `3px solid ${config.accentColor}`, backgroundColor: '#fff' }}><QR /></div>
        <div style={{ height: '14px' }} />
        <LinkEl />
      </div>
    );

    // ── BANNER (horizontal) ──
    if (S === 'banner') return (
      <div ref={qrContainerRef} style={{ display: 'flex', alignItems: 'center', gap: '28px', backgroundColor: config.bgColor, borderRadius: '20px', padding: '28px 32px', boxShadow: `0 12px 40px ${config.accentColor}12, 0 2px 15px rgba(0,0,0,0.2)`, border: `1px solid ${isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)'}` }}>
        {/* Left side: info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '140px' }}>
          <PhotoEl />
          <NameEl />
          <CustomTextEl />
          <LinkEl />
        </div>
        {/* Right side: QR */}
        <div style={{ padding: '12px', borderRadius: '16px', border: `3px solid ${config.accentColor}`, backgroundColor: '#fff', flexShrink: 0 }}>
          <QR size={Math.min(config.qrSize, 200)} />
        </div>
      </div>
    );

    // ── BADGE (shield outline) ──
    if (S === 'badge') return (
      <div ref={qrContainerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: config.bgColor, borderRadius: '24px', padding: '0', overflow: 'hidden', boxShadow: `0 16px 50px ${config.accentColor}15`, border: `2px solid ${config.accentColor}`, minWidth: '300px' }}>
        {/* Top accent bar */}
        <div style={{ width: '100%', padding: '16px 24px', backgroundColor: config.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {config.showPhoto && config.photoUrl && (
            <img src={config.photoUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.5)' }} />
          )}
          {config.showName && config.displayName && (
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', fontFamily: "'Inter',sans-serif" }}>{config.displayName}</span>
          )}
          <img src="/verified-badge.svg" alt="" style={{ width: '16px', height: '16px', filter: 'brightness(10)' }} />
        </div>
        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <CustomTextEl />
          <div style={{ padding: '12px', borderRadius: '16px', border: `2px solid ${config.accentColor}40`, backgroundColor: '#fff' }}><QR /></div>
          <LinkEl />
        </div>
      </div>
    );

    // ── STICKER (circular frame) ──
    if (S === 'sticker') {
      const stickerSize = Math.max(config.qrSize + 100, 320);
      return (
        <div ref={qrContainerRef} style={{ width: `${stickerSize}px`, height: `${stickerSize}px`, borderRadius: '50%', backgroundColor: config.bgColor, border: `4px solid ${config.accentColor}`, boxShadow: `0 0 0 8px ${config.bgColor}, 0 0 0 10px ${config.accentColor}40, 0 20px 50px ${config.accentColor}20`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '30px', position: 'relative' }}>
          {/* Top text arc simulation */}
          {config.showName && config.displayName && (
            <span style={{ fontSize: '11px', fontWeight: 800, color: config.fgColor, textTransform: 'uppercase', letterSpacing: '3px', fontFamily: "'Inter',sans-serif" }}>{config.displayName}</span>
          )}
          <div style={{ padding: '8px', borderRadius: '12px', border: `2px solid ${config.accentColor}`, backgroundColor: '#fff' }}>
            <QR size={Math.min(config.qrSize, stickerSize - 160)} />
          </div>
          {config.customText && (
            <span style={{ fontSize: '9px', fontWeight: 700, color: config.accentColor, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: "'Inter',sans-serif" }}>{config.customText}</span>
          )}
        </div>
      );
    }

    // ── PHONE (device mockup) ──
    if (S === 'phone') return (
      <div ref={qrContainerRef} style={{ width: '280px', minHeight: '500px', borderRadius: '40px', border: `4px solid ${isLight ? '#d1d5db' : '#333'}`, backgroundColor: config.bgColor, padding: '3px', overflow: 'hidden', boxShadow: `0 20px 60px rgba(0,0,0,0.5)` }}>
        <div style={{ borderRadius: '36px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: config.bgColor }}>
          {/* Dynamic Island */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', marginBottom: '20px' }}>
            <div style={{ width: '100px', height: '24px', backgroundColor: isLight ? '#222' : '#000', borderRadius: '16px' }} />
          </div>
          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '0 20px 24px', flex: 1 }}>
            <PhotoEl />
            <NameEl size="15px" />
            <CustomTextEl />
            <div style={{ padding: '10px', borderRadius: '14px', border: `2.5px solid ${config.accentColor}`, backgroundColor: '#fff', marginTop: '4px' }}>
              <QR size={Math.min(config.qrSize, 180)} />
            </div>
            <LinkEl />
          </div>
          {/* Home indicator */}
          <div style={{ width: '90px', height: '4px', backgroundColor: config.fgColor, opacity: 0.15, borderRadius: '4px', marginBottom: '8px' }} />
        </div>
      </div>
    );

    // ── MINIMAL (elegant thin frame) ──
    if (S === 'minimal') return (
      <div ref={qrContainerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: config.bgColor, padding: '40px', position: 'relative', minWidth: '300px' }}>
        {/* Thin elegant border */}
        <div style={{ position: 'absolute', inset: '12px', border: `1.5px solid ${config.accentColor}30`, borderRadius: '4px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: '8px', border: `0.5px solid ${config.accentColor}15`, borderRadius: '2px', pointerEvents: 'none' }} />

        {config.showName && config.displayName && (
          <span style={{ fontSize: '10px', fontWeight: 800, color: config.fgColor, textTransform: 'uppercase', letterSpacing: '4px', fontFamily: "'Inter',sans-serif", marginBottom: '20px', opacity: 0.6 }}>{config.displayName}</span>
        )}
        <div style={{ backgroundColor: '#fff', padding: '6px' }}>
          <QR />
        </div>
        {config.customText && (
          <span style={{ fontSize: '9px', fontWeight: 600, color: config.fgColor, textTransform: 'uppercase', letterSpacing: '3px', fontFamily: "'Inter',sans-serif", marginTop: '16px', opacity: 0.35 }}>{config.customText}</span>
        )}
        {config.showLink && (
          <span style={{ fontSize: '9px', fontWeight: 600, color: config.accentColor, letterSpacing: '1px', fontFamily: "'Inter',sans-serif", marginTop: '8px', opacity: 0.5 }}>{urlClean}</span>
        )}
      </div>
    );

    // Fallback
    return (
      <div ref={qrContainerRef} style={{ padding: '20px', backgroundColor: config.bgColor }}>
        <QR />
      </div>
    );
  };


  return (
    <div className="p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <QrCode className="text-raynold-red" size={32} />
            <h1 className="text-4xl md:text-5xl font-futuristic font-black text-white">
              QR STUDIO <span className="animate-gradient-text">PRO</span>
            </h1>
            <span className="px-2 py-0.5 bg-raynold-red/20 text-raynold-red rounded-full text-[9px] font-black uppercase">Pro</span>
          </div>
          <p className="text-gray-400">Crea códigos QR profesionales con diseño de tarjeta, logo, foto y descarga en PNG, JPG, SVG y PDF.</p>
        </div>

        <div className="flex gap-6">
          {/* Left: Controls */}
          <div className="w-[380px] shrink-0 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>

            {/* Saved QRs */}
            {savedQRs.length > 0 && (
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-2">
                  <FolderOpen size={12} className="inline mr-1 text-raynold-red" /> QR Guardados ({savedQRs.length})
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-modern">
                  {savedQRs.map(qr => (
                    <div key={qr.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${selectedQrId === qr.id ? 'bg-raynold-red/15 border border-raynold-red/30' : 'hover:bg-white/5'}`}>
                      <button onClick={() => loadSavedQR(qr)} className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: qr.accent_color || qr.fg_color }} />
                          <span className="text-xs text-white font-medium truncate">{qr.name}</span>
                          <span className="text-[9px] text-gray-600 ml-auto">{new Date(qr.created_at).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      </button>
                      <button onClick={() => deleteSavedQR(qr.id)} className="text-gray-600 hover:text-red-400"><Trash2 size={11} /></button>
                    </div>
                  ))}
                </div>
                <button onClick={resetConfig} className="mt-2 w-full px-3 py-1.5 border border-dashed border-white/15 rounded-lg text-[10px] text-gray-500 hover:text-white flex items-center justify-center gap-1"><Plus size={10} /> Nuevo QR</button>
              </div>
            )}

            {/* URL Input */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Link2 size={14} className="text-raynold-red" /> Enlace / URL
              </h3>
              <input
                type="url"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="https://tu-sitio.com"
                className="w-full bg-black border border-white/20 rounded-lg px-3 py-2.5 text-white focus:border-raynold-red focus:outline-none transition-colors font-mono text-xs mb-3"
              />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_LINKS.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => setConfig({ ...config, url: link.url })}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all ${config.url === link.url ? 'bg-raynold-red/20 border-raynold-red/50 text-raynold-red' : 'border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Tabs */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-raynold-red" /> Estilo de Diseño
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {([
                  ['classic','Clásico','svgexport-2'],['modern','Moderno','svgexport-10'],['card','Tarjeta','svgexport-1'],['banner','Banner','svgexport-6'],
                  ['badge','Badge','svgexport-3'],['sticker','Sticker','svgexport-12'],['phone','Teléfono','svgexport-5'],['minimal','Mínimal','svgexport-8'],
                ] as [QRStyle, string, string][]).map(([v,l,svg]) => (
                  <button key={v} onClick={() => setConfig({ ...config, style: v })} className={`py-2.5 px-2 rounded-xl border text-center transition-all ${config.style === v ? 'bg-raynold-red/20 border-raynold-red/50 text-white shadow-[0_0_10px_rgba(230,0,0,0.15)]' : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}>
                    <img src={`/qr-frames/${svg}.svg`} alt={l} className="w-8 h-8 mx-auto mb-1 opacity-70" style={{ filter: config.style === v ? 'brightness(1.3) invert(0.1)' : 'invert(0.7)' }} />
                    <div className="text-[9px] font-bold">{l}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Elements */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Eye size={14} className="text-raynold-red" /> Elementos Visibles
              </h3>
              <div className="space-y-1">
                {[
                  { k: 'showLogo', l: 'Logo en QR', v: config.showLogo, icon: <QrCode size={12}/> },
                  { k: 'showPhoto', l: 'Foto / Avatar', v: config.showPhoto, icon: <Camera size={12}/> },
                  { k: 'showName', l: 'Nombre', v: config.showName, icon: <User size={12}/> },
                  { k: 'showLink', l: 'Link Completo', v: config.showLink, icon: <Link2 size={12}/> },
                ].map(o => (
                  <button key={o.k} onClick={() => setConfig({ ...config, [o.k]: !o.v })} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5">
                    <span className="text-gray-500">{o.icon}</span>
                    <span className="flex-1 text-left text-xs text-white font-medium">{o.l}</span>
                    <div className={`w-8 h-4 rounded-full transition-colors ${o.v ? 'bg-raynold-red' : 'bg-gray-700'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full bg-white mt-[1px] transition-transform ${o.v ? 'translate-x-[17px]' : 'translate-x-[1px]'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Display Name */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <User size={14} className="text-raynold-red" /> Nombre para mostrar
              </h3>
              <input type="text" value={config.displayName} onChange={e => setConfig({ ...config, displayName: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-xs" placeholder="Tu Nombre o Empresa" />
            </div>

            {/* Custom Text */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Type size={14} className="text-raynold-red" /> Texto Personalizado
              </h3>
              <input type="text" value={config.customText} onChange={e => setConfig({ ...config, customText: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-xs" placeholder="Escanea para visitar..." />
              <p className="text-[8px] text-gray-600 mt-1">Aparece encima del código QR.</p>
            </div>

            {/* Photo Upload */}
            {config.showPhoto && (
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Camera size={14} className="text-raynold-red" /> Foto / Avatar
                </h3>
                {config.photoUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={config.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-raynold-red" />
                    <span className="text-xs text-white font-bold flex-1">Foto cargada</span>
                    <button onClick={() => setConfig({ ...config, photoUrl: '' })} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40"><Trash2 size={14} /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 py-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-raynold-red/50 transition-all">
                    <Camera size={24} className="text-gray-500" />
                    <span className="text-[10px] font-bold text-gray-400">Subir foto de perfil</span>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                )}
              </div>
            )}

            {/* Logo Upload */}
            {config.showLogo && (
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ImageIcon size={14} className="text-raynold-red" /> Logo Central en QR
                </h3>
                {config.logoUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-gray-900">
                      <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs text-white font-bold flex-1">Logo cargado</span>
                    <button onClick={() => setConfig({ ...config, logoUrl: '' })} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40"><Trash2 size={14} /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 py-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-raynold-red/50 transition-all">
                    <ImageIcon size={24} className="text-gray-500" />
                    <span className="text-[10px] font-bold text-gray-400">Subir Logo (PNG, JPG, SVG)</span>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                )}
              </div>
            )}

            {/* Predefined Themes */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Palette size={14} className="text-raynold-red" /> Temas Predefinidos
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {QR_THEMES.map(([bg, accent], i) => (
                  <button key={i} onClick={() => { setConfig({ ...config, bgColor: bg, accentColor: accent, fgColor: bg === '#ffffff' || bg === '#f8fafc' ? '#000000' : '#ffffff' }); }}
                    className={`w-full aspect-square rounded-xl border-2 overflow-hidden ${config.bgColor === bg && config.accentColor === accent ? 'border-white shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}>
                    <div className="w-full h-full relative" style={{ backgroundColor: bg }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div style={{ width: '16px', height: '16px', borderRadius: '3px', backgroundColor: accent }} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent + BG Color Pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-2">Color Principal</label>
                <div className="flex gap-1.5 flex-wrap">
                  {ACCENTS.map(c => (
                    <button key={c} onClick={() => setConfig({ ...config, accentColor: c })} className={`w-6 h-6 rounded-full border-2 ${config.accentColor === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}
                  <label className="w-6 h-6 rounded-full border border-dashed border-white/30 flex items-center justify-center cursor-pointer">
                    <Plus size={10} className="text-gray-500" />
                    <input type="color" value={config.accentColor} onChange={e => setConfig({ ...config, accentColor: e.target.value })} className="sr-only" />
                  </label>
                </div>
              </div>
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-2">Fondo</label>
                <div className="flex gap-2">
                  {[{c:'#ffffff',l:'Blanco'},{c:'#f8fafc',l:'Gris'},{c:'#1a1a2e',l:'Oscuro'},{c:'#0f0f23',l:'Negro'}].map(bg => (
                    <button key={bg.c} onClick={() => { setConfig({ ...config, bgColor: bg.c, fgColor: bg.c === '#ffffff' || bg.c === '#f8fafc' ? '#000000' : '#ffffff' }); }}
                      className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-[8px] font-bold ${config.bgColor === bg.c ? 'border-raynold-red' : 'border-white/10'}`}
                      style={{ backgroundColor: bg.c, color: bg.c === '#ffffff' || bg.c === '#f8fafc' ? '#333' : '#fff' }}>{bg.l[0]}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* QR Size Slider */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
              <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block mb-2">Tamaño QR: {config.qrSize}px</label>
              <input type="range" min="160" max="400" value={config.qrSize} onChange={e => setConfig({ ...config, qrSize: Number(e.target.value) })} className="w-full accent-raynold-red" />
            </div>
          </div>

          {/* Right: Live Preview + Actions */}
          <div className="flex-1 flex flex-col">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Eye size={16} className="text-raynold-red" /> Vista Previa en Vivo
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsSaveModalOpen(true)} className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-green-500/30"><Save size={14} /> {selectedQrId ? 'Actualizar' : 'Guardar'}</button>
                  <button onClick={resetConfig} className="px-3 py-2 text-gray-500 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1"><RotateCcw size={13} /> Reset</button>
                </div>
              </div>

              {/* Preview Area */}
              <div className="flex-1 flex items-center justify-center p-8 bg-[#111] overflow-auto">
                {renderQrDesign()}
              </div>

              {/* Download Buttons */}
              <div className="p-4 border-t border-white/10 flex items-center gap-2 flex-wrap">
                <button onClick={() => downloadQr('png')} className="px-4 py-2.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-[11px] font-bold flex items-center gap-2 hover:bg-cyan-500/30"><Download size={13} /> PNG</button>
                <button onClick={() => downloadQr('jpg')} className="px-4 py-2.5 bg-amber-500/20 text-amber-400 rounded-lg text-[11px] font-bold flex items-center gap-2 hover:bg-amber-500/30"><Download size={13} /> JPG</button>
                <button onClick={() => downloadQr('pdf')} className="px-4 py-2.5 bg-rose-500/20 text-rose-400 rounded-lg text-[11px] font-bold flex items-center gap-2 hover:bg-rose-500/30"><FileText size={13} /> PDF</button>
                <button onClick={() => downloadQr('svg')} className="px-4 py-2.5 bg-purple-500/20 text-purple-400 rounded-lg text-[11px] font-bold flex items-center gap-2 hover:bg-purple-500/30"><Download size={13} /> SVG</button>
                <div className="flex-1" />
                <button onClick={copyToClipboard} className="px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-lg text-[11px] font-bold flex items-center gap-2 hover:bg-white/10">
                  {copied ? <><Check size={13} className="text-raynold-green" /> Copiado</> : <><Copy size={13} /> Copiar</>}
                </button>
              </div>

              {/* Pro Tip */}
              <div className="mx-4 mb-4 p-3 bg-raynold-red/5 border border-raynold-red/20 rounded-xl">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  <span className="text-raynold-red font-bold">TIP:</span> Usa el estilo <span className="text-white font-bold">"Tarjeta"</span> para imprimir y colocar en tu negocio. Sube tu logo para que aparezca dentro del QR.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Save size={20} className="text-raynold-green" /> {selectedQrId ? 'Actualizar' : 'Guardar'} Código QR
            </h3>
            <p className="text-gray-400 text-sm mb-4">Dale un nombre para identificarlo después.</p>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={`Ej: QR Sitio Web, QR WhatsApp...`}
              className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-green focus:outline-none transition-colors mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveQR()}
            />
            <div className="flex gap-3">
              <button onClick={() => { setIsSaveModalOpen(false); }} className="flex-1 py-2.5 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
              <button onClick={handleSaveQR} disabled={saving || !saveName.trim()} className="flex-1 py-2.5 bg-raynold-green text-black font-bold rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? 'Guardando...' : <><Save size={16} /> {selectedQrId ? 'Actualizar' : 'Guardar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden inputs */}
      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
    </div>
  );
};

export default AdminQR;
