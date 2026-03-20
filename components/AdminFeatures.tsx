import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import CustomSelect from './CustomSelect';

interface Feature {
    title: string;
    desc: string;
    icon: string;
    color: string;
}

const defaultFeatures: Feature[] = [
    { title: 'Entrega Rápida', desc: 'Optimizamos tiempos de producción sin sacrificar calidad.', icon: 'Zap', color: 'red' },
    { title: 'Garantía de Calidad', desc: 'Materiales premium resistentes a exteriores y desgaste.', icon: 'ShieldCheck', color: 'green' },
    { title: 'Soporte 24/7', desc: 'Atención personalizada vía WhatsApp para tus urgencias.', icon: 'Clock', color: 'blue' },
];

const COLORS = ['red', 'green', 'blue', 'yellow', 'purple', 'white'];

const AdminFeatures: React.FC = () => {
    const [features, setFeatures] = useState<Feature[]>(defaultFeatures);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        supabase.from('site_settings').select('value').eq('key', 'features_data').single().then(({ data }) => {
            if (data) {
                const parsed = JSON.parse(data.value);
                if (parsed.features) setFeatures(parsed.features);
            }
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const value = JSON.stringify({ features });
        const { data: existing } = await supabase.from('site_settings').select('id').eq('key', 'features_data').single();
        if (existing) {
            await supabase.from('site_settings').update({ value }).eq('key', 'features_data');
        } else {
            await supabase.from('site_settings').insert([{ key: 'features_data', value }]);
        }
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const updateFeature = (index: number, field: keyof Feature, val: string) => {
        const updated = [...features];
        updated[index] = { ...updated[index], [field]: val };
        setFeatures(updated);
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-futuristic font-bold text-white mb-1">Ventajas / Features</h1>
                    <p className="text-gray-400 text-sm">Edita las 3 tarjetas de ventajas del Landing Page.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 btn-animated font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saved ? '¡Guardado!' : 'Guardar'}
                </button>
            </div>

            <div className="space-y-4">
                {features.map((f, i) => (
                    <div key={i} className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 block">Tarjeta {i + 1}</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Título</label>
                                <input
                                    value={f.title}
                                    onChange={e => updateFeature(i, 'title', e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Icono (Lucide)</label>
                                <input
                                    value={f.icon}
                                    onChange={e => updateFeature(i, 'icon', e.target.value)}
                                    placeholder="ej: Zap, ShieldCheck, Clock"
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-green focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Color</label>
                                <CustomSelect variant="dark" value={f.color} onChange={v => updateFeature(i, 'color', v)} options={COLORS.map(c => ({ value: c, label: c }))} />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                                <textarea
                                    value={f.desc}
                                    onChange={e => updateFeature(i, 'desc', e.target.value)}
                                    rows={2}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminFeatures;
