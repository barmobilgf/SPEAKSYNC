import { GoogleGenAI, Type } from "@google/genai";
import { NewsItem, ProficiencyLevel } from "../types";
import { supabase } from "./supabase";
import { throttlingService } from "./throttlingService";

const GLOBAL_CACHE_TTL_MINUTES = 10;

const NEWS_STYLE_GUIDE = `
DOSSIER DE INTELIGENCIA MEDIÁTICA - SPEAKSYNC:
Actúa como un Analista de Prensa y Tutor Lingüístico experto en los Países Bajos. Tu objetivo es transformar una noticia en un dossier técnico de alta utilidad.

RESTRICCIONES DE 'RUIDO CERO':
1. PROHIBICIÓN DE SÍMBOLOS: No uses almohadillas (#), asteriscos (*), guiones largos (---) ni bloques de código.
2. ESTRUCTURA DE SECCIONES: Usa exclusivamente la etiqueta "SECTION: NOMBRE" en mayúsculas para separar bloques.
3. LISTAS: Usa únicamente el guion simple "-" seguido de un espacio.
4. TÉRMINOS TÉCNICOS: Usa el formato [Término en Neerlandés] (Traducción al Español).
5. ESPACIADO: Usa saltos de línea dobles para separar párrafos.
6. CONTENIDO DIRECTO: Empieza directamente con la primera sección.

ESTRUCTURA OBLIGATORIA:

SECTION: ANÁLISIS DE IMPACTO
Explicación de por qué esta noticia es tendencia y cómo afecta el día a día en los Países Bajos.

SECTION: LÉXICO DE ACTUALIDAD
Términos periodísticos y palabras de la calle que aparecen en la noticia en formato [Neerlandés] (Traducción).

SECTION: PERSPECTIVAS Y DEBATE
Estructuras y frases para que el usuario aprenda a opinar sobre este tema específico en un entorno social o laboral.

SECTION: NOTA PARA EL RESIDENTE
Desglose de qué significa esta noticia específicamente para la comunidad extranjera.

TONO: Editorial, analítico, profesional y directo.
`;

export const generateNewsDossierStream = async (newsTitle: string, newsSummary: string, level: ProficiencyLevel) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    GENERACIÓN DE DOSSIER DE INTELIGENCIA MEDIÁTICA:
    NOTICIA: "${newsTitle}"
    RESUMEN: "${newsSummary}"
    NIVEL REQUERIDO: ${level}

    ${NEWS_STYLE_GUIDE}
  `;

  return await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      temperature: 0.4,
      // Capping para Dossier de Noticias
      thinkingConfig: { thinkingBudget: 1500 },
      maxOutputTokens: 5000
    }
  });
};

export const fetchDutchNewsFromAI = async (category: string, level: ProficiencyLevel): Promise<NewsItem[]> => {
  // 1. Verificar Cache de Supabase primero (Siempre gratis)
  const tenMinutesAgo = new Date(Date.now() - GLOBAL_CACHE_TTL_MINUTES * 60 * 1000).toISOString();
  
  const { data: cachedRow, error: cacheError } = await supabase
    .from('news_cache')
    .select('items, created_at')
    .eq('category', category)
    .eq('level', level)
    .gt('created_at', tenMinutesAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cachedRow && !cacheError) {
    return cachedRow.items as NewsItem[];
  }

  // 2. Verificar Throttling antes de disparar Google Search
  if (throttlingService.isThrottled('news_search')) {
    throw new Error(`TOOL_THROTTLED:${throttlingService.getRemainingSeconds('news_search')}`);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Busca las 6 noticias más recientes e importantes de HOY en Países Bajos (Holanda) específicamente sobre la categoría: "${category}". 
  
  NIVEL DE DIFICULTAD LINGÜÍSTICA: ${level}.
  
  Instrucciones Críticas:
  1. Utiliza fuentes oficiales en neerlandés (NOS, RTL Nieuws, NRC, de Volkskrant).
  2. El título debe estar en ESPAÑOL.
  3. El resumen (summary) debe estar en ESPAÑOL.
  4. ADAPTA el lenguaje.
  5. Devuelve estrictamente un JSON válido.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }] as any,
      // Cap para búsqueda: necesita pensar para filtrar pero devolver JSON conciso
      thinkingConfig: { thinkingBudget: 1000 },
      maxOutputTokens: 3000,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            url: { type: Type.STRING },
            source: { type: Type.STRING },
          },
          required: ["id", "title", "summary", "url", "source"]
        }
      }
    }
  });

  // Registrar éxito en throttling
  throttlingService.recordExecution('news_search');

  const newsData = JSON.parse(response.text || "[]");
  const finalNews = newsData.map((item: any) => ({
    ...item,
    category
  }));

  if (finalNews.length > 0) {
    supabase.from('news_cache').delete().eq('category', category).eq('level', level).lt('created_at', tenMinutesAgo)
      .then(() => {
        supabase.from('news_cache').insert({
          category,
          level,
          items: finalNews
        }).then();
      });
  }

  return finalNews;
};