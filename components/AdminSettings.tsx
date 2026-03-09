import React, { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const AdminSettings = () => {
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    instagram_url: '',
    location: ''
  });
  const [headerData, setHeaderData] = useState({
    show_solutions: true,
    show_projects: true,
    show_about: true,
    show_contact: true,
  });
  const [loading, setLoading] = useState(true);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [headerSavedId, setHeaderSavedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fullData, setFullData] = useState<any>({});


  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const [footerRes, headerRes] = await Promise.all([
        supabase.from('site_settings').select('*').eq('key', 'footer_data').single(),
        supabase.from('site_settings').select('*').eq('key', 'header_data').single()
      ]);

      if (footerRes.data) {
        setSavedId(footerRes.data.id);
        const parsed = JSON.parse(footerRes.data.value);
        setFullData(parsed);
        setFormData({
          phone: parsed.phone || '',
          email: parsed.email || '',
          instagram_url: parsed.instagram_url || '',
          location: parsed.location || ''
        });
      }

      if (headerRes.data) {
        setHeaderSavedId(headerRes.data.id);
        const parsedHeader = JSON.parse(headerRes.data.value);
        setHeaderData({
          show_solutions: parsedHeader.show_solutions ?? true,
          show_projects: parsedHeader.show_projects ?? true,
          show_about: parsedHeader.show_about ?? true,
          show_contact: parsedHeader.show_contact ?? true,
        });
      }

      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleHeaderChange = (key: string) => {
    setHeaderData(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData = {
      ...fullData,
      phone: formData.phone,
      email: formData.email,
      instagram_url: formData.instagram_url,
      location: formData.location,
      // Auto-update the URLs based on inputs
      whatsapp_url: `https://wa.me/1${formData.phone.replace(/[^0-9]/g, '')}`,
      email_url: `mailto:${formData.email}`
    };

    const footerPayload = { key: 'footer_data', value: JSON.stringify(updatedData) };
    const headerPayload = { key: 'header_data', value: JSON.stringify(headerData) };

    const promises = [];

    if (savedId) {
      promises.push(supabase.from('site_settings').update(footerPayload).eq('id', savedId));
    } else {
      promises.push(supabase.from('site_settings').insert([footerPayload]));
    }

    if (headerSavedId) {
      promises.push(supabase.from('site_settings').update(headerPayload).eq('id', headerSavedId));
    } else {
      promises.push(supabase.from('site_settings').insert([headerPayload]));
    }

    await Promise.all(promises);


    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 text-gray-500">
        <Loader2 className="animate-spin mr-2" size={20} /> Cargando configuración...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Configuración General</h1>
        <p className="text-gray-400">Actualiza los datos de contacto, elementos de navegación y preferencias del sitio.</p>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 max-w-3xl mb-8">
        <h2 className="text-xl font-bold font-futuristic text-white mb-6">Información de Contacto y Footer</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Número de WhatsApp</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                placeholder="Ej. 18095550123 o 809-555-0123"
              />
              <p className="text-[10px] text-gray-500">Incluye el código de país (Ej: 829-580-7411)</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">URL de Instagram</label>
              <input
                type="url"
                name="instagram_url"
                value={formData.instagram_url}
                onChange={handleChange}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dirección Física</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 mt-6">
            <h2 className="text-xl font-bold font-futuristic text-white mb-6">Elementos de Navegación (Header)</h2>
            <p className="text-gray-400 mb-6 text-sm">Controla la visibilidad de los enlaces principales en el menú superior del sitio.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 bg-black border border-white/10 rounded-lg cursor-pointer hover:border-white/30 transition-colors">
                <input
                  type="checkbox"
                  checked={headerData.show_solutions}
                  onChange={() => handleHeaderChange('show_solutions')}
                  className="w-5 h-5 accent-raynold-red"
                />
                <span className="text-white font-bold text-sm">Mega Menú "Soluciones"</span>
              </label>

              <label className="flex items-center gap-3 p-4 bg-black border border-white/10 rounded-lg cursor-pointer hover:border-white/30 transition-colors">
                <input
                  type="checkbox"
                  checked={headerData.show_projects}
                  onChange={() => handleHeaderChange('show_projects')}
                  className="w-5 h-5 accent-raynold-red"
                />
                <span className="text-white font-bold text-sm">Enlace "Proyectos"</span>
              </label>

              <label className="flex items-center gap-3 p-4 bg-black border border-white/10 rounded-lg cursor-pointer hover:border-white/30 transition-colors">
                <input
                  type="checkbox"
                  checked={headerData.show_about}
                  onChange={() => handleHeaderChange('show_about')}
                  className="w-5 h-5 accent-raynold-red"
                />
                <span className="text-white font-bold text-sm">Enlace "Nosotros"</span>
              </label>

              <label className="flex items-center gap-3 p-4 bg-black border border-white/10 rounded-lg cursor-pointer hover:border-white/30 transition-colors">
                <input
                  type="checkbox"
                  checked={headerData.show_contact}
                  onChange={() => handleHeaderChange('show_contact')}
                  className="w-5 h-5 accent-raynold-red"
                />
                <span className="text-white font-bold text-sm">Enlace "Contacto"</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button type="submit" className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2">
              {saved ? (
                <><CheckCircle size={18} className="text-green-400" /> ¡Guardado!</>
              ) : (
                <><Save size={18} /> Guardar Configuración</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
