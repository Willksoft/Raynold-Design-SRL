const GEMINI_PROXY_URL = 'https://ymiqmbzsmeqexgztquwj.supabase.co/functions/v1/gemini-proxy';

export const getAiDesignConsultation = async (userQuery: string): Promise<string> => {
  try {
    const systemInstruction = {
      parts: [{
        text: `Actúa como un consultor experto en diseño gráfico y publicidad para la empresa "Raynold Design SRL".
      
Nuestros servicios son:
- Diseño gráfico
- Fabricación de letreros (neon, 3D, cajas de luz)
- Servicio de impresión (gran formato, papelería)
- Artículos personalizados (promocionales, regalos)
- Rótulos corporativos
- Laminado residencial y de vehículos (car wrapping)

Mantén un tono profesional, entusiasta y futurista. Responde en español.`
      }]
    };

    const contents = [{
      role: 'user',
      parts: [{
        text: `El usuario tiene la siguiente idea o consulta: "${userQuery}"

Por favor, sugiere brevemente (máximo 100 palabras):
1. Qué materiales o técnica recomendamos.
2. Un estilo visual moderno o tendencia actual.
3. Un llamado a la acción para cotizar con nosotros.`
      }]
    }];

    const response = await fetch(GEMINI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        contents,
        systemInstruction,
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.7
        }
      })
    });

    if (response.status === 429) {
      return "Has enviado muchos mensajes. Por favor espera 1 minuto e intenta de nuevo.";
    }

    if (!response.ok) {
      throw new Error(`Proxy error: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return text || "Lo siento, no pude generar una consulta en este momento. Por favor contáctanos directamente.";
  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    return "Lo siento, hubo un error técnico. Por favor intenta más tarde.";
  }
};