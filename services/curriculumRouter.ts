
import { DUTCH_CURRICULUM } from '../data/curriculum';
import { GoogleGenAI, Type } from "@google/genai";

export const findBestChapter = async (query: string): Promise<{ chapterId: string; topic: string; level: string } | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Simplificamos el currículo para que la IA lo procese
    const curriculumSummary = DUTCH_CURRICULUM.map(l => ({
      level: l.level,
      modules: l.modules.map(m => ({ id: m.id, title: m.title }))
    }));

    const prompt = `Actúa como el enrutador semántico de SPEAKSYNC. 
    Tu objetivo es encontrar el módulo más relevante para la búsqueda: "${query}".
    
    Currículo disponible: ${JSON.stringify(curriculumSummary)}
    
    Instrucciones:
    1. Si encuentras una coincidencia clara, devuelve el chapterId (ej: 'A1-m10-c1'), el título y el nivel.
    2. Si no hay coincidencia exacta, busca la más cercana.
    3. Devuelve estrictamente un JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapterId: { type: Type.STRING },
            topic: { type: Type.STRING },
            level: { type: Type.STRING }
          },
          required: ["chapterId", "topic", "level"]
        }
      }
    });

    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Routing error:", error);
    return null;
  }
};
