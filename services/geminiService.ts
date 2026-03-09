import { GoogleGenAI } from "@google/genai";

export const getAiDesignConsultation = async (userQuery: string): Promise<string> => {
  try {
    // Check if process is defined to prevent browser reference errors in non-polyfilled environments
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;

    if (!apiKey) {
      console.warn("Gemini API Key is missing.");
      return "El asistente de IA no está configurado correctamente en este momento. Por favor contáctanos directamente vía WhatsApp.";
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      Actúa como un consultor experto en diseño gráfico y publicidad para la empresa "Raynold Design SRL".
      
      Nuestros servicios son:
      - Diseño gráfico
      - Fabricación de letreros (neon, 3D, cajas de luz)
      - Servicio de impresión (gran formato, papelería)
      - Artículos personalizados (promocionales, regalos)
      - Rótulos corporativos
      - Laminado residencial y de vehículos (car wrapping)

      El usuario tiene la siguiente idea o consulta: "${userQuery}"

      Por favor, sugiere brevemente (máximo 100 palabras):
      1. Qué materiales o técnica recomendamos.
      2. Un estilo visual moderno o tendencia actual.
      3. Un llamado a la acción para cotizar con nosotros.

      Mantén un tono profesional, entusiasta y futurista.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Lo siento, no pude generar una consulta en este momento. Por favor contáctanos directamente.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Lo siento, hubo un error técnico. Por favor intenta más tarde.";
  }
};