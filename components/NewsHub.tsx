import React, { useState, useEffect, useRef } from 'react';
import { 
  Newspaper, Globe, Briefcase, Coffee, Zap, Loader2, Sparkles, 
  ExternalLink, RefreshCw, Clock, ArrowLeft, Settings2, Shield, 
  Gavel, Home, Trophy, GraduationCap, LayoutGrid, Heart, Search,
  Download, Share2, CornerDownRight, FileText, CheckCircle2,
  AlertTriangle, Ghost
} from 'lucide-react';
import { fetchDutchNewsFromAI, generateNewsDossierStream } from '../services/newsService';
import { throttlingService } from '../services/throttlingService';
import { NewsItem, ProficiencyLevel } from '../types';
import { NewsCardSkeleton } from './Skeleton';

interface NewsHubProps {
  onGenerateFromNews: (topic: string, level: ProficiencyLevel) => void;
}

interface CacheEntry {
  items: NewsItem[];
  timestamp: number;
}

const LOCAL_TTL_MS = 10 * 60 * 1000; // 10 Minutos

const CATEGORIES = [
  { id: 'politiek', label: 'Leyes raras', dutch: 'Politiek', description: 'Lo que traman en el Binnenhof.', icon: <Gavel className="w-6 h-6" /> },
  { id: 'woningmarkt', label: 'Buscando techo', dutch: 'Woningmarkt', description: 'Por qué tu alquiler es tan caro.', icon: <Home className="w-6 h-6" /> },
  { id: 'economie', label: 'Pasta y Curro', dutch: 'Economie', description: 'Sueldos, iDEAL y el precio del queso.', icon: <Briefcase className="w-6 h-6" /> },
  { id: 'cultuur', label: 'Cosas de Holanda', dutch: 'Cultuur', description: 'Tradiciones que no vas a entender.', icon: <Coffee className="w-6 h-6" /> },
  { id: 'sport', label: 'Goles y Bicis', dutch: 'Sport', description: 'Fútbol y gente que corre bajo la lluvia.', icon: <Trophy className="w-6 h-6" /> },
  { id: 'onderwijs', label: 'Cole de críos', dutch: 'Onderwijs', description: 'Actualidad para que no te líen en la escuela.', icon: <GraduationCap className="w-6 h-6" /> }
];

