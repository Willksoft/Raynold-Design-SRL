import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, Bot } from 'lucide-react';
import { getAiDesignConsultation } from '../services/geminiService';

const AiConsultant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse('');
    
    try {
      const result = await getAiDesignConsultation(query);
      setResponse(result);
    } catch (error) {
      setResponse("Hubo un error al conectar con la IA. Por favor intenta más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="ai-consultant" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-raynold-black">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=10')] opacity-10 bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-raynold-black via-transparent to-raynold-black"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl shadow-raynold-green/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-raynold-green/20 rounded-lg">
              <Bot className="text-raynold-green" size={32} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-futuristic text-white font-bold">
                Raynold <span className="text-raynold-green">AI Assistant</span>
              </h2>
              <p className="text-gray-400 text-sm">¿No sabes qué material elegir? Pregúntale a nuestra IA.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative mb-8">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: Quiero rotular mi food truck de tacos con un estilo neon..."
              className="w-full bg-black/50 border border-gray-700 rounded-xl py-4 pl-6 pr-16 text-white focus:outline-none focus:border-raynold-green focus:ring-1 focus:ring-raynold-green transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-2 bottom-2 p-3 bg-raynold-green text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </form>

          <AnimatePresence>
            {response && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/5 border-l-4 border-raynold-red rounded-r-lg p-6"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="text-white font-bold mb-2 font-futuristic">Sugerencia Inteligente:</h4>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">{response}</p>
                    <div className="mt-4">
                      <a 
                        href={`https://wa.me/18295807411?text=${encodeURIComponent(`Hola, usé su asistente AI y me sugirió esto: ${response}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-raynold-red hover:underline font-bold"
                      >
                        ¡Hablemos para hacerlo realidad! &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default AiConsultant;