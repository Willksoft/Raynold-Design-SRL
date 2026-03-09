import React, { useState, useEffect } from 'react';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ProcessStep {
    id: number;
    title: string;
    desc: string;
    icon: string;
}

const defaultSteps: ProcessStep[] = [
    { id: 1, title: 'Consulta', desc: 'Analizamos tus necesidades y definimos el alcance del proyecto.', icon: 'ClipboardList' },
    { id: 2, title: 'Diseño', desc: 'Nuestro equipo creativo desarrolla propuestas visuales impactantes.', icon: 'PenTool' },
    { id: 3, title: 'Producción', desc: 'Fabricación con tecnología láser, impresión UV y materiales premium.', icon: 'Cog' },
    { id: 4, title: 'Entrega', desc: 'Instalación profesional y entrega puntual en todo el país.', icon: 'Truck' },
];

const AdminProcess: React.FC = () => {
    const [steps, setSteps] = useState<ProcessStep[]>(defaultSteps);
    const [sectionTitle, setSectionTitle] = useState('Protocolo de Ejecución');
    const [sectionSubtitle, setSectionSubtitle] = useState('Sistema optimizado de 4 fases para garantizar resultados de alta precisión.');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        supabase.from('site_settings').select('value').eq('key', 'process_data').single().then(({ data }) => {
            if (data) {
                const parsed = JSON.parse(data.value);
                if (parsed.steps) setSteps(parsed.steps);
                if (parsed.sectionTitle) setSectionTitle(parsed.sectionTitle);
                if (parsed.sectionSubtitle) setSectionSubtitle(parsed.sectionSubtitle);
            }
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const value = JSON.stringify({ steps, sectionTitle, sectionSubtitle });
        const { data: existing } = await supabase.from('site_settings').select('id').eq('key', 'process_data').single();
        if (existing) {
            await supabase.from('site_settings').update({ value }).eq('key', 'process_data');
        } else {
            await supabase.from('site_settings').insert([{ key: 'process_data', value }]);
        }
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const updateStep = (index: number, field: keyof ProcessStep, val: string) => {
        const updated = [...steps];
        updated[index] = { ...updated[index], [field]: val };
        setSteps(updated);
    };

    const addStep = () => {
        setSteps([...steps, { id: steps.length + 1, title: 'Nuevo Paso', desc: '', icon: 'Star' }]);
    };

    const removeStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-futuristic font-bold text-white mb-1">Proceso (Protocolo)</h1>
                    <p className="text-gray-400 text-sm">Edita los pasos del proceso de trabajo mostrados en el Landing.</p>
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

            {/* Section Title / Subtitle */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mb-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Encabezado de la Sección</h2>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Título</label>
                    <input
                        value={sectionTitle}
                        onChange={e => setSectionTitle(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Subtítulo</label>
                    <input
                        value={sectionSubtitle}
                        onChange={e => setSectionSubtitle(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                    />
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
                {steps.map((step, i) => (
                    <div key={i} className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Paso {i + 1}</span>
                            <button onClick={() => removeStep(i)} className="p-1 text-red-400 hover:text-red-300 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Título</label>
                                <input
                                    value={step.title}
                                    onChange={e => updateStep(i, 'title', e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Icono (nombre de Lucide)</label>
                                <input
                                    value={step.icon}
                                    onChange={e => updateStep(i, 'icon', e.target.value)}
                                    placeholder="ej: ClipboardList, PenTool, Cog, Truck"
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-green focus:outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                                <textarea
                                    value={step.desc}
                                    onChange={e => updateStep(i, 'desc', e.target.value)}
                                    rows={2}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-raynold-red focus:outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={addStep} className="mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl px-5 py-3 hover:bg-white/5 transition-colors">
                <Plus size={16} /> Añadir Paso
            </button>
        </div>
    );
};

export default AdminProcess;
