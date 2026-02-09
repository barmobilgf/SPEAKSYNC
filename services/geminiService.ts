import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProficiencyLevel, LessonTone, VocabularyItem, TrainingQuestion, QuizQuestion, ScriptImprovementResponse } from "../types";

// Almacén local de referencias de caché para evitar recreaciones innecesarias
const cacheStore: Record<string, { name: string; expires: number }> = {};

// Lógica de volumen adaptativo con requisitos mínimos de densidad
const getTargetVolumeInfo = (level: ProficiencyLevel) => {
  if (level.startsWith('A1')) return { 
    words: "350-450", 
    detail: "EXTREMADAMENTE IMPORTANTE: No generes menos de 350 palabras reales. Incluye un diálogo de al menos 12 líneas, una sección gramatical detallada y consejos culturales. Foco en estructuras básicas pero con volumen suficiente para una lección real." 
  };
  if (level.startsWith('A2')) return { 
    words: "600-700", 
    detail: "IMPORTANTE: Genera un contenido denso de unas 650 palabras. Explica tiempos pasados y situaciones sociales con profundidad. Diálogos extendidos y explicaciones gramaticales ricas." 
  };
  if (level.startsWith('B1')) return { 
    words: "850-950", 
    detail: "Contenido intermedio de alto volumen. Análisis de matices y diálogos complejos de opinión. No escatimes en detalles técnicos." 
  };
  return { 
    words: "1100-1300", 
    detail: "Inmersión profesional completa. Máxima densidad de vocabulario y matices culturales profundos." 
  };
};

const STYLE_GUIDE = (level: ProficiencyLevel) => {
  const volume = getTargetVolumeInfo(level);
  return `
MANUAL DE ESTILO CRÍTICO SPEAKSYNC (NIVEL ${level}):
1. Actúa como un Director Lingüístico Experto en NEERLANDÉS para hispanohablantes. 
2. OBJETIVO DE VOLUMEN: Debes generar aproximadamente ${volume.words} palabras. ${volume.detail}
3. REGLAS DE FORMATO INVIOLABLES:
   - Toda palabra o frase en NEERLANDÉS debe ir entre corchetes: [De auto].
   - Inmediatamente después, su traducción en ESPAÑOL entre paréntesis: (El coche).
   - NO uses negritas ni HTML. Usa MAYÚSCULAS para títulos de secciones.
4. ESTRUCTURA OBLIGATORIA (CUMPLE TODAS CON DENSIDAD):

   SECTION: ESCENARIO NARRATIVO
   Un diálogo realista y extenso que cubra al menos el 40% del volumen total.

   SECTION: ANATOMÍA LINGÜÍSTICA
   Desglose técnico y pedagógico de la gramática.

   SECTION: TALLER DE FONÉTICA
   Instrucciones detalladas de pronunciación.

   SECTION: SYNC CULTURAL
   Contexto y etiqueta holandesa.

   SECTION: LABORATORIO DE PRÁCTICA
   Ejercicios de traducción inversa.
`;
};

/**
 * Gestiona la creación y recuperación de un Context Cache para el nivel específico.
 * Reduce el costo de tokens de entrada al no enviar el STYLE_GUIDE en cada petición.
 */
const getOrCreateCache = async (ai: any, level: ProficiencyLevel) => {
  const levelKey = level.split(' ')[0];
  const now = Date.now();
  
  if (cacheStore[levelKey] && cacheStore[levelKey].expires > now) {
    return cacheStore[levelKey].name;
  }

  // Crear nuevo caché con TTL de 1 hora
  const cache = await ai.caches.create({
    model: 'gemini-3-flash-preview',
    displayName: `speaksync_style_${levelKey.toLowerCase()}`,
    systemInstruction: STYLE_GUIDE(level),
    ttlSeconds: 3600,
  });

  cacheStore[levelKey] = {
    name: cache.name,
    expires: now + (3600 * 1000) - (60 * 1000) // Margen de 1 minuto
  };

  return cache.name;
};

