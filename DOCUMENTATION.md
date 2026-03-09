# Documentación y PRD (Product Requirements Document)
**Proyecto:** Raynold Design SRL - Plataforma Web y Portafolio
**Versión:** 1.0.0
**Fecha:** Marzo 2026

---

## 1. Introducción
Este documento contiene la especificación de requisitos del producto (PRD) y la documentación técnica para la plataforma web de **Raynold Design SRL**. La aplicación es una experiencia web futurista, altamente animada y orientada a la conversión, diseñada para mostrar servicios de diseño, productos físicos (impresión, señalización, textil) y facilitar la cotización directa a través de WhatsApp, complementada con un asistente de Inteligencia Artificial.

---

## 2. Product Requirements Document (PRD)

### 2.1. Visión del Producto
Crear una experiencia digital inmersiva que posicione a Raynold Design SRL como una agencia de vanguardia. La plataforma no solo debe funcionar como un portafolio, sino como una herramienta de ventas interactiva que permita a los usuarios explorar productos, guardar favoritos, armar cotizaciones y recibir asesoría instantánea mediante IA.

### 2.2. Público Objetivo
*   **Empresas (B2B):** Buscan soluciones de señalización, material promocional, branding corporativo y diseño de interiores/exteriores.
*   **Emprendedores y Particulares (B2C):** Buscan impresiones personalizadas, rotulación de vehículos (wrapping) y diseño gráfico general.

### 2.3. Objetivos Clave
1.  **Aumentar la conversión:** Facilitar el contacto directo y la solicitud de cotizaciones vía WhatsApp.
2.  **Mejorar la experiencia de usuario (UX):** Proveer una interfaz rápida, con animaciones fluidas (estilo cyberpunk/futurista) que retenga la atención.
3.  **Automatizar la atención inicial:** Utilizar un asistente de IA para responder preguntas frecuentes y guiar a los usuarios hacia los servicios adecuados.

### 2.4. Requisitos Funcionales (Funcionalidades Core)
*   **Catálogo de Productos:** Visualización de productos filtrables por categoría (Señalización, Impresión, Promocional, Textil, etc.).
*   **Sistema de Cotización (Carrito):** Capacidad de añadir productos a un "carrito" que consolida una lista de interés para ser enviada como solicitud de cotización vía WhatsApp.
*   **Sistema de Favoritos:** Permite a los usuarios marcar productos con una "estrella" para guardarlos en una lista personalizada (`/favorites`) para futura referencia.
*   **Asistente de IA (Consultor):** Un chat integrado impulsado por Google Gemini que asesora sobre diseño, materiales y servicios de la empresa.
*   **Portafolio de Proyectos:** Galería de trabajos previos para validar la experiencia de la agencia.
*   **Detalle de Servicios:** Páginas dinámicas que explican a fondo cada servicio ofrecido.

### 2.5. Requisitos No Funcionales
*   **Rendimiento:** Carga rápida a pesar de las animaciones complejas.
*   **Diseño Responsivo:** Experiencia perfecta tanto en dispositivos móviles como en pantallas ultra anchas.
*   **Estética:** Tema oscuro (Dark Mode por defecto), tipografías futuristas, efectos CRT, glitch, y partículas parallax.
*   **Accesibilidad:** Contraste adecuado y navegación clara a pesar de los efectos visuales.

---

## 3. Arquitectura Técnica

### 3.1. Stack Tecnológico
*   **Framework Core:** React 18 con TypeScript.
*   **Build Tool:** Vite.
*   **Enrutamiento:** React Router DOM v6.
*   **Estilos:** Tailwind CSS (configurado con variables personalizadas para colores de la marca: `raynold-red`, `raynold-green`, `raynold-black`).
*   **Animaciones:** 
    *   Framer Motion (Transiciones de página, layout animations, interacciones UI).
    *   GSAP (ScrollTrigger, animaciones complejas basadas en scroll).
*   **Iconografía:** Lucide React.
*   **IA:** `@google/genai` (Integración con modelos Gemini).

