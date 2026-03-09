import React, { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface FooterData {
  cta_title: string;
  cta_subtitle: string;
  cta_button_text: string;
  cta_button_link: string;
  brand_description: string;
  instagram_url: string;
  whatsapp_url: string;
  email_url: string;
  location: string;
  phone: string;
  email: string;
}

const defaultData: FooterData = {
  cta_title: "¿Tienes un proyecto en mente?",
  cta_subtitle: "Transformamos tu visión en realidad visual.",
  cta_button_text: "Cotizar Ahora",
  cta_button_link: "https://wa.me/18295807411",
  brand_description: "Expertos en diseño gráfico, impresión y soluciones publicitarias futuristas en República Dominicana.",
  instagram_url: "https://instagram.com/raynolddesignsrl",
  whatsapp_url: "https://wa.me/18295807411",
  email_url: "mailto:cotizaciones@raynolddesignssrl.com",
  location: "Punta Cana, República Dominicana",
  phone: "829-580-7411",
  email: "cotizaciones@raynolddesignssrl.com"
};

const AdminFooter = () => {
  const [formData, setFormData] = useState<FooterData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from('site_settings').select('*').eq('key', 'footer_data').single();
      if (data) {
        setSavedId(data.id);
        setFormData({ ...defaultData, ...JSON.parse(data.value) });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { key: 'footer_data', value: JSON.stringify(formData) };
    if (savedId) {
      await supabase.from('site_settings').update(payload).eq('id', savedId);
    } else {
      const { data } = await supabase.from('site_settings').insert([payload]).select().single();
      if (data) setSavedId(data.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const field = (label: string, key: keyof FooterData, type = 'text', rows?: number) => (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      {rows ? (
        <textarea rows={rows} value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })}
          className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors resize-none" />
      ) : (
        <input type={type} value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })}
          className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors" />
      )}
    </div>
  );

  if (loading) return <div className="flex justify-center items-center h-48 text-gray-500"><Loader2 className="animate-spin mr-2" size={20} /> Cargando...</div>;

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Editar Footer</h1>
        <p className="text-gray-400">Modifica el contenido del pie de página de la web.</p>
      </div>
      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Sección Llamado a la Acción (CTA)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('Título CTA', 'cta_title')}
              {field('Subtítulo CTA', 'cta_subtitle')}
              {field('Texto Botón', 'cta_button_text')}
              {field('Enlace Botón', 'cta_button_link')}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Marca y Redes Sociales</h3>
            <div className="space-y-4">
              {field('Descripción de la Marca', 'brand_description', 'text', 2)}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {field('URL Instagram', 'instagram_url', 'url')}
                {field('URL WhatsApp', 'whatsapp_url', 'url')}
                {field('URL Email (mailto:)', 'email_url')}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {field('Ubicación', 'location')}
              {field('Teléfono', 'phone')}
              {field('Email Visible', 'email', 'email')}
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 flex justify-end">
            <button type="submit" className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2">
              {saved ? <><CheckCircle size={18} className="text-green-400" /> ¡Guardado!</> : <><Save size={18} /> Guardar Cambios</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFooter;
