
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import LessonForm from './components/LessonForm';
import ScriptDisplay from './components/ScriptDisplay';
import ScriptImprover from './components/ScriptImprover';
import CurriculumPath from './components/CurriculumPath';
import HistorySidebar from './components/HistorySidebar';
import NewsHub from './components/NewsHub';
import IntegrationModule from './components/IntegrationModule';
import RoleplayHub from './components/RoleplayHub';
import Dashboard from './components/Dashboard';
import VocabularyVault from './components/VocabularyVault';
import { LessonSkeleton } from './components/Skeleton';
import { fetchUserProfile, fetchAllProgress, fetchHistoryFromCloud, saveHistoryItem, clearCloudHistory, getCachedContent, saveContentToCache } from './services/supabase';
import { findBestChapter } from './services/curriculumRouter';
import { generateLessonScriptStream, generateVocabulary, generateQuiz } from './services/geminiService';
import { completeSyncTurn } from './services/syncEngine';
import { ProficiencyLevel, HistoryItem, LessonTone, AppMode, SyncSource } from './types';
import { 
  PenTool, Sparkles, Map, Loader2, Star, Newspaper, ShieldCheck, 
  Gamepad2, LayoutDashboard, Zap, PenLine, Database, Trash2, 
  Settings2, Target, GraduationCap, Mic, ChevronDown, PlayCircle, 
  StopCircle, Coffee, ShieldAlert, Briefcase, RotateCcw, Activity,
  Info, Skull, Wrench, Ghost
} from 'lucide-react';

// --- Sub-componentes definidos al inicio para evitar errores de referencia ---

