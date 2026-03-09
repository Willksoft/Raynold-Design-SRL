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
  const [loading, setLoading] = useState(true);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fullData, setFullData] = useState<any>({});

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data } = await supabase.from('site_settings').select('*').eq('key', 'footer_data').single();
      if (data) {
        setSavedId(data.id);
        const parsed = JSON.parse(data.value);
        setFullData(parsed);
        setFormData({
          phone: parsed.phone || '',
          email: parsed.email || '',
          instagram_url: parsed.instagram_url || '',
          location: parsed.location || ''
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

    const payload = { key: 'footer_data', value: JSON.stringify(updatedData) };

    if (savedId) {
      await supabase.from('site_settings').update(payload).eq('id', savedId);
    } else {
      const { data } = await supabase.from('site_settings').insert([payload]).select().single();
      if (data) setSavedId(data.id);
    }

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
        <p className="text-gray-400">Actualiza los datos de contacto, redes sociales y preferencias.</p>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 max-w-3xl">
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
