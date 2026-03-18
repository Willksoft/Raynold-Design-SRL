/* Catalog Template Definitions */
export type PageLayout = 'grid-2x2' | 'grid-2x3' | 'grid-3x3' | 'list' | 'full' | 'magazine' | 'sidebar';
export type SortMode = 'category' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';
export type FontFamily = 'Inter' | 'Montserrat' | 'Playfair Display' | 'Roboto' | 'Outfit';
export type CoverStyle = 'centered' | 'left-block' | 'split-diagonal' | 'photo-circle' | 'bold-bottom' | 'minimal-frame' | 'landscape-wave' | 'landscape-corporate';
export type PageOrientation = 'portrait' | 'landscape';

export interface CatalogConfig {
  title: string;
  subtitle: string;
  templateId: string;
  coverImage: string;
  logoUrl: string;
  showBackCover: boolean;
  backCoverText: string;
  contactPhone: string;
  contactEmail: string;
  contactWebsite: string;
  contactInstagram: string;
  contactFacebook: string;
  contactWhatsapp: string;
  showTOC: boolean;
  showPrice: boolean;
  showCategory: boolean;
  showDescription: boolean;
  showReference: boolean;
  showPageNumbers: boolean;
  showCategoryHeaders: boolean;
  pageLayout: PageLayout;
  sortMode: SortMode;
  pageColor: string;
  textColor: string;
  accentColor: string;
  secondaryColor: string;
  fontFamily: FontFamily;
  fontSize: 'sm' | 'md' | 'lg';
  coverGradient: string;
  coverStyle: CoverStyle;
  orientation: PageOrientation;
  headerStyle: 'bar' | 'line' | 'block' | 'minimal';
  productCardStyle: 'clean' | 'bordered' | 'shadow' | 'accent';
  isDraft: boolean;
}

export interface CatalogTemplate {
  id: string;
  name: string;
  description: string;
  orientation: PageOrientation;
  coverPreview: { bg: string; accent: string; text: string; style: string };
  defaults: Partial<CatalogConfig>;
}

