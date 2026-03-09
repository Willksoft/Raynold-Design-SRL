import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, ChevronDown, Bot } from 'lucide-react';

// ─── Chatbot Knowledge Base ──────────────────────────────────────────────────
type QA = { q: string; a: string; tags: string[] };
const KNOWLEDGE: QA[] = [
    {
        q: '¿Qué servicios ofrecen?',
        a: '🎨 En Raynold Design ofrecemos: **Rotulación vehicular**, **Letras 3D y neón**, **Impresión de gran formato**, **Car Wrapping**, **Stickers personalizados**, **Camisetas y ropa corporativa**, **Gorras bordadas**, **Roll-up banners**, y mucho más. ¿En cuál te puedo ayudar?',
        tags: ['servicios', 'que hacen', 'ofrecen', 'hacen'],
    },
    {
        q: '¿Cuánto cuesta un letrero?',
        a: '💡 El precio de un letrero depende del tamaño, material y complejidad del diseño. Los precios parten desde **RD$3,500** para letreros sencillos. Para un presupuesto exacto escríbenos al **WhatsApp: +1(809)XXX-XXXX** o llena el formulario de contacto.',
        tags: ['precio', 'costo', 'cuanto', 'letrero', 'presupuesto'],
    },
    {
        q: '¿Hacen rotulación vehicular?',
        a: '🚗 ¡Sí! Somos especialistas en **rotulación vehicular y car wrapping**. Trabajamos con vinilo de alta calidad de marcas como 3M y Oracal. El proceso incluye diseño, impresión e instalación. Tiempo estimado: **2-5 días hábiles**.',
        tags: ['vehiculo', 'carro', 'rotulacion', 'car wrap', 'vinilo', 'auto'],
    },
    {
        q: '¿Cuánto tiempo tarda un pedido?',
        a: '⏱️ Los tiempos de entrega dependen del producto:\n- Stickers y tarjetas: **1-2 días**\n- Letreros y carteles: **3-5 días**\n- Rotulación vehicular: **2-5 días**\n- Car wrapping completo: **5-10 días**\n\nSolicita rush delivery si tienes urgencia.',
        tags: ['tiempo', 'dias', 'entrega', 'cuando', 'demora', 'rapidez'],
    },
    {
        q: '¿Dónde están ubicados?',
        a: '📍 Estamos ubicados en **República Dominicana**. Atendemos en nuestra sede y también hacemos entregas a domicilio. Para la dirección exacta contáctanos por WhatsApp.',
        tags: ['ubicacion', 'direccion', 'donde', 'local', 'sucursal'],
    },
    {
        q: '¿Hacen diseño?',
        a: '✏️ ¡Sí! Contamos con un equipo creativo que puede diseñar tu logo, identidad visual, artes para imprimir y más. El servicio de diseño puede incluirse en el pedido o contratarse por separado.',
        tags: ['diseño', 'logo', 'arte', 'grafico', 'creativo'],
    },
    {
        q: '¿Cuáles son sus métodos de pago?',
        a: '💳 Aceptamos:\n- **Transferencia bancaria** (BHD, Popular, Banreservas)\n- **Tarjeta de crédito/débito**\n- **Pago en efectivo**\n- **PayPal** para clientes internacionales\n\nPedimos un adelanto del 50% para comenzar.',
        tags: ['pago', 'transferencia', 'efectivo', 'tarjeta', 'metodo'],
    },
    {
        q: '¿Trabajan con empresas?',
        a: '🏢 ¡Absolutamente! Tenemos clientes como **Toyota, Claro, Brugal** y muchas más marcas reconocidas. Ofrecemos **precios especiales por volumen** y contratos corporativos. Escríbenos para una propuesta personalizada.',
        tags: ['empresa', 'corporativo', 'negocio', 'cliente', 'volumen'],
    },
    {
        q: '¿Tienen garantía?',
        a: '🛡️ Sí. Garantizamos la **calidad de los materiales y la instalación**. En caso de defecto de fabricación, hacemos el reemplazo sin costo adicional. Los vinilos de exterior tienen duración garantizada de **3 a 7 años** dependiendo del material.',
        tags: ['garantia', 'duracion', 'calidad', 'defecto'],
    },
];

const SUGGESTIONS = [
    '¿Qué servicios ofrecen?',
    '¿Cuánto cuesta un letrero?',
    '¿Hacen rotulación vehicular?',
    '¿Cuánto tiempo tarda un pedido?',
    '¿Dónde están ubicados?',
];

// ─── Simple Markdown Renderer ─────────────────────────────────────────────────
const Md = ({ text }: { text: string }) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\n)/g);
    return (
        <span>
            {parts.map((p, i) => {
                if (p === '\n') return <br key={i} />;
                if (p.startsWith('**') && p.endsWith('**'))
                    return <strong key={i}>{p.slice(2, -2)}</strong>;
                return p;
            })}
        </span>
    );
};

// ─── Types ─────────────────────────────────────────────────────────────────
type Msg = { from: 'bot' | 'user'; text: string; time: string };

const now = () =>
    new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });

const findAnswer = (query: string): string => {
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const match = KNOWLEDGE.find(k => k.tags.some(t => q.includes(t)));
    if (match) return match.a;
    return '🤔 No tengo esa información exacta, pero puedo ayudarte. Comunícate directamente con nuestro equipo al **WhatsApp** usando el botón verde, o llena el formulario de contacto y te respondemos pronto.';
};

// ─── WhatsApp SVG ──────────────────────────────────────────────────────────
const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

// ─── Main Component ────────────────────────────────────────────────────────
const FloatingButtons: React.FC = () => {
    const [chatOpen, setChatOpen] = useState(false);
    const [msgs, setMsgs] = useState<Msg[]>([
        {
            from: 'bot',
            text: '¡Hola! 👋 Soy **Agente Raynold**, tu asistente virtual de **Raynold Design**. ¿En qué puedo ayudarte hoy?',
            time: now(),
        },
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const msgEndRef = useRef<HTMLDivElement>(null);
    const WHATSAPP_NUMBER = '18097777777'; // ← Actualizar con número real

    useEffect(() => {
        msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [msgs, typing]);

    const sendMsg = (text: string) => {
        if (!text.trim()) return;
        const userMsg: Msg = { from: 'user', text, time: now() };
        setMsgs(p => [...p, userMsg]);
        setInput('');
        setShowSuggestions(false);
        setTyping(true);

        setTimeout(() => {
            const answer = findAnswer(text);
            setTyping(false);
            setMsgs(p => [...p, { from: 'bot', text: answer, time: now() }]);
        }, 900 + Math.random() * 600);
    };

    return (
        <>
            {/* ─── WhatsApp Button ─── */}
            <motion.a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20Raynold%20Design,%20necesito%20informaci%C3%B3n`}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-8 left-8 z-[150] w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-[0_4px_24px_rgba(37,211,102,0.5)] cursor-pointer"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.93 }}
                title="WhatsApp"
            >
                <WhatsAppIcon />
                {/* Ping ring */}
                <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
            </motion.a>

            {/* ─── Chatbot Button ─── */}
            <motion.button
                onClick={() => setChatOpen(o => !o)}
                className="fixed bottom-8 left-28 z-[150] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_4px_24px_rgba(230,0,0,0.45)] cursor-pointer overflow-hidden border-2 border-white/20"
                style={{ background: 'linear-gradient(135deg,#E60000,#8B0000)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.0, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.93 }}
                title="Chat con Agente Raynold"
            >
                <AnimatePresence mode="wait">
                    {chatOpen ? (
                        <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                            <X size={24} />
                        </motion.div>
                    ) : (
                        <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                            <Bot size={22} />
                        </motion.div>
                    )}
                </AnimatePresence>
                {!chatOpen && (
                    <span className="absolute inset-0 rounded-full bg-raynold-red animate-ping opacity-20" />
                )}
            </motion.button>

            {/* ─── Chat Window ─── */}
            <AnimatePresence>
                {chatOpen && (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        className="fixed bottom-28 left-6 z-[149] w-[340px] max-h-[75vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-white/10"
                        style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(20px)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#E60000] to-[#8B0000] relative">
                            <div className="relative">
                                <img
                                    src="/agente-raynold.png"
                                    alt="Agente Raynold"
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white/30 bg-white"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#8B0000]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-sm leading-tight">Agente Raynold</p>
                                <p className="text-red-200 text-[11px]">Asistente Virtual • En línea</p>
                            </div>
                            <button
                                onClick={() => setChatOpen(false)}
                                className="text-white/60 hover:text-white transition-colors p-1"
                            >
                                <ChevronDown size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '320px' }}>
                            {msgs.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                                >
                                    {m.from === 'bot' && (
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Bot size={14} className="text-white" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${m.from === 'user'
                                                ? 'bg-raynold-red text-white rounded-br-sm'
                                                : 'bg-white/10 text-gray-100 rounded-bl-sm'
                                            }`}
                                    >
                                        <Md text={m.text} />
                                        <p className="text-[9px] mt-1 opacity-50 text-right">{m.time}</p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {typing && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center flex-shrink-0">
                                        <Bot size={14} className="text-white" />
                                    </div>
                                    <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <motion.div
                                                key={i}
                                                className="w-2 h-2 bg-gray-400 rounded-full"
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                            <div ref={msgEndRef} />
                        </div>

                        {/* Suggestions */}
                        {showSuggestions && (
                            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                                {SUGGESTIONS.slice(0, 3).map((s, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        onClick={() => sendMsg(s)}
                                        className="text-[11px] px-2.5 py-1 rounded-full border border-white/20 text-gray-300 hover:border-raynold-red hover:text-white transition-colors bg-white/5"
                                    >
                                        {s}
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-3 border-t border-white/10 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg(input)}
                                placeholder="Escribe tu pregunta..."
                                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-raynold-red transition-colors"
                            />
                            <motion.button
                                onClick={() => sendMsg(input)}
                                disabled={!input.trim() || typing}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.93 }}
                                className="w-10 h-10 bg-raynold-red rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity flex-shrink-0"
                            >
                                <Send size={16} />
                            </motion.button>
                        </div>

                        {/* Footer */}
                        <p className="text-center text-[10px] text-gray-600 pb-2">
                            Raynold Design · Atención 24/7
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingButtons;
