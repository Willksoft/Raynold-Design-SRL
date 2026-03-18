import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, Eye, Download, Settings2, Palette, Grid3X3, List, LayoutGrid,
  Check, X, ChevronRight, ChevronLeft, Plus, Minus, Image as ImageIcon,
  Hash, Columns, Rows, Square, Printer, Filter, Search, Move,
  ToggleLeft, ToggleRight, Loader2, Sparkles, ArrowUpDown, Save, FolderOpen,
  Trash2, Clock, Upload, Globe, FileText, Phone, Mail, Instagram, Facebook, ClipboardList, Edit2, Copy
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabaseClient';
import { ProductItem } from '../types';
import {
  CatalogConfig, PageLayout, CoverStyle, PageOrientation, DEFAULT_CONFIG, TEMPLATES, GRADIENT_PRESETS,
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
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
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
    const row = { name: saveName.trim(), config, selected_product_ids: [...selectedProducts] };
    if (editingCatalogId) {
      const { error } = await supabase.from('saved_catalogs').update(row).eq('id', editingCatalogId);
      if (!error) {
        setSavedCatalogs(savedCatalogs.map(c => c.id === editingCatalogId ? { ...c, ...row } as SavedCatalog : c));
      }
    } else {
      const { data, error } = await supabase.from('saved_catalogs').insert([row]).select();
      if (!error && data) {
        const newCat = data[0] as SavedCatalog;
        setSavedCatalogs([newCat, ...savedCatalogs]);
        setEditingCatalogId(newCat.id);
      }
    }
    setSaving(false); setSaveModalOpen(false); setSaveName('');
  };

  const handleSaveAsNew = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    const row = { name: saveName.trim(), config, selected_product_ids: [...selectedProducts] };
    const { data, error } = await supabase.from('saved_catalogs').insert([row]).select();
    if (!error && data) {
      const newCat = data[0] as SavedCatalog;
      setSavedCatalogs([newCat, ...savedCatalogs]);
      setEditingCatalogId(newCat.id);
    }
    setSaving(false); setSaveModalOpen(false); setSaveName('');
  };

  const loadCatalog = (cat: SavedCatalog) => {
    setConfig({ ...DEFAULT_CONFIG, ...cat.config });
    setSelectedProducts(new Set(cat.selected_product_ids));
    setEditingCatalogId(cat.id);
    setSaveName(cat.name);
    setActiveTab('design');
  };

  const createNewCatalog = () => {
    setTemplatePickerOpen(true);
  };

  const selectTemplateAndCreate = (tpl: typeof TEMPLATES[0]) => {
    const newConfig = { ...DEFAULT_CONFIG, ...tpl.defaults, templateId: tpl.id };
    setConfig(newConfig);
    setSelectedProducts(new Set(products.map(p => p.id)));
    setEditingCatalogId(null);
    setSaveName('');
    setTemplatePickerOpen(false);
    setActiveTab('select');
  };

  const toggleDraft = async () => {
    const newDraft = !config.isDraft;
    setConfig({ ...config, isDraft: newDraft });
    if (editingCatalogId) {
      await supabase.from('saved_catalogs').update({ config: { ...config, isDraft: newDraft } }).eq('id', editingCatalogId);
      setSavedCatalogs(savedCatalogs.map(c => c.id === editingCatalogId ? { ...c, config: { ...c.config, isDraft: newDraft } } as SavedCatalog : c));
    }
  };

  const deleteCatalog = async (id: string) => {
    if (!window.confirm('¿Eliminar este catálogo guardado?')) return;
    await supabase.from('saved_catalogs').delete().eq('id', id);
    setSavedCatalogs(savedCatalogs.filter(c => c.id !== id));
    if (editingCatalogId === id) { setEditingCatalogId(null); setSaveName(''); }
  };

  const duplicateCatalog = async (cat: SavedCatalog) => {
    const row = {
      name: `${cat.name} (Copia)`,
      config: cat.config,
      selected_product_ids: cat.selected_product_ids,
    };
    const { data, error } = await supabase.from('saved_catalogs').insert([row]).select();
    if (!error && data) {
      const newCat = data[0] as SavedCatalog;
      setSavedCatalogs([newCat, ...savedCatalogs]);
    }
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
      const isLand = config.orientation === 'landscape';
      const pdf = new jsPDF({ orientation: isLand ? 'l' : 'p', unit: 'in', format: 'letter' });

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
  const isLandscape = config.orientation === 'landscape';
  const PAGE: React.CSSProperties = { width: isLandscape ? '11in' : '8.5in', height: isLandscape ? '8.5in' : '11in', backgroundColor: config.pageColor, fontFamily: `'${config.fontFamily}',sans-serif`, position: 'relative', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', pageBreakAfter: 'always' };

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

  const coverDate = new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long' });
  const coverPos = `${config.coverImageX ?? 50}% ${config.coverImageY ?? 50}%`;
  const coverScale = (config.coverImageScale ?? 100) / 100;
  const coverImgStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', objectPosition: coverPos, transform: `scale(${coverScale})`, transformOrigin: coverPos };
  const renderCover = (idx: number) => {
    const cs = config.coverStyle || 'centered';
    const bgImg = config.coverImage ? { position: 'absolute' as const, inset: 0, backgroundImage: `url(${config.coverImage})`, backgroundSize: `${config.coverImageScale ?? 100}%`, backgroundPosition: coverPos, opacity: 0.2 } : undefined;

    if (cs === 'centered') return (
      <div key={idx} style={{ ...PAGE, background: config.coverGradient, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1.5in 1in' }}>
        {bgImg && <div style={bgImg} />}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {config.logoUrl && <img src={config.logoUrl} alt="" style={{ height: '60px', marginBottom: '40px', objectFit: 'contain' }} />}
          <div style={{ width: '60px', height: '3px', backgroundColor: config.accentColor, margin: '0 auto 30px' }} />
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', letterSpacing: '3px', lineHeight: 1.1, margin: '0 0 12px' }}>{config.title}</h1>
          <p style={{ fontSize: '14px', fontWeight: 300, color: config.accentColor, letterSpacing: '5px', textTransform: 'uppercase' }}>{config.subtitle}</p>
        </div>
      </div>
    );

    if (cs === 'left-block') return (
      <div key={idx} style={{ ...PAGE, background: config.secondaryColor, display: 'flex', position: 'relative' }}>
        {bgImg && <div style={bgImg} />}
        <div style={{ width: '55%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1in 0.8in', position: 'relative', zIndex: 1 }}>
          <div>{config.logoUrl && <img src={config.logoUrl} alt="" style={{ height: '40px', objectFit: 'contain', marginBottom: '20px' }} />}</div>
          <div>
            <p style={{ fontSize: '11px', color: config.accentColor, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '8px' }}>{config.subtitle}</p>
            <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#fff', lineHeight: 1, margin: '0 0 20px' }}>CATALOG</h1>
            <div style={{ width: '50px', height: '4px', backgroundColor: config.accentColor }} />
            <p style={{ fontSize: '9px', color: '#fff8', marginTop: '30px' }}>{coverDate}</p>
          </div>
          <div />
        </div>
        <div style={{ width: '45%', backgroundColor: config.accentColor, position: 'relative' }}>
          {config.coverImage && <img src={config.coverImage} alt="" style={{ ...coverImgStyle, mixBlendMode: 'multiply', opacity: 0.6 }} />}
        </div>
      </div>
    );

    if (cs === 'split-diagonal') return (
      <div key={idx} style={{ ...PAGE, background: '#fff', position: 'relative', overflow: 'hidden' }}>
        {/* Diagonal block */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '55%', height: '100%', backgroundColor: config.accentColor, clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', backgroundColor: config.secondaryColor, clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 5% 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '1in', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>{config.logoUrl && <img src={config.logoUrl} alt="" style={{ height: '35px', objectFit: 'contain' }} />}
            <p style={{ fontSize: '9px', color: '#888', marginTop: '8px' }}>{coverDate}</p>
          </div>
          <div style={{ maxWidth: '45%' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: config.textColor, lineHeight: 1.1, margin: '0 0 15px' }}>Product<br /><span style={{ color: config.accentColor }}>Catalog</span></h1>
            <div style={{ width: '40px', height: '3px', backgroundColor: config.accentColor, marginBottom: '15px' }} />
            <p style={{ fontSize: '10px', color: '#666', lineHeight: 1.5 }}>{config.subtitle}</p>
          </div>
          <div />
        </div>
      </div>
    );

    if (cs === 'photo-circle') return (
      <div key={idx} style={{ ...PAGE, background: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '45%', backgroundColor: config.secondaryColor }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.8in 1in', height: '100%' }}>
          <div style={{ alignSelf: 'flex-start', marginBottom: '10px' }}>
            <p style={{ fontSize: '10px', fontWeight: 900, color: config.accentColor, letterSpacing: '2px', textTransform: 'uppercase' }}>PRODUCT</p>
            <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#fff', lineHeight: 1, margin: 0 }}>CATALOG</h1>
          </div>
          <div style={{ width: '280px', height: '280px', borderRadius: '50%', backgroundColor: '#e0e0e0', marginTop: 'auto', marginBottom: 'auto', overflow: 'hidden', border: '6px solid #fff', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            {config.coverImage ? <img src={config.coverImage} alt="" style={coverImgStyle} /> : <div style={{ width: '100%', height: '100%', backgroundColor: '#d0d0d0' }} />}
          </div>
          <div style={{ textAlign: 'center', marginTop: 'auto' }}>
            {config.logoUrl && <img src={config.logoUrl} alt="" style={{ height: '30px', objectFit: 'contain', marginBottom: '10px' }} />}
            <p style={{ fontSize: '10px', color: '#666', fontWeight: 700 }}>{config.subtitle}</p>
            <p style={{ fontSize: '9px', color: '#999' }}>{coverDate}</p>
          </div>
        </div>
      </div>
    );

    if (cs === 'bold-bottom') return (
      <div key={idx} style={{ ...PAGE, background: '#fff', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative', padding: '0.8in 1in' }}>
          {config.logoUrl && <img src={config.logoUrl} alt="" style={{ height: '30px', objectFit: 'contain' }} />}
          <div style={{ width: '60%', height: '1px', backgroundColor: config.accentColor, margin: '15px 0' }} />
          {config.coverImage && <div style={{ position: 'absolute', top: '1.2in', right: '0.8in', width: '55%', height: '60%', borderRadius: '8px', overflow: 'hidden', border: `3px solid ${config.accentColor}20` }}>
            <img src={config.coverImage} alt="" style={coverImgStyle} />
          </div>}
        </div>
        <div style={{ backgroundColor: config.accentColor, padding: '0.8in 1in 0.6in', position: 'relative' }}>
          <h1 style={{ fontSize: '38px', fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: '0 0 8px' }}>{config.title.replace('CATÁLOGO DE ', '').replace('PRODUCTOS', '')}</h1>
          <h2 style={{ fontSize: '34px', fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0 }}>CATALOG</h2>
          <p style={{ fontSize: '10px', color: '#fff9', marginTop: '15px' }}>{config.subtitle}</p>
          <p style={{ fontSize: '9px', color: '#fff6', position: 'absolute', bottom: '20px', right: '1in' }}>{coverDate}</p>
        </div>
      </div>
    );

    if (cs === 'minimal-frame') return (
      <div key={idx} style={{ ...PAGE, background: config.coverGradient, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1in' }}>
        {bgImg && <div style={bgImg} />}
        <div style={{ position: 'relative', zIndex: 1, border: `2px solid ${config.accentColor}50`, padding: '60px 50px', textAlign: 'center', width: '80%' }}>
          {config.logoUrl && <img src={config.logoUrl} alt="" style={{ height: '50px', objectFit: 'contain', marginBottom: '30px' }} />}
          <div style={{ width: '40px', height: '2px', backgroundColor: config.accentColor, margin: '0 auto 25px' }} />
          <h1 style={{ fontSize: '28px', fontWeight: 300, color: '#fff', letterSpacing: '6px', textTransform: 'uppercase', margin: '0 0 8px' }}>Product</h1>
          <h2 style={{ fontSize: '40px', fontWeight: 900, color: config.accentColor, letterSpacing: '4px', margin: '0 0 25px' }}>CATALOG</h2>
          <div style={{ width: '40px', height: '2px', backgroundColor: config.accentColor, margin: '0 auto 15px' }} />
          <p style={{ fontSize: '10px', color: '#fff8', letterSpacing: '3px' }}>{config.subtitle}</p>
          <p style={{ fontSize: '9px', color: '#fff5', marginTop: '25px' }}>{coverDate}</p>
        </div>
      </div>
    );

    if (cs === 'landscape-corporate') return (
      <div key={idx} style={{ ...PAGE, background: '#f5f5f5', display: 'flex', position: 'relative' }}>
        <div style={{ width: '55%', padding: '0.8in', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>{config.logoUrl && <img src={config.logoUrl} alt="" style={{ height: '35px', objectFit: 'contain' }} />}</div>
          <div>
            <p style={{ fontSize: '10px', color: '#999', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>{config.subtitle}</p>
            <h1 style={{ fontSize: '42px', fontWeight: 900, color: config.textColor, lineHeight: 1.1, margin: 0 }}>PRODUCT<br /><span style={{ color: config.accentColor }}>CATALOG</span></h1>
            <div style={{ width: '50px', height: '3px', backgroundColor: config.accentColor, margin: '15px 0' }} />
            <p style={{ fontSize: '9px', color: '#999' }}>{coverDate}</p>
          </div>
          <div />
        </div>
        <div style={{ width: '45%', backgroundColor: config.accentColor, position: 'relative' }}>
          {config.coverImage ? <img src={config.coverImage} alt="" style={{ ...coverImgStyle, opacity: 0.7 }} /> : null}
        </div>
      </div>
    );

    // landscape-wave
    return (
      <div key={idx} style={{ ...PAGE, background: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', backgroundColor: config.secondaryColor, clipPath: 'ellipse(70% 80% at 70% 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', height: '100%' }}>
          <div style={{ width: '50%', padding: '0.8in', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {config.logoUrl && <img src={config.logoUrl} alt="" style={{ height: '35px', objectFit: 'contain', alignSelf: 'flex-start', marginBottom: '25px' }} />}
            <p style={{ fontSize: '10px', color: config.accentColor, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>{config.subtitle}</p>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: config.textColor, lineHeight: 1.1, margin: '0 0 15px' }}>Business<br />Brochure</h1>
            <div style={{ width: '40px', height: '3px', backgroundColor: config.accentColor, marginBottom: '15px' }} />
            <p style={{ fontSize: '9px', color: '#888', lineHeight: 1.5, maxWidth: '80%' }}>{config.title}</p>
          </div>
          <div style={{ width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {config.coverImage && <div style={{ width: '70%', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden' }}><img src={config.coverImage} alt="" style={coverImgStyle} /></div>}
          </div>
        </div>
      </div>
    );
  };

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

  const renderBack = (idx: number) => {
    const iconProps = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: config.accentColor, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    const contactItems: { icon: React.ReactNode; text: string }[] = [];
    if (config.contactPhone) contactItems.push({
      icon: <svg {...iconProps}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
      text: config.contactPhone,
    });
    if (config.contactEmail) contactItems.push({
      icon: <svg {...iconProps}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
      text: config.contactEmail,
    });
    if (config.contactWebsite) contactItems.push({
      icon: <svg {...iconProps}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
      text: config.contactWebsite,
    });
    if (config.contactInstagram) contactItems.push({
      icon: <svg {...iconProps}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
      text: config.contactInstagram,
    });
    if (config.contactFacebook) contactItems.push({
      icon: <svg {...iconProps}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
      text: config.contactFacebook,
    });
    if (config.contactWhatsapp) contactItems.push({
      icon: <svg width={16} height={16} viewBox="0 0 24 24" fill={config.accentColor}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
      text: config.contactWhatsapp,
    });
    return (
      <div key={idx} style={{ ...PAGE, background: config.coverGradient, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1.5in 1.2in', position: 'relative' }}>
        {config.logoUrl && <img src={config.logoUrl} alt="" style={{ height: '55px', marginBottom: '35px', objectFit: 'contain' }} />}
        <div style={{ width: '50px', height: '3px', backgroundColor: config.accentColor, margin: '0 auto 30px', borderRadius: '2px' }} />
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '35px', letterSpacing: '2px' }}>{config.subtitle}</h2>
        {/* Contact Items with Icons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
          {contactItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: `2px solid ${config.accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </div>
              <span style={{ fontSize: '12px', color: '#ccc', fontWeight: 500, letterSpacing: '0.3px' }}>{item.text}</span>
            </div>
          ))}
        </div>
        <div style={{ width: '50px', height: '3px', backgroundColor: config.accentColor, margin: '40px auto 0', borderRadius: '2px' }} />
        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '20px' }}>© {new Date().getFullYear()} {config.subtitle}. Todos los derechos reservados.</p>
      </div>
    );
  };

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
              <p className="text-[10px] text-gray-500">
                {editingCatalogId ? <><span className="text-raynold-green">Editando:</span> {savedCatalogs.find(c => c.id === editingCatalogId)?.name || saveName}</> : 'Nuevo catálogo'}
                {config.isDraft && <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-bold rounded">BORRADOR</span>}
                {' · '}{selectedProducts.size} productos · {pages.length} páginas
                {config.orientation === 'landscape' && <span className="ml-1 text-blue-400"> · Horizontal</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-black border border-white/10 rounded-lg p-0.5">
              {([
                { key: 'templates' as const, label: 'Catálogos', icon: <FolderOpen size={13} /> },
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
            <button onClick={toggleDraft} className={`px-3 py-1.5 font-bold rounded-lg text-[11px] flex items-center gap-1.5 transition-all ${config.isDraft ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'}`}>{config.isDraft ? <ToggleRight size={14} /> : <ToggleLeft size={14} />} Borrador</button>
            <button onClick={() => { setSaveModalOpen(true); if (editingCatalogId) { const c = savedCatalogs.find(s => s.id === editingCatalogId); if (c) setSaveName(c.name); } }} className="px-3 py-1.5 bg-green-500/20 text-green-400 font-bold rounded-lg text-[11px] flex items-center gap-1.5 hover:bg-green-500/30"><Save size={14} /> {editingCatalogId ? 'Guardar' : 'Guardar Nuevo'}</button>
            {editingCatalogId && <button onClick={() => { setEditingCatalogId(null); setSaveName(''); setSaveModalOpen(true); }} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 font-bold rounded-lg text-[11px] flex items-center gap-1.5 hover:bg-purple-500/30"><Copy size={14} /> Guardar como Nuevo</button>}
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
              {/* Saved Catalogs List - Primary */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2"><FolderOpen size={18} className="text-raynold-red" /> Mis Catálogos ({savedCatalogs.length})</h2>
                  <p className="text-xs text-gray-500">Selecciona un catálogo para editarlo o crea uno nuevo</p>
                </div>
                <button onClick={createNewCatalog} className="px-4 py-2 bg-raynold-red hover:bg-red-700 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-colors">
                  <Plus size={16} /> Nuevo Catálogo
                </button>
              </div>

              {savedCatalogs.length > 0 ? (
                <div className="space-y-2 mb-10">
                  {savedCatalogs.map(sc => (
                    <div key={sc.id} className={`flex items-center gap-4 bg-[#0A0A0A] border rounded-xl p-4 transition-all cursor-pointer hover:border-raynold-red/40 group ${
                      editingCatalogId === sc.id ? 'border-raynold-red shadow-[0_0_15px_rgba(230,0,0,0.15)]' : 'border-white/10'
                    }`} onClick={() => loadCatalog(sc)}>
                      {/* Mini cover preview */}
                      <div className="w-14 h-18 rounded-lg overflow-hidden border border-white/10 shrink-0" style={{ background: (sc.config as CatalogConfig).coverGradient }}>
                        <div className="w-full h-full flex items-center justify-center">
                          {(sc.config as CatalogConfig).logoUrl ? 
                            <img src={(sc.config as CatalogConfig).logoUrl} alt="" className="w-8 h-8 object-contain" /> :
                            <BookOpen size={16} className="text-white/40" />
                          }
                        </div>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{sc.name}</h3>
                          {editingCatalogId === sc.id && <span className="px-1.5 py-0.5 bg-raynold-green/20 text-raynold-green text-[8px] font-bold rounded">EDITANDO</span>}
                          {(sc.config as CatalogConfig).isDraft && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-bold rounded">BORRADOR</span>}
                          {(sc.config as CatalogConfig).orientation === 'landscape' && <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[8px] font-bold rounded">HORIZONTAL</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={9} /> {new Date(sc.created_at).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="text-[10px] text-gray-500">{(sc.selected_product_ids || []).length} productos</span>
                          <span className="text-[10px] text-gray-500 capitalize">{(sc.config as CatalogConfig).templateId?.replace(/-/g, ' ')}</span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button onClick={() => loadCatalog(sc)} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold hover:bg-blue-500/30 flex items-center gap-1"><Edit2 size={11} /> Editar</button>
                        <button onClick={() => duplicateCatalog(sc)} className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30" title="Duplicar"><Copy size={13} /></button>
                        <button onClick={() => deleteCatalog(sc.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30" title="Eliminar"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-[#0A0A0A] border border-white/10 rounded-xl mb-10">
                  <BookOpen size={40} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No hay catálogos guardados aún.</p>
                  <p className="text-gray-600 text-xs mt-1">Crea tu primer catálogo con el botón de arriba.</p>
                </div>
              )}

              {/* Templates */}
              <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><Sparkles size={18} className="text-raynold-red" /> Plantillas de Diseño</h2>
              <p className="text-xs text-gray-500 mb-4">Aplica un estilo base al catálogo actual</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {TEMPLATES.map(tpl => {
                  const isLand = tpl.orientation === 'landscape';
                  const accent = tpl.defaults.accentColor || '#E60000';
                  const secondary = tpl.defaults.secondaryColor || '#333';
                  const cs = tpl.defaults.coverStyle || 'centered';
                  return (
                    <button key={tpl.id} onClick={() => applyTemplate(tpl)}
                      className={`text-left rounded-xl border-2 overflow-hidden transition-all group hover:border-raynold-red/50 ${config.templateId === tpl.id ? 'border-raynold-red shadow-[0_0_15px_rgba(230,0,0,0.2)]' : 'border-white/10'}`}>
                      <div className={`relative overflow-hidden ${isLand ? 'h-24' : 'h-36'}`} style={{ background: tpl.defaults.coverGradient }}>
                        {/* Distinct layouts per style */}
                        {cs === 'centered' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                            <div style={{ width: '25px', height: '2px', backgroundColor: accent, marginBottom: '6px' }} />
                            <p style={{ fontSize: '10px', fontWeight: 900, color: '#fff', letterSpacing: '1px' }}>CATALOG</p>
                            <p style={{ fontSize: '7px', color: accent, letterSpacing: '2px', marginTop: '3px' }}>COMPANY</p>
                          </div>
                        )}
                        {cs === 'left-block' && (
                          <div className="absolute inset-0 flex">
                            <div style={{ width: '55%', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                              <p style={{ fontSize: '6px', color: accent, textTransform: 'uppercase', letterSpacing: '1px' }}>COMPANY</p>
                              <p style={{ fontSize: '12px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>CATALOG</p>
                              <div style={{ width: '20px', height: '2px', backgroundColor: accent, marginTop: '4px' }} />
                            </div>
                            <div style={{ width: '45%', backgroundColor: accent }} />
                          </div>
                        )}
                        {cs === 'split-diagonal' && (
                          <div className="absolute inset-0">
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '55%', height: '100%', backgroundColor: accent, clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }} />
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', backgroundColor: secondary, clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 5% 100%)' }} />
                            <div style={{ position: 'relative', padding: '12px', zIndex: 1 }}>
                              <p style={{ fontSize: '10px', fontWeight: 900, color: '#333', lineHeight: 1.1 }}>Product<br /><span style={{ color: accent }}>Catalog</span></p>
                            </div>
                          </div>
                        )}
                        {cs === 'photo-circle' && (
                          <div className="absolute inset-0">
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '45%', backgroundColor: secondary }} />
                            <div style={{ position: 'relative', padding: '10px', zIndex: 1 }}>
                              <p style={{ fontSize: '6px', fontWeight: 900, color: accent, letterSpacing: '1px' }}>PRODUCT</p>
                              <p style={{ fontSize: '10px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>CATALOG</p>
                            </div>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#d0d0d0', border: '2px solid #fff' }} />
                          </div>
                        )}
                        {cs === 'bold-bottom' && (
                          <div className="absolute inset-0 flex flex-col" style={{ background: '#fff' }}>
                            <div style={{ flex: 1, padding: '10px' }}>
                              <div style={{ width: '40%', height: '2px', backgroundColor: accent }} />
                            </div>
                            <div style={{ backgroundColor: accent, padding: '10px' }}>
                              <p style={{ fontSize: '10px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>PRODUCT</p>
                              <p style={{ fontSize: '8px', fontWeight: 900, color: '#fff', lineHeight: 1, marginTop: '2px' }}>CATALOG</p>
                            </div>
                          </div>
                        )}
                        {cs === 'minimal-frame' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div style={{ border: `1px solid ${accent}50`, padding: '12px 16px', textAlign: 'center' }}>
                              <p style={{ fontSize: '8px', fontWeight: 300, color: '#fff', letterSpacing: '3px' }}>Product</p>
                              <p style={{ fontSize: '12px', fontWeight: 900, color: accent, letterSpacing: '2px' }}>CATALOG</p>
                            </div>
                          </div>
                        )}
                        {cs === 'landscape-corporate' && (
                          <div className="absolute inset-0 flex" style={{ background: '#f5f5f5' }}>
                            <div style={{ width: '55%', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                              <p style={{ fontSize: '10px', fontWeight: 900, color: '#333', lineHeight: 1 }}>PRODUCT<br /><span style={{ color: accent }}>CATALOG</span></p>
                              <div style={{ width: '20px', height: '2px', backgroundColor: accent, marginTop: '4px' }} />
                            </div>
                            <div style={{ width: '45%', backgroundColor: accent }} />
                          </div>
                        )}
                        {cs === 'landscape-wave' && (
                          <div className="absolute inset-0" style={{ background: '#fff' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', backgroundColor: secondary, clipPath: 'ellipse(70% 80% at 70% 50%)' }} />
                            <div style={{ position: 'relative', padding: '10px', zIndex: 1 }}>
                              <p style={{ fontSize: '6px', color: accent, letterSpacing: '1px' }}>COMPANY</p>
                              <p style={{ fontSize: '10px', fontWeight: 900, color: '#333', lineHeight: 1 }}>Business<br />Brochure</p>
                              <div style={{ width: '16px', height: '2px', backgroundColor: accent, marginTop: '3px' }} />
                            </div>
                          </div>
                        )}
                        {config.templateId === tpl.id && <div className="absolute top-2 right-2 w-6 h-6 bg-raynold-red rounded-full flex items-center justify-center"><Check size={12} className="text-white" /></div>}
                        {isLand && <div className="absolute bottom-1 left-2 px-1 py-0.5 bg-blue-500/80 text-white text-[7px] font-bold rounded">HORIZONTAL</div>}
                      </div>
                      <div className="p-3 bg-[#0A0A0A]">
                        <p className="text-sm font-bold text-white">{tpl.name}</p>
                        <p className="text-[10px] text-gray-500">{tpl.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
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
                    {config.coverImage && <button onClick={() => setConfig({ ...config, coverImage: '', coverImageX: 50, coverImageY: 50, coverImageScale: 100 })} className="px-2.5 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-[10px]">Quitar</button>}
                  </div>
                  {/* Cover Image Crop/Position Panel */}
                  {config.coverImage && (
                    <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-300 flex items-center gap-1.5"><Move size={12} className="text-raynold-red" /> Ajustar Imagen</p>
                        <button onClick={() => setConfig({ ...config, coverImageX: 50, coverImageY: 50, coverImageScale: 100 })} className="text-[9px] text-gray-500 hover:text-white px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10">Resetear</button>
                      </div>
                      {/* Preview */}
                      <div className="relative w-full h-28 rounded-lg overflow-hidden border border-white/10 bg-black">
                        <img src={config.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${config.coverImageX ?? 50}% ${config.coverImageY ?? 50}%`, transform: `scale(${(config.coverImageScale ?? 100) / 100})`, transformOrigin: `${config.coverImageX ?? 50}% ${config.coverImageY ?? 50}%` }} />
                        <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-lg pointer-events-none" />
                        <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/70 text-[7px] text-gray-400 rounded">Vista previa del recorte</div>
                      </div>
                      {/* Controls */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-400 w-14 shrink-0">Pos X</span>
                          <input type="range" min="0" max="100" value={config.coverImageX ?? 50} onChange={e => setConfig({ ...config, coverImageX: Number(e.target.value) })} className="flex-1 h-1 accent-raynold-red cursor-pointer" />
                          <span className="text-[9px] text-gray-500 w-8 text-right">{config.coverImageX ?? 50}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-400 w-14 shrink-0">Pos Y</span>
                          <input type="range" min="0" max="100" value={config.coverImageY ?? 50} onChange={e => setConfig({ ...config, coverImageY: Number(e.target.value) })} className="flex-1 h-1 accent-raynold-red cursor-pointer" />
                          <span className="text-[9px] text-gray-500 w-8 text-right">{config.coverImageY ?? 50}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-400 w-14 shrink-0">Zoom</span>
                          <input type="range" min="100" max="300" step="5" value={config.coverImageScale ?? 100} onChange={e => setConfig({ ...config, coverImageScale: Number(e.target.value) })} className="flex-1 h-1 accent-raynold-red cursor-pointer" />
                          <span className="text-[9px] text-gray-500 w-8 text-right">{config.coverImageScale ?? 100}%</span>
                        </div>
                      </div>
                      <p className="text-[8px] text-gray-600">
                        {config.coverStyle === 'photo-circle' ? 'La imagen aparecerá dentro del círculo central' :
                         config.coverStyle === 'bold-bottom' ? 'La imagen aparecerá como recuadro en la parte superior' :
                         config.coverStyle === 'left-block' || config.coverStyle === 'landscape-corporate' ? 'La imagen aparecerá en el panel lateral derecho' :
                         config.coverStyle === 'landscape-wave' ? 'La imagen aparecerá en el recuadro redondeado derecho' :
                         'La imagen aparecerá como fondo de portada'}
                      </p>
                    </div>
                  )}
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
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Palette size={14} className="text-raynold-red" /> Colores y Fuente</h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[{ k: 'pageColor' as const, l: 'Fondo' }, { k: 'textColor' as const, l: 'Texto' }, { k: 'accentColor' as const, l: 'Acento' }].map(c => (
                    <div key={c.k}>
                      <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">{c.l}</label>
                      <div className="relative">
                        <input type="color" value={config[c.k]} onChange={e => setConfig({ ...config, [c.k]: e.target.value })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="flex items-center gap-2 bg-black border border-white/15 rounded-lg px-2.5 py-2 cursor-pointer hover:border-white/30 transition-all">
                          <div className="w-5 h-5 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: config[c.k] }} />
                          <span className="font-mono text-[10px] text-white/80 uppercase">{config[c.k]}</span>
                        </div>
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
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><ClipboardList size={12} className="text-gray-500" /> Contraportada - Contacto</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-gray-500 shrink-0" />
                      <input type="text" value={config.contactPhone || ''} onChange={e => setConfig({ ...config, contactPhone: e.target.value })} className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white text-[11px]" placeholder="Teléfono" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-gray-500 shrink-0" />
                      <input type="text" value={config.contactEmail || ''} onChange={e => setConfig({ ...config, contactEmail: e.target.value })} className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white text-[11px]" placeholder="Email" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe size={13} className="text-gray-500 shrink-0" />
                      <input type="text" value={config.contactWebsite || ''} onChange={e => setConfig({ ...config, contactWebsite: e.target.value })} className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white text-[11px]" placeholder="Sitio web" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Instagram size={13} className="text-gray-500 shrink-0" />
                      <input type="text" value={config.contactInstagram || ''} onChange={e => setConfig({ ...config, contactInstagram: e.target.value })} className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white text-[11px]" placeholder="@usuario Instagram" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Facebook size={13} className="text-gray-500 shrink-0" />
                      <input type="text" value={config.contactFacebook || ''} onChange={e => setConfig({ ...config, contactFacebook: e.target.value })} className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white text-[11px]" placeholder="Facebook" />
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" className="text-gray-500 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      <input type="text" value={config.contactWhatsapp || ''} onChange={e => setConfig({ ...config, contactWhatsapp: e.target.value })} className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white text-[11px]" placeholder="WhatsApp" />
                    </div>
                  </div>
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
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Save size={20} className="text-raynold-green" /> {editingCatalogId ? 'Guardar Catálogo' : 'Guardar Nuevo Catálogo'}</h3>
            <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Nombre del catálogo..." className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white mb-4" autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
            <div className="flex gap-3">
              <button onClick={() => { setSaveModalOpen(false); setSaveName(''); }} className="flex-1 py-2.5 rounded-lg font-bold text-gray-400 hover:text-white">Cancelar</button>
              {editingCatalogId && (
                <button onClick={handleSaveAsNew} disabled={saving || !saveName.trim()} className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm"><Copy size={14} /> Como Nuevo</button>
              )}
              <button onClick={handleSave} disabled={saving || !saveName.trim()} className="flex-1 py-2.5 bg-raynold-green text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">{saving ? 'Guardando...' : <><Save size={16} /> {editingCatalogId ? 'Actualizar' : 'Guardar'}</>}</button>
            </div>
          </div>
        </div>
      )}

      {/* Template Picker Modal */}
      {templatePickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles size={20} className="text-raynold-red" /> Nuevo Catálogo - Elige un Diseño</h3>
                <p className="text-xs text-gray-500 mt-1">Selecciona la plantilla base para tu nuevo catálogo</p>
              </div>
              <button onClick={() => setTemplatePickerOpen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-modern">
              {/* Portrait */}
              <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><Square size={14} /> Vertical (Carta 8.5×11)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {TEMPLATES.filter(t => t.orientation === 'portrait').map(tpl => {
                  const accent = tpl.defaults.accentColor || '#E60000';
                  const secondary = tpl.defaults.secondaryColor || '#333';
                  const cs = tpl.defaults.coverStyle || 'centered';
                  return (
                    <button key={tpl.id} onClick={() => selectTemplateAndCreate(tpl)}
                      className="text-left rounded-xl border-2 border-white/10 overflow-hidden transition-all hover:border-raynold-red/50 hover:shadow-[0_0_20px_rgba(230,0,0,0.15)] group">
                      <div className="h-44 relative overflow-hidden" style={{ background: tpl.defaults.coverGradient }}>
                        {cs === 'centered' && <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4"><div style={{width:30,height:2,backgroundColor:accent,marginBottom:8}}/><p style={{fontSize:12,fontWeight:900,color:'#fff',letterSpacing:1}}>CATALOG</p><p style={{fontSize:8,color:accent,letterSpacing:2,marginTop:4}}>COMPANY</p></div>}
                        {cs === 'left-block' && <div className="absolute inset-0 flex"><div style={{width:'55%',padding:16,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}><p style={{fontSize:7,color:accent,textTransform:'uppercase',letterSpacing:1}}>COMPANY</p><p style={{fontSize:16,fontWeight:900,color:'#fff',lineHeight:1}}>CATALOG</p><div style={{width:25,height:2,backgroundColor:accent,marginTop:5}}/></div><div style={{width:'45%',backgroundColor:accent}}/></div>}
                        {cs === 'split-diagonal' && <div className="absolute inset-0"><div style={{position:'absolute',top:0,right:0,width:'55%',height:'100%',backgroundColor:accent,clipPath:'polygon(15% 0,100% 0,100% 100%,0 100%)'}}/><div style={{position:'absolute',top:0,right:0,width:'50%',height:'100%',backgroundColor:secondary,clipPath:'polygon(20% 0,100% 0,100% 100%,5% 100%)'}}/><div style={{position:'relative',padding:16,zIndex:1}}><p style={{fontSize:14,fontWeight:900,color:'#333',lineHeight:1.1}}>Product<br/><span style={{color:accent}}>Catalog</span></p></div></div>}
                        {cs === 'photo-circle' && <div className="absolute inset-0"><div style={{position:'absolute',top:0,left:0,width:'100%',height:'45%',backgroundColor:secondary}}/><div style={{position:'relative',padding:12,zIndex:1}}><p style={{fontSize:7,fontWeight:900,color:accent,letterSpacing:1}}>PRODUCT</p><p style={{fontSize:14,fontWeight:900,color:'#fff',lineHeight:1}}>CATALOG</p></div><div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:65,height:65,borderRadius:'50%',backgroundColor:'#d0d0d0',border:'3px solid #fff'}}/></div>}
                        {cs === 'bold-bottom' && <div className="absolute inset-0 flex flex-col" style={{background:'#fff'}}><div style={{flex:1,padding:12}}><div style={{width:'40%',height:2,backgroundColor:accent}}/></div><div style={{backgroundColor:accent,padding:14}}><p style={{fontSize:14,fontWeight:900,color:'#fff',lineHeight:1}}>PRODUCT</p><p style={{fontSize:12,fontWeight:900,color:'#fff',lineHeight:1,marginTop:3}}>CATALOG</p></div></div>}
                        {cs === 'minimal-frame' && <div className="absolute inset-0 flex items-center justify-center"><div style={{border:`1px solid ${accent}50`,padding:'16px 20px',textAlign:'center'}}><p style={{fontSize:10,fontWeight:300,color:'#fff',letterSpacing:4}}>Product</p><p style={{fontSize:16,fontWeight:900,color:accent,letterSpacing:2}}>CATALOG</p></div></div>}
                      </div>
                      <div className="p-3 bg-[#0A0A0A] group-hover:bg-[#111]">
                        <p className="text-sm font-bold text-white">{tpl.name}</p>
                        <p className="text-[10px] text-gray-500 line-clamp-2">{tpl.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* Landscape */}
              <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><Rows size={14} /> Horizontal (Carta 11×8.5)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEMPLATES.filter(t => t.orientation === 'landscape').map(tpl => {
                  const accent = tpl.defaults.accentColor || '#E60000';
                  const secondary = tpl.defaults.secondaryColor || '#333';
                  const cs = tpl.defaults.coverStyle || 'centered';
                  return (
                    <button key={tpl.id} onClick={() => selectTemplateAndCreate(tpl)}
                      className="text-left rounded-xl border-2 border-white/10 overflow-hidden transition-all hover:border-raynold-red/50 hover:shadow-[0_0_20px_rgba(230,0,0,0.15)] group">
                      <div className="h-32 relative overflow-hidden" style={{ background: tpl.defaults.coverGradient }}>
                        {cs === 'landscape-corporate' && <div className="absolute inset-0 flex" style={{background:'#f5f5f5'}}><div style={{width:'55%',padding:14,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}><p style={{fontSize:14,fontWeight:900,color:'#333',lineHeight:1}}>PRODUCT<br/><span style={{color:accent}}>CATALOG</span></p><div style={{width:25,height:2,backgroundColor:accent,marginTop:5}}/></div><div style={{width:'45%',backgroundColor:accent}}/></div>}
                        {cs === 'landscape-wave' && <div className="absolute inset-0" style={{background:'#fff'}}><div style={{position:'absolute',top:0,right:0,width:'50%',height:'100%',backgroundColor:secondary,clipPath:'ellipse(70% 80% at 70% 50%)'}}/><div style={{position:'relative',padding:14,zIndex:1}}><p style={{fontSize:7,color:accent,letterSpacing:1}}>COMPANY</p><p style={{fontSize:14,fontWeight:900,color:'#333',lineHeight:1}}>Business<br/>Brochure</p><div style={{width:20,height:2,backgroundColor:accent,marginTop:4}}/></div></div>}
                        <div className="absolute bottom-1 left-2 px-1.5 py-0.5 bg-blue-500/80 text-white text-[8px] font-bold rounded">HORIZONTAL</div>
                      </div>
                      <div className="p-3 bg-[#0A0A0A] group-hover:bg-[#111]">
                        <p className="text-sm font-bold text-white">{tpl.name}</p>
                        <p className="text-[10px] text-gray-500">{tpl.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCatalog;
