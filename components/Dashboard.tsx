import React, { useEffect, useState, useMemo } from 'react';
import { 
  LayoutDashboard, Zap, TrendingUp, Trophy, ArrowUpRight, 
  Flame, BrainCircuit, Star, Gamepad2, Target, ShieldCheck, 
  Calendar, PenTool, BookOpen, Headphones, Mic, Heart, 
  ChevronRight, Sparkles, Clock, Map, Globe, Loader2,
  CheckCircle2, AlertCircle, Bookmark, Newspaper, PenLine,
  Database, ShieldAlert, Skull, Wrench
} from 'lucide-react';
import { AppMode, DailyQuest, SkillMastery, HistoryItem, VocabMastery } from '../types';
import { fetchUserProfile, fetchAllProgress, fetchVaultVocab, calculateStreak, fetchHistoryFromCloud } from '../services/supabase';

interface DashboardProps {
  setMode: (mode: AppMode) => void;
  completedChapters: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ setMode, completedChapters }) => {
  const [profile, setProfile] = useState<any>(null);
  const [progressCount, setProgressCount] = useState(0);
  const [vocabData, setVocabData] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [uProfile, uProgress, uVocab, uStreak, uHistory] = await Promise.all([
        fetchUserProfile(),
        fetchAllProgress(),
        fetchVaultVocab(),
        calculateStreak(),
        fetchHistoryFromCloud()
      ]);
      
      if (uProfile) setProfile(uProfile);
      if (uProgress) setProgressCount(uProgress.length);
      if (uVocab) setVocabData(uVocab);
      setStreak(uStreak || 0);
      setHistory(uHistory || []);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const dailyQuests = useMemo((): DailyQuest[] => {
    const newsSyncs = history.filter(h => h.source === 'news').length;
    const roleplaySyncs = history.filter(h => h.source === 'roleplay').length;
    const masteredVocab = vocabData.filter(v => v.mastery === VocabMastery.MASTERED).length;

    return [
      { id: 'q1', title: 'Leer un chisme (Noticias)', target: 1, current: Math.min(1, newsSyncs), xpReward: 50, icon: '📰' },
      { id: 'q2', title: 'Robar 5 palabras', target: 5, current: Math.min(5, masteredVocab), xpReward: 100, icon: '💎' },
      { id: 'q3', title: 'No morir en el intento (Misión)', target: 1, current: Math.min(1, roleplaySyncs), xpReward: 75, icon: '🎙️' }
    ];
  }, [history, vocabData]);

  const skills: SkillMastery = useMemo(() => ({
    writing: Math.min(100, (history.filter(h => h.source === 'ai_sync').length * 10)),
    speaking: Math.min(100, (history.filter(h => h.source === 'roleplay').length * 15)),
    listening: Math.min(100, (history.length * 2)),
    culture: Math.min(100, (history.filter(h => h.source === 'civic' || h.source === 'roadmap').length * 5))
  }), [history]);

  const roadmapPct = Math.min(100, Math.round((progressCount / 180) * 100));
  const civicReadiness = Math.min(100, Math.round((history.filter(h => h.source === 'civic').length / 20) * 100));

  const heatmapWeeks = useMemo(() => {
    const today = new Date();
    const weeks = [];
    const activityMap: Record<string, number> = {};
    history.forEach(item => {
      const dateKey = new Date(item.timestamp).toDateString();
      activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
    });
    const daysToShow = 98; 
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (daysToShow - 1));
    for (let w = 0; w < 14; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const current = new Date(startDate);
        current.setDate(startDate.getDate() + (w * 7) + d);
        const dateKey = current.toDateString();
        week.push({ date: current, intensity: current > today ? -1 : Math.min(activityMap[dateKey] || 0, 4) });
      }
      weeks.push(week);
    }
    return weeks;
  }, [history]);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Preparando el café...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-enter w-full max-w-full box-border overflow-hidden">
      
      {/* 1. HERO STATUS */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-[1.5rem] md:rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700">
            <BrainCircuit className="w-48 h-48 md:w-64 md:h-64" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                  ⛺
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black italic tracking-tight uppercase leading-none">Mi Cuartel</h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-2 py-0.5 bg-orange-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">{profile?.level || 'A1'}</span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{profile?.xp || 0} XP ACUMULADOS</span>
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-6xl font-black italic mb-6 leading-tight tracking-tight">
              A la conquista <br/><span className="text-orange-500">del Holandés.</span>
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setMode('roadmap')} className="px-6 py-4 bg-orange-500 text-white rounded-full text-[9px] font-black uppercase tracking-wide transition-all shadow-lg shadow-orange-500/25 tap-active flex items-center gap-2 active:scale-95">
                Seguir el Caminito <ChevronRight size={14} />
              </button>
              <button onClick={() => setMode('generator')} className="px-6 py-4 bg-orange-600 text-white rounded-full text-[9px] font-black uppercase tracking-wide shadow-lg shadow-orange-900/20 transition-all border border-orange-400/20 tap-active flex items-center gap-2 active:scale-95">
                <Sparkles size={14} className="text-white" /> Nueva Peli
              </button>
            </div>
          </div>
        </div>

        {/* STREAK */}
        <div className="ui-card rounded-[1.5rem] md:rounded-[3rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-sm tap-active">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-700 ${streak > 0 ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'}`}>
            <Flame className={`w-10 h-10 ${streak > 0 ? 'animate-pulse' : ''}`} />
          </div>
          <h3 className="text-4xl md:text-5xl font-black italic text-slate-900 dark:text-white mb-1 leading-none tracking-tight">{streak} DÍAS</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Racha de Supervivencia</p>
        </div>
      </div>

      {/* 2. GRID INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* DAILY QUESTS */}
        <div className="lg:col-span-2 ui-card rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy size={14} className="text-orange-500" /> Tareas del Día
            </h3>
          </div>
          <div className="space-y-6">
            {dailyQuests.map(quest => {
              const pct = (quest.current / quest.target) * 100;
              return (
                <div key={quest.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{quest.icon}</span>
                      <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{quest.title}</p>
                    </div>
                    <span className="text-[10px] font-black italic text-slate-900 dark:text-white">{quest.current}/{quest.target}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${pct >= 100 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SKILL MASTERA */}
        <div className="ui-card rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-8 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <Target size={14} className="text-orange-500" /> Nivel de Pro
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Escritura', value: skills.writing, color: 'orange' },
              { label: 'Labia', value: skills.speaking, color: 'indigo' },
              { label: 'Oído', value: skills.listening, color: 'emerald' }
            ].map(skill => (
              <div key={skill.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{skill.label}</span>
                  <span className="text-[9px] font-black italic text-slate-900 dark:text-white">{skill.value}%</span>
                </div>
                <div className="w-full h-1 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${
                    skill.color === 'orange' ? 'bg-orange-500' : 
                    skill.color === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500'
                  }`} style={{ width: `${skill.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* INBURGERING */}
        <div className="bg-emerald-500 rounded-[1.5rem] md:rounded-[3rem] p-8 text-white shadow-xl shadow-emerald-500/10 flex flex-col justify-between tap-active active:scale-95" onClick={() => setMode('integration')}>
            <h3 className="text-xl font-black uppercase leading-tight italic tracking-tight">Estado <br/>Anti-Pánico.</h3>
            <div className="mt-6 flex items-end justify-between">
              <span className="text-3xl font-black italic leading-none">{civicReadiness}%</span>
              <div className="p-2 bg-white text-emerald-500 rounded-xl">
                 <ChevronRight size={18} />
              </div>
            </div>
        </div>
      </div>

      {/* 3. HEATMAP */}
      <div className="ui-card rounded-[1.5rem] md:rounded-[3rem] p-6 md:p-8 shadow-sm overflow-hidden">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2 mb-6">
          <Calendar size={14} className="text-orange-500" /> Sudor y Lágrimas
        </h3>
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar pt-2">
          <div className="grid grid-flow-col gap-1.5 h-20 md:h-24">
            {heatmapWeeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-rows-7 gap-1">
                {week.map((day, dIdx) => {
                  const intensityClass = day.intensity === -1 
                    ? 'opacity-0' 
                    : [
                        'bg-slate-50 dark:bg-slate-900/50', 
                        'bg-orange-100 dark:bg-orange-900/20', 
                        'bg-orange-300 dark:bg-orange-700/50', 
                        'bg-orange-500', 
                        'bg-orange-600 shadow-md'
                      ][day.intensity];
                  return (
                    <div key={dIdx} className={`w-2 h-2 md:w-3 md:h-3 rounded-sm ${intensityClass}`}></div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;