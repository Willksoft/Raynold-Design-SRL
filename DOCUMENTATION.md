# 📋 Documentación del Proyecto — Raynold Design SRL

## Información General

| Campo | Valor |
|---|---|
| **Nombre** | Raynold Design SRL |
| **RNC** | 131-76560-2 |
| **Tipo** | Web App (Landing + Admin + POS) |
| **URL de Producción** | [raynolddesign.com](https://raynolddesign.com) |
| **Repositorio** | [Willksoft/Raynold-Design-SRL](https://github.com/Willksoft/Raynold-Design-SRL) |
| **Hosting** | Vercel (SPA) |
| **Backend** | Supabase (DB, Auth, Storage) |
| **Ubicación** | Punta Cana, La Altagracia, RD |

---

## 🏗️ Stack Tecnológico

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.2.0 | UI Framework |
| TypeScript | 5.8.2 | Type Safety |
| Vite | 6.2.0 | Build Tool + Dev Server |
| React Router DOM | 6.22.3 | SPA Routing |
| Framer Motion | 11.0.8 | Animaciones y transiciones |
| GSAP | 3.14.2 | Scroll animations (parallax) |
| Tailwind CSS | CDN | Estilos utilitarios |
| Lucide React | 0.562.0 | Iconografía |
| Recharts | 3.8.0 | Gráficos en dashboard |

### Backend & Servicios

| Servicio | Uso |
|---|---|
| **Supabase** | PostgreSQL + Auth + Storage + API |
| **Google Gemini API** | Consultor IA integrado |
| **DGII API** | Autocompletado de RNC y contribuyentes |
| **Vercel** | Deploy y hosting |
| **Express + TSX** | Dev server local |

---

## 📁 Estructura del Proyecto

```
raynold-design-srl/
├── index.html              # Punto de entrada HTML (SEO, Tailwind, meta tags)
├── index.tsx                # Entry point React
├── App.tsx                  # Router principal + Layout
├── types.ts                 # Interfaces TypeScript globales
├── vite.config.ts           # Configuración de Vite
├── vite-env.d.ts            # Declaraciones env vars
├── vercel.json              # Config Vercel (rewrites + security headers)
├── server.ts                # Dev server Express
├── package.json             # Dependencias
├── .env.local               # Variables de entorno (NO en git)
├── .gitignore
│
├── lib/
│   ├── supabaseClient.ts    # Cliente Supabase inicializado
│   └── dgiiService.ts       # Servicio API DGII (RNC lookup)
│
├── context/
│   ├── ShopContext.tsx       # Estado global del carrito/productos
│   └── UIContext.tsx         # Estado UI global
│
├── components/
│   ├── ─── LANDING PAGE ───
│   ├── Hero.tsx              # Hero slider con imágenes dinámicas
│   ├── Features.tsx          # Características principales
│   ├── Services.tsx          # Catálogo de servicios
│   ├── ServiceDetail.tsx     # Detalle individual de servicio
│   ├── Products.tsx          # Productos destacados (home)
│   ├── ProductsPage.tsx      # Página completa de productos
│   ├── ProductModal.tsx      # Modal de detalle de producto
│   ├── Clients.tsx           # Carrusel de logos de clientes
│   ├── Process.tsx           # Proceso de trabajo
│   ├── HomeProjects.tsx      # Proyectos destacados (home)
│   ├── ProjectsPage.tsx      # Página completa de proyectos
│   ├── ProjectDetailPage.tsx # Detalle de proyecto con galería
│   ├── About.tsx             # Página "Nosotros"
│   ├── Contact.tsx           # Sección de contacto (home)
│   ├── ContactPage.tsx       # Página de contacto completa
│   ├── AiConsultant.tsx      # Consultor inteligente con Gemini
│   │
│   ├── ─── NAVEGACIÓN & UI ───
│   ├── Navbar.tsx            # Barra de navegación principal
│   ├── Footer.tsx            # Footer dinámico
│   ├── FloatingButtons.tsx   # Botones WhatsApp + Chatbot Agente Raynold
│   ├── CartSidebar.tsx       # Sidebar del carrito de compras
│   ├── SearchOverlay.tsx     # Overlay de búsqueda
│   ├── FavoritesPage.tsx     # Página de favoritos
│   ├── CrtTransition.tsx     # Transición CRT entre páginas
│   ├── ParallaxParticles.tsx # Partículas decorativas
│   ├── GsapController.tsx    # Control de animaciones GSAP
│   ├── ScrollDrone.tsx       # Efecto de scroll 3D
│   ├── TiltCard.tsx          # Tarjeta con efecto tilt
│   │
│   ├── ─── PANEL DE ADMINISTRACIÓN ───
│   ├── AdminLayout.tsx       # Layout admin (auth + sidebar + routing)
│   ├── AdminDashboard.tsx    # Dashboard con KPIs y gráficos
│   ├── AdminPanel.tsx        # Gestión de productos
│   ├── AdminServices.tsx     # Gestión de servicios
│   ├── AdminCategories.tsx   # Gestión de categorías
│   ├── AdminClients.tsx      # Gestión de clientes (+ DGII autocomplete)
│   ├── AdminSuppliers.tsx    # Gestión de proveedores (+ DGII autocomplete)
│   ├── AdminSellers.tsx      # Gestión de vendedores
│   ├── AdminInvoices.tsx     # Facturación y cotizaciones
│   ├── AdminPOS.tsx          # Punto de Venta
│   ├── AdminExpenses.tsx     # Control de gastos
│   ├── AdminAccounts.tsx     # Cuentas bancarias + transferencias
│   ├── AdminProjects.tsx     # Portafolio de proyectos
│   ├── AdminBrands.tsx       # Logos de clientes
│   ├── AdminHero.tsx         # Gestión de slides hero
│   ├── AdminMedia.tsx        # Galería multimedia
│   ├── AdminSettings.tsx     # Configuración del sitio
│   ├── AdminFooter.tsx       # Configuración del footer
│   ├── AdminAbout.tsx        # Editar página "Nosotros"
│   ├── AdminProcess.tsx      # Editar proceso de trabajo
│   ├── AdminFeatures.tsx     # Editar características
│   └── AdminReports.tsx      # Reportes contables + DGII
│
└── public/
    └── agente-raynold.png    # Avatar del chatbot
```

---

## 🗂️ Modelos de Datos (Interfaces TypeScript)

### `Client`

```typescript
interface Client {
  id: string;
  type: 'FISICA' | 'EMPRESA';
  name: string;
  company: string;
  rnc: string;       // RNC o Cédula
  phone: string;
  email: string;
  address: string;
}
```

### `Supplier`

```typescript
interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;     // RNC/NIT
}
```

### `ProductItem`

```typescript
interface ProductItem {
  id: string;
  reference?: string;
  title: string;
  category: string;
  image: string;
  price?: string;
  description?: string;
  type?: 'product' | 'service';
  unit?: string;
}
```

### `Expense`

```typescript
interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  reference?: string;
  attachmentUrl?: string;
}
```

### `ServiceItem`

```typescript
interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: 'red' | 'green' | 'white';
}
```

---

## 🔐 Autenticación y Seguridad

### Autenticación

- **Proveedor:** Supabase Auth
- **Método:** Email + Password
- **Ubicación:** `AdminLayout.tsx` maneja login/logout
- **Protección:** Solo rutas `/admin/*` requieren autenticación

### Headers de Seguridad (Vercel)

| Header | Valor |
|---|---|
| `X-Frame-Options` | `DENY` |
| `Content-Security-Policy` | `frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self)` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |

### Protección Anti-Clickjacking

- Script framebusting en `index.html` que oculta contenido dentro de iframes

---

## 🌐 Rutas de la Aplicación

### Públicas (Landing)

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `Home` | Hero + Features + Clients + Services + Products + Contact |
| `/products` | `ProductsPage` | Catálogo completo |
| `/projects` | `ProjectsPage` | Portafolio |
| `/projects/:id` | `ProjectDetailPage` | Detalle de proyecto |
| `/services/:slug` | `ServiceDetail` | Detalle de servicio |
| `/about` | `About` | Página Nosotros |
| `/contact` | `ContactPage` | Contacto completo |
| `/favorites` | `FavoritesPage` | Productos favoritos |

### Admin (Protegidas)

| Ruta | Componente | Descripción |
|---|---|---|
| `/admin` | `AdminDashboard` | Dashboard con KPIs |
| `/admin/products` | `AdminPanel` | CRUD Productos |
| `/admin/services` | `AdminServices` | CRUD Servicios |
| `/admin/categories` | `AdminCategories` | CRUD Categorías |
| `/admin/invoices` | `AdminInvoices` | Facturación |
| `/admin/pos` | `AdminPOS` | Punto de Venta |
| `/admin/clients` | `AdminClients` | CRUD Clientes |
| `/admin/suppliers` | `AdminSuppliers` | CRUD Proveedores |
| `/admin/sellers` | `AdminSellers` | CRUD Vendedores |
| `/admin/expenses` | `AdminExpenses` | Control de Gastos |
| `/admin/accounts` | `AdminAccounts` | Cuentas Bancarias |
| `/admin/projects` | `AdminProjects` | Portafolio |
| `/admin/brands` | `AdminBrands` | Logos de Clientes |
| `/admin/hero` | `AdminHero` | Slides Hero |
| `/admin/media` | `AdminMedia` | Galería Multimedia |
| `/admin/reports` | `AdminReports` | Reportes + DGII |
| `/admin/settings` | `AdminSettings` | Configuración |
| `/admin/footer` | `AdminFooter` | Footer |
| `/admin/about` | `AdminAbout` | Página Nosotros |
| `/admin/process` | `AdminProcess` | Proceso de Trabajo |
| `/admin/features` | `AdminFeatures` | Características |

---

## 🗃️ Tablas Supabase

| Tabla | Uso |
|---|---|
| `products` | Catálogo de productos |
| `categories` | Categorías de productos/proyectos |
| `services` | Servicios ofrecidos |
| `clients` | Directorio de clientes |
| `suppliers` | Directorio de proveedores |
| `sellers` | Vendedores |
| `invoices` | Facturas y cotizaciones |
| `expenses` | Gastos |
| `accounts` | Cuentas bancarias |
| `account_transactions` | Movimientos bancarios |
| `brands` | Logos de marcas/clientes |
| `projects` | Portafolio de proyectos |
| `hero_slides` | Slides del hero banner |
| `site_settings` | Configuraciones del sitio (footer, about, etc.) |

### Storage Buckets

| Bucket | Uso |
|---|---|
| `raynold-media` | Todas las imágenes del sitio |
| `raynold-media/hero` | Imágenes del hero slider |
| `raynold-media/brand` | Logos e identidad |
| `raynold-media/products` | Fotos de productos |
| `raynold-media/projects` | Fotos de proyectos |

---

## 📊 Sistema de Reportes DGII

### Formatos Implementados

| Formato | Nombre | Descripción |
|---|---|---|
| **606** | Compras | Detalle de costos y gastos |
| **607** | Ventas | Ingresos por ventas |
| **608** | Anulaciones | NCFs anulados |
| **609** | Pagos al Exterior | Pagos a proveedores extranjeros |
| **IT-1** | ITBIS | Declaración jurada de ITBIS |

### Exportación

- **CSV** para uso general
- **TXT pipe-delimited** (formato oficial DGII)
- Incluye RNC de la empresa en los archivos generados

---

## 🤖 Integraciones

### DGII API (Autocompletado RNC)

- **Servicio:** `lib/dgiiService.ts`
- **Endpoints:**
  - `GET /rnc/{rnc}` — Consulta directa por RNC/Cédula
  - `GET /search?nombre=...` — Búsqueda por nombre
- **Integrado en:** AdminClients, AdminSuppliers
- **Funcionamiento:** Debounce de 400ms, dropdown de resultados, auto-fill de datos

### Chatbot Agente Raynold

- **Componente:** `FloatingButtons.tsx`
- **Tipo:** Rule-based con respuestas predefinidas
- **Features:** Avatar del agente, horario de atención, preguntas sugeridas

### WhatsApp Business

- **Número:** +1 (829) 580-7411
- **Integración:** Botón flotante circular con deep link `wa.me`

### Google Gemini AI

- **Componente:** `AiConsultant.tsx`
- **Uso:** Consultor inteligente para cotizaciones y preguntas

---

## ⚙️ Variables de Entorno

| Variable | Descripción | Obligatoria |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase | ✅ |
| `VITE_DGII_API_KEY` | API key para DGII lookup | ✅ |
| `VITE_DGII_API_URL` | URL base de la API DGII | ❌ (tiene default) |
| `GEMINI_API_KEY` | API key de Google Gemini | ❌ |

> ⚠️ Estas variables deben configurarse tanto en `.env.local` (desarrollo) como en **Vercel Dashboard → Settings → Environment Variables** (producción).

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local (puerto 3000)
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Lint TypeScript
npm run lint
```

---

## 📱 Diseño y UX

### Identidad Visual

| Elemento | Valor |
|---|---|
| **Color Primario** | `#E60000` (Rojo Raynold) |
| **Color Secundario** | `#009933` (Verde) |
| **Background** | `#050505` (Negro profundo) |
| **Gris Panel** | `#1A1A1A` |
| **Fuente Principal** | Archivo (Google Fonts) |
| **Cursor** | Custom crosshair animado |

### Efectos Visuales

- Cursor personalizado con efecto crosshair
- Transiciones CRT entre páginas
- Partículas parallax decorativas
- Efecto glitch en textos
- Gradients animados en textos y botones
- Cards con efecto tilt 3D
- Animaciones de scroll con GSAP
