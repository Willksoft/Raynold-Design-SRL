import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ChevronDown, Bot, Clock } from 'lucide-react';

// ─── Horario de atención ─────────────────────────────────────────────────────
const HOURS = [
    { day: 'Lunes', h: '8:30 AM – 7:00 PM' },
    { day: 'Martes', h: '8:30 AM – 7:00 PM' },
    { day: 'Miércoles', h: '8:30 AM – 7:00 PM' },
    { day: 'Jueves', h: '8:30 AM – 7:00 PM' },
    { day: 'Viernes', h: '8:30 AM – 7:00 PM' },
    { day: 'Sábado', h: '8:30 AM – 1:00 PM' },
    { day: 'Domingo', h: 'Cerrado' },
];

const isOpen = (): boolean => {
    const now = new Date();
    const day = now.getDay(); // 0=Dom,1=Lun...6=Sáb
    const mins = now.getHours() * 60 + now.getMinutes();
    if (day === 0) return false;                        // domingo
    if (day === 6) return mins >= 8 * 60 + 30 && mins < 13 * 60; // sábado 8:30-13:00
    return mins >= 8 * 60 + 30 && mins < 19 * 60;             // lun-vier 8:30-19:00
};

// ─── Chatbot Knowledge Base ──────────────────────────────────────────────────
type QA = { q: string; a: string; tags: string[] };
const KNOWLEDGE: QA[] = [
    {
        q: '¿Qué servicios ofrecen?',
        a: 'En Raynold Design ofrecemos: **Rotulación vehicular**, **Letras 3D y neón**, **Impresión de gran formato**, **Car Wrapping**, **Stickers personalizados**, **Camisetas y ropa corporativa**, **Gorras bordadas**, **Roll-up banners**, y mucho más. ¿En cuál colocamos?',
        tags: ['servicio', 'que hacen', 'ofrecen', 'hacen'],
    },
    {
        q: '¿Cuánto cuesta un letrero?',
        a: 'El precio depende del tamaño, material y complejidad. Los letreros parten desde **RD$3,500**. Para un presupuesto exacto escríbenos al WhatsApp **+1 (829) 580-7411** o llena el formulario de contacto.',
        tags: ['precio', 'costo', 'cuanto', 'letrero', 'presupuesto', 'vale'],
    },
    {
        q: '¿Hacen rotulación vehicular?',
        a: '¡Sí! Somos especialistas en **rotulación vehicular y car wrapping**. Usamos vinil de alta calidad (3M, Oracal). Incluye diseño, impresión e instalación. Tiempo estimado: **2-5 días hábiles**.',
        tags: ['vehiculo', 'carro', 'rotulacion', 'car wrap', 'vinilo', 'auto'],
    },
    {
        q: '¿Cuánto tiempo tarda un pedido?',
        a: 'Los tiempos de entrega según producto:\n- Stickers y tarjetas: **1-2 días**\n- Letreros y carteles: **3-5 días**\n- Rotulación vehicular: **2-5 días**\n- Car wrapping completo: **5-10 días**\n\nPuedes solicitar *rush delivery* si tienes urgencia.',
        tags: ['tiempo', 'dias', 'entrega', 'cuando', 'demora', 'rapidez', 'tarde'],
    },
    {
        q: '¿Cuál es el horario de atención?',
        a: 'Nuestro horario:\n- **Lun – Vie:** 8:30 AM – 7:00 PM\n- **Sábado:** 8:30 AM – 1:00 PM\n- **Domingo:** Cerrado\n\nEstamos disponibles por WhatsApp en **+1 (829) 580-7411**.',
        tags: ['horario', 'hora', 'atienden', 'abren', 'cierran', 'cuando atienden'],
    },
    {
        q: '¿Dónde están ubicados?',
        a: 'Estamos en **República Dominicana**. Atendemos en nuestra sede y hacemos entregas a domicilio. Para la dirección exacta contáctanos por WhatsApp **+1 (829) 580-7411**.',
        tags: ['ubicacion', 'direccion', 'donde', 'local', 'sucursal'],
    },
    {
        q: '¿Hacen diseño gráfico?',
        a: '¡Sí! Contamos con nuestro equipo creativo para diseñar tu logo, identidad visual, artes para impresión y más. El diseño puede incluirse en el pedido o contratarse por separado.',
        tags: ['diseño', 'logo', 'arte', 'grafico', 'creativo'],
    },
    {
        q: '¿Cuáles son sus métodos de pago?',
        a: 'Aceptamos:\n- **Transferencia bancaria** (BHD, Popular, Banreservas)\n- **Tarjeta de crédito/débito**\n- **Efectivo**\n- **PayPal** para clientes internacionales\n\nSolicitamos un adelanto del **50%** para iniciar.',
        tags: ['pago', 'transferencia', 'efectivo', 'tarjeta', 'metodo'],
    },
    {
        q: '¿Trabajan con empresas?',
        a: '¡Absolutamente! Trabajamos con **Toyota, Claro, Brugal** y muchas más. Ofrecemos **precios especiales por volumen** y contratos corporativos. Escríbenos para una propuesta personalizada.',
        tags: ['empresa', 'corporativo', 'negocio', 'cliente', 'volumen'],
    },
    {
        q: '¿Tienen garantía?',
        a: 'Sí. Garantizamos la **calidad de materiales e instalación**. En caso de defecto de fabricación, hacemos el reemplazo sin costo. Los vinilos de exterior tienen duración garantizada de **3-7 años**.',
        tags: ['garantia', 'duracion', 'calidad', 'defecto'],
    },
];