function NavButtons({ mode, setMode }: { mode: AppMode, setMode: (m: AppMode) => void }) {
  const items = [
    { id: 'dashboard', label: 'Cuartel', icon: <LayoutDashboard size={14} /> },
    { id: 'roadmap', label: 'Caminito', icon: <Map size={14} /> },
    { id: 'roleplay', label: '¡Habla!', icon: <Skull size={14} /> },
    { id: 'news', label: 'Chismes', icon: <Newspaper size={14} /> },
    { id: 'integration', label: 'Pánico', icon: <ShieldAlert size={14} /> },
    { id: 'vault', label: 'Botín', icon: <Database size={14} /> },
    { id: 'improver', label: 'Chapa', icon: <Wrench size={14} /> },
    { id: 'generator', label: 'Cine IA', icon: <Sparkles size={14} /> }
  ];

  return (
    <>
      {items.map((item) => (
        <button 
          key={item.id}
          onClick={() => setMode(item.id as AppMode)} 
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[9px] font-black transition-all uppercase tracking-wider tap-active whitespace-nowrap ${mode === item.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
        >
          {item.icon} <span className="hidden lg:inline">{item.label}</span>
          <span className="lg:hidden">{item.label}</span>
        </button>
      ))}
    </>
  );
}

function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all px-3 py-1 tap-active ${active ? 'text-orange-500' : 'text-slate-400'}`}>
      <div className={`p-2 rounded-xl transition-all ${active ? 'bg-orange-500/10' : ''}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
      </div>
      <span className={`text-[7px] font-black uppercase tracking-tight ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
    </button>
  );
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem('last_mode');
    const validModes: AppMode[] = ['dashboard', 'roadmap', 'generator', 'improver', 'news', 'integration', 'roleplay', 'vault', 'flashsync'];
    return (saved && validModes.includes(saved as AppMode)) ? (saved as AppMode) : 'dashboard';
  });
  
  const [script, setScript] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [topic, setTopic] = useState('');
  const [genLevel, setGenLevel] = useState<ProficiencyLevel>(ProficiencyLevel.A1);
  const [genTone, setGenTone] = useState<LessonTone>(LessonTone.GEZELLIG);
  const [showParams, setShowParams] = useState(false);
  const paramsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAppData = async () => {
      const [profile, progress, cloudHistory] = await Promise.all([
        fetchUserProfile(),
        fetchAllProgress(),
        fetchHistoryFromCloud()
      ]);
      if (profile) setUserProfile(profile);
      if (progress) setCompletedChapters(progress.map((p: any) => p.chapter_id));
      if (cloudHistory) setHistory(cloudHistory);
    };
    loadAppData();
  }, []);

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('last_mode', mode);
  }, [mode]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleManualGenerate = async (overrideTopic?: string, overrideLevel?: ProficiencyLevel) => {
    const finalT = overrideTopic || topic;
    const finalL = overrideLevel || genLevel;

    if (!finalT.trim() || isLoading || isStreaming) return;

    setIsLoading(true);
    setIsStreaming(false);
    setError(null);
    setScript(null);
    setShowParams(false);

    try {
      const route = await findBestChapter(finalT);
      const chapterId = route?.chapterId || `GEN-${Date.now()}`;
      const effectiveTopic = route?.topic || finalT;
      const effectiveLevel = (route?.level as ProficiencyLevel) || finalL;

      const cached = await getCachedContent(chapterId);
      if (cached) {
        setScript(cached.content);
        setIsLoading(false);
        return;
      }

      const streamResponse = await generateLessonScriptStream(effectiveTopic, effectiveLevel, false, genTone);
      setIsLoading(false);
      setIsStreaming(true);
      
      let fullText = "";
      for await (const chunk of streamResponse) {
        fullText += chunk.text;
        setScript(fullText);
      }
      
      const newItem: HistoryItem = { 
        id: chapterId, 
        topic: effectiveTopic, 
        level: effectiveLevel, 
        content: fullText, 
        timestamp: Date.now(),
        source: SyncSource.AI_SYNC
      };

      await Promise.all([
        saveHistoryItem(newItem),
        completeSyncTurn(chapterId, 150, userProfile?.xp || 0),
        (async () => {
           const [vocab, quiz] = await Promise.all([
             generateVocabulary(fullText),
             generateQuiz(fullText)
           ]);
           await saveContentToCache(chapterId, effectiveTopic, fullText, vocab, quiz);
        })()
      ]);

      const freshHistory = await fetchHistoryFromCloud();
      setHistory(freshHistory);
      setUserProfile((prev: any) => prev ? { ...prev, xp: prev.xp + 150 } : null);
    } catch (err: any) {
      console.error(err);
      setError("Fallo en la sincronización maestra.");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm("¿Estás seguro de purgar el historial de la nube?")) {
      await clearCloudHistory();
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-x-hidden relative box-border h-full">
      <Header onHistoryClick={() => setShowHistory(true)} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
      
      <HistorySidebar 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        history={history.slice(0, 20)} 
        onSelect={(item) => { setMode('generator'); setScript(item.content); setTopic(item.topic); }} 
        onClear={handleClearHistory} 
      />

      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-6 md:py-8 pb-28 md:pb-12 overflow-x-hidden box-border">
        {/* Navegación Fija al Contenedor (No Sticky) - Evita invadir la visión al hacer scroll */}
        <div className="hidden md:flex justify-center mb-8">
          <nav className="glass-card px-2 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/5 dark:shadow-none flex items-center gap-1">
            <NavButtons mode={mode} setMode={setMode} />
          </nav>
        </div>

        {mode === 'dashboard' && <Dashboard setMode={setMode} completedChapters={completedChapters} />}
        {mode === 'roadmap' && <CurriculumPath onSaveHistory={async (t, l, c, s) => {
             // Fix: correctly map 'l' to the 'level' property for the HistoryItem object literal
             const newItem: HistoryItem = { id: `ROAD-${Date.now()}`, topic: t, level: l, content: c, timestamp: Date.now(), source: s };
             await saveHistoryItem(newItem);
             const freshHistory = await fetchHistoryFromCloud();
             setHistory(freshHistory);
        }} />}
        {mode === 'roleplay' && <RoleplayHub />}
        {mode === 'improver' && <ScriptImprover />}
        {mode === 'vault' && <VocabularyVault />}
        {mode === 'news' && <NewsHub onGenerateFromNews={(t, l) => { 
            setMode('generator'); 
            setTopic(t); 
            setGenLevel(l); 
            handleManualGenerate(t, l); 
        }} />}
        {mode === 'integration' && <IntegrationModule onGenerateImmersion={(t, l) => { 
            setMode('generator'); 
            setTopic(t); 
            setGenLevel(l); 
            handleManualGenerate(t, l); 
        }} />}
        
        {mode === 'generator' && (
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[3.5rem] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col h-[78vh] md:h-[850px] overflow-hidden w-full relative animate-enter">
            <header className="h-12 md:h-16 sticky top-0 z-20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0">
               <button 
                onClick={() => { setTopic(''); setScript(null); setError(null); }}
                className={`flex items-center justify-center p-2 rounded-lg transition-all tap-active
                  ${topic.trim() || script ? 'text-slate-400 hover:text-red-500' : 'text-slate-200 dark:text-slate-800 cursor-default'}
                `}
               >
                 <RotateCcw className="w-5 h-5" />
               </button>

               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleManualGenerate()}
                    disabled={isLoading || isStreaming || !topic.trim()}
                    className={`relative flex items-center gap-3 px-6 md:px-8 py-2 md:py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl tap-active
                      ${(isLoading || isStreaming) ? 'bg-slate-100 dark:bg-slate-800 text-orange-500' : topic.trim() ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 grayscale opacity-40'}
                    `}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isLoading || isStreaming ? 'Rodando...' : '¡Acción!'}</span>
                  </button>
               </div>

               <div className="flex items-center gap-2 relative" ref={paramsRef}>
                 <button onClick={() => setShowParams(!showParams)} className={`p-2 rounded-lg transition-all tap-active ${showParams ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400'}`}>
                   <Settings2 className="w-5 h-5" />
                 </button>
                 {showParams && (
                    <div className="absolute top-full right-0 mt-3 w-60 bg-white dark:bg-slate-900 rounded-[1.25rem] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 p-3 animate-enter z-50">
                      <div className="space-y-4">
                        <div className="p-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Calibración</p>
                          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl">
                            {Object.values(ProficiencyLevel).map(l => (
                              <button key={l} onClick={() => setGenLevel(l)} className={`py-1.5 rounded-lg text-[9px] font-black transition-all ${genLevel === l ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400'}`}>
                                {l.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                 )}
               </div>
            </header>

            <div className="flex-1 overflow-hidden relative">
              {isLoading && !script ? (
                <div className="p-4 md:p-12"><LessonSkeleton /></div>
              ) : script ? (
                <div className="h-full overflow-hidden">
                   <ScriptDisplay content={script} title={topic} level={genLevel} onExit={() => setScript(null)} />
                </div>
              ) : (
                <LessonForm topic={topic} setTopic={setTopic} level={genLevel} setLevel={setGenLevel} tone={genTone} setTone={setGenTone} isLoading={isLoading || isStreaming} credits={userProfile?.credits || 0} onGenerate={() => handleManualGenerate()} />
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/60 pt-3 pb-[calc(0.75rem+var(--sab))] z-50 overflow-x-auto no-scrollbar">
         <div className="flex items-center gap-1 min-w-max px-4">
            <MobileNavItem icon={<LayoutDashboard />} label="Cuartel" active={mode === 'dashboard'} onClick={() => setMode('dashboard')} />
            <MobileNavItem icon={<Map />} label="Caminito" active={mode === 'roadmap'} onClick={() => setMode('roadmap')} />
            <MobileNavItem icon={<Skull />} label="¡Habla!" active={mode === 'roleplay'} onClick={() => setMode('roleplay')} />
            <MobileNavItem icon={<Newspaper />} label="Chismes" active={mode === 'news'} onClick={() => setMode('news')} />
            <MobileNavItem icon={<ShieldAlert />} label="Pánico" active={mode === 'integration'} onClick={() => setMode('integration')} />
            <MobileNavItem icon={<Database />} label="Botín" active={mode === 'vault'} onClick={() => setMode('vault')} />
            <MobileNavItem icon={<Wrench />} label="Chapa" active={mode === 'improver'} onClick={() => setMode('improver')} />
            <MobileNavItem icon={<Sparkles />} label="Cine IA" active={mode === 'generator'} onClick={() => setMode('generator')} />
         </div>
      </nav>
    </div>
  );
};

export default App;