const NewsHub: React.FC<NewsHubProps> = ({ onGenerateFromNews }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState<ProficiencyLevel>(ProficiencyLevel.A2);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [activeNewsLesson, setActiveNewsLesson] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

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
  }, [activeNewsLesson, isStreaming]);

  const levels = Object.values(ProficiencyLevel);

  const getCache = (): Record<string, CacheEntry> => {
    const saved = localStorage.getItem('speaksync_news_cache');
    return saved ? JSON.parse(saved) : {};
  };

  const saveCache = (cat: string, level: string, items: NewsItem[]) => {
    const cache = getCache();
    const key = `${cat}_${level}`;
    cache[key] = { items, timestamp: Date.now() };
    localStorage.setItem('speaksync_news_cache', JSON.stringify(cache));
  };

  const loadNews = async (cat: string, level: ProficiencyLevel, forceRefresh = false) => {
    setError(null);
    const cache = getCache();
    const key = `${cat}_${level}`;
    const entry = cache[key];
    const isExpired = !entry || (Date.now() - entry.timestamp > LOCAL_TTL_MS);

    if (!forceRefresh && entry && !isExpired) {
      setNews(entry.items);
      setLastUpdate(entry.timestamp);
      setIsInitialized(true);
      return;
    }

    setIsLoading(true);
    setIsInitialized(true);
    try {
      const data = await fetchDutchNewsFromAI(cat, level);
      setNews(data);
      saveCache(cat, level, data);
      setLastUpdate(Date.now());
    } catch (err: any) {
      if (err.message?.startsWith('TOOL_THROTTLED:')) {
        const secs = parseInt(err.message.split(':')[1]);
        setCooldownSeconds(secs);
        setError(`¡Relaja! Espera ${secs}s para volver a cotillear.`);
      } else {
        setError("No hay cobertura en el Binnenhof ahora mismo.");
      }
      if (entry) {
        setNews(entry.items);
        setLastUpdate(entry.timestamp);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    loadNews(catId, currentLevel);
  };

  const handleBackToPortal = () => {
    setIsInitialized(false);
    setActiveCategory(null);
    setNews([]);
    setActiveNewsLesson(null);
    setError(null);
  };

  const handleGenerateClass = async (item: NewsItem) => {
    setGeneratingId(item.id);
    setLessonTitle(item.title);
    setIsLoading(true);
    setActiveNewsLesson("");
    setIsStreaming(false);

    try {
      const stream = await generateNewsDossierStream(item.title, item.summary, currentLevel);
      setIsLoading(false);
      setIsStreaming(true);
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk.text;
        setActiveNewsLesson(fullText);
      }
    } catch (error) {
      console.error("News dossier generation failed:", error);
      setActiveNewsLesson(null);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setGeneratingId(null);
    }
  };

  const renderDossierContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('SECTION:')) {
        const title = trimmed.replace('SECTION:', '').trim();
        return (
          <div key={i} className="mt-12 mb-8 first:mt-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 whitespace-nowrap bg-white dark:bg-slate-900 px-4">
                {title}
              </span>
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
          <span key={i} className="inline-block px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold border border-orange-400 mx-0.5 shadow-sm shadow-orange-500/20">
            {part.slice(1, -1)}
          </span>
        );
      }
      if (part.startsWith('(') && part.endsWith(')')) {
        return <span key={i} className="text-slate-400 dark:text-slate-500 italic text-sm font-medium ml-1">{part}</span>;
      }
      return part;
    });
  };

  if (activeNewsLesson !== null) {
    return (
      <div className="animate-fade-in bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col h-[85vh] md:h-[850px] overflow-hidden relative">
        <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveNewsLesson(null)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-orange-500 transition-all active:scale-90 shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-500">¿Qué dicen estos?</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic truncate max-w-[200px] md:max-w-md leading-none">{lessonTitle}</h3>
            </div>
          </div>
        </header>
        <div ref={scrollRef} className="flex-1 overflow-y-auto script-scroll bg-slate-50/20 dark:bg-slate-950/20 p-8 md:p-16">
          <div className="max-w-3xl mx-auto relative">
             {isStreaming && (
                <div className="sticky top-0 z-30 mb-8 flex justify-center">
                  <div className="bg-orange-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/30 animate-pulse flex items-center gap-3"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Traduciendo chismes...</div>
                </div>
             )}
             {activeNewsLesson ? (
                <div className="animate-fade-in-up font-sans">{renderDossierContent(activeNewsLesson)}</div>
             ) : (
                <div className="py-20 flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Leyendo periódicos...</p>
                </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="animate-fade-in-up space-y-12">
        <div className="bg-slate-900 rounded-[3rem] md:rounded-[4rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><Newspaper className="w-80 h-80" /></div>
          <div className="relative z-10 max-w-4xl">
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-orange-500 rounded-full shadow-lg shadow-orange-500/25">
                <Ghost className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Detector de Chismes v8.0</span>
              </div>
            </div>
            <h2 className="text-5xl md:text-8xl font-black italic mb-6 leading-tight tracking-tighter">¿Qué dicen <span className="text-orange-500">estos?</span></h2>
            <p className="text-slate-400 font-medium text-lg md:text-2xl leading-relaxed max-w-2xl mb-12">Entérate de lo que pasa en la calle hoy mismo, pero explicado para que lo entiendas sin morir en el intento.</p>
            <div className="flex flex-wrap items-center gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-md">
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nivel de Cotilleo</span>
                <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
                  {levels.map(l => (
                    <button key={l} onClick={() => setCurrentLevel(l)} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all active:scale-95 ${currentLevel === l ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-slate-500 hover:text-white'}`}>{l.split(' ')[0]}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 text-left hover:border-orange-500/50 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full relative overflow-hidden shadow-sm active:scale-[0.98]">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-150 transition-transform duration-1000">{cat.icon}</div>
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-all mb-8 shadow-inner group-hover:shadow-orange-500/25">{React.cloneElement(cat.icon as React.ReactElement, { className: 'w-7 h-7' })}</div>
              <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">{cat.label}</h3>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{cat.dutch}</p>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-grow">{cat.description}</p>
              <div className="mt-10 pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-orange-500">¿Qué pasa hoy? <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" /></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-full box-border pb-20">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Globe className="w-64 h-64" /></div>
        <div className="relative z-10 flex items-center gap-6">
          <button onClick={handleBackToPortal} className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-all border border-orange-400 shadow-lg shadow-orange-500/25 active:scale-90"><ArrowLeft className="w-6 h-6" /></button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white leading-none">{CATEGORIES.find(c => c.id === activeCategory)?.label}</span>
              <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm shadow-orange-500/20">{currentLevel.split(' ')[0]}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chismes de última hora</p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-4">
           {cooldownSeconds > 0 && (
             <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 px-4 py-2 rounded-xl text-[10px] font-black border border-amber-500/20">
               <Clock className="w-4 h-4" /> RELAJA EN {cooldownSeconds}s
             </div>
           )}
           <button onClick={() => loadNews(activeCategory!, currentLevel, true)} disabled={isLoading || cooldownSeconds > 0} className="p-4 bg-orange-500 text-white rounded-2xl shadow-xl shadow-orange-500/25 hover:bg-orange-600 transition-all active:scale-90 disabled:opacity-50"><RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>
      {error && (
        <div className="mx-2 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-600 animate-enter">
           <AlertTriangle className="w-6 h-6 shrink-0" />
           <p className="text-sm font-bold uppercase tracking-tight">{error}</p>
        </div>
      )}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {[1, 2, 3, 4, 5, 6].map(i => <NewsCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {news.map((item, idx) => (
            <div key={item.id || idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 flex flex-col h-full shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden box-border hover:-translate-y-2">
              <div className="flex justify-between items-start mb-6 shrink-0">
                <span className="text-[9px] font-black bg-orange-500 text-white px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm shadow-orange-500/20">{item.source}</span>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-300 hover:text-orange-500 transition-colors border border-slate-100 active:scale-90 shadow-sm"><ExternalLink className="w-4 h-4" /></a>
              </div>
              <div className="flex-grow space-y-4">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight italic uppercase tracking-tighter group-hover:text-orange-500 transition-colors line-clamp-3">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-4">{item.summary}</p>
              </div>
              <div className="mt-10 shrink-0">
                <button onClick={() => handleGenerateClass(item)} className="w-full py-5 px-6 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-orange-600 transition-all active:scale-[0.96] shadow-xl shadow-orange-500/30">
                  {generatingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Resumen para Inmigrantes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsHub;