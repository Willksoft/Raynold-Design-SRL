import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, MapPin, ArrowRight, Phone, Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Official WhatsApp Logo Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const defaultFooterData = {
  ctaTitle: "¿Tienes un proyecto en mente?",
  ctaSubtitle: "Transformamos tu visión en realidad visual.",
  ctaButtonText: "Cotizar Ahora",
  ctaButtonLink: "https://wa.me/18295807411",
  brandDescription: "Expertos en diseño gráfico, impresión y soluciones publicitarias futuristas en República Dominicana.",
  instagramUrl: "https://instagram.com/raynolddesignsrl",
  whatsappUrl: "https://wa.me/18295807411",
  emailUrl: "mailto:cotizaciones@raynolddesignssrl.com",
  location: "Punta Cana, República Dominicana",
  phone: "829-580-7411",
  email: "cotizaciones@raynolddesignssrl.com"
};

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [footerData, setFooterData] = useState(defaultFooterData);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'footer_data').single();
      if (data) {
        const parsed = JSON.parse(data.value);
        setFooterData({
          ...defaultFooterData,
          ctaTitle: parsed.cta_title || parsed.ctaTitle || defaultFooterData.ctaTitle,
          ctaSubtitle: parsed.cta_subtitle || parsed.ctaSubtitle || defaultFooterData.ctaSubtitle,
          ctaButtonText: parsed.cta_button_text || parsed.ctaButtonText || defaultFooterData.ctaButtonText,
          ctaButtonLink: parsed.cta_button_link || parsed.ctaButtonLink || defaultFooterData.ctaButtonLink,
          brandDescription: parsed.brand_description || parsed.brandDescription || defaultFooterData.brandDescription,
          instagramUrl: parsed.instagram_url || parsed.instagramUrl || defaultFooterData.instagramUrl,
          whatsappUrl: parsed.whatsapp_url || parsed.whatsappUrl || defaultFooterData.whatsappUrl,
          emailUrl: parsed.email_url || parsed.emailUrl || defaultFooterData.emailUrl,
          location: parsed.location || defaultFooterData.location,
          phone: parsed.phone || defaultFooterData.phone,
          email: parsed.email || defaultFooterData.email,
        });
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-black pt-10 pb-6 px-4">
      <div className="max-w-7xl mx-auto bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] overflow-hidden relative shadow-2xl">

        {/* Decorative Background Blurs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-raynold-red/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-raynold-green/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* CTA Banner */}
        <div className="bg-white/5 border-b border-white/10 p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-futuristic font-bold text-white mb-2">
              {footerData.ctaTitle}
            </h3>
            <p className="text-gray-400">{footerData.ctaSubtitle}</p>
          </div>
          <a
            href={footerData.ctaButtonLink}
            target="_blank"
            rel="noreferrer"
            className="relative z-10 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            {footerData.ctaButtonText} <ArrowRight size={18} />
          </a>
        </div>

        <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              {/* Replace the CSS logo with the official logo */}
              <div className="h-10 w-auto relative">
                <img
                  src="https://ymiqmbzsmeqexgztquwj.supabase.co/storage/v1/object/public/raynold-media/brand/logo-blanco-r.svg"
                  alt="Raynold Design SRL"
                  className="h-full w-auto object-contain drop-shadow-lg"
                  onError={(e) => {
                    // Fallback to text if the logo fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div className="hidden flex-col">
                  <span className="font-futuristic font-bold text-white leading-none tracking-wider">RAYNOLD</span>
                  <span className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">Design SRL</span>
                </div>
              </div>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              {footerData.brandDescription}
            </p>
            <div className="flex gap-3">
              <a href={footerData.instagramUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-red-500 hover:to-purple-500 hover:text-white transition-all duration-300">
                <Instagram size={18} />
              </a>
              <a href={footerData.whatsappUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#25D366] hover:text-white transition-all duration-300">
                <WhatsAppIcon className="w-5 h-5" />
              </a>
              <a href={footerData.emailUrl} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black transition-all duration-300">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="text-white font-bold font-futuristic mb-6">Explorar</h4>
            <ul className="space-y-4">
              <li><Link to="/products" className="text-gray-500 hover:text-raynold-red transition-colors text-sm flex items-center gap-2"><div className="w-1 h-1 bg-gray-600 rounded-full"></div> Catálogo</Link></li>
              <li><Link to="/projects" className="text-gray-500 hover:text-raynold-red transition-colors text-sm flex items-center gap-2"><div className="w-1 h-1 bg-gray-600 rounded-full"></div> Proyectos</Link></li>
              <li><Link to="/about" className="text-gray-500 hover:text-raynold-red transition-colors text-sm flex items-center gap-2"><div className="w-1 h-1 bg-gray-600 rounded-full"></div> Nosotros</Link></li>
              <li><Link to="/contact" className="text-gray-500 hover:text-raynold-red transition-colors text-sm flex items-center gap-2"><div className="w-1 h-1 bg-gray-600 rounded-full"></div> Contacto</Link></li>
            </ul>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="text-white font-bold font-futuristic mb-6">Servicios</h4>
            <ul className="space-y-4">
              <li><Link to="/services/diseno-grafico" className="text-gray-500 hover:text-raynold-green transition-colors text-sm">Diseño Gráfico</Link></li>
              <li><Link to="/services/fabricacion-letreros" className="text-gray-500 hover:text-raynold-green transition-colors text-sm">Letreros 3D & Neon</Link></li>
              <li><Link to="/services/servicio-impresion" className="text-gray-500 hover:text-raynold-green transition-colors text-sm">Impresión Digital</Link></li>
              <li><Link to="/services/laminado-vehiculos" className="text-gray-500 hover:text-raynold-green transition-colors text-sm">Car Wrapping</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-white font-bold font-futuristic mb-6">Info Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-500 text-sm">
                <MapPin size={18} className="text-raynold-red shrink-0 mt-0.5" />
                <span>{footerData.location}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500 text-sm">
                <Phone size={18} className="text-raynold-green shrink-0" />
                <span>{footerData.phone}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500 text-sm">
                <Send size={18} className="text-blue-400 shrink-0" />
                <span>{footerData.email}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="bg-black/40 border-t border-white/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>&copy; {currentYear} Raynold Design SRL. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos de Servicio</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;