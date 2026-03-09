import React from 'react';
import { Save } from 'lucide-react';

const AdminSettings = () => {
  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-futuristic font-bold text-white mb-2">Configuración General</h1>
        <p className="text-gray-400">Actualiza los datos de contacto, redes sociales y preferencias.</p>
      </div>
      
      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 max-w-3xl">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Número de WhatsApp</label>
              <input 
                type="text" 
                defaultValue="18095550123"
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
                placeholder="Ej. 18095550123"
              />
              <p className="text-[10px] text-gray-500">Incluye el código de país sin el signo +</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Correo Electrónico</label>
              <input 
                type="email" 
                defaultValue="contacto@raynolddesign.com"
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">URL de Instagram</label>
              <input 
                type="url" 
                defaultValue="https://instagram.com/raynolddesign"
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dirección Física</label>
              <input 
                type="text" 
                defaultValue="Av. Winston Churchill, Santo Domingo"
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-raynold-red focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button type="button" className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2">
              <Save size={18} />
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
