
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  StopCircle, Sparkles, BookOpen, Mic, PlayCircle, Loader2, 
  Target, Library, Zap, GraduationCap, ArrowLeft, Settings2,
  Download, FileText, Check, ChevronRight, Trophy, PartyPopper,
  Save, Volume2, CheckCircle2, Star
} from 'lucide-react';
import { generateVocabulary, generateQuiz, generateLessonAudio, generateObjectives } from '../services/geminiService';
import { decode, decodeAudioData, saveAudioAsWav } from '../utils/audioUtils';
import { VocabularyItem, QuizQuestion, ProficiencyLevel } from '../types';
import VocabularyList from './VocabularyList';
import Quiz from './Quiz';
import { SkeletonPulse } from './Skeleton';

interface ScriptDisplayProps {
  content: string;
  title?: string;
  level?: ProficiencyLevel;
  onExit?: () => void;
}

type StepType = 'script' | 'objectives' | 'vocab' | 'quiz' | 'finish';
const STEPS: StepType[] = ['script', 'objectives', 'vocab', 'quiz', 'finish'];

interface ScriptSection {
  title: string;
  lines: string[];
}

const ScriptDisplay: React.FC<ScriptDisplayProps> = ({ content, title, level, onExit }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [audioExperience, setAudioExperience] = useState<'tutor' | 'podcast'>('tutor');
  const [showControls, setShowControls] = useState(false);
  
  const [vocabData, setVocabData] = useState<VocabularyItem[] | null>(null);
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [objectives, setObjectives] = useState<string[] | null>(null);
  
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastBase64Audio, setLastBase64Audio] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  const activeStep = STEPS[currentStepIdx];

  useEffect(() => {
    // Resetear al cambiar contenido
    setVocabData(null);
    setQuizData(null);
    setObjectives(null);
    setLastBase64Audio(null);
    setCurrentStepIdx(0);
    stopAudio();

    const prefetch = async () => {
      if (content.length < 200) return;
      try {
        const [v, q, o] = await Promise.all([
          generateVocabulary(content),
          generateQuiz(content),
          generateObjectives(content)
        ]);
        setVocabData(v);
        setQuizData(q);
        setObjectives(o);
      } catch (e) {
        console.error("Prefetch error:", e);
      }
    };

    const timer = setTimeout(prefetch, 1000);
    return () => clearTimeout(timer);
  }, [content]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStepIdx]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
        setShowControls(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parsedSections = useMemo((): ScriptSection[] => {
    const lines = content.split('\n');
    const sections: ScriptSection[] = [];
    let currentSection: ScriptSection = { title: 'INICIO', lines: [] };

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('SECTION:')) {
        if (currentSection.lines.length > 0) sections.push(currentSection);
        currentSection = { title: trimmed.replace('SECTION:', '').trim(), lines: [] };
      } else {
        currentSection.lines.push(line);
      }
    });
    if (currentSection.lines.length > 0) sections.push(currentSection);
    return sections;
  }, [content]);

  const handlePlayAudio = async () => {
    if (isPlaying) { stopAudio(); return; }
    if (lastBase64Audio) { playExistingAudio(lastBase64Audio); return; }

    setIsGeneratingAudio(true);
    try {
      const base64Audio = await generateLessonAudio(content, audioExperience);
      if (!base64Audio) throw new Error("No audio data");
      setLastBase64Audio(base64Audio);
      playExistingAudio(base64Audio);
    } catch (e) { 
      console.error(e);
    } finally { 
      setIsGeneratingAudio(false); 
    }
  };

  const playExistingAudio = async (base64: string) => {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
    const ctx = new AudioCtx({ sampleRate: 24000 });
    audioContextRef.current = ctx;
    const audioBuffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    audioSourceRef.current = source;
    source.start();
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
    }
    setIsPlaying(false);
  };

  const handleNextStep = () => {
    if (currentStepIdx < STEPS.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const downloadScript = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `speaksync_${title?.replace(/\s+/g, '_').toLowerCase() || 'lesson'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setShowControls(false);
  };

  const renderLine = (line: string) => {
    const parts = line.split(/(\[.*?\]|\(.*?\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return <span key={i} className="inline-block px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold leading-none shadow-sm shadow-orange-500/10">{part.slice(1, -1)}</span>;
      }
      if (part.startsWith('(') && part.endsWith(')')) {
        return <span key={i} className="text-slate-400 dark:text-slate-500 text-[13px] italic font-medium ml-1">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden relative bg-slate-50 dark:bg-slate-950 animate-fade-in">
      
      {/* HEADER COMPACTO - OPTIMIZADO PARA MÓVIL */}
      <header className="h-14 md:h-16 sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 md:px-6 shrink-0 transition-all">
        <button 
          onClick={onExit}
          className="p-2 text-slate-400 hover:text-orange-500 active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center flex-1 min-w-0 px-2">
            <div className="flex items-center gap-1.5 max-w-full">
              <span className="text-[8px] font-black px-1.5 py-0.5 bg-orange-500 text-white rounded uppercase shrink-0">
                {level?.split(' ')[0] || 'A1'}
              </span>
              <h1 className="text-[11px] font-black text-slate-900 dark:text-white uppercase truncate tracking-tight">
                {title || 'Lección Sync'}
              </h1>
            </div>
            {/* Indicador de pasos sutil */}
            <div className="flex gap-1 mt-2">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= currentStepIdx ? 'w-4 bg-orange-500' : 'w-1.5 bg-slate-200 dark:bg-slate-800'}`} />
              ))}
            </div>
        </div>

        <div className="flex items-center gap-1 relative" ref={controlsRef}>
          <button 
            onClick={handlePlayAudio}
            disabled={isGeneratingAudio}
            className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all active:scale-90
              ${isPlaying ? 'bg-red-500 text-white' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'}
            `}
          >
            {isGeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : isPlaying ? <StopCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
          </button>

          <button 
            onClick={() => setShowControls(!showControls)}
            className={`p-2 rounded-xl transition-all ${showControls ? 'text-orange-500' : 'text-slate-400'}`}
          >
            <Settings2 className="w-5 h-5" />
          </button>

          {showControls && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-[60] animate-fade-in-up">
              <div className="p-3">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Audio Master</p>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl mb-4">
                  <button onClick={() => setAudioExperience('tutor')} className={`py-2 rounded-lg text-[9px] font-black transition-all ${audioExperience === 'tutor' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400'}`}>TUTOR</button>
                  <button onClick={() => setAudioExperience('podcast')} className={`py-2 rounded-lg text-[9px] font-black transition-all ${audioExperience === 'podcast' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400'}`}>PODCAST</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => saveAudioAsWav(lastBase64Audio || "", "speaksync.wav")} disabled={!lastBase64Audio} className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-[8px] font-black text-slate-600 dark:text-slate-300 disabled:opacity-30 active:scale-95 transition-all">
                    <Download className="w-3 h-3" /> WAV
                  </button>
                  <button onClick={downloadScript} className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-[8px] font-black text-slate-600 dark:text-slate-300 active:scale-95 transition-all">
                    <FileText className="w-3 h-3" /> TXT
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ÁREA DE CONTENIDO - FLUJO PASO A PASO */}
      <main ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-24 script-scroll">
        <div className="max-w-2xl mx-auto px-4 py-6 md:px-8 space-y-6">
          
          {activeStep === 'script' && parsedSections.map((section, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl p-4 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in-up transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 italic">{section.title}</span>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="space-y-4">
                {section.lines.map((line, lIdx) => (
                  <p key={lIdx} className="text-slate-700 dark:text-slate-300 leading-relaxed text-[15px] md:text-[18px] font-medium">
                    {renderLine(line)}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {activeStep === 'objectives' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Metas de <span className="text-orange-500">Sincronía</span></h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Lo que dominaremos en esta unidad</p>
              </div>
              {!objectives ? (
                [1, 2, 3].map(i => <SkeletonPulse key={i} className="h-16 w-full rounded-xl" />)
              ) : (
                objectives.map((obj, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.01]">
                    <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-lg shadow-orange-500/10 italic">{i+1}</div>
                    <p className="text-slate-700 dark:text-slate-200 font-bold text-sm md:text-base self-center leading-tight">{obj}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeStep === 'vocab' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Bóveda <span className="text-orange-500">Léxica</span></h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Términos tácticos extraídos del guion</p>
              </div>
              {!vocabData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <SkeletonPulse key={i} className="h-20 w-full rounded-xl" />) }
                </div>
              ) : <VocabularyList items={vocabData} /> }
            </div>
          )}

          {activeStep === 'quiz' && (
            <div className="space-y-6">
               <div className="text-center mb-4">
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase">Validación <span className="text-orange-500">Táctica</span></h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Demuestra tu dominio sobre el contenido</p>
               </div>
               {!quizData ? (
                <div className="space-y-4">
                  <SkeletonPulse className="h-40 w-full rounded-2xl" />
                  <SkeletonPulse className="h-40 w-full rounded-2xl" />
                </div>
               ) : <Quiz questions={quizData} /> }
            </div>
          )}

          {activeStep === 'finish' && (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in px-4">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-orange-500/40 animate-bounce">
                <PartyPopper className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Unidad <span className="text-orange-500">Completada.</span></h2>
              <p className="text-slate-500 font-medium mb-10 max-w-xs text-sm">Has finalizado todas las etapas de esta sincronización lingüística con éxito.</p>
              
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-10">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">XP Ganado</span>
                  <span className="text-xl font-black italic text-orange-500">+150</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                  <span className="text-xl font-black italic text-indigo-500">MAESTRO</span>
                </div>
              </div>

              <button 
                onClick={onExit}
                className="w-full max-w-sm py-5 bg-orange-500 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Save className="w-4 h-4" /> Finalizar y Guardar Progreso
              </button>
            </div>
          )}

        </div>
      </main>

      {/* BARRA DE NAVEGACIÓN SECUENCIAL FLOTANTE */}
      {activeStep !== 'finish' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-slate-50/90 dark:via-slate-950/90 to-transparent pointer-events-none z-40">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 pointer-events-auto">
            <button 
              onClick={handlePrevStep}
              disabled={currentStepIdx === 0}
              className={`h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2 border-2 active:scale-95 ${currentStepIdx === 0 ? 'opacity-0 pointer-events-none' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}
            >
              Atrás
            </button>
            <button 
              onClick={handleNextStep}
              className="flex-1 h-12 bg-orange-500 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {currentStepIdx === STEPS.length - 2 ? 'Ver Resultados' : 'Siguiente Etapa'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptDisplay;
