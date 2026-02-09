
import React, { useState, useEffect } from 'react';
import { VocabularyItem, TrainingQuestion, VocabMastery } from '../types';
import { generateTrainingSet } from '../services/geminiService';
import { updateVocabMastery, updateUserStats, fetchUserProfile } from '../services/supabase';
import { Brain, ArrowRight, CheckCircle2, XCircle, Loader2, Sparkles, PenTool, Flame, Target, Trophy, RefreshCw } from 'lucide-react';

interface FlashSyncProps {
  vocabSource: VocabularyItem[];
  onFinish: () => void;
}

const FlashSync: React.FC<FlashSyncProps> = ({ vocabSource, onFinish }) => {
  const [questions, setQuestions] = useState<TrainingQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Seleccionar 5 palabras aleatorias que no estén masterizadas
      const pool = vocabSource
        .filter(v => v.mastery !== VocabMastery.MASTERED)
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);
      
      const data = await generateTrainingSet(pool);
      setQuestions(data);
      setIsLoading(false);
    };
    init();
  }, [vocabSource]);

  const handleCheck = async () => {
    if (!userInput.trim()) return;
    setIsChecking(true);
    
    const q = questions[currentIndex];
    const normalizedUser = userInput.trim().toLowerCase();
    const normalizedCorrect = q.correctAnswer.toLowerCase();
    
    const correct = normalizedUser === normalizedCorrect;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setScore(s => s + 1);
      // Subir maestría
      await updateVocabMastery(q.vocabId, VocabMastery.LEARNING);
    } else {
      // Bajar a crítico si falla
      await updateVocabMastery(q.vocabId, VocabMastery.CRITICAL);
    }
    
    setIsChecking(false);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setShowFeedback(false);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    const profile = await fetchUserProfile();
    if (profile) {
        await updateUserStats({ xp: profile.xp + (score * 10) });
    }
    onFinish();
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Preparando Sesión de Escritura...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
        <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
            <Trophy className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase mb-2">Bóveda Sincronizada</h3>
            <p className="text-sm text-slate-500 mb-8">No tienes palabras pendientes de práctica. ¡Excelente trabajo!</p>
            <button onClick={onFinish} className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/25 active:scale-95">Volver</button>
        </div>
    );
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Progress Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 text-white rounded-lg shadow-lg shadow-orange-500/25">
                <Brain className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sesión de Escritura</span>
        </div>
        <span className="text-xs font-black text-orange-500">{currentIndex + 1} / {questions.length}</span>
      </div>
      
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Main Training Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="space-y-10 relative z-10">
          <div className="text-center space-y-4">
            <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
                {q.type === 'writing' ? 'Traducción Directa' : 'Vocabulario en Contexto'}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                {q.prompt}
            </h2>
            {q.context && (
                <p className="text-xl text-slate-400 font-medium italic border-t border-slate-50 dark:border-slate-800 pt-6 mt-6">
                    {q.context.replace(q.correctAnswer, '______')}
                </p>
            )}
          </div>

          <div className="relative">
            <input 
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Escribe en neerlandés..."
              className={`w-full p-8 rounded-3xl border-4 text-2xl font-black text-center outline-none transition-all
                ${showFeedback 
                    ? (isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/10 text-green-600' : 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-600')
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-orange-500 text-slate-900 dark:text-white shadow-inner'}
              `}
              disabled={showFeedback || isChecking}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && (showFeedback ? handleNext() : handleCheck())}
            />
          </div>

          {!showFeedback ? (
            <button
              onClick={handleCheck}
              disabled={!userInput.trim() || isChecking}
              className="w-full py-6 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-orange-500/30 hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {isChecking ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sincronizar Respuesta'}
            </button>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
                <div className={`p-6 rounded-3xl border flex items-center gap-4 ${isCorrect ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
                    {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">{isCorrect ? '¡Perfecto!' : 'Error de Sincronía'}</p>
                        <p className="text-lg font-bold">{isCorrect ? 'Respuesta Correcta' : `Era: ${q.correctAnswer}`}</p>
                    </div>
                </div>
                
                {q.explanation && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nota del Tutor</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{q.explanation}</p>
                    </div>
                )}

                <button
                    onClick={handleNext}
                    className="w-full py-6 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 hover:bg-orange-600 transition-all active:scale-95"
                >
                    Continuar <ArrowRight className="w-4 h-4" />
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashSync;
