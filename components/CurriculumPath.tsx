import React, { useState, useEffect, useMemo } from 'react';
import { DUTCH_CURRICULUM } from '../data/curriculum';
// Added Module to the types import
import { ProficiencyLevel, Chapter, Module, HistoryItem, SyncSource } from '../types';
import { 
  Map, ChevronDown, ChevronRight, PlayCircle, Target, ArrowLeft, 
  Info, CheckCircle2, Library, Search,
  Newspaper, Gamepad2, ShieldCheck, Zap, Calendar, ArrowUpRight,
  ChevronUp, Sparkles, Skull
} from 'lucide-react';
import { generateLessonScriptStream, generateVocabulary, generateQuiz } from '../services/geminiService';
import { syncProgressToCloud, fetchProgressFromCloud, fetchHistoryFromCloud, saveContentToCache } from '../services/supabase';
import ScriptDisplay from './ScriptDisplay';
import Philosophy from './Philosophy';
import { LessonSkeleton } from './Skeleton';

interface CurriculumPathProps {
  onSaveHistory: (topic: string, level: ProficiencyLevel, content: string, source: SyncSource) => void;
}

const CurriculumPath: React.FC<CurriculumPathProps> = ({ onSaveHistory }) => {
  const [activeTab, setActiveTab] = useState<'explore' | 'library'>('explore');
  const [activeLevelIdx, setActiveLevelIdx] = useState(0);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<{ chapter: Chapter, topic: string, level: ProficiencyLevel } | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SyncSource | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<ProficiencyLevel | 'all'>('all');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const [completedChapters, setCompletedChapters] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('speaksync_completed');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    const loadData = async () => {
      const [cloudIds, cloudHistory] = await Promise.all([
        fetchProgressFromCloud(),
        fetchHistoryFromCloud()
      ]);
      
      if (cloudIds) {
        setCompletedChapters(prev => {
          const next = new Set(prev);
          (cloudIds as string[]).forEach(id => next.add(id));
          return next;
        });
      }
      if (cloudHistory) setHistory(cloudHistory);
    };
    loadData();
  }, []);

  useEffect(() => {
    const ids = Array.from(completedChapters) as string[];
    localStorage.setItem('speaksync_completed', JSON.stringify(ids));
    if (ids.length > 0) syncProgressToCloud(ids);
  }, [completedChapters]);

  const currentLevel = DUTCH_CURRICULUM[activeLevelIdx];

  const handleStartLesson = async (chapter: Chapter, moduleId: string, moduleTitle: string) => {
    const topic = `${moduleTitle} - ${chapter.title}`;
    setSelectedLesson({ chapter, topic, level: currentLevel.level });
    setIsLoading(true);
    setIsStreaming(false);
    setGeneratedContent(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const streamResponse = await generateLessonScriptStream(topic, currentLevel.level, chapter.isExam);
      setIsLoading(false);
      setIsStreaming(true);
      
      let fullText = "";
      for await (const chunk of streamResponse) {
        fullText += chunk.text;
        setGeneratedContent(fullText);
      }
      setIsStreaming(false);

      const key = `${moduleId}-${chapter.id}`;
      setCompletedChapters(prev => new Set([...Array.from(prev), key]));
      
      onSaveHistory(topic, currentLevel.level, fullText, SyncSource.ROADMAP);
      
      Promise.all([
        (async () => {
           const [vocab, quiz] = await Promise.all([
             generateVocabulary(fullText),
             generateQuiz(fullText)
           ]);
           await saveContentToCache(chapter.id, topic, fullText, vocab, quiz);
        })(),
        (async () => {
           const freshHistory = await fetchHistoryFromCloud();
           setHistory(freshHistory);
        })()
      ]);

    } catch (err) {
      console.error(err);
      setSelectedLesson(null);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const levelProgress = (() => {
    const total = currentLevel.modules.reduce((acc, m) => acc + m.chapters.length, 0);
    const completed = Array.from(completedChapters).filter((id: string) => id.includes(currentLevel.level.split(' ')[0])).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  })();

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.topic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;
      const matchesLevel = levelFilter === 'all' || item.level === levelFilter;
      return matchesSearch && matchesSource && matchesLevel;
    });
  }, [history, searchQuery, sourceFilter, levelFilter]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, HistoryItem[]> = {};
    filteredHistory.forEach(item => {
      const date = new Date(item.timestamp);
      const monthYear = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(date);
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(item);
    });
    return groups;
  }, [filteredHistory]);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  const getSourceIcon = (source?: SyncSource) => {
    switch (source) {
      case SyncSource.ROADMAP: return <Map className="w-3.5 h-3.5 text-blue-500" />;
      case SyncSource.NEWS: return <Newspaper className="w-3.5 h-3.5 text-orange-500" />;
      case SyncSource.ROLEPLAY: return <Skull className="w-3.5 h-3.5 text-indigo-500" />;
      case SyncSource.CIVIC: return <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />;
      case SyncSource.AI_SYNC: return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Zap className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  if (showPhilosophy) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <button onClick={() => setShowPhilosophy(false)} className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-bold text-xs bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4" /> VOLVER
        </button>
        <Philosophy />
      </div>
    );
  }

  if (selectedLesson) {
    return (
      <div className="animate-fade-in bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] shadow-3xl overflow-hidden border border-slate-100 dark:border-slate-800 h-[80vh] md:h-[850px]">
        {isLoading ? (
          <div className="p-10"><LessonSkeleton /></div>
        ) : generatedContent ? (
          <div className="h-full relative">
            {isStreaming && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] bg-orange-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 animate-bounce">
                <Sparkles className="w-3 h-3" /> Escribiendo guion...
              </div>
            )}
            <ScriptDisplay 
              content={generatedContent} 
              title={selectedLesson.topic} 
              level={selectedLesson.level}
              onExit={() => { setSelectedLesson(null); setGeneratedContent(null); }}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10 w-full max-w-full box-border overflow-hidden">
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm max-w-md mx-auto">
        <button 
          onClick={() => setActiveTab('explore')}
          className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all tap-active active:scale-95 ${activeTab === 'explore' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Map className="w-4 h-4" /> El Caminito
        </button>
        <button 
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all tap-active active:scale-95 ${activeTab === 'library' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Library className="w-4 h-4" /> Mis Logros
        </button>
      </div>

      {activeTab === 'explore' ? (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-slate-900 rounded-[32px] p-6 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-1000">
               <Map className="w-80 h-80" />
            </div>
            <div className="relative z-10 flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500 rounded-full shadow-lg shadow-orange-500/25">
                    <Target className="w-3.5 h-3.5" />
                    <span className="text-white font-black uppercase tracking-tighter text-[9px]">El Caminito del Pro</span>
                </div>
              </div>
              <h2 className="text-3xl md:text-6xl font-black mb-4 leading-tight italic tracking-tighter">Pasito a pasito, <span className="text-orange-500">Suave suavecito.</span></h2>
              <p className="text-slate-400 text-sm md:text-lg leading-relaxed font-medium max-w-xl">180 Módulos diseñados para que dejes de decir "Ja" a todo y empieces a entender.</p>
            </div>
            <div className="relative z-10 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center min-w-[180px] backdrop-blur-md">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                        <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="263.8" strokeDashoffset={263.8 - (levelProgress * 2.638)} className="text-orange-500 transition-all duration-1000" strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-2xl font-black italic">{levelProgress}%</span>
                </div>
                <span className="mt-4 text-[10px] font-black uppercase tracking-widest text-orange-400">LOGRADO</span>
            </div>
          </div>

          <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar gap-2">
            {DUTCH_CURRICULUM.map((lc, idx) => (
              <button key={lc.level} onClick={() => { setActiveLevelIdx(idx); setExpandedModule(null); }}
                className={`flex-1 min-w-[110px] py-4 px-4 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-1 tap-active active:scale-95
                  ${activeLevelIdx === idx ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <span className="text-xl italic">{lc.level.split(' ')[0]}</span>
                <span className="text-[8px] uppercase font-black opacity-60 tracking-widest">NIVEL</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentLevel.modules.map((module: Module, mIdx) => {
              const completedCount = module.chapters.filter(c => completedChapters.has(`${module.id}-${c.id}`)).length;
              const isDone = completedCount === module.chapters.length;
              const isExpanded = expandedModule === module.id;
              return (
                <div key={module.id} className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border transition-all duration-500 group
                    ${isExpanded ? 'border-orange-500 shadow-3xl md:col-span-2 lg:col-span-3 -translate-y-1' : isDone ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-100 dark:border-slate-800 hover:border-orange-300'}`}>
                  <button onClick={() => setExpandedModule(isExpanded ? null : module.id)} className="w-full p-8 flex items-center justify-between tap-active active:scale-95">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-orange-500 text-white rotate-6 scale-110 shadow-lg shadow-orange-500/25' : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:scale-110'}`}>
                        {isDone ? <CheckCircle2 className="w-8 h-8" /> : <span className="font-black text-xl italic">{mIdx + 1}</span>}
                      </div>
                      <div className="text-left">
                        <h3 className={`font-black leading-tight italic tracking-tight group-hover:text-orange-500 transition-colors ${isExpanded ? 'text-2xl md:text-3xl' : 'text-base md:text-lg'}`}>{module.title}</h3>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{completedCount}/{module.chapters.length} COMPLETADOS</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown className="w-6 h-6 text-orange-500" /> : <ChevronRight className="w-5 h-5 text-slate-200" />}
                  </button>
                  {isExpanded && (
                    <div className="px-8 pb-10 pt-4 border-t border-slate-50 dark:border-slate-800/50 mt-2 animate-fade-in-up">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Explicitly typed module.chapters.map to avoid 'unknown' error */}
                        {module.chapters.map((chapter: Chapter) => {
                          const isChapterDone = completedChapters.has(`${module.id}-${chapter.id}`);
                          return (
                            <button key={chapter.id} onClick={() => handleStartLesson(chapter, module.id, module.title)}
                              className={`flex items-center gap-4 p-5 rounded-[1.5rem] border-2 transition-all text-left group/chapter tap-active active:scale-95
                                ${isChapterDone ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40' : chapter.isExam ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/40 hover:bg-red-600 hover:text-white' : 'bg-slate-50 dark:bg-slate-950 border-transparent hover:border-orange-500 hover:bg-white dark:hover:bg-slate-900'}`}>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isChapterDone ? 'bg-emerald-500 text-white' : chapter.isExam ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-300 group-hover/chapter:scale-110 group-hover/chapter:rotate-6'}`}>
                                {isChapterDone ? <CheckCircle2 className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                              </div>
                              <div className="overflow-hidden">
                                  <h4 className={`text-[11px] font-black uppercase tracking-tight leading-none mb-1.5 truncate ${isChapterDone ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>{chapter.title}</h4>
                                  <p className="text-[9px] leading-tight font-black opacity-40 italic uppercase tracking-widest">{isChapterDone ? 'DOMINADO' : chapter.isExam ? '¡EXAMEN!' : 'DALE CAÑA'}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
             <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                <input type="text" placeholder="Busca tus batallitas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-16 pr-8 py-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border-2 border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-lg text-slate-700 dark:text-white transition-all shadow-inner" />
             </div>
          </div>
          {/* Resto de la biblioteca permanece similar pero con los nuevos iconos */}
          <div className="space-y-12">
             {Object.keys(groupedHistory).length === 0 ? (
               <div className="h-96 flex flex-col items-center justify-center text-center p-12 bg-white/50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                 <Skull className="w-20 h-20 text-slate-200 mb-6" />
                 <h3 className="text-xl font-black uppercase text-slate-300">Todavía no has hecho nada, ¡vago!</h3>
               </div>
             ) : (
               Object.entries(groupedHistory).map(([month, items]) => (
                  <div key={month} className="space-y-6">
                    <button onClick={() => toggleMonth(month)} className="flex items-center gap-4 group w-full text-left tap-active active:scale-95">
                      <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-400 group-hover:text-orange-500 transition-colors shrink-0">{month}</h4>
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800 group-hover:bg-orange-500/20 transition-all"></div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-md">{expandedMonths[month] !== false ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</div>
                    </button>
                    {expandedMonths[month] !== false && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
                        {/* Explicitly typed items.map to avoid 'unknown' error */}
                        {(items as HistoryItem[]).map((item: HistoryItem) => (
                          <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 group/card relative overflow-hidden flex flex-col h-full hover:-translate-y-2">
                            <div className="flex justify-between items-start mb-6 shrink-0">
                               <div className="mt-2 flex items-center gap-2">
                                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">{getSourceIcon(item.source)}</div>
                                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">{item.source || 'Peli IA'}</span>
                               </div>
                               <span className="text-[10px] font-black px-3 py-1 bg-orange-500 text-white rounded-full shadow-sm shadow-orange-500/20">{item.level.split(' ')[0]}</span>
                            </div>
                            <div className="flex-grow space-y-4">
                              <h5 className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-tight uppercase group-hover/card:text-orange-500 transition-colors line-clamp-3">{item.topic}</h5>
                            </div>
                            <button onClick={() => { setSelectedLesson({ chapter: { id: item.id, title: item.topic, description: '' }, topic: item.topic, level: item.level }); setGeneratedContent(item.content); }} className="mt-10 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-500 transition-colors group/btn tap-active active:scale-95">Revisar Guion <ArrowUpRight className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
               ))
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumPath;