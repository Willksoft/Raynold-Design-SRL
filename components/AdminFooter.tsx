import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

export interface FooterData {
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  brandDescription: string;
  instagramUrl: string;
  whatsappUrl: string;
  emailUrl: string;
  location: string;
  phone: string;
  email: string;
}

const defaultFooterData: FooterData = {
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

const AdminFooter = () => {
  const [formData, setFormData] = useState<FooterData>(defaultFooterData);

  useEffect(() => {
    const saved = localStorage.getItem('admin_footer_data');
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('admin_footer_data', JSON.stringify(formData));
    alert('Configuración del Footer guardada correctamente.');
  };

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Editar Footer</h1>
        <p className="text-gray-400">Modifica el contenido del pie de página de la web.</p>
      </div>
      
      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* CTA Section */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Sección Llamado a la Acción (CTA)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Título CTA</label>
                <input 
                  type="text" 
                  value={formData.ctaTitle}
                  onChange={e => setFormData({...formData, ctaTitle: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subtítulo CTA</label>
                <input 
                  type="text" 
                  value={formData.ctaSubtitle}
                  onChange={e => setFormData({...formData, ctaSubtitle: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Texto Botón</label>
                <input 
                  type="text" 
                  value={formData.ctaButtonText}
                  onChange={e => setFormData({...formData, ctaButtonText: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enlace Botón</label>
                <input 
                  type="text" 
                  value={formData.ctaButtonLink}
                  onChange={e => setFormData({...formData, ctaButtonLink: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Brand & Social */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Marca y Redes Sociales</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descripción de la Marca</label>
                <textarea 
                  rows={2}
                  value={formData.brandDescription}
                  onChange={e => setFormData({...formData, brandDescription: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">URL Instagram</label>
                  <input 
                    type="url" 
                    value={formData.instagramUrl}
                    onChange={e => setFormData({...formData, instagramUrl: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">URL WhatsApp</label>
                  <input 
                    type="url" 
                    value={formData.whatsappUrl}
                    onChange={e => setFormData({...formData, whatsappUrl: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">URL Email (mailto:)</label>
                  <input 
                    type="text" 
                    value={formData.emailUrl}
                    onChange={e => setFormData({...formData, emailUrl: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ubicación</label>
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Teléfono</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Visible</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-end">
            <button type="submit" className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2">
              <Save size={18} />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFooter;
