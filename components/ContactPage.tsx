import React, { useState } from 'react';
import { Mail, Instagram, ArrowUpRight, Send } from 'lucide-react';
import { ContactInfo } from '../types';

const contactInfo: ContactInfo = {
  whatsapp: '829-580-7411',
  instagram: '@raynolddesignsrl',
  email: 'cotizaciones@raynolddesignssrl.com',
  domain: 'raynolddesignssrl.com',
  address: 'Punta Cana, República Dominicana'
};

// Official WhatsApp Logo Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: 'Diseño Gráfico',
    details: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleWhatsAppSubmit = () => {
    const message = `Hola Raynold Design, mi nombre es ${formData.name}.%0A%0AEstoy interesado en: ${formData.service}.%0A%0A*Detalles:* ${formData.details}%0A%0A*Teléfono:* ${formData.phone}`;
    window.open(`https://wa.me/18295807411?text=${message}`, '_blank');
  };

  return (
    <div className="pt-24 min-h-screen bg-gradient-to-b from-raynold-black to-gray-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          <div className="flex flex-col justify-center">
            <h2 className="text-4xl md:text-6xl font-futuristic font-bold text-white mb-6 leading-tight">
              Inicia tu <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-raynold-red to-orange-500">Transformación</span>
            </h2>
            <p className="text-gray-400 mb-10 text-lg font-light leading-relaxed">
              Estamos listos para llevar tu marca al siguiente nivel. Contáctanos directamente y recibe asesoría personalizada de expertos.
            </p>

            <div className="space-y-6">
              {/* WhatsApp Special Button */}
              <a 
                href={`https://wa.me/1${contactInfo.whatsapp.replace(/-/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-6 p-6 bg-[#25D366]/10 rounded-2xl hover:bg-[#25D366]/20 transition-all border border-[#25D366]/20 hover:border-[#25D366] group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#25D366]/5 blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-lg shadow-green-900/50 z-10">
                  <WhatsAppIcon className="w-8 h-8" />
                </div>
                <div className="z-10">
                  <h3 className="text-white font-bold text-xl font-futuristic">WhatsApp Oficial</h3>
                  <p className="text-[#25D366] font-mono">{contactInfo.whatsapp}</p>
                </div>
                <ArrowUpRight className="ml-auto text-[#25D366] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform z-10" />
              </a>

              {/* Instagram */}
              <a 
                href="https://instagram.com/raynolddesignsrl" 
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-6 p-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10 group"
              >
                <div className="w-10 h-10 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                  <Instagram size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold">Instagram</h3>
                  <p className="text-gray-500 text-sm">Portafolio visual</p>
                </div>
                <ArrowUpRight className="ml-auto text-gray-600 group-hover:text-white" size={16} />
              </a>

              {/* Email */}
              <a 
                href={`mailto:${contactInfo.email}`}
                className="flex items-center gap-6 p-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10 group"
              >
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-white border border-white/10">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold">Correo Corporativo</h3>
                  <p className="text-gray-500 text-sm break-all">{contactInfo.email}</p>
                </div>
                <ArrowUpRight className="ml-auto text-gray-600 group-hover:text-white" size={16} />
              </a>
            </div>
          </div>

          <div className="glass-panel p-8 md:p-10 rounded-3xl relative overflow-hidden">
             {/* Decorative circles */}
             <div className="absolute -top-20 -right-20 w-80 h-80 bg-raynold-red/10 rounded-full blur-[100px]"></div>
             <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-raynold-green/10 rounded-full blur-[100px]"></div>
             
             <h3 className="text-2xl font-futuristic text-white mb-8 relative z-10">Cotización Rápida</h3>
             <form className="space-y-5 relative z-10">
               <div className="grid grid-cols-2 gap-5">
                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre</label>
                   <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-raynold-red focus:bg-black/60 outline-none transition-all placeholder-gray-700" 
                      placeholder="Tu nombre" 
                   />
                 </div>
                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Teléfono</label>
                   <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-raynold-red focus:bg-black/60 outline-none transition-all placeholder-gray-700" 
                      placeholder="000-000-0000" 
                    />
                 </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Servicio de Interés</label>
                  <select 
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-raynold-red focus:bg-black/60 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option className="bg-gray-900">Diseño Gráfico</option>
                    <option className="bg-gray-900">Letreros 3D / Neon</option>
                    <option className="bg-gray-900">Impresión Gran Formato</option>
                    <option className="bg-gray-900">Rotulación / Wrapping</option>
                    <option className="bg-gray-900">Artículos Personalizados</option>
                  </select>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detalles del Proyecto</label>
                 <textarea 
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    rows={4} 
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-raynold-red focus:bg-black/60 outline-none transition-all placeholder-gray-700" 
                    placeholder="Cuéntanos sobre tu idea..."
                  ></textarea>
               </div>
               <button 
                  type="button" 
                  onClick={handleWhatsAppSubmit}
                  className="w-full py-4 bg-white text-black font-black text-lg rounded-lg btn-animated uppercase font-futuristic shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 border-0"
               >
                 <Send size={20} className="text-white" />
                 Enviar a WhatsApp
               </button>
             </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;