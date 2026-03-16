import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Eye, Download, Settings2, Palette, Type, Grid3X3, List, LayoutGrid,
  GripVertical, Check, X, ChevronRight, ChevronLeft, Plus, Minus, Image as ImageIcon,
  FileText, Hash, AlignLeft, Columns, Rows, Square, Printer, Filter, Search,
  ToggleLeft, ToggleRight, Loader2, Sparkles, ArrowUpDown
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { ProductItem } from '../types';

/* ────────── Types ────────── */
type PageLayout = 'grid-2x2' | 'grid-3x3' | 'grid-2x3' | 'list' | 'full' | 'magazine';
type SortMode = 'category' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';
type FontFamily = 'Inter' | 'Montserrat' | 'Playfair Display' | 'Roboto' | 'Outfit';

interface CatalogConfig {
  title: string;
  subtitle: string;
  coverImage: string;
  coverStyle: 'dark' | 'light' | 'gradient' | 'photo';
  showBackCover: boolean;
  backCoverText: string;
  showTOC: boolean;
  showPrice: boolean;
  showCategory: boolean;
  showDescription: boolean;
  showReference: boolean;
  showPageNumbers: boolean;
  pageLayout: PageLayout;
  sortMode: SortMode;
  pageColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: FontFamily;
  fontSize: 'sm' | 'md' | 'lg';
}

const DEFAULT_CONFIG: CatalogConfig = {
  title: 'CATÁLOGO DE PRODUCTOS',
  subtitle: 'Raynold Design SRL',
  coverImage: '',
  coverStyle: 'dark',
  showBackCover: true,
  backCoverText: 'Raynold Design SRL\nTeléfono: (829) 580-7411\nEmail: info@raynolddesign.com\nwww.raynolddesignssrl.com',
  showTOC: true,
  showPrice: false,
  showCategory: true,
  showDescription: false,
  showReference: true,
  showPageNumbers: true,
  pageLayout: 'grid-2x3',
  sortMode: 'category',
  pageColor: '#ffffff',
  textColor: '#111111',
  accentColor: '#E60000',
  fontFamily: 'Inter',
  fontSize: 'md',
};

const LAYOUT_OPTIONS: { value: PageLayout; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'grid-2x2', label: '2×2 Grid', icon: <LayoutGrid size={18} />, desc: '4 productos por página' },
  { value: 'grid-2x3', label: '2×3 Grid', icon: <Grid3X3 size={18} />, desc: '6 productos por página' },
  { value: 'grid-3x3', label: '3×3 Grid', icon: <Columns size={18} />, desc: '9 productos por página' },
  { value: 'list', label: 'Lista', icon: <List size={18} />, desc: '5 productos por página' },
  { value: 'full', label: 'Full Page', icon: <Square size={18} />, desc: '1 producto por página' },
  { value: 'magazine', label: 'Magazine', icon: <Rows size={18} />, desc: '3 productos destacados' },
];

const FONTS: FontFamily[] = ['Inter', 'Montserrat', 'Playfair Display', 'Roboto', 'Outfit'];

const COVER_STYLES = [
  { value: 'dark' as const, label: 'Oscuro Elegante', bg: '#0A0A0A', text: '#fff' },
  { value: 'light' as const, label: 'Blanco Limpio', bg: '#ffffff', text: '#111' },
  { value: 'gradient' as const, label: 'Gradiente', bg: 'linear-gradient(135deg, #0A0A0A 0%, #1a0000 50%, #E60000 100%)', text: '#fff' },
  { value: 'photo' as const, label: 'Con Foto', bg: '#0A0A0A', text: '#fff' },
];

const getProductsPerPage = (layout: PageLayout): number => {
  switch (layout) {
    case 'grid-2x2': return 4;
    case 'grid-2x3': return 6;
    case 'grid-3x3': return 9;
    case 'list': return 5;
    case 'full': return 1;
    case 'magazine': return 3;
  }
};

