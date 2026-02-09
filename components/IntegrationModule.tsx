import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShieldCheck, Scale, Landmark, HeartHandshake, Briefcase, Sparkles, 
  Loader2, BookOpen, Timer, ChevronRight, Award, Info, ArrowRight, 
  Settings2, Shield, Search, Filter, CheckCircle2, Zap, FileText,
  FileCheck, Download, ArrowLeft, MoreVertical, Share2, CornerDownRight,
  Clock, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { generateIntegrationExam, generateCivicTacticalGuide } from '../services/integrationService';
import { DUTCH_CURRICULUM } from '../data/curriculum';
import { QuizQuestion, ProficiencyLevel, SyncSource } from '../types';
import Quiz from './Quiz';

interface IntegrationModuleProps {
  onGenerateImmersion: (topic: string, level: ProficiencyLevel) => void;
}

const CATEGORIES = [
  { id: 'knm', label: 'Sobrevivir a Holanda (KNM)', icon: <Landmark className="w-4 h-4" />, color: 'orange' },
  { id: 'legal', label: 'Tus Derechos (Sin líos)', icon: <Scale className="w-4 h-4" />, color: 'indigo' },
  { id: 'ona', label: 'Buscando Curro (ONA)', icon: <Briefcase className="w-4 h-4" />, color: 'emerald' },
  { id: 'map', label: 'Hacerse el Holandés (MAP)', icon: <HeartHandshake className="w-4 h-4" />, color: 'rose' }
];

