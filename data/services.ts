import { 
  ComputerDesktopIcon, 
  PrinterIcon, 
  GiftIcon, 
  BuildingOffice2Icon, 
  TruckIcon,
} from '@heroicons/react/24/outline';
import { TvMinimal } from 'lucide-react';
import { ServiceItem } from '../types';

export interface ServiceDetail extends ServiceItem {
  slug: string;
  image: string;
  fullDescription: string;
  features: string[];
  benefits: { title: string; desc: string }[];
}

export const servicesData: ServiceDetail[] = [
  {
    id: '1',
    slug: 'diseno-grafico',
    title: 'Diseño Gráfico',
    description: 'Identidad visual impactante, branding corporativo y arte digital de vanguardia.',
    fullDescription: 'En Raynold Design, transformamos ideas abstractas en lenguajes visuales coherentes. Nuestro servicio de diseño gráfico no se trata solo de hacer cosas "bonitas", sino de comunicar estratégicamente los valores de tu empresa. Desde la creación de logotipos memorables hasta sistemas de identidad completos, nuestro enfoque es futurista, limpio y funcional.',
    icon: ComputerDesktopIcon,
    color: 'red',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799314346d?q=80&w=2070&auto=format&fit=crop',
    features: ['Diseño de Logotipos', 'Manual de Marca', 'Diseño UI/UX', 'Publicidad para Redes Sociales', 'Vectorización'],
    benefits: [
        { title: 'Identidad Única', desc: 'Diferénciate de la competencia con un estilo visual propio.' },
        { title: 'Comunicación Clara', desc: 'Transmite tu mensaje de manera efectiva y rápida.' }
    ]
  },
  {
    id: '2',
    slug: 'fabricacion-letreros',
    title: 'Fabricación de Letreros',
    description: 'Letreros 3D, cajas de luz, neón flex y señalética arquitectónica.',
    fullDescription: 'Somos expertos en la fabricación de rótulos que destacan día y noche. Utilizamos tecnología CNC y láser para cortes precisos en materiales como acrílico, ACM, acero inoxidable y PVC. Nuestra especialidad son los letreros luminosos con tecnología LED de bajo consumo, garantizando durabilidad y un impacto visual inigualable para tu local comercial.',
    icon: TvMinimal,
    color: 'green',
    image: 'https://images.unsplash.com/photo-1555431189-0fabf2667795?q=80&w=1000&auto=format&fit=crop',
    features: ['Letras Corpóreas 3D', 'Cajas de Luz (Lightboxes)', 'Neon Flex Personalizado', 'Señalética de Seguridad', 'Totems Publicitarios'],
    benefits: [
        { title: 'Visibilidad 24/7', desc: 'Tu negocio visible a cualquier hora del día.' },
        { title: 'Durabilidad', desc: 'Materiales resistentes a la intemperie y el sol del Caribe.' }
    ]
  },
  {
    id: '3',
    slug: 'servicio-impresion',
    title: 'Servicio de Impresión',
    description: 'Gran formato, vinilos y papelería corporativa.',
    fullDescription: 'Ofrecemos soluciones de impresión digital de alta resolución para cualquier tamaño. Desde tarjetas de presentación con acabados premium hasta vallas publicitarias gigantes. Contamos con equipos de impresión UV, solvente y ecosolvente que aseguran colores vibrantes y una nitidez fotográfica en vinilos, lonas, microperforados y papel.',
    icon: PrinterIcon,
    color: 'white',
    image: 'https://images.unsplash.com/photo-1562564055-71e051d33c19?q=80&w=2070&auto=format&fit=crop',
    features: ['Impresión Gran Formato', 'Vinilo Adhesivo', 'Microperforado', 'Papelería Corporativa', 'Flyers y Brochure'],
    benefits: [
        { title: 'Alta Resolución', desc: 'Impresiones nítidas que reflejan profesionalismo.' },
        { title: 'Variedad de Sustratos', desc: 'Imprimimos sobre casi cualquier material rígido o flexible.' }
    ]
  },
  {
    id: '4',
    slug: 'rotulos-corporativos',
    title: 'Rótulos Corporativos',
    description: 'Transformamos fachadas y espacios interiores para reflejar la esencia de tu empresa.',
    fullDescription: 'El entorno físico de tu empresa habla por ti. Nos encargamos de la rotulación integral de oficinas, cristales, fachadas y espacios comerciales. Utilizamos vinilos esmerilados para privacidad, murales decorativos y señalética direccional que mejora la experiencia de tus clientes y empleados dentro de tus instalaciones.',
    icon: BuildingOffice2Icon,
    color: 'red',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop',
    features: ['Fachadas en ACM', 'Vinilo Esmerilado (Frosted)', 'Decoración de Interiores', 'Señalización Arquitectónica'],
    benefits: [
        { title: 'Imagen Profesional', desc: 'Estandariza la imagen de tus sucursales.' },
        { title: 'Ambiente Moderno', desc: 'Espacios de trabajo más agradables y productivos.' }
    ]
  },
  {
    id: '5',
    slug: 'laminado-vehiculos',
    title: 'Laminado y Wrapping',
    description: 'Protección y cambio de color para vehículos (Car Wrapping) y laminado arquitectónico.',
    fullDescription: 'El Car Wrapping es el futuro de la publicidad móvil y la personalización automotriz. Convertimos tu vehículo en una valla publicitaria en movimiento o simplemente cambiamos su color con vinilos de alta gama (Avery, 3M) que protegen la pintura original. También ofrecemos laminado arquitectónico para renovar muebles, elevadores y puertas sin necesidad de obra civil.',
    icon: TruckIcon,
    color: 'green',
    image: 'https://images.unsplash.com/photo-1625902377366-41e73e979a40?q=80&w=1000&auto=format&fit=crop',
    features: ['Car Wrapping Comercial', 'Cambio de Color (Color Change)', 'Paint Protection Film (PPF)', 'Laminado de Muebles'],
    benefits: [
        { title: 'Publicidad Móvil', desc: 'Miles de impresiones visuales al día en el tráfico.' },
        { title: 'Protección', desc: 'Resguarda la pintura original contra rayones y rayos UV.' }
    ]
  },
  {
    id: '6',
    slug: 'articulos-personalizados',
    title: 'Artículos Personalizados',
    description: 'Merchandising, regalos corporativos, tazas, camisetas y grabado láser.',
    fullDescription: 'Fideliza a tus clientes y equipa a tu equipo con artículos promocionales de calidad. Desde camisetas y gorras bordadas hasta termos grabados con láser y bolígrafos premium. Nos encargamos de que tu marca esté presente en la vida diaria de las personas a través de objetos útiles y estéticamente atractivos.',
    icon: GiftIcon,
    color: 'white',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=1000&auto=format&fit=crop',
    features: ['Bordado de Gorras y Polos', 'Grabado Láser en Metal/Madera', 'Sublimación de Tazas', 'Merchandising para Eventos'],
    benefits: [
        { title: 'Recordación de Marca', desc: 'Mantén tu marca en la mente del consumidor.' },
        { title: 'Calidad Premium', desc: 'Artículos duraderos que hablan bien de tu empresa.' }
    ]
  }
];