### 3.2. Estructura del Proyecto
```text
/
├── src/
│   ├── components/       # Componentes reutilizables (Navbar, Hero, ProductModal, etc.)
│   ├── context/          # Gestión de estado global (ShopContext)
│   ├── data/             # Datos estáticos (products.ts, services.ts)
│   ├── services/         # Lógica de integración externa (geminiService.ts)
│   ├── types.ts          # Definiciones de interfaces TypeScript
│   ├── App.tsx           # Componente raíz y configuración de rutas
│   └── index.css         # Estilos globales y directivas de Tailwind
├── index.html            # Punto de entrada HTML
├── vite.config.ts        # Configuración de Vite
└── package.json          # Dependencias y scripts
```

### 3.3. Gestión del Estado
El estado principal de la aplicación se maneja a través de React Context API:
*   **`ShopContext`**: Gestiona el estado del carrito de cotizaciones (`cart`), la lista de favoritos (`favorites`), y la visibilidad del sidebar del carrito (`isCartOpen`). Provee funciones como `addToCart`, `removeFromCart`, `toggleFavorite`, y `clearCart`.

---

## 4. Flujos de Usuario Principales

### 4.1. Flujo de Cotización de Productos
1. El usuario navega a `/products`.
2. Filtra por categoría o explora el catálogo.
3. Hace clic en un producto para ver el `ProductModal`.
4. Hace clic en "Añadir a Cotización". El producto se guarda en el `ShopContext`.
5. Abre el `CartSidebar` (icono de carrito en el Navbar).
6. Revisa su lista y hace clic en "Enviar Cotización por WhatsApp".
7. Se genera un enlace dinámico de WhatsApp con el texto preformateado incluyendo los ítems seleccionados.

### 4.2. Flujo de Favoritos
1. El usuario navega por el catálogo (`/products`).
2. Hace clic en el icono de "Estrella" en la tarjeta del producto o dentro del modal.
3. El ID del producto se guarda en el array `favorites` del `ShopContext`.
4. El usuario navega a `/favorites` (haciendo clic en la estrella del Navbar).
5. Visualiza su lista guardada, desde donde puede añadir los ítems directamente a la cotización o eliminarlos de favoritos.

### 4.3. Interacción con el Consultor IA
1. El usuario hace clic en el widget flotante del "Consultor IA" o navega a la sección correspondiente.
2. Ingresa una consulta (ej. "¿Qué material recomiendan para un letrero exterior?").
3. La solicitud se envía a `geminiService.ts`, que se comunica con la API de Google Gemini utilizando un prompt de sistema predefinido que instruye a la IA a actuar como un experto de Raynold Design.
4. La respuesta se renderiza en la interfaz de chat con efecto de escritura (typing effect).

---

## 5. Integraciones Externas

*   **WhatsApp API:** Utilizada mediante enlaces `wa.me` para redirigir a los usuarios directamente al chat de la empresa con mensajes prellenados.
*   **Google Gemini API:** Requiere la variable de entorno `GEMINI_API_KEY`. Se utiliza el modelo `gemini-3-flash-preview` (o equivalente configurado) para respuestas rápidas y precisas en el consultor virtual.

---

## 6. Guía de Desarrollo y Despliegue

### 6.1. Variables de Entorno
Crear un archivo `.env.local` en la raíz del proyecto con las siguientes variables:
```env
GEMINI_API_KEY=tu_api_key_aqui
```

### 6.2. Scripts Disponibles
*   `npm run dev`: Inicia el servidor de desarrollo en `localhost:3000`.
*   `npm run build`: Compila la aplicación para producción en la carpeta `/dist`.
*   `npm run preview`: Previsualiza la build de producción localmente.

### 6.3. Notas de Mantenimiento
*   **Catálogo:** Para agregar nuevos productos, editar el archivo `/data/products.ts`.
*   **Servicios:** Para modificar la oferta de servicios, editar `/data/services.ts`.
*   **Animaciones:** Las animaciones de entrada están controladas por `Framer Motion` (ver `CrtTransition.tsx`), mientras que las animaciones basadas en scroll están controladas por `GSAP` (ver `GsapController.tsx`).
