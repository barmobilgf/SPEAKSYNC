import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RoleplayScenario, RoleplayTurnResponse, RoleplayMessage, ProficiencyLevel } from "../types";
import { DUTCH_CURRICULUM } from "../data/curriculum";

export const getMissionsForLevel = (level: ProficiencyLevel): RoleplayScenario[] => {
  const levelData = DUTCH_CURRICULUM.find(l => l.level === level);
  if (!levelData) return [];

  return levelData.modules.map((module, index) => {
    const objectives = [
      { id: 'obj1', description: `Iniciar la interacción con naturalidad`, completed: false },
      { id: 'obj2', description: `Usar vocabulario específico de: ${module.title}`, completed: false },
      { id: 'obj3', description: `Completar el intercambio con éxito comunicativo`, completed: false }
    ];

    return {
      id: module.id,
      title: module.title,
      roles: "Tú eres el protagonista. La IA actuará como la contraparte holandesa necesaria.",
      summary: `Simulación táctica basada en el Módulo ${index + 1}: ${module.title}. Debes aplicar lo aprendido para resolver esta situación social o profesional.`,
      initialMessage: `Hoi! Welkom bij de simulatie. Vamos a practicar: ${module.title}. ¿Estás listo para empezar?`,
      icon: "🎯",
      objectives
    };
  });
};

export const processRoleplayTurn = async (
  scenario: RoleplayScenario,
  history: RoleplayMessage[],
  userInput: string
): Promise<RoleplayTurnResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Extraer objetivos no completados para presionar a la IA a validarlos
    const pendingObjectives = scenario.objectives
      .filter(o => !o.completed)
      .map(o => `- ${o.id}: ${o.description}`)
      .join('\n');

    const ROLEPLAY_STYLE_GUIDE = `
    PROTOCOLO DE TRIAJE TÁCTICO Y VALIDACIÓN DE PROGRESO:
    1. PROHIBICIÓN DE SÍMBOLOS: No uses almohadillas (#) ni asteriscos (*).
    2. FORMATO DE TÉRMINOS: [Neerlandés] (Español).
    3. VALIDACIÓN DE OBJETIVOS (CRÍTICO): 
       - Evalúa si el usuario ha cumplido alguno de estos objetivos pendientes:
       ${pendingObjectives}
       - Si el usuario ha demostrado la habilidad requerida, incluye el ID en 'completedObjectiveIds'.
    4. TRIAJE DE FEEDBACK: 
       - grammar_feedback: Errores y correcciones.
       - cultural_feedback: Etiqueta holandesa aplicada.
       - vocabulary_feedback: Sugerencias de modismos.
    `;

    const prompt = `Actúa como el personaje de la simulación: "${scenario.title}". 
    ${ROLEPLAY_STYLE_GUIDE}
    
    Resumen del contexto: ${scenario.summary}. 
    Nivel: ${scenario.id.split('-')[0]}.

    Instrucciones de comportamiento: Actúa de forma realista como un ciudadano holandés.
    
    Última entrada del Estudiante: ${userInput}

    Devuelve un JSON con:
    - reply: Tu respuesta en Neerlandés (Lenguaje natural).
    - completedObjectiveIds: IDs de objetivos logrados en este turno.
    - grammar_feedback: Análisis gramatical (Sin Markdown).
    - cultural_feedback: Análisis cultural (Sin Markdown).
    - vocabulary_feedback: Sugerencias de vocabulario (Sin Markdown).
    - suggestion: Frase sugerida para que el usuario continúe.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Roleplay Capping: necesitamos turnos rápidos y concisos para simular habla.
        thinkingConfig: { thinkingBudget: 500 },
        maxOutputTokens: 2000,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            completedObjectiveIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            grammar_feedback: { type: Type.STRING },
            cultural_feedback: { type: Type.STRING },
            vocabulary_feedback: { type: Type.STRING },
            suggestion: { type: Type.STRING }
          },
          required: ["reply", "completedObjectiveIds", "grammar_feedback", "cultural_feedback", "vocabulary_feedback", "suggestion"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Roleplay turn processing failed:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanText = text.replace(/\[(.*?)\]/g, '$1').replace(/\((.*?)\)/g, '');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    return null;
  }
};