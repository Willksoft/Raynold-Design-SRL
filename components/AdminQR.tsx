import React, { useState, useRef, useEffect, useCallback } from 'react';
import { QrCode, Download, Copy, Check, Link2, Palette, Image as ImageIcon, Trash2, RotateCcw, Sparkles, Save, FolderOpen, Clock, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabaseClient';

type QRStyle = 'square' | 'rounded' | 'dots';

interface QRConfig {
  url: string;
  fgColor: string;
  bgColor: string;
  logoUrl: string;
  style: QRStyle;
  size: number;
  margin: number;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
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
}

const PRESET_COLORS = [
  { name: 'Rojo Raynold', fg: '#E60000', bg: '#000000' },
  { name: 'Elegante Oscuro', fg: '#FFFFFF', bg: '#0A0A0A' },
  { name: 'Verde Neon', fg: '#00FF88', bg: '#0A0A0A' },
  { name: 'Azul Premium', fg: '#3B82F6', bg: '#0F172A' },
  { name: 'Dorado Luxury', fg: '#D4A017', bg: '#1A1A2E' },
  { name: 'Púrpura Tech', fg: '#A855F7', bg: '#0F0019' },
  { name: 'Clásico', fg: '#000000', bg: '#FFFFFF' },
  { name: 'Inverso', fg: '#FFFFFF', bg: '#000000' },
];

const QUICK_LINKS = [
  { label: 'Sitio Web', url: 'https://raynolddesignssrl.com' },
  { label: 'WhatsApp', url: 'https://wa.me/18295807411' },
  { label: 'Catálogo', url: 'https://raynolddesignssrl.com/products' },
  { label: 'Instagram', url: 'https://instagram.com/raynolddesignssrl' },
  { label: 'Contacto', url: 'https://raynolddesignssrl.com/#contact' },
];

const AdminQR: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedQRs, setSavedQRs] = useState<SavedQR[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const [config, setConfig] = useState<QRConfig>({
    url: 'https://raynolddesignssrl.com',
    fgColor: '#E60000',
    bgColor: '#000000',
    logoUrl: '',
    style: 'rounded',
    size: 600,
    margin: 2,
    errorCorrection: 'H',
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

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  };

  const generateQR = useCallback(async () => {
    if (!canvasRef.current || !config.url) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = config.size;
    canvas.width = size;
    canvas.height = size;

    const qrData = await QRCode.create(config.url, {
      errorCorrectionLevel: config.errorCorrection,
    });

    const modules = qrData.modules;
    const moduleCount = modules.size;
    const cellSize = (size - config.margin * 2) / moduleCount;
    const offset = config.margin;

    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = config.fgColor;

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (modules.get(row, col)) {
          const x = offset + col * cellSize;
          const y = offset + row * cellSize;

          switch (config.style) {
            case 'dots':
              ctx.beginPath();
              ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.4, 0, 2 * Math.PI);
              ctx.fill();
              break;
            case 'rounded':
              drawRoundedRect(ctx, x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, cellSize * 0.3);
              break;
            case 'square':
            default:
              ctx.fillRect(x, y, cellSize, cellSize);
              break;
          }
        }
      }
    }

    if (config.logoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const logoSize = size * 0.22;
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;
        const padding = logoSize * 0.1;

        ctx.fillStyle = config.bgColor;
        drawRoundedRect(ctx, logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2, 12);

        ctx.strokeStyle = config.fgColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2, 12);
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, logoSize, logoSize, 8);
        ctx.clip();
        ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      };
      img.src = config.logoUrl;
    }
  }, [config]);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      generateQR();
    });
    return () => cancelAnimationFrame(timer);
  }, [generateQR]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setConfig({ ...config, logoUrl: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getPreviewDataUrl = (): string => {
    if (!canvasRef.current) return '';
    // Create a small thumbnail for storage
    const thumb = document.createElement('canvas');
    thumb.width = 200;
    thumb.height = 200;
    const tCtx = thumb.getContext('2d');
    if (tCtx && canvasRef.current) {
      tCtx.drawImage(canvasRef.current, 0, 0, 200, 200);
    }
    return thumb.toDataURL('image/png', 0.7);
  };

  const handleSaveQR = async () => {
    if (!saveName.trim()) return;
    setSaving(true);

    const previewImage = getPreviewDataUrl();

    const { data, error } = await supabase.from('saved_qr_codes').insert([{
      name: saveName.trim(),
      url: config.url,
      fg_color: config.fgColor,
      bg_color: config.bgColor,
      logo_url: config.logoUrl || null,
      style: config.style,
      size: config.size,
      error_correction: config.errorCorrection,
      preview_image: previewImage,
    }]).select();

    if (!error && data) {
      setSavedQRs([data[0] as SavedQR, ...savedQRs]);
    }

    setSaving(false);
    setIsSaveModalOpen(false);
    setSaveName('');
  };

  const loadSavedQR = (qr: SavedQR) => {
    setConfig({
      url: qr.url,
      fgColor: qr.fg_color,
      bgColor: qr.bg_color,
      logoUrl: qr.logo_url || '',
      style: qr.style as QRStyle,
      size: qr.size,
      margin: 2,
      errorCorrection: qr.error_correction as 'L' | 'M' | 'Q' | 'H',
    });
  };

  const deleteSavedQR = async (id: string) => {
    if (!window.confirm('¿Eliminar este QR guardado?')) return;
    await supabase.from('saved_qr_codes').delete().eq('id', id);
    setSavedQRs(savedQRs.filter(q => q.id !== id));
  };

  const downloadQR = (format: 'png' | 'svg') => {
    if (!canvasRef.current) return;
    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `QR-Raynold-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    } else {
      QRCode.toString(config.url, {
        type: 'svg',
        color: { dark: config.fgColor, light: config.bgColor },
        errorCorrectionLevel: config.errorCorrection,
        margin: config.margin,
        width: config.size,
      }).then((svg) => {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.download = `QR-Raynold-${Date.now()}.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
      });
    }
  };

  const copyToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvasRef.current!.toBlob((b) => resolve(b!), 'image/png')
      );
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      downloadQR('png');
    }
  };

  const resetConfig = () => {
    setConfig({
      url: 'https://raynolddesignssrl.com',
      fgColor: '#E60000',
      bgColor: '#000000',
      logoUrl: '',
      style: 'rounded',
      size: 600,
      margin: 2,
      errorCorrection: 'H',
    });
  };

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <QrCode className="text-raynold-red" size={32} />
            <h1 className="text-4xl md:text-5xl font-futuristic font-black text-white">
              GENERADOR <span className="animate-gradient-text">QR</span>
            </h1>
          </div>
          <p className="text-gray-400">Crea códigos QR personalizados con logo, colores y diseños únicos para tu negocio.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: Controls */}
          <div className="lg:col-span-3 space-y-6">

            {/* URL Input */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Link2 size={16} className="text-raynold-red" /> Enlace / URL
              </h3>
              <input
                type="url"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="https://tu-sitio.com"
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors font-mono text-sm mb-4"
              />
              <div className="flex flex-wrap gap-2">
                {QUICK_LINKS.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => setConfig({ ...config, url: link.url })}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${config.url === link.url
                      ? 'bg-raynold-red/20 border-raynold-red/50 text-raynold-red'
                      : 'border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                      }`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selection */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-raynold-red" /> Estilo del QR
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(['square', 'rounded', 'dots'] as QRStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => setConfig({ ...config, style })}
                    className={`py-3 px-4 rounded-xl border font-bold text-sm uppercase tracking-wider transition-all ${config.style === style
                      ? 'bg-raynold-red/20 border-raynold-red/50 text-raynold-red shadow-[0_0_15px_rgba(230,0,0,0.2)]'
                      : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                  >
                    {style === 'square' ? 'Cuadrado' : style === 'rounded' ? 'Redondeado' : 'Puntos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Palette size={16} className="text-raynold-red" /> Colores
              </h3>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setConfig({ ...config, fgColor: preset.fg, bgColor: preset.bg })}
                    className={`relative group p-3 rounded-xl border transition-all text-center ${config.fgColor === preset.fg && config.bgColor === preset.bg
                      ? 'border-raynold-red/50 shadow-[0_0_10px_rgba(230,0,0,0.3)]'
                      : 'border-white/10 hover:border-white/30'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: preset.fg }}></div>
                      <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: preset.bg }}></div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold leading-tight block">{preset.name}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">Color del QR</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.fgColor}
                      onChange={(e) => setConfig({ ...config, fgColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.fgColor}
                      onChange={(e) => setConfig({ ...config, fgColor: e.target.value })}
                      className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-raynold-red focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">Color de Fondo</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.bgColor}
                      onChange={(e) => setConfig({ ...config, bgColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.bgColor}
                      onChange={(e) => setConfig({ ...config, bgColor: e.target.value })}
                      className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-raynold-red focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ImageIcon size={16} className="text-raynold-red" /> Logo Central
              </h3>
              {config.logoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-gray-900">
                    <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold mb-1">Logo cargado</p>
                    <p className="text-gray-500 text-xs">Se mostrará en el centro del QR</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, logoUrl: '' })}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-raynold-red/50 hover:bg-white/5 transition-all">
                  <ImageIcon size={32} className="text-gray-500" />
                  <span className="text-sm font-bold text-gray-400">Subir Logo (PNG, JPG, SVG)</span>
                  <span className="text-xs text-gray-600">Se recomienda fondo transparente</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
              )}
            </div>

            {/* Advanced Settings */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Ajustes Avanzados</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">Tamaño (px)</label>
                  <select
                    value={config.size}
                    onChange={(e) => setConfig({ ...config, size: Number(e.target.value) })}
                    className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-raynold-red focus:outline-none"
                  >
                    <option value={300}>300 x 300</option>
                    <option value={600}>600 x 600</option>
                    <option value={1024}>1024 x 1024</option>
                    <option value={2048}>2048 x 2048 (HD)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">Corrección de Error</label>
                  <select
                    value={config.errorCorrection}
                    onChange={(e) => setConfig({ ...config, errorCorrection: e.target.value as 'L' | 'M' | 'Q' | 'H' })}
                    className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-raynold-red focus:outline-none"
                  >
                    <option value="L">Baja (7%)</option>
                    <option value="M">Media (15%)</option>
                    <option value="Q">Alta (25%)</option>
                    <option value="H">Máxima (30%) — Recomendado con logo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Saved QRs Gallery */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FolderOpen size={16} className="text-raynold-red" /> QR Guardados ({savedQRs.length})
              </h3>
              {loadingSaved ? (
                <p className="text-gray-500 text-sm text-center py-6">Cargando...</p>
              ) : savedQRs.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">No tienes QR guardados aún. Crea uno y presiona "Guardar QR".</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {savedQRs.map((qr) => (
                    <div
                      key={qr.id}
                      className="bg-black border border-white/10 rounded-xl overflow-hidden hover:border-raynold-red/50 transition-colors group"
                    >
                      {/* Preview */}
                      <div
                        className="aspect-square flex items-center justify-center p-3 cursor-pointer"
                        style={{ backgroundColor: qr.bg_color }}
                        onClick={() => loadSavedQR(qr)}
                      >
                        {qr.preview_image ? (
                          <img src={qr.preview_image} alt={qr.name} className="w-full h-full object-contain rounded-lg" />
                        ) : (
                          <QrCode size={48} style={{ color: qr.fg_color }} />
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <p className="text-white text-sm font-bold truncate mb-1">{qr.name}</p>
                        <div className="flex items-center gap-1 mb-2">
                          <ExternalLink size={10} className="text-gray-500" />
                          <p className="text-gray-500 text-[10px] font-mono truncate">{qr.url}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Clock size={10} className="text-gray-600" />
                            <span className="text-[10px] text-gray-600">
                              {new Date(qr.created_at).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => loadSavedQR(qr)}
                              className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors"
                              title="Cargar"
                            >
                              <FolderOpen size={12} />
                            </button>
                            <button
                              onClick={() => deleteSavedQR(qr.id)}
                              className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Preview + Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 sticky top-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 text-center">Vista Previa</h3>

              {/* QR Preview */}
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 shadow-[0_0_30px_rgba(230,0,0,0.1)]">
                  <canvas
                    ref={canvasRef}
                    className="w-64 h-64 rounded-xl"
                    style={{ imageRendering: 'auto' }}
                  />
                </div>
              </div>

              {/* URL display */}
              <div className="bg-black rounded-lg px-4 py-2 mb-6 border border-white/5">
                <p className="text-xs text-gray-500 font-mono truncate">{config.url || 'Sin URL'}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Save Button */}
                <button
                  onClick={() => setIsSaveModalOpen(true)}
                  className="w-full py-3 bg-raynold-green text-black font-bold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-green-400 transition-colors"
                >
                  <Save size={16} /> Guardar QR
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => downloadQR('png')}
                    className="py-3 btn-animated font-bold rounded-xl flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={16} /> PNG
                  </button>
                  <button
                    onClick={() => downloadQR('svg')}
                    className="py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-white/10 transition-colors"
                  >
                    <Download size={16} /> SVG
                  </button>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="w-full py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-white/10 transition-colors"
                >
                  {copied ? <><Check size={16} className="text-raynold-green" /> Copiado al portapapeles</> : <><Copy size={16} /> Copiar imagen</>}
                </button>
                <button
                  onClick={resetConfig}
                  className="w-full py-3 text-gray-500 font-bold rounded-xl flex items-center justify-center gap-2 text-sm hover:text-white hover:bg-white/5 transition-colors"
                >
                  <RotateCcw size={16} /> Restablecer todo
                </button>
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-raynold-red/5 border border-raynold-red/20 rounded-xl">
                <p className="text-xs text-gray-400 leading-relaxed">
                  <span className="text-raynold-red font-bold">TIP:</span> Usa corrección de error <span className="text-white font-bold">Máxima (H)</span> cuando agregues un logo para que el QR siga siendo escaneable.
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
              <Save size={20} className="text-raynold-green" /> Guardar Código QR
            </h3>
            <p className="text-gray-400 text-sm mb-4">Dale un nombre para identificarlo después.</p>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Ej: QR WhatsApp Rojo, QR Catálogo Dorado..."
              className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-green focus:outline-none transition-colors mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveQR()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setIsSaveModalOpen(false); setSaveName(''); }}
                className="flex-1 py-2.5 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveQR}
                disabled={saving || !saveName.trim()}
                className="flex-1 py-2.5 bg-raynold-green text-black font-bold rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? 'Guardando...' : <><Save size={16} /> Guardar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQR;