export const generateLessonScriptStream = async (topic: string, level: ProficiencyLevel, isExam: boolean = false, tone: LessonTone = LessonTone.GEZELLIG) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const cacheName = await getOrCreateCache(ai, level);
    
    const prompt = `
      SOLICITUD DE GENERACIÓN MAESTRA SPEAKSYNC:
      Genera una ${isExam ? 'EVALUACIÓN DE MAESTRÍA' : 'UNIDAD DE INMERSIÓN TOTAL'} para el nivel ${level}.
      TEMA CENTRAL: "${topic}"
      TONO REQUERIDO: ${tone}
    `;

    return await ai.models.generateContentStream({ 
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      cachedContent: cacheName,
      config: {
        temperature: 0.7,
        topP: 0.95,
        // Capping de seguridad para lecciones del roadmap: balance entre razonamiento y output denso.
        thinkingConfig: { thinkingBudget: 1500 },
        maxOutputTokens: 5000 
      }
    });
  } catch (error) {
    console.warn("Context Caching failed, falling back to standard generation", error);
    
    const fullPrompt = `
      SOLICITUD DE GENERACIÓN MAESTRA SPEAKSYNC:
      Genera una ${isExam ? 'EVALUACIÓN DE MAESTRÍA' : 'UNIDAD DE INMERSIÓN TOTAL'} para el nivel ${level}.
      TEMA CENTRAL: "${topic}"
      TONO REQUERIDO: ${tone}

      ${STYLE_GUIDE(level)}
    `;

    return await ai.models.generateContentStream({ 
      model: 'gemini-3-flash-preview', 
      contents: fullPrompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
        thinkingConfig: { thinkingBudget: 1500 },
        maxOutputTokens: 5000 
      }
    });
  }
};

export const generateVocabulary = async (script: string): Promise<VocabularyItem[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Extrae el vocabulario clave de este guion. Devuelve array JSON de objetos: dutch, spanish, type, pronunciation. Solo palabras entre corchetes: ${script}`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Cap bajo para tareas de extracción directa
        maxOutputTokens: 1000,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dutch: { type: Type.STRING },
              spanish: { type: Type.STRING },
              type: { type: Type.STRING },
              pronunciation: { type: Type.STRING }
            },
            required: ["dutch", "spanish", "type"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};

export const generateQuiz = async (script: string): Promise<QuizQuestion[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Genera un cuestionario de 5 preguntas basado en este guion: ${script}. Devuelve JSON: array de objetos con question, options (array de 4), correctAnswer (indice 0-3), explanation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Cap medio para asegurar explicaciones completas pero no excesivas
        maxOutputTokens: 1500,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};

export const generateObjectives = async (script: string): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Extrae 3 objetivos de aprendizaje de este guion: ${script}. Devuelve array JSON de strings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Cap ultra-bajo para ahorro de tokens
        maxOutputTokens: 500,
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};

export const generateTrainingSet = async (vocabItems: VocabularyItem[]): Promise<TrainingQuestion[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Genera ejercicios de práctica de escritura basados en este vocabulario: ${JSON.stringify(vocabItems)}. Devuelve JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 1500,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING },
              prompt: { type: Type.STRING },
              correctAnswer: { type: Type.STRING },
              context: { type: Type.STRING },
              explanation: { type: Type.STRING },
              vocabId: { type: Type.STRING }
            },
            required: ["id", "type", "prompt", "correctAnswer", "vocabId"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};

export const improveScript = async (text: string, level: ProficiencyLevel): Promise<ScriptImprovementResponse | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analiza críticamente y eleva este texto de neerlandés al nivel ${level}. Corrige gramática, sintaxis y naturalidad. Devuelve JSON detallado.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Atelier Capping: Reducido para mayor precisión y menor coste de razonamiento
        thinkingConfig: { thinkingBudget: 1000 },
        maxOutputTokens: 3000,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalWithCorrections: { type: Type.STRING },
            improvedVersion: { type: Type.STRING },
            feedback: { type: Type.STRING },
            detectedTopic: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["originalWithCorrections", "improvedVersion", "feedback", "detectedTopic", "category"]
        }
      }
    });
    return JSON.parse(response.text || "null");
  } catch (e) { return null; }
};

export const generateLessonAudio = async (content: string, experience: 'tutor' | 'podcast'): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanContent = content
      .replace(/SECTION:.*?\n/g, '')
      .replace(/\[(.*?)\]/g, '$1')
      .replace(/\((.*?)\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: cleanContent.substring(0, 3000) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { 
              voiceName: experience === 'tutor' ? 'Zephyr' : 'Kore' 
            },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Audio generation failed:", error);
    return null;
  }
};