/* ────────── Component ────────── */
const AdminCatalog: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<CatalogConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'select' | 'design' | 'preview'>('select');
  const [previewPage, setPreviewPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [perPageOverrides, setPerPageOverrides] = useState<Record<number, PageLayout>>({});
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch products
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, title, category, image, price, description, reference, show_price')
        .eq('is_active', true)
        .order('category');
      if (data) {
        const prods = data.map(p => ({
          id: p.id, title: p.title, category: p.category || 'Sin categoría',
          image: p.image || '', price: p.price || '', description: p.description || '',
          reference: p.reference || '', show_price: p.show_price ?? false,
        }));
        setProducts(prods);
        const cats = [...new Set(prods.map(p => p.category))];
        setCategories(cats);
        setSelectedProducts(new Set(prods.map(p => p.id)));
        setSelectedCategories(new Set(cats));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  // Get sorted & filtered products
  const catalogProducts = products
    .filter(p => selectedProducts.has(p.id))
    .sort((a, b) => {
      switch (config.sortMode) {
        case 'category': return a.category.localeCompare(b.category);
        case 'name-asc': return a.title.localeCompare(b.title);
        case 'name-desc': return b.title.localeCompare(a.title);
        case 'price-asc': return parseFloat(a.price || '0') - parseFloat(b.price || '0');
        case 'price-desc': return parseFloat(b.price || '0') - parseFloat(a.price || '0');
        default: return 0;
      }
    });

  // Generate pages
  const generatePages = () => {
    const pages: { type: 'cover' | 'toc' | 'products' | 'back'; products?: ProductItem[]; layout: PageLayout; categoryHeader?: string }[] = [];

    // Cover
    pages.push({ type: 'cover', layout: config.pageLayout });

    // TOC
    if (config.showTOC && catalogProducts.length > 0) {
      pages.push({ type: 'toc', layout: config.pageLayout });
    }

    // Product pages
    const ppp = getProductsPerPage(config.pageLayout);
    let currentCategory = '';

    if (config.sortMode === 'category') {
      // Group by category
      const grouped: Record<string, ProductItem[]> = {};
      catalogProducts.forEach(p => {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
      });

      Object.entries(grouped).forEach(([cat, prods]) => {
        for (let i = 0; i < prods.length; i += ppp) {
          const layout = perPageOverrides[pages.length] || config.pageLayout;
          const effectivePpp = getProductsPerPage(layout);
          const chunk = prods.slice(i, i + effectivePpp);
          pages.push({
            type: 'products',
            products: chunk,
            layout,
            categoryHeader: i === 0 ? cat : undefined,
          });
        }
      });
    } else {
      for (let i = 0; i < catalogProducts.length; i += ppp) {
        const layout = perPageOverrides[pages.length] || config.pageLayout;
        const effectivePpp = getProductsPerPage(layout);
        const chunk = catalogProducts.slice(i, i + effectivePpp);
        pages.push({ type: 'products', products: chunk, layout });
      }
    }

    // Back cover
    if (config.showBackCover) {
      pages.push({ type: 'back', layout: config.pageLayout });
    }

    return pages;
  };

  const pages = generatePages();
  const totalPages = pages.length;

  // Toggle all products in category
  const toggleCategory = (cat: string) => {
    const newSelected = new Set(selectedProducts);
    const newCats = new Set(selectedCategories);
    const catProducts = products.filter(p => p.category === cat);

    if (selectedCategories.has(cat)) {
      newCats.delete(cat);
      catProducts.forEach(p => newSelected.delete(p.id));
    } else {
      newCats.add(cat);
      catProducts.forEach(p => newSelected.add(p.id));
    }
    setSelectedCategories(newCats);
    setSelectedProducts(newSelected);
  };

  const toggleProduct = (id: string) => {
    const newSet = new Set(selectedProducts);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedProducts(newSet);
  };

  const selectAll = () => {
    setSelectedProducts(new Set(products.map(p => p.id)));
    setSelectedCategories(new Set(categories));
  };

  const deselectAll = () => {
    setSelectedProducts(new Set());
    setSelectedCategories(new Set());
  };

  // Print / Download
  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Font size mapping
  const fs = { sm: { title: '10px', body: '8px', h: '14px' }, md: { title: '12px', body: '9px', h: '16px' }, lg: { title: '14px', body: '11px', h: '18px' } }[config.fontSize];

  /* ────────── Render Product Card ────────── */
  const renderProductCard = (product: ProductItem, layout: PageLayout) => {
    const isFullOrMag = layout === 'full' || layout === 'magazine';
    const isList = layout === 'list';

    if (isList) {
      return (
        <div key={product.id} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: `1px solid ${config.accentColor}15`, alignItems: 'center' }}>
          <img src={product.image} alt={product.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: fs.title, color: config.textColor, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</p>
            {config.showReference && product.reference && <p style={{ fontSize: '8px', color: config.accentColor, margin: '1px 0 0', fontFamily: 'monospace' }}>REF: {product.reference}</p>}
            {config.showDescription && product.description && <p style={{ fontSize: fs.body, color: '#888', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.description}</p>}
          </div>
          {config.showPrice && product.price && <p style={{ fontWeight: 800, fontSize: fs.title, color: config.accentColor, margin: 0, whiteSpace: 'nowrap' }}>{product.price}</p>}
        </div>
      );
    }

    return (
      <div key={product.id} style={{
        display: 'flex', flexDirection: isFullOrMag ? 'row' : 'column',
        gap: isFullOrMag ? '16px' : '6px',
        height: '100%', overflow: 'hidden',
      }}>
        <div style={{
          width: isFullOrMag ? '55%' : '100%',
          height: isFullOrMag ? '100%' : undefined,
          aspectRatio: isFullOrMag ? undefined : '1',
          borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f5f5f5', flexShrink: 0,
        }}>
          <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          {config.showCategory && <p style={{ fontSize: '7px', fontWeight: 800, color: config.accentColor, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{product.category}</p>}
          <p style={{ fontWeight: 700, fontSize: fs.title, color: config.textColor, margin: '0 0 2px', lineHeight: 1.2 }}>{product.title}</p>
          {config.showReference && product.reference && <p style={{ fontSize: '7px', color: '#999', margin: '0 0 2px', fontFamily: 'monospace' }}>REF: {product.reference}</p>}
          {config.showDescription && product.description && (
            <p style={{ fontSize: fs.body, color: '#666', margin: '4px 0 0', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: isFullOrMag ? 5 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>
          )}
          {config.showPrice && product.price && <p style={{ fontWeight: 800, fontSize: isFullOrMag ? '20px' : fs.h, color: config.accentColor, margin: '6px 0 0' }}>{product.price}</p>}
        </div>
      </div>
    );
  };

  /* ────────── Render Page ────────── */
  const renderPage = (page: typeof pages[0], index: number) => {
    const coverBg = COVER_STYLES.find(c => c.value === config.coverStyle);
    const pageStyle: React.CSSProperties = {
      width: '8.5in', height: '11in', backgroundColor: config.pageColor,
      fontFamily: `'${config.fontFamily}', sans-serif`,
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      pageBreakAfter: 'always',
    };

    // Cover
    if (page.type === 'cover') {
      const bg = config.coverStyle === 'gradient' ? coverBg?.bg : coverBg?.bg;
      const textCol = coverBg?.text || '#fff';
      return (
        <div key={index} style={{ ...pageStyle, background: bg || '#0A0A0A', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2in 1in' }}>
          {config.coverStyle === 'photo' && config.coverImage && (
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.3 }} />
          )}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: '80px', height: '4px', backgroundColor: config.accentColor, margin: '0 auto 40px', borderRadius: '2px' }} />
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: textCol, letterSpacing: '3px', lineHeight: 1.1, margin: '0 0 16px' }}>{config.title}</h1>
            <p style={{ fontSize: '16px', fontWeight: 300, color: config.accentColor, letterSpacing: '6px', textTransform: 'uppercase' }}>{config.subtitle}</p>
            <div style={{ width: '80px', height: '4px', backgroundColor: config.accentColor, margin: '40px auto 0', borderRadius: '2px' }} />
            <p style={{ fontSize: '10px', color: `${textCol}80`, marginTop: '60px' }}>{new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long' })}</p>
          </div>
        </div>
      );
    }

    // TOC
    if (page.type === 'toc') {
      const grouped: Record<string, number> = {};
      let currentPage = config.showTOC ? 3 : 2;
      const ppp = getProductsPerPage(config.pageLayout);
      if (config.sortMode === 'category') {
        const cats: Record<string, ProductItem[]> = {};
        catalogProducts.forEach(p => { if (!cats[p.category]) cats[p.category] = []; cats[p.category].push(p); });
        Object.entries(cats).forEach(([cat, prods]) => {
          grouped[cat] = currentPage;
          currentPage += Math.ceil(prods.length / ppp);
        });
      }

      return (
        <div key={index} style={{ ...pageStyle, padding: '1in 0.8in', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: config.textColor, marginBottom: '8px', letterSpacing: '2px' }}>ÍNDICE</h2>
          <div style={{ width: '40px', height: '3px', backgroundColor: config.accentColor, marginBottom: '30px', borderRadius: '2px' }} />
          <div style={{ flex: 1 }}>
            {Object.entries(grouped).map(([cat, pageNum]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: `1px solid ${config.textColor}10` }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: config.textColor }}>{cat}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: config.accentColor, fontFamily: 'monospace' }}>{pageNum}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '9px', color: '#999', textAlign: 'center' }}>{catalogProducts.length} productos en este catálogo</p>
        </div>
      );
    }

    // Back Cover
    if (page.type === 'back') {
      return (
        <div key={index} style={{ ...pageStyle, background: '#0A0A0A', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2in' }}>
          <div style={{ width: '60px', height: '3px', backgroundColor: config.accentColor, marginBottom: '40px', borderRadius: '2px' }} />
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '30px', letterSpacing: '2px' }}>{config.subtitle}</h2>
          {config.backCoverText.split('\n').map((line, i) => (
            <p key={i} style={{ fontSize: '12px', color: '#aaa', margin: '4px 0', lineHeight: 1.6 }}>{line}</p>
          ))}
          <div style={{ width: '60px', height: '3px', backgroundColor: config.accentColor, marginTop: '40px', borderRadius: '2px' }} />
        </div>
      );
    }

    // Product Page
    const layout = page.layout;
    const prods = page.products || [];
    const gridTemplates: Record<PageLayout, React.CSSProperties> = {
      'grid-2x2': { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '16px' },
      'grid-2x3': { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: '12px' },
      'grid-3x3': { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: '8px' },
      'list': { display: 'flex', flexDirection: 'column' as const },
      'full': { display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' as const },
      'magazine': { display: 'grid', gridTemplateColumns: '1fr', gap: '16px' },
    };

    return (
      <div key={index} style={{ ...pageStyle, padding: '0.6in 0.7in', display: 'flex', flexDirection: 'column' }}>
        {/* Category Header */}
        {page.categoryHeader && (
          <div style={{ marginBottom: '12px', flexShrink: 0 }}>
            <p style={{ fontSize: '8px', fontWeight: 800, color: config.accentColor, textTransform: 'uppercase', letterSpacing: '3px', margin: '0 0 4px' }}>CATEGORÍA</p>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: config.textColor, margin: 0, lineHeight: 1 }}>{page.categoryHeader}</h2>
            <div style={{ width: '30px', height: '2px', backgroundColor: config.accentColor, marginTop: '6px', borderRadius: '1px' }} />
          </div>
        )}

        {/* Products Grid/List */}
        <div style={{ flex: 1, ...gridTemplates[layout] }}>
          {prods.map(p => renderProductCard(p, layout))}
        </div>

        {/* Page Number */}
        {config.showPageNumbers && (
          <div style={{ textAlign: 'center', paddingTop: '8px', borderTop: `1px solid ${config.textColor}10`, flexShrink: 0 }}>
            <span style={{ fontSize: '8px', fontWeight: 700, color: config.accentColor, fontFamily: 'monospace' }}>{index + 1}</span>
          </div>
        )}
      </div>
    );
  };

  /* ────────── MAIN RENDER ────────── */
  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-raynold-red" size={40} /></div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="text-raynold-red" size={28} />
            <div>
              <h1 className="text-2xl font-futuristic font-black text-white">CREADOR DE <span className="animate-gradient-text">CATÁLOGOS</span></h1>
              <p className="text-xs text-gray-500">{selectedProducts.size} productos seleccionados · {totalPages} páginas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Tab Navigation */}
            <div className="flex bg-black border border-white/10 rounded-lg p-1">
              {([
                { key: 'select' as const, label: 'Productos', icon: <Filter size={14} /> },
                { key: 'design' as const, label: 'Diseño', icon: <Palette size={14} /> },
                { key: 'preview' as const, label: 'Vista Previa', icon: <Eye size={14} /> },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${activeTab === tab.key ? 'bg-raynold-red/20 text-raynold-red' : 'text-gray-400 hover:text-white'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            <button onClick={handlePrint} className="px-4 py-2 btn-animated font-bold rounded-lg text-sm flex items-center gap-2">
              <Printer size={16} /> Imprimir / PDF
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* ─── SIDEBAR: Product Selection ─── */}
        {activeTab === 'select' && (
          <div className="w-full p-6 overflow-y-auto scrollbar-modern">
            <div className="max-w-5xl mx-auto">
              {/* Search & Actions */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-raynold-red focus:outline-none" />
                </div>
                <button onClick={selectAll} className="px-4 py-2 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/30 transition-colors">Seleccionar Todos</button>
                <button onClick={deselectAll} className="px-4 py-2 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/30 transition-colors">Deseleccionar Todos</button>
              </div>

              {/* Categories */}
              {categories.map(cat => {
                const catProducts = filteredProducts.filter(p => p.category === cat);
                if (catProducts.length === 0) return null;
                const allSelected = catProducts.every(p => selectedProducts.has(p.id));
                const someSelected = catProducts.some(p => selectedProducts.has(p.id));

                return (
                  <div key={cat} className="mb-6">
                    <button
                      onClick={() => toggleCategory(cat)}
                      className={`flex items-center gap-3 w-full text-left p-3 rounded-xl mb-2 transition-all ${allSelected ? 'bg-raynold-red/10 border border-raynold-red/30' : someSelected ? 'bg-white/5 border border-white/10' : 'bg-white/5 border border-white/10'}`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${allSelected ? 'bg-raynold-red border-raynold-red' : someSelected ? 'border-raynold-red/50 bg-raynold-red/20' : 'border-white/20'}`}>
                        {allSelected && <Check size={12} className="text-white" />}
                        {someSelected && !allSelected && <Minus size={12} className="text-raynold-red" />}
                      </div>
                      <span className="text-sm font-bold text-white flex-1">{cat}</span>
                      <span className="text-xs text-gray-500">{catProducts.filter(p => selectedProducts.has(p.id)).length}/{catProducts.length}</span>
                    </button>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 pl-4">
                      {catProducts.map(product => {
                        const isSelected = selectedProducts.has(product.id);
                        return (
                          <button key={product.id} onClick={() => toggleProduct(product.id)}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all text-left ${isSelected ? 'border-raynold-red shadow-[0_0_10px_rgba(230,0,0,0.2)]' : 'border-transparent opacity-50 hover:opacity-80'}`}
                          >
                            <div className="aspect-square bg-gray-900 overflow-hidden">
                              <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-2 bg-[#0A0A0A]">
                              <p className="text-[10px] font-bold text-white truncate">{product.title}</p>
                              {product.reference && <p className="text-[8px] text-gray-500 font-mono">{product.reference}</p>}
                            </div>
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-raynold-red rounded-full flex items-center justify-center">
                                <Check size={10} className="text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── SIDEBAR: Design Settings ─── */}
        {activeTab === 'design' && (
          <div className="w-full p-6 overflow-y-auto scrollbar-modern">
            <div className="max-w-3xl mx-auto space-y-6">

              {/* Cover */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><ImageIcon size={16} className="text-raynold-red" /> Portada</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Título</label>
                    <input type="text" value={config.title} onChange={e => setConfig({ ...config, title: e.target.value })}
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white text-sm focus:border-raynold-red focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Subtítulo</label>
                    <input type="text" value={config.subtitle} onChange={e => setConfig({ ...config, subtitle: e.target.value })}
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white text-sm focus:border-raynold-red focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Estilo de Portada</label>
                    <div className="grid grid-cols-4 gap-2">
                      {COVER_STYLES.map(cs => (
                        <button key={cs.value} onClick={() => setConfig({ ...config, coverStyle: cs.value })}
                          className={`p-3 rounded-xl border text-center transition-all ${config.coverStyle === cs.value ? 'border-raynold-red/50 shadow-[0_0_10px_rgba(230,0,0,0.2)]' : 'border-white/10 hover:border-white/20'}`}>
                          <div className="w-full h-8 rounded-lg mb-2" style={{ background: cs.bg as string }} />
                          <span className="text-[10px] text-gray-400 font-bold">{cs.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {config.coverStyle === 'photo' && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">URL de imagen de portada</label>
                      <input type="text" value={config.coverImage} onChange={e => setConfig({ ...config, coverImage: e.target.value })} placeholder="https://..."
                        className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white text-sm focus:border-raynold-red focus:outline-none" />
                    </div>
                  )}
                </div>
              </div>

              {/* Layout */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><LayoutGrid size={16} className="text-raynold-red" /> Distribución de Páginas</h3>
                <div className="grid grid-cols-3 gap-3">
                  {LAYOUT_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setConfig({ ...config, pageLayout: opt.value })}
                      className={`p-4 rounded-xl border text-center transition-all ${config.pageLayout === opt.value ? 'bg-raynold-red/10 border-raynold-red/50 shadow-[0_0_10px_rgba(230,0,0,0.2)]' : 'border-white/10 hover:border-white/20'}`}>
                      <div className="flex justify-center mb-2 text-gray-400">{opt.icon}</div>
                      <p className="text-xs font-bold text-white">{opt.label}</p>
                      <p className="text-[10px] text-gray-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Options */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Settings2 size={16} className="text-raynold-red" /> Opciones de Contenido</h3>
                <div className="space-y-3">
                  {([
                    { key: 'showPrice' as const, label: 'Mostrar Precios' },
                    { key: 'showCategory' as const, label: 'Mostrar Categoría' },
                    { key: 'showDescription' as const, label: 'Mostrar Descripción' },
                    { key: 'showReference' as const, label: 'Mostrar Referencia' },
                    { key: 'showPageNumbers' as const, label: 'Numeración de Páginas' },
                    { key: 'showTOC' as const, label: 'Índice Automático' },
                    { key: 'showBackCover' as const, label: 'Contraportada' },
                  ]).map(opt => (
                    <button key={opt.key} onClick={() => setConfig({ ...config, [opt.key]: !config[opt.key] })}
                      className="flex items-center justify-between w-full p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                      <span className="text-sm text-white font-medium">{opt.label}</span>
                      {config[opt.key] ? <ToggleRight size={24} className="text-raynold-green" /> : <ToggleLeft size={24} className="text-gray-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><ArrowUpDown size={16} className="text-raynold-red" /> Ordenar Por</h3>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'category' as const, label: 'Categoría' },
                    { value: 'name-asc' as const, label: 'Nombre A→Z' },
                    { value: 'name-desc' as const, label: 'Nombre Z→A' },
                    { value: 'price-asc' as const, label: 'Precio ↑' },
                  ]).map(s => (
                    <button key={s.value} onClick={() => setConfig({ ...config, sortMode: s.value })}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${config.sortMode === s.value ? 'bg-raynold-red/20 text-raynold-red border border-raynold-red/30' : 'text-gray-400 border border-white/10 hover:text-white'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors & Typography */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Palette size={16} className="text-raynold-red" /> Colores y Tipografía</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Fondo Página</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={config.pageColor} onChange={e => setConfig({ ...config, pageColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent" />
                      <input type="text" value={config.pageColor} onChange={e => setConfig({ ...config, pageColor: e.target.value })} className="flex-1 bg-black border border-white/20 rounded px-2 py-1 text-white font-mono text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Texto</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={config.textColor} onChange={e => setConfig({ ...config, textColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent" />
                      <input type="text" value={config.textColor} onChange={e => setConfig({ ...config, textColor: e.target.value })} className="flex-1 bg-black border border-white/20 rounded px-2 py-1 text-white font-mono text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Acento</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={config.accentColor} onChange={e => setConfig({ ...config, accentColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent" />
                      <input type="text" value={config.accentColor} onChange={e => setConfig({ ...config, accentColor: e.target.value })} className="flex-1 bg-black border border-white/20 rounded px-2 py-1 text-white font-mono text-xs" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Fuente</label>
                    <select value={config.fontFamily} onChange={e => setConfig({ ...config, fontFamily: e.target.value as FontFamily })}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-raynold-red focus:outline-none">
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Tamaño Texto</label>
                    <div className="flex rounded-lg border border-white/10 overflow-hidden">
                      {(['sm', 'md', 'lg'] as const).map(s => (
                        <button key={s} onClick={() => setConfig({ ...config, fontSize: s })}
                          className={`flex-1 py-2 text-xs font-bold transition-colors ${config.fontSize === s ? 'bg-raynold-red/20 text-raynold-red' : 'text-gray-400 hover:text-white'}`}>
                          {s === 'sm' ? 'S' : s === 'md' ? 'M' : 'L'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Back Cover */}
              {config.showBackCover && (
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Texto Contraportada</h3>
                  <textarea value={config.backCoverText} onChange={e => setConfig({ ...config, backCoverText: e.target.value })}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm focus:border-raynold-red focus:outline-none h-28 resize-none" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── PREVIEW ─── */}
        {activeTab === 'preview' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Preview Controls */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setPreviewPage(Math.max(0, previewPage - 1))} disabled={previewPage === 0}
                  className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronLeft size={18} /></button>
                <span className="text-sm text-white font-bold">Página {previewPage + 1} / {totalPages}</span>
                <button onClick={() => setPreviewPage(Math.min(totalPages - 1, previewPage + 1))} disabled={previewPage >= totalPages - 1}
                  className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronRight size={18} /></button>
              </div>
              {pages[previewPage]?.type === 'products' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Layout de esta página:</span>
                  <select
                    value={perPageOverrides[previewPage] || config.pageLayout}
                    onChange={e => setPerPageOverrides({ ...perPageOverrides, [previewPage]: e.target.value as PageLayout })}
                    className="bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs focus:border-raynold-red focus:outline-none"
                  >
                    {LAYOUT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Page Preview */}
            <div className="flex-1 overflow-auto p-8 flex items-start justify-center bg-[#111]">
              <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center' }}>
                {pages[previewPage] && renderPage(pages[previewPage], previewPage)}
              </div>
            </div>

            {/* Page thumbnails */}
            <div className="flex gap-2 p-3 border-t border-white/10 overflow-x-auto scrollbar-modern shrink-0 bg-[#0A0A0A]">
              {pages.map((page, i) => (
                <button key={i} onClick={() => setPreviewPage(i)}
                  className={`flex-shrink-0 w-14 h-18 rounded-lg border-2 overflow-hidden transition-all ${i === previewPage ? 'border-raynold-red shadow-[0_0_8px_rgba(230,0,0,0.4)]' : 'border-white/10 hover:border-white/30 opacity-60'}`}>
                  <div className="w-full h-full bg-white flex items-center justify-center text-[8px] font-bold text-gray-400">
                    {page.type === 'cover' ? 'PORT' : page.type === 'toc' ? 'IND' : page.type === 'back' ? 'CONT' : i}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── PRINT AREA (hidden, only used for printing) ─── */}
      <div ref={printRef} className="hidden print:block">
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .print-catalog, .print-catalog * { visibility: visible !important; }
            .print-catalog { position: absolute; left: 0; top: 0; width: 100%; }
            @page { size: 8.5in 11in; margin: 0; }
          }
        `}</style>
        <div className="print-catalog">
          {pages.map((page, i) => renderPage(page, i))}
        </div>
      </div>
    </div>
  );
};

export default AdminCatalog;
