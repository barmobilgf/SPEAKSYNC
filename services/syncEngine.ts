
import { getCachedContent, saveContentToCache, saveChapterProgress, updateUserStats } from './supabase';
// Use generateLessonScriptStream instead of generateLessonScript as it is the available export in geminiService.ts
import { generateLessonScriptStream, generateVocabulary, generateQuiz } from './geminiService';
import { ProficiencyLevel, LessonTone } from '../types';

export const syncLessonContent = async (
  chapterId: string, 
  topic: string, 
  level: ProficiencyLevel,
  isExam: boolean = false
) => {
  // 1. Intentar obtener de la caché de Supabase
  const cached = await getCachedContent(chapterId);
  
  if (cached) {
    console.log(`[SyncEngine] Cargando ${chapterId} desde Caché Supabase (Costo $0)`);
    return {
      content: cached.content,
      vocabulary: cached.vocabulary,
      quiz: cached.quiz,
      isFromCache: true
    };
  }

  // 2. Si no existe, generar con Gemini
  console.log(`[SyncEngine] Generando nuevo contenido maestro para ${chapterId}`);
  // Aggregate the results from the stream to build the full lesson script
  const stream = await generateLessonScriptStream(topic, level, isExam);
  let script = "";
  for await (const chunk of stream) {
    script += chunk.text || "";
  }
  
  // Generamos vocabulario y quiz en paralelo para ahorrar tiempo
  const [vocab, quiz] = await Promise.all([
    generateVocabulary(script),
    generateQuiz(script)
  ]);

  // 3. Guardar en Caché Maestro para futuros usuarios
  await saveContentToCache(chapterId, topic, script, vocab, quiz);

  return {
    content: script,
    vocabulary: vocab,
    quiz: quiz,
    isFromCache: false
  };
};

export const completeSyncTurn = async (chapterId: string, xpEarned: number, currentXp: number) => {
  await Promise.all([
    saveChapterProgress(chapterId, 100),
    updateUserStats({ xp: currentXp + xpEarned })
  ]);
};