const SUGGESTIONS = [
    '¿Qué servicios ofrecen?',
    '¿Cuál es el horario?',
    '¿Cuánto cuesta un letrero?',
    '¿Hacen rotulación vehicular?',
    '¿Métodos de pago?',
];

// ─── Simple Markdown ──────────────────────────────────────────────────────────
const Md = ({ text }: { text: string }) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g);
    return (
        <span>
            {parts.map((p, i) => {
                if (p === '\n') return <br key={i} />;
                if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
                if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>;
                return p;
            })}
        </span>
    );
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Msg = { from: 'bot' | 'user'; text: string; time: string };
const nowStr = () => new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });

const findAnswer = (query: string): string => {
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const match = KNOWLEDGE.find(k => k.tags.some(t => q.includes(t)));
    if (match) return match.a;
    return 'No tengo esa información exacta. Comunícate directamente con nuestro equipo por WhatsApp al **+1 (829) 580-7411** o llena el formulario de contacto y te respondemos pronto.';
};

// ─── WhatsApp SVG ─────────────────────────────────────────────────────────────
const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const FloatingButtons: React.FC = () => {
    const [chatOpen, setChatOpen] = useState(false);
    const [showHours, setShowHours] = useState(false);
    const [msgs, setMsgs] = useState<Msg[]>([
        {
            from: 'bot',
            text: '¡Hola! Soy **Agente Raynold**, tu asistente virtual de **Raynold Design**. ¿En qué puedo ayudarte hoy?',
            time: nowStr(),
        },
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const msgEndRef = useRef<HTMLDivElement>(null);

    const WHATSAPP_NUMBER = '18295807411';
    const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20Raynold%20Design%2C%20necesito%20informaci%C3%B3n`;
    const open = isOpen();
    const todayIdx = new Date().getDay();    // 0=Sun
    // Convert so Mon=0
    const todayHours = todayIdx === 0 ? HOURS[6] : HOURS[todayIdx - 1];

    useEffect(() => {
        msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [msgs, typing]);

    const sendMsg = (text: string) => {
        if (!text.trim()) return;
        setMsgs(p => [...p, { from: 'user', text, time: nowStr() }]);
        setInput('');
        setShowSuggestions(false);
        setTyping(true);
        setTimeout(() => {
            setTyping(false);
            setMsgs(p => [...p, { from: 'bot', text: findAnswer(text), time: nowStr() }]);
        }, 900 + Math.random() * 600);
    };

    return (
        <>
            {/* ════════════════════════════════════
          RIGHT-COLUMN FLOATING BUTTONS
          (bottom-right, stacked vertically)
      ════════════════════════════════════ */}
            <div className="fixed bottom-8 right-6 z-[150] flex flex-col-reverse items-end gap-4">

                {/* ── WhatsApp Button (circular) ──────────── */}
                <motion.a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, type: 'spring', stiffness: 220 }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative w-14 h-14 bg-[#25D366] rounded-full text-white shadow-[0_4px_28px_rgba(37,211,102,0.55)] cursor-pointer flex items-center justify-center"
                    title="WhatsApp +1 (829) 580-7411"
                >
                    <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25 pointer-events-none" />
                    <WhatsAppIcon />
                </motion.a>

                {/* ── Chatbot Button (circular) ──────────── */}
                <motion.button
                    onClick={() => setChatOpen(o => !o)}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.9, type: 'spring', stiffness: 220 }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative w-14 h-14 rounded-full text-white shadow-[0_4px_28px_rgba(230,0,0,0.45)] cursor-pointer border border-white/10 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg,#1a0000,#3a0000)' }}
                    title="Chat con Agente Raynold"
                >
                    {!chatOpen && (
                        <span className="absolute inset-0 rounded-full bg-red-700 animate-ping opacity-15 pointer-events-none" />
                    )}
                    {chatOpen ? (
                        <X size={22} className="text-white mx-auto" />
                    ) : (
                        <>
                            <img
                                src="/agente-raynold.png"
                                alt="Agente Raynold"
                                className="w-full h-full object-cover absolute inset-0"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {/* Fallback icon (shows if image fails) */}
                            <Bot size={24} className="text-white relative z-[1]" />
                        </>
                    )}
                    {/* Online dot */}
                    <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-[#1a0000] z-10 ${open ? 'bg-green-400' : 'bg-gray-500'}`} />
                </motion.button>
            </div>

            {/* ════════════════════════════════════
          CHAT WINDOW  (bottom-right, above buttons)
      ════════════════════════════════════ */}
            <AnimatePresence>
                {chatOpen && (
                    <motion.div
                        key="chat-window"
                        initial={{ opacity: 0, y: 24, scale: 0.93 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.93 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        className="fixed bottom-[140px] right-6 z-[149] w-[340px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-white/10"
                        style={{ background: 'rgba(8,8,8,0.98)', backdropFilter: 'blur(24px)', maxHeight: 'calc(100vh - 180px)' }}
                    >
                        {/* ── Header ── */}
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#1a0000] via-[#2d0000] to-[#8B0000] border-b border-white/10 flex-shrink-0">
                            <div className="relative flex-shrink-0">
                                <img
                                    src="/agente-raynold.png"
                                    alt="Agente Raynold"
                                    className="w-11 h-11 rounded-full object-cover border-2 border-raynold-red bg-gray-800"
                                    onError={e => { (e.target as HTMLImageElement).src = ''; }}
                                />
                                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#1a0000] ${open ? 'bg-green-400' : 'bg-gray-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-sm leading-tight">Agente Raynold</p>
                                <p className={`text-[11px] ${open ? 'text-green-400' : 'text-gray-400'}`}>
                                    {open ? '● En línea' : `● ${todayHours.h === 'Cerrado' ? 'Cerrado hoy' : 'Fuera de horario'}`}
                                </p>
                            </div>
                            {/* Hours toggle */}
                            <button
                                onClick={() => setShowHours(h => !h)}
                                title="Ver horario"
                                className={`p-1.5 rounded-lg transition-colors ${showHours ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                            >
                                <Clock size={15} />
                            </button>
                            <button
                                onClick={() => setChatOpen(false)}
                                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ChevronDown size={16} />
                            </button>
                        </div>

                        {/* ── Hours panel ── */}
                        <AnimatePresence>
                            {showHours && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden border-b border-white/10 flex-shrink-0"
                                >
                                    <div className="px-4 py-3 bg-black/60">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Clock size={12} /> Horario de Atención
                                        </p>
                                        <div className="space-y-1">
                                            {HOURS.map((h, i) => {
                                                const isToday = (i === 6 && todayIdx === 0) || (i !== 6 && i === todayIdx - 1);
                                                return (
                                                    <div key={h.day} className={`flex justify-between text-[11px] py-0.5 ${isToday ? 'text-white font-bold' : 'text-gray-500'}`}>
                                                        <span className={isToday ? 'text-raynold-red' : ''}>{h.day}</span>
                                                        <span className={h.h === 'Cerrado' ? 'text-red-500' : isToday ? 'text-green-400' : ''}>{h.h}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Messages ── */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '300px' }}>
                            {msgs.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                                >
                                    {m.from === 'bot' && (
                                        <img
                                            src="/agente-raynold.png"
                                            alt=""
                                            className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1 border border-red-800"
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    )}
                                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${m.from === 'user'
                                        ? 'bg-raynold-red text-white rounded-br-sm'
                                        : 'bg-white/10 text-gray-100 rounded-bl-sm'
                                        }`}>
                                        <Md text={m.text} />
                                        <p className="text-[9px] mt-1 opacity-40 text-right">{m.time}</p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {typing && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                                    <img src="/agente-raynold.png" alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-red-800" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <motion.div
                                                key={i}
                                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.14 }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                            <div ref={msgEndRef} />
                        </div>

                        {/* ── Suggestions ── */}
                        {showSuggestions && (
                            <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                                {SUGGESTIONS.slice(0, 3).map((s, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.08 }}
                                        onClick={() => sendMsg(s)}
                                        className="text-[11px] px-2.5 py-1 rounded-full border border-white/20 text-gray-300 hover:border-raynold-red hover:text-white transition-colors bg-white/5"
                                    >
                                        {s}
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* ── Input ── */}
                        <div className="p-3 border-t border-white/10 flex gap-2 flex-shrink-0">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg(input)}
                                placeholder="Escribe tu pregunta..."
                                className="flex-1 bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-raynold-red transition-colors"
                            />
                            <motion.button
                                onClick={() => sendMsg(input)}
                                disabled={!input.trim() || typing}
                                whileHover={{ scale: 1.07 }}
                                whileTap={{ scale: 0.92 }}
                                className="w-9 h-9 bg-raynold-red rounded-xl flex items-center justify-center text-white disabled:opacity-35 transition-opacity flex-shrink-0 shadow-lg"
                            >
                                <Send size={15} />
                            </motion.button>
                        </div>

                        {/* Footer */}
                        <p className="text-center text-[10px] text-gray-700 pb-2 flex-shrink-0">
                            Raynold Design SRL · {open ? 'Abierto ahora' : 'Cerrado ahora'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingButtons;