const IntegrationModule: React.FC<IntegrationModuleProps> = ({ onGenerateImmersion }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [currentLevel, setCurrentLevel] = useState<ProficiencyLevel>(ProficiencyLevel.A2);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentGuide, setCurrentGuide] = useState<string | null>(null);
  const [guideTitle, setGuideTitle] = useState('');
  const [examQuestions, setExamQuestions] = useState<QuizQuestion[] | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(s => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  useEffect(() => {
    if (scrollRef.current && isStreaming) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentGuide, isStreaming]);

  const levels = Object.values(ProficiencyLevel);

  const filteredModules = useMemo(() => {
    const levelModules = DUTCH_CURRICULUM.find(l => l.level === currentLevel)?.modules || [];
    return levelModules.filter(m => {
      const title = m.title.toLowerCase();
      let category = 'knm'; 
      if (title.includes('trabajo') || title.includes('laboral') || title.includes('profesiones') || 
          title.includes('entrevistas') || title.includes('contratos') || title.includes('negociación')) category = 'ona';
      else if (title.includes('leyes') || title.includes('derechos') || title.includes('gobierno') || 
               title.includes('tráfico') || title.includes('documentación') || title.includes('bsn') || 
               title.includes('legal') || title.includes('justicia') || title.includes('impuestos')) category = 'legal';
      else if (title.includes('participación') || title.includes('voluntariado') || title.includes('social') || 
               title.includes('amigos') || title.includes('fiesta') || title.includes('hobbys')) category = 'map';
      return category === activeCategory && title.includes(searchQuery.toLowerCase());
    });
  }, [currentLevel, activeCategory, searchQuery]);

  const handleStartExam = async () => {
    setIsInitialized(true);
    setIsLoading(true);
    try {
      const questions = await generateIntegrationExam(activeCategory, currentLevel);
      setExamQuestions(questions);
      setIsSimulating(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSyncGuide = async (moduleTitle: string) => {
    setError(null);
    setGuideTitle(moduleTitle);
    setIsLoading(true);
    setCurrentGuide('');
    setIsStreaming(false);

    try {
      const stream = await generateCivicTacticalGuide(moduleTitle, currentLevel);
      setIsLoading(false);
      setIsStreaming(true);
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk.text;
        setCurrentGuide(fullText);
      }
    } catch (err: any) {
      if (err.message?.startsWith('TOOL_THROTTLED:')) {
        const secs = parseInt(err.message.split(':')[1]);
        setCooldownSeconds(secs);
        setError(`¡Relaja! Espera ${secs}s para buscar leyes.`);
      } else {
        setError("Error en la conexión cívica. Intenta en unos minutos.");
      }
      setCurrentGuide(null);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const renderGuideContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('SECTION:')) {
        const title = trimmed.replace('SECTION:', '').trim();
        return (
          <div key={i} className="mt-12 mb-8 first:mt-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 whitespace-nowrap bg-white dark:bg-slate-900 px-4">{title}</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        );
      }
      if (trimmed.startsWith('-')) {
        return (
          <div key={i} className="flex gap-4 mb-4 pl-4 animate-fade-in-up">
            <CornerDownRight className="w-4 h-4 text-orange-500 shrink-0 mt-1" />
            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{renderFormattedText(trimmed.substring(1))}</p>
          </div>
        );
      }
      if (!trimmed) return <div key={i} className="h-4" />;
      return (
        <p key={i} className="mb-6 text-slate-800 dark:text-slate-200 leading-relaxed font-medium text-lg antialiased">{renderFormattedText(line)}</p>
      );
    });
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\[.*?\]|\(.*?\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span key={i} className="inline-block px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold border border-orange-400 mx-0.5 shadow-sm shadow-orange-500/20">{part.slice(1, -1)}</span>
        );
      }
      if (part.startsWith('(') && part.endsWith(')')) {
        return <span key={i} className="text-slate-400 dark:text-slate-500 italic text-sm font-medium ml-1">{part}</span>;
      }
      return part;
    });
  };

  if (currentGuide !== null) {
    return (
      <div className="animate-fade-in bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col h-[85vh] md:h-[850px] overflow-hidden relative">
        <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentGuide(null)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-orange-500 transition-all active:scale-90"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-500">MANUAL ANTI-PÁNICO</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic truncate max-w-[200px] md:max-w-md leading-none">{guideTitle}</h3>
            </div>
          </div>
        </header>
        <div ref={scrollRef} className="flex-1 overflow-y-auto script-scroll bg-slate-50/20 dark:bg-slate-950/20 p-8 md:p-16">
          <div className="max-w-3xl mx-auto relative">
             {isStreaming && (
                <div className="sticky top-0 z-30 mb-8 flex justify-center">
                  <div className="bg-orange-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/30 animate-pulse flex items-center gap-3"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando leyes vigentes...</div>
                </div>
             )}
             {currentGuide ? (
                <div className="animate-fade-in-up font-sans">{renderGuideContent(currentGuide)}</div>
             ) : (
                <div className="py-20 flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Consultando con un abogado IA...</p>
                </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-full box-border overflow-hidden pb-20">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><ShieldAlert className="w-32 h-32" /></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-2">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-3"><ShieldAlert className="w-6 h-6 text-orange-500" /> Manual Anti-Pánico</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lo que necesitas saber para que no te líen en el ayuntamiento</p>
          </div>
          <div className="flex flex-wrap bg-slate-50 dark:bg-slate-950 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-800 gap-1.5 shadow-inner">
             {levels.map(level => (
               <button key={level} onClick={() => setCurrentLevel(level)} className={`px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${currentLevel === level ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25 scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>{level.split(' ')[0]}</button>
             ))}
          </div>
        </div>
      </div>

      {!isSimulating && (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input type="text" placeholder="¿Qué trámite te quita el sueño?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-16 pr-6 py-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 outline-none focus:border-orange-500 font-bold text-slate-700 dark:text-white transition-all shadow-sm" />
            </div>
            <button onClick={handleStartExam} className="w-full md:w-auto px-8 py-6 bg-orange-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 active:scale-95"><Timer className="w-4 h-4" /> Simulacro de Inburgering</button>
          </div>
          <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex-1 min-w-[140px] py-4 px-6 rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 ${activeCategory === cat.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{cat.icon} {cat.label}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredModules.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]"><p className="text-[10px] font-black uppercase tracking-[0.5em]">No hay manuales para esto todavía</p></div>
            ) : (
              filteredModules.map((module) => (
                <div key={module.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 flex flex-col h-full shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden box-border hover:-translate-y-2">
                  <div className="flex items-center justify-between mb-8">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-orange-500 group-hover:text-white rounded-2xl transition-all shadow-sm group-hover:shadow-orange-500/20">{CATEGORIES.find(c => c.id === activeCategory)?.icon}</div>
                  </div>
                  <div className="space-y-4 flex-grow mb-10">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight italic uppercase tracking-tighter group-hover:text-orange-500 transition-colors">{module.title}</h3>
                  </div>
                  <button onClick={() => handleSyncGuide(module.title)} disabled={cooldownSeconds > 0} className="w-full py-5 px-6 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-orange-600 transition-all active:scale-95 shadow-xl shadow-orange-500/30 disabled:opacity-50">¡Sácame de dudas!</button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {isSimulating && examQuestions && (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-4 md:p-8 border border-slate-100 dark:border-slate-800 animate-fade-in-up">
           <div className="flex items-center justify-between mb-8 px-4">
              <button onClick={() => setIsSimulating(false)} className="text-[10px] font-black uppercase text-slate-400 hover:text-orange-500 transition-colors">Abortar</button>
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase shadow-lg shadow-orange-500/25">Simulador {activeCategory.toUpperCase()}</div>
           </div>
           <Quiz questions={examQuestions} />
        </div>
      )}
    </div>
  );
};

export default IntegrationModule;