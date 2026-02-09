import React, { useState, useEffect } from 'react';
import { ProficiencyLevel } from '../types';
import { improveScript } from '../services/geminiService';
import { findBestChapter } from '../services/curriculumRouter';
import { saveAtelierLog, updateUserStats, fetchUserProfile } from '../services/supabase';
import { Wand2, ArrowRight, BookCheck, MessageSquare, AlertCircle, Loader2, Copy, Check, Sparkles, PenLine, Target, Zap, ShieldCheck, Map, PenTool, Trash2, Wrench } from 'lucide-react';

const ScriptImprover: React.FC = () => {
  const [inputScript, setInputScript] = useState('');
  const [targetLevel, setTargetLevel] = useState<ProficiencyLevel>(ProficiencyLevel.A2);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [suggestedChapter, setSuggestedChapter] = useState<{ chapterId: string; topic: string; level: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [userXp, setUserXp] = useState(0);

  useEffect(() => {
    const loadXp = async () => {
      const profile = await fetchUserProfile();
      if (profile) setUserXp(profile.xp);
    };
    loadXp();
  }, []);

  const handleImprove = async () => {
    if (!inputScript.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setSuggestedChapter(null);

    try {
      const response = await improveScript(inputScript, targetLevel);
      if (!response) throw new Error("IA offline");
      setResult(response);
      const route = await findBestChapter(response.detectedTopic || inputScript);
      if (route) setSuggestedChapter(route);
      await saveAtelierLog(inputScript, response.improvedVersion, response.feedback, response.category);
      const newXp = userXp + 15;
      await updateUserStats({ xp: newXp });
      setUserXp(newXp);
    } catch (err: any) {
      setError("Fallo en la sincronización de Chapa y Pintura.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
        navigator.clipboard.writeText(result.improvedVersion);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-full mx-auto pb-20 animate-fade-in">
      
      <div className="bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-14 text-white shadow-2xl relative overflow-hidden border border-white/5 mx-2 md:mx-0">
        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
          <Wrench className="w-64 h-64" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500 rounded-full mb-6 shadow-lg shadow-orange-500/25">
            <Wrench className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-tighter text-white">Taller de Estética v2.0</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black italic mb-4 leading-tight tracking-tighter">
            Chapa y <span className="text-orange-500">Pintura.</span>
          </h2>
          
          <p className="text-slate-400 font-medium text-sm md:text-lg leading-relaxed max-w-2xl mb-10">
            Pega aquí tu texto "pocho" en neerlandés. Lo lijaremos, le daremos una capa de gramática y te lo devolveremos brillando como nuevo.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 md:gap-12">
            <div className="flex flex-col">
              <span className="text-3xl font-black italic text-orange-500">{userXp}</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">XP de Mecánico</span>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
            
            <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nivel de Acabado</span>
                <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
                  {Object.values(ProficiencyLevel).map((level) => (
                    <button
                      key={level}
                      onClick={() => setTargetLevel(level)}
                      className={`px-3 py-1.5 text-[8px] font-black rounded-lg transition-all uppercase active:scale-95
                        ${targetLevel === level ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-slate-500 hover:text-white'}
                      `}
                    >
                      {level.split(' ')[0]}
                    </button>
                  ))}
                </div>
            </div>

            <button 
                onClick={handleImprove}
                disabled={isLoading || !inputScript.trim()}
                className="px-8 py-5 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30 active:scale-95 disabled:opacity-20 flex items-center gap-3 group ml-auto"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                ¡Pulir mi Neerlandés!
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 px-2 md:px-0">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
           <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Texto Original (Abollado)</span>
              <button onClick={() => setInputScript('')} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
           </div>
           <textarea
              value={inputScript}
              onChange={(e) => setInputScript(e.target.value)}
              placeholder="Pega tu texto aquí..."
              className="flex-1 p-8 bg-transparent text-slate-700 dark:text-slate-200 text-lg font-medium outline-none resize-none placeholder-slate-200 dark:placeholder-slate-800 italic tracking-tight"
           />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px] relative">
           {!result && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 opacity-20">
                 <Sparkles className="w-16 h-16 text-slate-300 mb-4" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Esperando al mecánico...</p>
              </div>
           )}
           {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
                 <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 animate-pulse">Lijando y Barnizando...</p>
              </div>
           )}
           {result && (
              <>
                 <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-green-500/5 dark:bg-green-500/10">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Resultado Premium (+15 XP)</span>
                    </div>
                    <button onClick={handleCopy} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-orange-500 shadow-sm transition-all active:scale-90">
                       {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                 </div>
                 <div className="flex-1 p-8 overflow-y-auto">
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-lg font-medium tracking-tight antialiased whitespace-pre-wrap">
                       {result.improvedVersion}
                    </p>
                    <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 className="text-[9px] font-black uppercase text-orange-500 mb-3 tracking-widest">Consejo del Jefe de Taller</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">{result.feedback}</p>
                    </div>
                 </div>
              </>
           )}
        </div>
      </div>
    </div>
  );
};

export default ScriptImprover;