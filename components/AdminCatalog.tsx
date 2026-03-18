import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, Eye, Download, Settings2, Palette, Grid3X3, List, LayoutGrid,
  Check, X, ChevronRight, ChevronLeft, Plus, Minus, Image as ImageIcon,
  Hash, Columns, Rows, Square, Printer, Filter, Search,
  ToggleLeft, ToggleRight, Loader2, Sparkles, ArrowUpDown, Save, FolderOpen,
  Trash2, Clock, Upload, Globe, FileText
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabaseClient';
import { ProductItem } from '../types';
import {
  CatalogConfig, PageLayout, DEFAULT_CONFIG, TEMPLATES, GRADIENT_PRESETS,
  LAYOUT_OPTIONS, FONTS, getProductsPerPage
} from './catalogTemplates';

interface SavedCatalog {
  id: string; name: string; config: CatalogConfig;
  selected_product_ids: string[]; preview_image: string | null; created_at: string;
}

const AdminCatalog: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<CatalogConfig>({ ...DEFAULT_CONFIG });
  const [activeTab, setActiveTab] = useState<'templates' | 'select' | 'design' | 'preview'>('templates');
  const [previewPage, setPreviewPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedCatalogs, setSavedCatalogs] = useState<SavedCatalog[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: prods }, { data: saved }] = await Promise.all([
        supabase.from('products').select('id,title,category,image,price,description,reference,show_price').eq('is_active', true).order('category'),
        supabase.from('saved_catalogs').select('*').order('created_at', { ascending: false }),
      ]);
      if (prods) {
        const mapped = prods.map(p => ({
          id: p.id, title: p.title, category: p.category || 'Sin categoría',
          image: p.image || '', price: p.price || '', description: p.description || '',
          reference: p.reference || '', show_price: p.show_price ?? false,
        }));
        setProducts(mapped);
        setCategories([...new Set(mapped.map(p => p.category))]);
        setSelectedProducts(new Set(mapped.map(p => p.id)));
      }
      if (saved) setSavedCatalogs(saved as SavedCatalog[]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const catalogProducts = products.filter(p => selectedProducts.has(p.id)).sort((a, b) => {
    switch (config.sortMode) {
      case 'category': return a.category.localeCompare(b.category);
      case 'name-asc': return a.title.localeCompare(b.title);
      case 'name-desc': return b.title.localeCompare(a.title);
      case 'price-asc': return parseFloat(a.price || '0') - parseFloat(b.price || '0');
      case 'price-desc': return parseFloat(b.price || '0') - parseFloat(a.price || '0');
      default: return 0;
    }
  });

  const generatePages = useCallback(() => {
    const pages: { type: 'cover' | 'toc' | 'products' | 'back'; products?: ProductItem[]; layout: PageLayout; categoryHeader?: string }[] = [];
    pages.push({ type: 'cover', layout: config.pageLayout });
    if (config.showTOC && catalogProducts.length > 0) pages.push({ type: 'toc', layout: config.pageLayout });
    const ppp = getProductsPerPage(config.pageLayout);
    // When showing category headers inline, the header takes space so fit fewer products on that page
    const pppWithHeader = Math.max(1, ppp - (config.pageLayout === 'list' ? 1 : (config.pageLayout.startsWith('grid-3') ? 3 : (config.pageLayout === 'full' || config.pageLayout === 'magazine' ? 0 : 2))));
    if (config.sortMode === 'category') {
      const grouped: Record<string, ProductItem[]> = {};
      catalogProducts.forEach(p => { if (!grouped[p.category]) grouped[p.category] = []; grouped[p.category].push(p); });
      Object.entries(grouped).forEach(([cat, prods]) => {
        if (config.showCategoryHeaders) {
          // First page has category header + fewer products
          const firstBatch = prods.slice(0, pppWithHeader);
          pages.push({ type: 'products', products: firstBatch, layout: config.pageLayout, categoryHeader: cat });
          // Remaining products in full pages
          for (let i = pppWithHeader; i < prods.length; i += ppp) {
            pages.push({ type: 'products', products: prods.slice(i, i + ppp), layout: config.pageLayout });
          }
        } else {
          for (let i = 0; i < prods.length; i += ppp) {
            pages.push({ type: 'products', products: prods.slice(i, i + ppp), layout: config.pageLayout });
          }
        }
      });
    } else {
      for (let i = 0; i < catalogProducts.length; i += ppp) pages.push({ type: 'products', products: catalogProducts.slice(i, i + ppp), layout: config.pageLayout });
    }
    if (config.showBackCover) pages.push({ type: 'back', layout: config.pageLayout });
    return pages;
  }, [config, catalogProducts]);

  const pages = generatePages();

  const toggleCategory = (cat: string) => {
    const ns = new Set(selectedProducts);
    const cp = products.filter(p => p.category === cat);
    const all = cp.every(p => ns.has(p.id));
    cp.forEach(p => all ? ns.delete(p.id) : ns.add(p.id));
    setSelectedProducts(ns);
  };

  const toggleProduct = (id: string) => {
    const ns = new Set(selectedProducts);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelectedProducts(ns);
  };

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setConfig({ ...config, ...tpl.defaults, templateId: tpl.id });
    setActiveTab('design');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setConfig({ ...config, logoUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setConfig({ ...config, coverImage: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const useWebLogo = () => setConfig({ ...config, logoUrl: 'https://ymiqmbzsmeqexgztquwj.supabase.co/storage/v1/object/public/raynold-media/logos/isotipo.png' });

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from('saved_catalogs').insert([{
      name: saveName.trim(), config, selected_product_ids: [...selectedProducts],
    }]).select();
    if (!error && data) setSavedCatalogs([data[0] as SavedCatalog, ...savedCatalogs]);
    setSaving(false); setSaveModalOpen(false); setSaveName('');
  };

  const loadCatalog = (cat: SavedCatalog) => {
    setConfig(cat.config);
    setSelectedProducts(new Set(cat.selected_product_ids));
    setActiveTab('preview');
  };

  const deleteCatalog = async (id: string) => {
    if (!window.confirm('¿Eliminar este catálogo guardado?')) return;
    await supabase.from('saved_catalogs').delete().eq('id', id);
    setSavedCatalogs(savedCatalogs.filter(c => c.id !== id));
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      // Render all pages in an offscreen container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '8.5in';
      container.style.zIndex = '-1';
      document.body.appendChild(container);

      // Temporarily render all pages into the container
      const tempRoot = document.createElement('div');
      container.appendChild(tempRoot);

      // Use the printRef pages already rendered
      const printArea = printRef.current;
      if (!printArea) { setDownloading(false); return; }

      // Force show printRef
      printArea.style.display = 'block';
      printArea.style.position = 'fixed';
      printArea.style.left = '-9999px';
      printArea.style.top = '0';
      printArea.style.width = '8.5in';
      printArea.style.zIndex = '-1';

      const pageElements = printArea.querySelectorAll('[data-catalog-page]');
      if (pageElements.length === 0) {
        printArea.style.display = '';
        printArea.style.position = '';
        printArea.style.left = '';
        printArea.style.top = '';
        printArea.style.width = '';
        printArea.style.zIndex = '';
        setDownloading(false);
        return;
      }

      // 8.5x11 inches at 96dpi = 816x1056px, scale 2x for quality
      const pdf = new jsPDF({ orientation: 'p', unit: 'in', format: 'letter' });

      for (let i = 0; i < pageElements.length; i++) {
        const el = pageElements[i] as HTMLElement;
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false,
          width: el.offsetWidth,
          height: el.offsetHeight,
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 8.5, 11);
      }

      pdf.save(`catalogo-${config.catalogTitle?.replace(/\s+/g, '-').toLowerCase() || 'raynold'}.pdf`);

      // Restore printRef
      printArea.style.display = '';
      printArea.style.position = '';
      printArea.style.left = '';
      printArea.style.top = '';
      printArea.style.width = '';
      printArea.style.zIndex = '';

      document.body.removeChild(container);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
    setDownloading(false);
  };

  const fs = { sm: { t: '10px', b: '8px', h: '14px' }, md: { t: '12px', b: '9px', h: '16px' }, lg: { t: '14px', b: '11px', h: '18px' } }[config.fontSize];
  const PAGE: React.CSSProperties = { width: '8.5in', height: '11in', backgroundColor: config.pageColor, fontFamily: `'${config.fontFamily}',sans-serif`, position: 'relative', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', pageBreakAfter: 'always' };

  const renderCard = (p: ProductItem, layout: PageLayout) => {
    const isList = layout === 'list';
    const isFull = layout === 'full' || layout === 'magazine';
    const cardBorder = config.productCardStyle === 'bordered' ? `1px solid ${config.accentColor}30` : config.productCardStyle === 'shadow' ? 'none' : 'none';
    const cardShadow = config.productCardStyle === 'shadow' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none';
    const accentBar = config.productCardStyle === 'accent';
    if (isList) return (
      <div key={p.id} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: `1px solid ${config.textColor}10`, alignItems: 'center' }}>
        <img src={p.image} alt="" style={{ width: '55px', height: '55px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: fs.t, color: config.textColor, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
          {config.showReference && p.reference && <p style={{ fontSize: '7px', color: config.accentColor, margin: '1px 0 0', fontFamily: 'monospace' }}>REF: {p.reference}</p>}
          {config.showDescription && p.description && <p style={{ fontSize: fs.b, color: '#888', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</p>}
        </div>
        {config.showPrice && p.price && <p style={{ fontWeight: 800, fontSize: fs.t, color: config.accentColor, margin: 0 }}>{p.price}</p>}
      </div>
    );
    return (
      <div key={p.id} style={{ display: 'flex', flexDirection: isFull ? 'row' : 'column', gap: isFull ? '16px' : '6px', height: '100%', overflow: 'hidden', border: cardBorder, boxShadow: cardShadow, borderRadius: '6px', padding: cardBorder !== 'none' || cardShadow !== 'none' ? '6px' : 0, position: 'relative' }}>
        {accentBar && <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: config.accentColor, borderRadius: '2px' }} />}
        <div style={{ width: isFull ? '55%' : '100%', aspectRatio: isFull ? undefined : '1', height: isFull ? '100%' : undefined, borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f0f0f0', flexShrink: 0 }}>
          <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: accentBar ? '8px' : 0 }}>
          {config.showCategory && <p style={{ fontSize: '7px', fontWeight: 800, color: config.accentColor, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.category}</p>}
          <p style={{ fontWeight: 700, fontSize: fs.t, color: config.textColor, margin: '0 0 2px', lineHeight: 1.2 }}>{p.title}</p>
          {config.showReference && p.reference && <p style={{ fontSize: '7px', color: '#999', margin: '0 0 2px', fontFamily: 'monospace' }}>REF: {p.reference}</p>}
          {config.showDescription && p.description && <p style={{ fontSize: fs.b, color: '#666', margin: '3px 0', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: isFull ? 4 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}
          {config.showPrice && p.price && <p style={{ fontWeight: 800, fontSize: isFull ? '18px' : fs.h, color: config.accentColor, margin: '4px 0 0' }}>{p.price}</p>}
        </div>
      </div>
    );
  };

  const renderCover = (idx: number) => (
    <div key={idx} style={{ ...PAGE, background: config.coverGradient, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1.5in 1in', position: 'relative' }}>
      {config.coverImage && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }} />}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {config.logoUrl && <img src={config.logoUrl} alt="Logo" style={{ height: '60px', marginBottom: '40px', objectFit: 'contain' }} />}
        <div style={{ width: '60px', height: '3px', backgroundColor: config.accentColor, margin: '0 auto 30px', borderRadius: '2px' }} />
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', letterSpacing: '3px', lineHeight: 1.1, margin: '0 0 12px' }}>{config.title}</h1>
        <p style={{ fontSize: '14px', fontWeight: 300, color: config.accentColor, letterSpacing: '5px', textTransform: 'uppercase' }}>{config.subtitle}</p>
        <div style={{ width: '60px', height: '3px', backgroundColor: config.accentColor, margin: '30px auto 0', borderRadius: '2px' }} />
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '50px' }}>{new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long' })}</p>
      </div>
    </div>
  );

  const renderTOC = (idx: number) => {
    const grouped: Record<string, number> = {};
    let pg = config.showTOC ? 3 : 2;
    const ppp = getProductsPerPage(config.pageLayout);
    const pppWithHeader = Math.max(1, ppp - (config.pageLayout === 'list' ? 1 : (config.pageLayout.startsWith('grid-3') ? 3 : (config.pageLayout === 'full' || config.pageLayout === 'magazine' ? 0 : 2))));
    if (config.sortMode === 'category') {
      const cats: Record<string, ProductItem[]> = {};
      catalogProducts.forEach(p => { if (!cats[p.category]) cats[p.category] = []; cats[p.category].push(p); });
      Object.entries(cats).forEach(([cat, prods]) => {
        grouped[cat] = pg;
        if (config.showCategoryHeaders) {
          pg += 1 + Math.ceil(Math.max(0, prods.length - pppWithHeader) / ppp);
        } else {
          pg += Math.ceil(prods.length / ppp);
        }
      });
    }
    return (
      <div key={idx} style={{ ...PAGE, padding: '1in 0.8in', display: 'flex', flexDirection: 'column' }}>
        {config.logoUrl && <img src={config.logoUrl} alt="" style={{ height: '30px', objectFit: 'contain', marginBottom: '20px', alignSelf: 'flex-start', filter: 'brightness(0)' }} />}
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: config.textColor, marginBottom: '6px', letterSpacing: '2px' }}>ÍNDICE</h2>
        <div style={{ width: '30px', height: '3px', backgroundColor: config.accentColor, marginBottom: '25px', borderRadius: '2px' }} />
        <div style={{ flex: 1 }}>
          {Object.entries(grouped).map(([cat, pn]) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: `1px solid ${config.textColor}10` }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: config.textColor }}>{cat}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: config.accentColor, fontFamily: 'monospace' }}>{pn}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '8px', color: '#999', textAlign: 'center' }}>{catalogProducts.length} productos</p>
      </div>
    );
  };



  const renderProductPage = (idx: number, prods: ProductItem[], catHeader?: string) => {
    const layout = config.pageLayout;
    const gridMap: Record<PageLayout, React.CSSProperties> = {
      'grid-2x2': { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gridTemplateRows: `repeat(2,1fr)`, gap: '14px' },
      'grid-2x3': { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gridTemplateRows: `repeat(3,1fr)`, gap: '10px' },
      'grid-3x3': { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: `repeat(3,1fr)`, gap: '8px' },
      'list': { display: 'flex', flexDirection: 'column' as const },
      'full': { display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' as const },
      'magazine': { display: 'grid', gridTemplateColumns: '1fr', gap: '14px' },
      'sidebar': { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gridTemplateRows: '1fr 1fr', gap: '10px' },
    };
    const hdrStyle: Record<string, React.CSSProperties> = {
      bar: { backgroundColor: config.accentColor, color: '#fff', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 800, margin: '0 0 12px', letterSpacing: '1px' },
      line: { borderBottom: `2px solid ${config.accentColor}`, paddingBottom: '6px', fontSize: '14px', fontWeight: 800, color: config.textColor, margin: '0 0 12px' },
      block: { borderLeft: `4px solid ${config.accentColor}`, paddingLeft: '12px', fontSize: '14px', fontWeight: 800, color: config.textColor, margin: '0 0 12px' },
      minimal: { fontSize: '12px', fontWeight: 800, color: config.accentColor, textTransform: 'uppercase' as const, letterSpacing: '2px', margin: '0 0 12px' },
    };
    return (
      <div key={idx} style={{ ...PAGE, padding: '0.5in 0.6in', display: 'flex', flexDirection: 'column' }}>
        {catHeader && (
          <div style={{ marginBottom: '6px', flexShrink: 0 }}>
            <p style={hdrStyle[config.headerStyle]}>{catHeader}</p>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', ...gridMap[layout] }}>
          {prods.map(p => renderCard(p, layout))}
        </div>
        {config.showPageNumbers && <div style={{ textAlign: 'center', paddingTop: '6px', borderTop: `1px solid ${config.textColor}10`, flexShrink: 0 }}><span style={{ fontSize: '8px', fontWeight: 700, color: config.accentColor, fontFamily: 'monospace' }}>{idx + 1}</span></div>}
      </div>
    );
  };

  const renderBack = (idx: number) => (
    <div key={idx} style={{ ...PAGE, background: config.coverGradient, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1.5in 1.2in', position: 'relative' }}>
      {config.logoUrl && <img src={config.logoUrl} alt="" style={{ height: '50px', marginBottom: '30px', objectFit: 'contain' }} />}
      <div style={{ width: '50px', height: '3px', backgroundColor: config.accentColor, margin: '0 auto 30px', borderRadius: '2px' }} />
      <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '25px', letterSpacing: '2px' }}>{config.subtitle}</h2>
      {config.backCoverText.split('\n').map((l, i) => <p key={i} style={{ fontSize: '11px', color: '#aaa', margin: '3px 0', lineHeight: 1.5 }}>{l}</p>)}
      {/* Social Icons */}
      <div style={{ display: 'flex', gap: '18px', marginTop: '40px', alignItems: 'center' }}>
        {/* Instagram */}
        <a href="https://instagram.com/raynolddesignsrl" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', border: `2px solid ${config.accentColor}40`, textDecoration: 'none', transition: 'all 0.2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={config.accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
        </a>
        {/* Facebook */}
        <a href="https://facebook.com/raynolddesignsrl" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', border: `2px solid ${config.accentColor}40`, textDecoration: 'none', transition: 'all 0.2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={config.accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
        </a>
        {/* WhatsApp */}
        <a href="https://wa.me/18295807411" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', border: `2px solid ${config.accentColor}40`, textDecoration: 'none', transition: 'all 0.2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={config.accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        </a>
        {/* Website */}
        <a href="https://raynolddesignssrl.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', border: `2px solid ${config.accentColor}40`, textDecoration: 'none', transition: 'all 0.2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={config.accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </a>
      </div>
      <div style={{ width: '50px', height: '3px', backgroundColor: config.accentColor, margin: '35px auto 0', borderRadius: '2px' }} />
      <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '20px' }}>© {new Date().getFullYear()} {config.subtitle}. Todos los derechos reservados.</p>
    </div>
  );

  const renderPage = (page: typeof pages[0], idx: number) => {
    if (page.type === 'cover') return renderCover(idx);
    if (page.type === 'toc') return renderTOC(idx);
    if (page.type === 'back') return renderBack(idx);
    return renderProductPage(idx, page.products || [], page.categoryHeader);
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-raynold-red" size={40} /></div>;

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BookOpen className="text-raynold-red" size={26} />
            <div>
              <h1 className="text-xl font-futuristic font-black text-white">CREADOR DE <span className="animate-gradient-text">CATÁLOGOS</span></h1>
              <p className="text-[10px] text-gray-500">{selectedProducts.size} productos · {pages.length} páginas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-black border border-white/10 rounded-lg p-0.5">
              {([
                { key: 'templates' as const, label: 'Plantillas', icon: <Sparkles size={13} /> },
                { key: 'select' as const, label: 'Productos', icon: <Filter size={13} /> },
                { key: 'design' as const, label: 'Diseño', icon: <Palette size={13} /> },
                { key: 'preview' as const, label: 'Vista Previa', icon: <Eye size={13} /> },
              ]).map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all ${activeTab === t.key ? 'bg-raynold-red/20 text-raynold-red' : 'text-gray-400 hover:text-white'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <button onClick={() => setSaveModalOpen(true)} className="px-3 py-1.5 bg-green-500/20 text-green-400 font-bold rounded-lg text-[11px] flex items-center gap-1.5 hover:bg-green-500/30"><Save size={14} /> Guardar</button>
            <button onClick={handleDownloadPdf} disabled={downloading} className="px-3 py-1.5 bg-rose-500/20 text-rose-400 font-bold rounded-lg text-[11px] flex items-center gap-1.5 hover:bg-rose-500/30 disabled:opacity-50">
              {downloading ? <><Loader2 size={14} className="animate-spin" /> Generando...</> : <><FileText size={14} /> PDF</>}
            </button>
            <button onClick={() => window.print()} className="px-3 py-1.5 btn-animated font-bold rounded-lg text-[11px] flex items-center gap-1.5"><Printer size={14} /> Imprimir</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* TEMPLATES TAB */}
        {activeTab === 'templates' && (
          <div className="w-full p-6 overflow-y-auto scrollbar-modern">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-lg font-bold text-white mb-1">Elige una Plantilla</h2>
              <p className="text-xs text-gray-500 mb-6">Selecciona un diseño base y personalízalo a tu gusto</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                {TEMPLATES.map(tpl => (
                  <button key={tpl.id} onClick={() => applyTemplate(tpl)}
                    className={`text-left rounded-xl border-2 overflow-hidden transition-all group hover:border-raynold-red/50 ${config.templateId === tpl.id ? 'border-raynold-red shadow-[0_0_15px_rgba(230,0,0,0.2)]' : 'border-white/10'}`}>
                    {/* Mini Preview */}
                    <div className="h-36 relative overflow-hidden" style={{ background: tpl.defaults.coverGradient }}>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <div style={{ width: '25px', height: '2px', backgroundColor: tpl.defaults.accentColor, marginBottom: '8px', borderRadius: '1px' }} />
                        <p style={{ fontSize: '10px', fontWeight: 900, color: '#fff', letterSpacing: '1px' }}>PRODUCT CATALOG</p>
                        <p style={{ fontSize: '7px', color: tpl.defaults.accentColor, letterSpacing: '2px', marginTop: '3px' }}>COMPANY</p>
                      </div>
                      {config.templateId === tpl.id && <div className="absolute top-2 right-2 w-6 h-6 bg-raynold-red rounded-full flex items-center justify-center"><Check size={12} className="text-white" /></div>}
                    </div>
                    <div className="p-3 bg-[#0A0A0A]">
                      <p className="text-sm font-bold text-white">{tpl.name}</p>
                      <p className="text-[10px] text-gray-500">{tpl.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Saved Catalogs */}
              <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><FolderOpen size={18} className="text-raynold-red" /> Catálogos Guardados ({savedCatalogs.length})</h2>
              <p className="text-xs text-gray-500 mb-4">Carga un catálogo guardado previamente</p>
              {savedCatalogs.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8 bg-[#0A0A0A] border border-white/10 rounded-xl">No hay catálogos guardados aún.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {savedCatalogs.map(sc => (
                    <div key={sc.id} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-raynold-red/30 transition-colors group">
                      <div className="h-20 flex items-center justify-center" style={{ background: (sc.config as CatalogConfig).coverGradient }}>
                        <BookOpen size={24} className="text-white/50" />
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold text-white truncate">{sc.name}</p>
                        <p className="text-[9px] text-gray-500 flex items-center gap-1 mt-1"><Clock size={9} />{new Date(sc.created_at).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}</p>
                        <div className="flex gap-1 mt-2">
                          <button onClick={() => loadCatalog(sc)} className="flex-1 py-1 bg-blue-500/20 text-blue-400 rounded text-[9px] font-bold hover:bg-blue-500/30">Cargar</button>
                          <button onClick={() => deleteCatalog(sc.id)} className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"><Trash2 size={11} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SELECT TAB */}
        {activeTab === 'select' && (
          <div className="w-full p-6 overflow-y-auto scrollbar-modern">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                  <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black border border-white/20 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:border-raynold-red focus:outline-none" />
                </div>
                <button onClick={() => setSelectedProducts(new Set(products.map(p => p.id)))} className="px-3 py-2 bg-green-500/20 text-green-400 text-[11px] font-bold rounded-lg">Todos</button>
                <button onClick={() => setSelectedProducts(new Set())} className="px-3 py-2 bg-red-500/20 text-red-400 text-[11px] font-bold rounded-lg">Ninguno</button>
              </div>
              {categories.map(cat => {
                const cp = products.filter(p => p.category === cat && p.title.toLowerCase().includes(searchTerm.toLowerCase()));
                if (!cp.length) return null;
                const all = cp.every(p => selectedProducts.has(p.id));
                const some = cp.some(p => selectedProducts.has(p.id));
                return (
                  <div key={cat} className="mb-5">
                    <button onClick={() => toggleCategory(cat)} className={`flex items-center gap-3 w-full text-left p-2.5 rounded-xl mb-2 transition-all ${all ? 'bg-raynold-red/10 border border-raynold-red/30' : 'bg-white/5 border border-white/10'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${all ? 'bg-raynold-red border-raynold-red' : some ? 'border-raynold-red/50 bg-raynold-red/20' : 'border-white/20'}`}>{all && <Check size={10} className="text-white" />}{some && !all && <Minus size={10} className="text-raynold-red" />}</div>
                      <span className="text-xs font-bold text-white flex-1">{cat}</span>
                      <span className="text-[10px] text-gray-500">{cp.filter(p => selectedProducts.has(p.id)).length}/{cp.length}</span>
                    </button>
                    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-1.5 pl-3">
                      {cp.map(p => (
                        <button key={p.id} onClick={() => toggleProduct(p.id)} className={`relative rounded-lg overflow-hidden border-2 transition-all text-left ${selectedProducts.has(p.id) ? 'border-raynold-red' : 'border-transparent opacity-40 hover:opacity-70'}`}>
                          <div className="aspect-square bg-gray-900"><img src={p.image} alt="" className="w-full h-full object-cover" /></div>
                          <div className="p-1.5 bg-[#0A0A0A]"><p className="text-[9px] font-bold text-white truncate">{p.title}</p></div>
                          {selectedProducts.has(p.id) && <div className="absolute top-1 right-1 w-4 h-4 bg-raynold-red rounded-full flex items-center justify-center"><Check size={8} className="text-white" /></div>}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DESIGN TAB - Split: Controls Left + Preview Right */}
        {activeTab === 'design' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Design Controls */}
            <div className="w-[420px] shrink-0 overflow-y-auto scrollbar-modern p-5 space-y-4 border-r border-white/10">
              {/* Logo */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><ImageIcon size={14} className="text-raynold-red" /> Logo</h3>
                <div className="flex gap-2 items-center flex-wrap">
                  {config.logoUrl && <img src={config.logoUrl} alt="" className="h-8 object-contain bg-white/10 rounded-lg px-2 py-0.5" />}
                  <button onClick={() => logoInputRef.current?.click()} className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-300 hover:bg-white/10 flex items-center gap-1.5"><Upload size={12} /> Subir</button>
                  <button onClick={useWebLogo} className="px-2.5 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-[10px] text-blue-400 hover:bg-blue-500/30 flex items-center gap-1.5"><Globe size={12} /> Web</button>
                  {config.logoUrl && <button onClick={() => setConfig({ ...config, logoUrl: '' })} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 size={12} /></button>}
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
              </div>
              {/* Cover */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Portada</h3>
                <div className="space-y-3">
                  <input type="text" value={config.title} onChange={e => setConfig({ ...config, title: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs focus:border-raynold-red focus:outline-none" placeholder="Título" />
                  <input type="text" value={config.subtitle} onChange={e => setConfig({ ...config, subtitle: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs focus:border-raynold-red focus:outline-none" placeholder="Subtítulo" />
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1.5 block">Degradado</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {GRADIENT_PRESETS.map(g => (
                        <button key={g.name} onClick={() => setConfig({ ...config, coverGradient: g.value })}
                          className={`rounded-lg border-2 overflow-hidden transition-all ${config.coverGradient === g.value ? 'border-raynold-red' : 'border-white/10 hover:border-white/20'}`}>
                          <div className="h-6 w-full" style={{ background: g.value }} />
                          <p className="text-[7px] text-gray-400 font-bold p-0.5 bg-[#0A0A0A] text-center truncate">{g.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => coverInputRef.current?.click()} className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-300 hover:bg-white/10 flex items-center gap-1.5"><Upload size={12} /> Imagen Portada</button>
                    {config.coverImage && <button onClick={() => setConfig({ ...config, coverImage: '' })} className="px-2.5 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-[10px]">Quitar</button>}
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </div>
              </div>
              {/* Layout */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><LayoutGrid size={14} className="text-raynold-red" /> Distribución</h3>
                <div className="grid grid-cols-4 gap-1.5">
                  {LAYOUT_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => setConfig({ ...config, pageLayout: o.value })} className={`p-2 rounded-xl border text-center transition-all ${config.pageLayout === o.value ? 'bg-raynold-red/10 border-raynold-red/50' : 'border-white/10 hover:border-white/20'}`}>
                      <p className="text-[10px] font-bold text-white">{o.label}</p>
                      <p className="text-[8px] text-gray-500">{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              {/* Toggles */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Settings2 size={14} className="text-raynold-red" /> Opciones</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { k: 'showPrice' as const, l: 'Precios' }, { k: 'showCategory' as const, l: 'Categoría' },
                    { k: 'showDescription' as const, l: 'Descripción' }, { k: 'showReference' as const, l: 'Referencia' },
                    { k: 'showPageNumbers' as const, l: 'Núm. Páginas' }, { k: 'showTOC' as const, l: 'Índice' },
                    { k: 'showCategoryHeaders' as const, l: 'Separadores' }, { k: 'showBackCover' as const, l: 'Contraportada' },
                  ]).map(o => (
                    <button key={o.k} onClick={() => setConfig({ ...config, [o.k]: !config[o.k] })} className="flex items-center justify-between p-2 rounded-lg border border-white/5 hover:border-white/10">
                      <span className="text-[10px] text-white font-medium">{o.l}</span>
                      {config[o.k] ? <ToggleRight size={18} className="text-raynold-green" /> : <ToggleLeft size={18} className="text-gray-600" />}
                    </button>
                  ))}
                </div>
              </div>
              {/* Sort / Style */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ordenar</h3>
                  <div className="space-y-1">
                    {([{ v: 'category' as const, l: 'Categoría' }, { v: 'name-asc' as const, l: 'A→Z' }, { v: 'name-desc' as const, l: 'Z→A' }, { v: 'price-asc' as const, l: 'Precio ↑' }]).map(s => (
                      <button key={s.v} onClick={() => setConfig({ ...config, sortMode: s.v })} className={`w-full py-1 px-2 rounded-lg text-[10px] font-bold text-left ${config.sortMode === s.v ? 'bg-raynold-red/20 text-raynold-red' : 'text-gray-400 hover:text-white'}`}>{s.l}</button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tarjetas</h3>
                  <div className="space-y-1">
                    {([{ v: 'clean' as const, l: 'Limpio' }, { v: 'bordered' as const, l: 'Borde' }, { v: 'shadow' as const, l: 'Sombra' }, { v: 'accent' as const, l: 'Acento' }]).map(s => (
                      <button key={s.v} onClick={() => setConfig({ ...config, productCardStyle: s.v })} className={`w-full py-1 px-2 rounded-lg text-[10px] font-bold text-left ${config.productCardStyle === s.v ? 'bg-raynold-red/20 text-raynold-red' : 'text-gray-400 hover:text-white'}`}>{s.l}</button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Colors & Fonts */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Palette size={14} className="text-raynold-red" /> Colores y Fuente</h3>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[{ k: 'pageColor' as const, l: 'Fondo' }, { k: 'textColor' as const, l: 'Texto' }, { k: 'accentColor' as const, l: 'Acento' }].map(c => (
                    <div key={c.k}>
                      <label className="text-[8px] text-gray-500 mb-0.5 block">{c.l}</label>
                      <div className="flex gap-1 items-center">
                        <input type="color" value={config[c.k]} onChange={e => setConfig({ ...config, [c.k]: e.target.value })} className="w-6 h-6 rounded cursor-pointer border border-white/10 bg-transparent" />
                        <input type="text" value={config[c.k]} onChange={e => setConfig({ ...config, [c.k]: e.target.value })} className="flex-1 bg-black border border-white/20 rounded px-1.5 py-0.5 text-white font-mono text-[9px]" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={config.fontFamily} onChange={e => setConfig({ ...config, fontFamily: e.target.value as any })} className="bg-black border border-white/20 rounded-lg px-2 py-1.5 text-white text-[10px]">{FONTS.map(f => <option key={f}>{f}</option>)}</select>
                  <div className="flex rounded-lg border border-white/10 overflow-hidden">{(['sm', 'md', 'lg'] as const).map(s => (<button key={s} onClick={() => setConfig({ ...config, fontSize: s })} className={`flex-1 py-1.5 text-[10px] font-bold ${config.fontSize === s ? 'bg-raynold-red/20 text-raynold-red' : 'text-gray-400'}`}>{s.toUpperCase()}</button>))}</div>
                </div>
              </div>
              {/* Headers */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Encabezados</h3>
                <div className="grid grid-cols-4 gap-1.5">
                  {([{ v: 'bar', l: 'Barra' }, { v: 'line', l: 'Línea' }, { v: 'block', l: 'Bloque' }, { v: 'minimal', l: 'Mínimo' }] as const).map(s => (
                    <button key={s.v} onClick={() => setConfig({ ...config, headerStyle: s.v })} className={`py-1.5 rounded-lg text-[10px] font-bold ${config.headerStyle === s.v ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 border border-white/10'}`}>{s.l}</button>
                  ))}
                </div>
              </div>
              {config.showBackCover && (
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Contraportada</h3>
                  <textarea value={config.backCoverText} onChange={e => setConfig({ ...config, backCoverText: e.target.value })} className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-[11px] h-20 resize-none" />
                </div>
              )}
            </div>
            {/* Right: Live Preview */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#111]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-raynold-red" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Vista Previa en Vivo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPreviewPage(Math.max(0, previewPage - 1))} disabled={previewPage === 0} className="p-1 rounded border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"><ChevronLeft size={14} /></button>
                  <span className="text-[10px] text-white font-bold">{previewPage + 1}/{pages.length}</span>
                  <button onClick={() => setPreviewPage(Math.min(pages.length - 1, previewPage + 1))} disabled={previewPage >= pages.length - 1} className="p-1 rounded border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"><ChevronRight size={14} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
                <div style={{ transform: 'scale(0.55)', transformOrigin: 'top center' }}>
                  {pages[previewPage] && renderPage(pages[previewPage], previewPage)}
                </div>
              </div>
              <div className="flex gap-1 p-1.5 border-t border-white/10 overflow-x-auto scrollbar-modern shrink-0 bg-[#0A0A0A]">
                {pages.map((pg, i) => (
                  <button key={i} onClick={() => setPreviewPage(i)} className={`flex-shrink-0 w-10 h-14 rounded border-2 overflow-hidden ${i === previewPage ? 'border-raynold-red' : 'border-white/10 opacity-40'}`}>
                    <div className="w-full h-full flex items-center justify-center text-[6px] font-bold text-gray-400" style={{ background: pg.type === 'cover' || pg.type === 'back' || pg.type === 'category-divider' ? config.coverGradient : config.pageColor }}>
                      {pg.type === 'cover' ? '📄' : pg.type === 'toc' ? '📋' : pg.type === 'back' ? '📕' : pg.type === 'category-divider' ? '📂' : i}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PREVIEW TAB */}
        {activeTab === 'preview' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-2 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewPage(Math.max(0, previewPage - 1))} disabled={previewPage === 0} className="p-1.5 rounded border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="text-xs text-white font-bold">{previewPage + 1} / {pages.length}</span>
                <button onClick={() => setPreviewPage(Math.min(pages.length - 1, previewPage + 1))} disabled={previewPage >= pages.length - 1} className="p-1.5 rounded border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
              <span className="text-[10px] text-gray-500 uppercase font-bold">
                {pages[previewPage]?.type === 'cover' ? 'Portada' : pages[previewPage]?.type === 'toc' ? 'Índice' : pages[previewPage]?.type === 'back' ? 'Contraportada' : pages[previewPage]?.type === 'category-divider' ? 'Separador' : 'Productos'}
              </span>
            </div>
            <div className="flex-1 overflow-auto p-6 flex items-start justify-center bg-[#111]">
              <div style={{ transform: 'scale(0.7)', transformOrigin: 'top center' }}>
                {pages[previewPage] && renderPage(pages[previewPage], previewPage)}
              </div>
            </div>
            <div className="flex gap-1.5 p-2 border-t border-white/10 overflow-x-auto scrollbar-modern shrink-0 bg-[#0A0A0A]">
              {pages.map((pg, i) => (
                <button key={i} onClick={() => setPreviewPage(i)} className={`flex-shrink-0 w-12 h-16 rounded border-2 overflow-hidden ${i === previewPage ? 'border-raynold-red' : 'border-white/10 opacity-50'}`}>
                  <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-gray-400" style={{ background: pg.type === 'cover' || pg.type === 'back' || pg.type === 'category-divider' ? config.coverGradient : config.pageColor }}>
                    {pg.type === 'cover' ? 'PORT' : pg.type === 'toc' ? 'IND' : pg.type === 'back' ? 'CONT' : pg.type === 'category-divider' ? 'CAT' : i}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Print Area - ALL PAGES */}
      <div ref={printRef} className="hidden print:block">
        <style>{`@media print { body * { visibility: hidden !important; } .print-cat, .print-cat * { visibility: visible !important; } .print-cat { position: absolute; left: 0; top: 0; width: 100%; } @page { size: 8.5in 11in; margin: 0; } }`}</style>
        <div className="print-cat">{pages.map((p, i) => <div key={i} data-catalog-page>{renderPage(p, i)}</div>)}</div>
      </div>

      {/* Save Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Save size={20} className="text-raynold-green" /> Guardar Catálogo</h3>
            <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Nombre del catálogo..." className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white mb-4" autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
            <div className="flex gap-3">
              <button onClick={() => { setSaveModalOpen(false); setSaveName(''); }} className="flex-1 py-2.5 rounded-lg font-bold text-gray-400 hover:text-white">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !saveName.trim()} className="flex-1 py-2.5 bg-raynold-green text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">{saving ? 'Guardando...' : <><Save size={16} /> Guardar</>}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCatalog;
