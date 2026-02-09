import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, ProficiencyLevel } from "../types";
import { throttlingService } from "./throttlingService";

const CIVIC_STYLE_GUIDE = `
PROTOCOLO DE RUIDO CERO - SPEAKSYNC CIVIC:
Actúa como un Consultor Legal y Social de élite en los Países Bajos. Tu objetivo es generar una GUÍA TÁCTICA DE CAMPO.

RESTRICCIONES ESTRICTAS DE FORMATO:
1. PROHIBICIÓN DE SÍMBOLOS: No uses almohadillas (#), asteriscos (*), guiones largos (---) ni bloques de código.
2. ESTRUCTURA DE SECCIONES: Usa exclusivamente la etiqueta "SECTION: NOMBRE" en mayúsculas para separar bloques.
3. LISTAS: Usa únicamente el guion simple "-" seguido de un espacio para listados.
4. TÉRMINOS TÉCNICOS: Usa estrictamente el formato [Término en Neerlandés] (Traducción al Español). 
5. ESPACIADO: Usa saltos de línea dobles para separar párrafos.
6. CONTENIDO DIRECTO: Empieza directamente con la primera sección. No incluyas saludos ni despedidas.

ESTRUCTURA OBLIGATORIA:

SECTION: PROTOCOLO ADMINISTRATIVO
Desglose técnico paso a paso de qué hacer físicamente.

SECTION: MARCO LEGAL Y DERECHOS
Citas a la normativa neerlandesa y derechos del residente.

SECTION: CÓDIGOS NO ESCRITOS
Análisis cultural y expectativas de etiqueta (Directness, Punctuality).

SECTION: GLOSARIO DE PODER
Términos burocráticos clave en [Neerlandés] (Traducción).

SECTION: CHECKLIST DE ACCIÓN
Tareas prácticas e inmediatas.

TONO: Sobrio, técnico, autoritario y extremadamente preciso.
`;

export const generateCivicTacticalGuide = async (topic: string, level: ProficiencyLevel) => {
  // Verificar Throttling
  if (throttlingService.isThrottled('civic_search')) {
    throw new Error(`TOOL_THROTTLED:${throttlingService.getRemainingSeconds('civic_search')}`);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    GENERACIÓN DE DOSSIER CÍVICO:
    TEMA: "${topic}"
    NIVEL: ${level}

    ${CIVIC_STYLE_GUIDE}

    INSTRUCCIÓN: Usa Google Search para validar datos de la IND, Belastingdienst o Gemeente vigentes a la fecha actual.
  `;

  const stream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }] as any,
      temperature: 0.3,
      // Capping cívico: requiere razonamiento legal denso.
      thinkingConfig: { thinkingBudget: 1500 },
      maxOutputTokens: 5000
    }
  });

  // Registrar ejecución
  throttlingService.recordExecution('civic_search');

  return stream;
};

export const generateIntegrationExam = async (category: string, level: ProficiencyLevel): Promise<QuizQuestion[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Genera un simulacro de examen oficial de Inburgering para la sección: "${category}". 
    
    NIVEL DE DIFICULTAD: ${level}.
    
    Instrucciones:
    1. Debe contener 10 preguntas de opción múltiple.
    2. Las preguntas deben estar en NEERLANDÉS adaptado al nivel ${level}.
    3. Las opciones y explicaciones deben estar en ESPAÑOL.
    4. El tema debe ser relevante para la categoría ${category}.
    5. Devuelve estrictamente un JSON válido.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        // Capping de exámenes: balance para 10 preguntas con explicaciones
        thinkingConfig: { thinkingBudget: 1000 },
        maxOutputTokens: 3500,
        responseMimeType: "application/json",
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
    console.error("Integration exam generation failed:", error);
    return [];
  }
};