export const GRADIENT_PRESETS = [
  { name: 'Raynold Rojo', value: 'linear-gradient(135deg, #0A0A0A 0%, #1a0000 50%, #E60000 100%)' },
  { name: 'Nocturno', value: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)' },
  { name: 'Dorado', value: 'linear-gradient(135deg, #0A0A0A 0%, #1a1500 50%, #D4A017 100%)' },
  { name: 'Esmeralda', value: 'linear-gradient(135deg, #0A0A0A 0%, #001a0f 50%, #00875a 100%)' },
  { name: 'Púrpura', value: 'linear-gradient(135deg, #0f0019 0%, #1a0033 50%, #7c3aed 100%)' },
  { name: 'Atardecer', value: 'linear-gradient(135deg, #1a0a00 0%, #b91c1c 40%, #f59e0b 100%)' },
  { name: 'Océano', value: 'linear-gradient(135deg, #001220 0%, #0c4a6e 50%, #06b6d4 100%)' },
  { name: 'Blanco Limpio', value: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #e5e7eb 100%)' },
];

export const TEMPLATES: CatalogTemplate[] = [
  {
    id: 'classic-bw',
    name: 'Clásico B/N',
    description: 'Elegante blanco y negro con círculo decorativo y layout minimalista',
    orientation: 'portrait',
    coverPreview: { bg: '#0A0A0A', accent: '#ffffff', text: '#ffffff', style: 'dark' },
    defaults: {
      pageColor: '#ffffff', textColor: '#111111', accentColor: '#000000', secondaryColor: '#666666',
      coverGradient: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
      coverStyle: 'photo-circle', orientation: 'portrait',
      fontFamily: 'Inter', headerStyle: 'line', productCardStyle: 'clean',
    },
  },
  {
    id: 'corporate-red',
    name: 'Corporativo Rojo',
    description: 'Profesional con bloque inferior rojo tipo Raynold',
    orientation: 'portrait',
    coverPreview: { bg: '#E60000', accent: '#0A0A0A', text: '#ffffff', style: 'red' },
    defaults: {
      pageColor: '#ffffff', textColor: '#111111', accentColor: '#E60000', secondaryColor: '#333333',
      coverGradient: 'linear-gradient(135deg, #0A0A0A 0%, #1a0000 50%, #E60000 100%)',
      coverStyle: 'bold-bottom', orientation: 'portrait',
      fontFamily: 'Montserrat', headerStyle: 'block', productCardStyle: 'accent',
    },
  },
  {
    id: 'modern-diagonal',
    name: 'Moderno Diagonal',
    description: 'Bloques diagonales con diseño geométrico y dividido',
    orientation: 'portrait',
    coverPreview: { bg: '#1a1a2e', accent: '#E60000', text: '#ffffff', style: 'diagonal' },
    defaults: {
      pageColor: '#ffffff', textColor: '#111111', accentColor: '#E60000', secondaryColor: '#1a1a2e',
      coverGradient: 'linear-gradient(135deg, #ffffff 60%, #E60000 60%, #E60000 100%)',
      coverStyle: 'split-diagonal', orientation: 'portrait',
      fontFamily: 'Outfit', headerStyle: 'bar', productCardStyle: 'bordered',
    },
  },
  {
    id: 'luxury-gold',
    name: 'Lujo Dorado',
    description: 'Premium con marco decorativo y detalles dorados',
    orientation: 'portrait',
    coverPreview: { bg: '#0A0A0A', accent: '#D4A017', text: '#ffffff', style: 'gold' },
    defaults: {
      pageColor: '#fafaf8', textColor: '#1a1a1a', accentColor: '#D4A017', secondaryColor: '#0A0A0A',
      coverGradient: 'linear-gradient(135deg, #0A0A0A 0%, #1a1500 50%, #D4A017 100%)',
      coverStyle: 'minimal-frame', orientation: 'portrait',
      fontFamily: 'Playfair Display', headerStyle: 'line', productCardStyle: 'shadow',
    },
  },
  {
    id: 'bold-catalog',
    name: 'Catálogo Bold',
    description: 'Fondo oscuro con título grande y bloques de color llamativos',
    orientation: 'portrait',
    coverPreview: { bg: '#1a1a1a', accent: '#f59e0b', text: '#ffffff', style: 'wave' },
    defaults: {
      pageColor: '#ffffff', textColor: '#0A0A0A', accentColor: '#f59e0b', secondaryColor: '#1a1a1a',
      coverGradient: 'linear-gradient(180deg, #1a1a1a 60%, #f59e0b 60%)',
      coverStyle: 'left-block', orientation: 'portrait',
      fontFamily: 'Roboto', headerStyle: 'block', productCardStyle: 'accent',
    },
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Limpio',
    description: 'Ultra minimalista con mucho espacio blanco y texto centrado',
    orientation: 'portrait',
    coverPreview: { bg: '#ffffff', accent: '#111111', text: '#111111', style: 'light' },
    defaults: {
      pageColor: '#ffffff', textColor: '#111111', accentColor: '#111111', secondaryColor: '#999999',
      coverGradient: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
      coverStyle: 'centered', orientation: 'portrait',
      fontFamily: 'Inter', headerStyle: 'minimal', productCardStyle: 'clean',
    },
  },
  // --- LANDSCAPE TEMPLATES ---
  {
    id: 'landscape-pink',
    name: 'Paisaje Rosa',
    description: 'Horizontal con bloque lateral de color y diseño tipo brochure',
    orientation: 'landscape',
    coverPreview: { bg: '#c2185b', accent: '#ffffff', text: '#ffffff', style: 'landscape' },
    defaults: {
      pageColor: '#ffffff', textColor: '#111111', accentColor: '#c2185b', secondaryColor: '#555',
      coverGradient: 'linear-gradient(90deg, #f5f5f5 55%, #c2185b 55%)',
      coverStyle: 'landscape-corporate', orientation: 'landscape',
      fontFamily: 'Montserrat', headerStyle: 'bar', productCardStyle: 'bordered',
      pageLayout: 'grid-3x3',
    },
  },
  {
    id: 'landscape-wave',
    name: 'Paisaje Curvas',
    description: 'Horizontal con formas curvadas y estilo empresarial moderno',
    orientation: 'landscape',
    coverPreview: { bg: '#333', accent: '#D4A017', text: '#ffffff', style: 'landscape' },
    defaults: {
      pageColor: '#ffffff', textColor: '#111111', accentColor: '#D4A017', secondaryColor: '#333333',
      coverGradient: 'linear-gradient(135deg, #ffffff 50%, #333 50%)',
      coverStyle: 'landscape-wave', orientation: 'landscape',
      fontFamily: 'Roboto', headerStyle: 'line', productCardStyle: 'shadow',
      pageLayout: 'grid-2x3',
    },
  },
];

export const DEFAULT_CONFIG: CatalogConfig = {
  title: 'CATÁLOGO DE PRODUCTOS',
  subtitle: 'Raynold Designs SRL',
  templateId: 'corporate-red',
  coverImage: '',
  logoUrl: '',
  showBackCover: true,
  backCoverText: '',
  contactPhone: '(829) 580-7411',
  contactEmail: 'cotizaciones@raynolddesignssrl.com',
  contactWebsite: 'www.raynolddesignssrl.com',
  contactInstagram: '@raynolddesignsrl',
  contactFacebook: 'raynolddesignsrl',
  contactWhatsapp: '8295807411',
  showTOC: true,
  showPrice: false,
  showCategory: true,
  showDescription: false,
  showReference: true,
  showPageNumbers: true,
  showCategoryHeaders: true,
  pageLayout: 'grid-2x3',
  sortMode: 'category',
  pageColor: '#ffffff',
  textColor: '#111111',
  accentColor: '#E60000',
  secondaryColor: '#333333',
  fontFamily: 'Montserrat',
  fontSize: 'md',
  coverGradient: 'linear-gradient(135deg, #0A0A0A 0%, #1a0000 50%, #E60000 100%)',
  coverStyle: 'bold-bottom',
  orientation: 'portrait',
  headerStyle: 'block',
  productCardStyle: 'accent',
  isDraft: false,
};

export const LAYOUT_OPTIONS = [
  { value: 'grid-2x2' as PageLayout, label: '2×2', desc: '4 por página', cols: 2, rows: 2 },
  { value: 'grid-2x3' as PageLayout, label: '2×3', desc: '6 por página', cols: 2, rows: 3 },
  { value: 'grid-3x3' as PageLayout, label: '3×3', desc: '9 por página', cols: 3, rows: 3 },
  { value: 'list' as PageLayout, label: 'Lista', desc: '5 por página', cols: 1, rows: 5 },
  { value: 'full' as PageLayout, label: 'Full', desc: '1 destacado', cols: 1, rows: 1 },
  { value: 'magazine' as PageLayout, label: 'Revista', desc: '3 por página', cols: 1, rows: 3 },
  { value: 'sidebar' as PageLayout, label: 'Sidebar', desc: '1 grande + 3', cols: 2, rows: 2 },
];

export const FONTS: FontFamily[] = ['Inter', 'Montserrat', 'Playfair Display', 'Roboto', 'Outfit'];

export const getProductsPerPage = (layout: PageLayout): number => {
  switch (layout) {
    case 'grid-2x2': return 4;
    case 'grid-2x3': return 6;
    case 'grid-3x3': return 9;
    case 'list': return 5;
    case 'full': return 1;
    case 'magazine': return 3;
    case 'sidebar': return 4;
  }
};
