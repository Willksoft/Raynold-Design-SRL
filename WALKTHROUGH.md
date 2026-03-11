# 🚶 Walkthrough Completo del Proyecto — Raynold Design SRL

> Historial cronológico de todas las fases de desarrollo, desde el deploy inicial hasta la auditoría de seguridad.

---

## 📐 Índice de Fases

1. [Fase 1: Deploy Inicial](#fase-1-deploy-inicial)
2. [Fase 2: Migración a Supabase](#fase-2-migración-a-supabase)
3. [Fase 3: Storage y Multimedia](#fase-3-storage-y-multimedia)
4. [Fase 4: Pulido UI y Correcciones](#fase-4-pulido-ui-y-correcciones)
5. [Fase 5: Rediseño de Landing Page](#fase-5-rediseño-de-landing-page)
6. [Fase 6: Service Cards y Hero Images](#fase-6-service-cards-y-hero-images)
7. [Fase 7: Secciones Dinámicas y Facturación](#fase-7-secciones-dinámicas-y-facturación)
8. [Fase 8: Botones Flotantes y Reportes DGII](#fase-8-botones-flotantes-y-reportes-dgii)
9. [Fase 9: Integración API DGII](#fase-9-integración-api-dgii)
10. [Fase 10: Seguridad](#fase-10-seguridad)

---

## Fase 1: Deploy Inicial

**Commit:** `aa52ee1`  
**Descripción:** Primer deploy de la aplicación completa

### Lo que se hizo

- Configuración de **Vite + React + TypeScript** como stack base
- Creación de **todas las páginas públicas** (Home, About, Contact, Products, Projects)
- Implementación del **Panel de Administración** completo con:
  - Dashboard con métricas
  - CRUD de Productos, Servicios, Categorías, Clientes, Proveedores
  - Sistema de Facturación y Cotizaciones
  - Punto de Venta (POS)
  - Control de Gastos y Cuentas Bancarias
- **Autenticación** con Supabase Auth (email + password)
- Diseño visual con tema oscuro premium, cursor custom, animaciones
- Deploy en **Vercel** como SPA

### Archivos clave creados

- `App.tsx` — Router principal con rutas públicas y admin
- `AdminLayout.tsx` — Layout del admin con sidebar, auth gate
- `components/Admin*.tsx` — Todos los módulos administrativos (20+ archivos)
- `lib/supabaseClient.ts` — Cliente Supabase

---

## Fase 2: Migración a Supabase

**Commits:** `a05f90f` → `68859e6`

### Lo que se hizo

- Migración de **localStorage → Supabase PostgreSQL** en todos los módulos
- Creación de tablas: `clients`, `products`, `categories`, `services`, `invoices`, `expenses`, `accounts`, `suppliers`, `sellers`, `brands`, `projects`, `hero_slides`, `site_settings`
- Configuración de **RLS (Row Level Security)** inicial para clientes
- Conexión de páginas públicas a datos de Supabase
- Remoción del login por email hardcodeado

### Archivos modificados

- Todos los `Admin*.tsx` actualizados para usar `supabase.from()` en lugar de `localStorage`
- `lib/supabaseClient.ts` con variables de entorno

### Decisiones técnicas

- Se optó por `supabase.from().select()` directo en componentes (sin capa de servicios intermedia) por simplicidad
- `site_settings` como tabla key-value para configuraciones dinámicas (footer, about, process, features)

---

## Fase 3: Storage y Multimedia

**Commits:** `c84980b` → `416a881`

### Lo que se hizo

- Creación del bucket `raynold-media` en Supabase Storage
- **Upload de imágenes** directo desde el admin:
  - Productos → `raynold-media/products/`
  - Proyectos → `raynold-media/projects/`
  - Hero slides → `raynold-media/hero/`
  - Logos de marcas → `raynold-media/brand/`
- Migración de **AdminHero, AdminFooter, AdminAbout** a Supabase
- Upload de **20 logos reales de clientes** y refactorización de AdminBrands
- **Sanitización de filenames** para prevenir errores de Supabase con caracteres especiales

### Fix importante

```
Commit 77658b2: fix: sanitize upload filenames to prevent Supabase Invalid Key errors
```

Se eliminaban caracteres especiales y espacios de los nombres de archivo antes del upload.

---

## Fase 4: Pulido UI y Correcciones

**Commits:** `169de29` → `206319f`

### Lo que se hizo

- Ajuste de **z-index en modales** para evitar overlapping
- Corrección de imágenes de About
- Ajuste del tamaño del logo en footer
- Reducción del tamaño del drone scroll
- **Uploads desde el admin panel** corregidos
- Remoción de la animación de intro (se consideró molesta)
- Remoción del botón "Admin Panel" del navbar público
- Sincronización del Dashboard con Supabase real (no localStorage)
- Scrollbar moderna y delgada en el admin layout
- Corrección de mapeo `image_url → image` en proyectos

---

## Fase 5: Rediseño de Landing Page

**Commits:** `3c7e631` → `35b3783`

### Lo que se hizo

- **Página de detalle de proyecto** (`ProjectDetailPage.tsx`) reemplazó al modal anterior
- **Misión y Visión** expandidas en la sección About
- **HomeProjects** como sección de proyectos destacados en el home
- Corrección del mapeo de `snake_case` en propiedades del footer
- **Selección dinámica de iconos** para servicios desde la base de datos
- **Auto-generación de slugs** para servicios
- **Auto-generación de códigos de referencia** para productos
- Transición CRT fix para navegación entre módulos admin

### Decisiones de diseño

- Los servicios pasaron de tener iconos hardcodeados a ser seleccionables desde el admin
- Cada servicio tiene su propia página de detalle con URL amigable (`/services/señalizacion-led`)

---

## Fase 6: Service Cards y Hero Images

**Commits:** `e0cca2d` → `539eceb`

### Lo que se hizo

- **Imágenes de fondo** añadidas a las cards de servicios
- **Cards de servicios con altura fija** (`h-[380px]`) para garantizar uniformidad
- Múltiples iteraciones para lograr cards del mismo tamaño:
  - Primer intento: `min-height` (no funcionó bien)
  - Segundo intento: `TiltCard` con height stretch
  - Tercer intento: 4 columnas por fila
  - Cuarto intento: Truncar descripciones
  - **Solución final:** `h-[380px]` fijo con overflow hidden
- **Logos de clientes** más grandes con hover-pause en carrusel
- Fix de overlapping en logos con width fijo

---

## Fase 7: Secciones Dinámicas y Facturación

**Commits:** `3f30e61` → `8a84730`

### Lo que se hizo

- **Process y Features** convertidos a secciones dinámicas editables desde el admin
- `AdminProcess.tsx` — Editor visual del proceso de trabajo (drag-and-drop de pasos)
- `AdminFeatures.tsx` — Editor de características principales
- **Creación rápida de productos** desde el modal de facturación
- Los datos de Process y Features se guardan en `site_settings` como JSON

### Flujo de edición dinámica

```
Admin edita → Guarda en site_settings (key/value) → Público lee → Muestra contenido actualizado
```

---

## Fase 8: Botones Flotantes y Reportes DGII

**Commits:** `66f9e4d` → `4f862ba`

### Lo que se hizo

1. **Eliminación del drone scroll** del landing

2. **Botones flotantes** (FloatingButtons.tsx):
   - Botón de **WhatsApp** con número `+1 (829) 580-7411`
   - Botón del **Chatbot Agente Raynold** con:
     - Foto del agente como avatar
     - Estado en línea / fuera de horario
     - Horario de atención (L-V 8:00-17:00)
     - Preguntas sugeridas
     - Respuestas automáticas predefinidas
   - Posicionados a la **derecha inferior** en columna vertical
   - Botones convertidos a **circulares** (56×56px, solo iconos)

3. **Sistema de Reportes Contables** (AdminReports.tsx):
   - Reporte de ventas con filtros de fecha
   - Reporte de gastos
   - KPIs (ingresos, gastos, margen)
   - **Formatos DGII completos:**
     - Formato 606 (Compras)
     - Formato 607 (Ventas)
     - Formato 608 (Anulaciones)
     - Formato 609 (Pagos al Exterior)
     - IT-1 (Declaración ITBIS)
   - Exportación en **CSV** y **TXT pipe-delimited** (formato oficial DGII)

### Archivos creados/modificados

- `FloatingButtons.tsx` — Reescrito completamente
- `AdminReports.tsx` — Reescrito con reportes DGII

---

## Fase 9: Integración API DGII

**Commits:** `ae8efef`

### Lo que se hizo

- Creación del servicio `lib/dgiiService.ts` con:
  - `consultarRNC(rnc)` — Consulta directa por RNC/Cédula
  - `buscarContribuyentes({ nombre, ... })` — Búsqueda por nombre
- **Integración en AdminClients.tsx:**
  - Campo de búsqueda por nombre de empresa (debounce 400ms)
  - Dropdown con resultados de la DGII (nombre, RNC, estado, actividad)
  - Auto-lookup al escribir RNC/Cédula (≥9 dígitos)
  - Banner verde de confirmación con botón "Usar datos"
  - Banner amarillo si RNC no encontrado
  - Auto-fill de: nombre/razón social, dirección, teléfono, tipo (física/jurídica)
- **Integración en AdminSuppliers.tsx:**
  - Misma funcionalidad de búsqueda y auto-lookup
  - Auto-fill de datos del proveedor

### API utilizada

```
Base URL: https://pptonanntevatndjyzmk.supabase.co/functions/v1/dgii-api
Header: x-api-key: {VITE_DGII_API_KEY}
Endpoints:
  GET /rnc/{rnc}           → Consulta directa
  GET /search?nombre=...   → Búsqueda por nombre
```

### Decisiones

- Se usó la API REST directa, NO el servidor MCP (a pedido del usuario)
- Debounce de 400ms para evitar exceso de peticiones
- Los datos se aplican con un clic, no automáticamente, para dar control al usuario

---

## Fase 10: Seguridad

**Commits:** `c172161` → `9a13a85`

### Lo que se hizo

#### Clickjacking (CORREGIDO ✅)

- Headers en `vercel.json`:
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: frame-ancestors 'none'`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- Script **framebusting** en `index.html` (defensa en profundidad)

#### API Key Expuesta (CORREGIDO ✅)

- DGII API key movida de hardcoded → `import.meta.env.VITE_DGII_API_KEY`
- Creación de `vite-env.d.ts` con declaraciones de tipos para env vars

#### Auditoría completa documentada

- 10 vulnerabilidades identificadas (2 críticas, 3 altas, 3 medias, 2 bajas)
- Reporte de seguridad con plan de acción prioritizado

### Pendientes de seguridad

- ⚠️ Activar RLS en todas las tablas de Supabase
- ⚠️ Crear proxy backend para API keys (DGII, Gemini)
- ⚠️ Agregar `VITE_DGII_API_KEY` en Vercel Dashboard

---

## 📊 Resumen de Métricas

| Métrica | Valor |
|---|---|
| **Total de commits** | 50+ |
| **Componentes creados** | 50 archivos TSX |
| **Tablas Supabase** | 14 tablas |
| **Rutas de la app** | 9 públicas + 21 admin = 30 rutas |
| **Integraciones** | Supabase, DGII API, WhatsApp, Gemini AI |
| **Formatos DGII** | 606, 607, 608, 609, IT-1 |
| **Headers de seguridad** | 7 implementados |
| **Líneas de código** | ~15,000+ (componentes) |

---

## 🔄 Historial de Commits (Completo)

```
9a13a85 security: move DGII API key to env vars, add vite-env.d.ts
c172161 security: add clickjacking protection - X-Frame-Options, CSP, HSTS
d090c82 style(floating): make buttons circular (icon only)
ae8efef feat(dgii): add DGII API integration for RNC autocomplete
4f862ba feat(reports): add complete DGII reports - 606, 607, 608, 609, IT-1
a78ad58 fix(floating): move buttons to right column, agent photo, business hours
66f9e4d feat: remove drone, add floating chatbot + WhatsApp + accounting reports
8a84730 feat(invoices): add inline quick product creation
3f30e61 feat: make Process and Features dynamic and editable
26117c8 style: set fixed h-[380px] on service cards
5f385cf style: larger client logos with hover pause
90aa700 fix(clients): fix overlapping logos with fixed width
539eceb style: set fixed min-height on service cards
24ffac2 style: truncate service description text
2df7489 style: center service cards, 4 columns per row
36aac5c style: fix tiltcard inner div height
6c6576e style: set equal height for service cards
e0cca2d style: rename navbar, add background images to services
3c7e631 fix(projects): replace ProjectModal with ProjectDetailPage
11c9878 chore: add react-doctor dependency
92e0af9 fix(footer): correct data binding for snake_case
35b3783 feat(Services): dynamic icon selection from DB
773e249 fix(AdminServices): scrollable edit modal
1175ba7 fix(AdminInvoices): prevent crash on number filtering
802aed1 feat: Invoice search, UI tweaks to drone and footer
f0ab3ec fix: prevent crt flash animation in admin navigation
72e610f feat: auto-generate product reference codes
315527d feat: auto-generate slugs in AdminServices
77658b2 fix: sanitize upload filenames
169de29 fix: adjust modal z-index, about image, footer logo, drone size
60d47a7 feat: sync AdminDashboard with Supabase + invoice deletion
09fa0cc UI: modern scrollbar styling
bf56873 chore: remove trabajos folder
1f55d16 UI: reduce sidebar button spacing
ef7abf2 feat: add Misión and Visión, expand core values
0c878b0 fix: map image_url to image correctly
206319f style: remove intro animation and admin panel button
ae35fe6 feat: add dynamic HomeProjects section
532ecd3 style: center team cards
4239981 feat: update admin components to fetch from Supabase
427d249 fix: logos no overlap, About images in color, SEO metadata
ef138b8 feat: migrate AdminInvoices+AdminPOS to Supabase
28cf544 feat: sync all content to Supabase + admin editability
68859e6 fix: connect public pages to Supabase + remove login email
416a881 feat: upload 20 real client logos to Supabase
3bde296 feat: migrate AdminHero, AdminFooter, AdminAbout to Supabase
c84980b feat: migrate products, categories to Supabase + Storage uploads
b9e75d7 fix: add vercel.json SPA rewrite rule
0967e8d feat: migrate admin modules to Supabase CRUD + storage
a05f90f feat: connect AdminClients to Supabase, add RLS policies
aa52ee1 feat: initial deploy - Supabase auth + all admin modules + Vite SPA
```
