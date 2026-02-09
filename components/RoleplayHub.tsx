import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, Sparkles, Loader2, Send, CheckCircle2, Info, 
  Lightbulb, PlayCircle, StopCircle, RefreshCw, ChevronLeft, 
  Target, Trophy, Volume2, ArrowRight, Settings2, Shield, 
  BrainCircuit, Activity, Zap, Map, LayoutDashboard, Copy,
  ShieldAlert, BookText, Globe, MessageSquare, PartyPopper,
  XCircle, Award, Star, Save, Skull
} from 'lucide-react';
import { getMissionsForLevel, processRoleplayTurn, generateSpeech } from '../services/roleplayService';
import { RoleplayScenario, RoleplayMessage, RoleplayObjective, ProficiencyLevel } from '../types';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { updateUserStats, fetchUserProfile } from '../services/supabase';

type FeedbackTab = 'grammar' | 'culture' | 'vocab';

const RoleplayHub: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario | null>(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<ProficiencyLevel>(ProficiencyLevel.A1);
  const [messages, setMessages] = useState<RoleplayMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMissionSuccess, setIsMissionSuccess] = useState(false);
  const [showMasteryPanel, setShowMasteryPanel] = useState(false);
  const [freePracticeMode, setFreePracticeMode] = useState(false);
  const [recentAchievement, setRecentAchievement] = useState<string | null>(null);
  
  const [grammarFeedback, setGrammarFeedback] = useState<string | null>(null);
  const [culturalFeedback, setCulturalFeedback] = useState<string | null>(null);
  const [vocabularyFeedback, setVocabularyFeedback] = useState<string | null>(null);
  const [activeFeedbackTab, setActiveFeedbackTab] = useState<FeedbackTab>('grammar');
  
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMissions = (level: ProficiencyLevel) => {
    const data = getMissionsForLevel(level);
    setScenarios(data);
  };

  useEffect(() => {
    if (isInitialized) loadMissions(currentLevel);
  }, [isInitialized, currentLevel]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSelectMission = (scenario: RoleplayScenario) => {
    setSelectedScenario(scenario);
    setIsBriefingOpen(true);
  };

  const handleStartMission = () => {
    if (!selectedScenario) return;
    setIsBriefingOpen(false);
    setMessages([{ role: 'model', text: selectedScenario.initialMessage }]);
    setGrammarFeedback(null);
    setCulturalFeedback(null);
    setVocabularyFeedback(null);
    setSuggestion(null);
    setIsMissionSuccess(false);
    setShowMasteryPanel(false);
    setFreePracticeMode(false);
    playResponse(selectedScenario.initialMessage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isProcessing || !selectedScenario) return;
    const userMsg = userInput.trim();
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsProcessing(true);
    try {
      const response = await processRoleplayTurn(selectedScenario, messages, userMsg);
      const updatedObjectives = selectedScenario.objectives.map(obj => {
        if (!obj.completed && response.completedObjectiveIds.includes(obj.id)) {
          setRecentAchievement(obj.description);
          setTimeout(() => setRecentAchievement(null), 4000);
          return { ...obj, completed: true };
        }
        return obj;
      });
      setSelectedScenario({ ...selectedScenario, objectives: updatedObjectives });
      if (updatedObjectives.every(o => o.completed) && !isMissionSuccess) setShowMasteryPanel(true);
      setMessages(prev => [...prev, { role: 'model', text: response.reply }]);
      setGrammarFeedback(response.grammar_feedback);
      setCulturalFeedback(response.cultural_feedback);
      setVocabularyFeedback(response.vocabulary_feedback);
      if (!response.grammar_feedback && response.cultural_feedback) setActiveFeedbackTab('culture');
      else if (!response.grammar_feedback && !response.cultural_feedback && response.vocabulary_feedback) setActiveFeedbackTab('vocab');
      setSuggestion(response.suggestion);
      playResponse(response.reply);
    } catch (err) { console.error(err); } finally { setIsProcessing(false); }
  };

  const handleMissionComplete = async () => {
    const profile = await fetchUserProfile();
    if (profile) await updateUserStats({ xp: profile.xp + 250 });
    setIsMissionSuccess(true);
    setShowMasteryPanel(false);
  };

  const playResponse = async (text: string) => {
    stopAudio();
    const base64 = await generateSpeech(text);
    if (base64) {
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
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) try { audioSourceRef.current.stop(); } catch (e) {}
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') try { audioContextRef.current.close(); } catch (e) {}
    setIsPlaying(false);
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\[.*?\]|\(.*?\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) return <span key={i} className="inline-block px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold border border-orange-400 mx-0.5 shadow-sm">{part.slice(1, -1)}</span>;
      if (part.startsWith('(') && part.endsWith(')')) return <span key={i} className="text-slate-400 dark:text-slate-500 italic text-sm font-medium ml-1">{part}</span>;
      return part;
    });
  };

  if (!isInitialized) {
    return (
      <div className="animate-fade-in-up space-y-8">
        <div className="bg-slate-900 rounded-[3rem] md:rounded-[4rem] p-10 md:p-20 text-white shadow-2xl relative overflow-hidden border border-white/5 mx-2 md:mx-0">
          <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><Skull className="w-80 h-80" /></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-orange-500 rounded-full mb-8 shadow-lg shadow-orange-500/25">
              <Sparkles className="w-5 h-5" />
              <span className="text-[11px] font-black uppercase tracking-[0.1em]">Simulación de Calle v3.0</span>
            </div>
            <h2 className="text-5xl md:text-8xl font-black italic mb-6 leading-tight tracking-tighter">¡Habla o <span className="text-orange-500">Muere!</span></h2>
            <p className="text-slate-400 font-medium text-lg md:text-2xl leading-relaxed max-w-3xl mb-12">No más teoría aburrida. Enfréntate a un holandés de verdad y sobrevive a la conversación sin usar el traductor.</p>
            <button onClick={() => setIsInitialized(true)} className="flex items-center gap-4 px-10 py-6 bg-orange-500 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30 active:scale-95 group">Entrar al Fuego <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {isBriefingOpen && selectedScenario && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-fade-in">
          <div className="max-w-4xl w-full bg-slate-900 border border-white/10 rounded-[3rem] p-8 md:p-16 shadow-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12"><Skull className="w-80 h-80" /></div>
            <div className="relative z-10 space-y-10">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-orange-500 rounded-2xl text-white shadow-xl shadow-orange-500/25"><Target className="w-8 h-8" /></div>
                 <div><span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">Plan de Ataque</span><h2 className="text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter">{selectedScenario.title}</h2></div>
              </div>
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-3"><Globe className="w-4 h-4" /> La Situación</h4>
                   <p className="text-slate-300 text-lg leading-relaxed font-medium bg-white/5 p-6 rounded-3xl border border-white/5">{selectedScenario.summary}</p>
                </div>
                <div className="space-y-6">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-3"><Target className="w-4 h-4" /> Retos a Superar</h4>
                   <div className="space-y-4">
                      {selectedScenario.objectives.map((obj, i) => (
                        <div key={obj.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                           <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center text-[12px] font-black italic shadow-md">{i+1}</div>
                           <span className="text-slate-200 font-bold uppercase text-[11px] tracking-tight">{obj.description}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
              <div className="flex gap-4"><button onClick={handleStartMission} className="flex-1 py-6 bg-orange-500 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30 active:scale-95 flex items-center justify-center gap-4">¡A por ellos! <ArrowRight className="w-5 h-5" /></button></div>
            </div>
          </div>
        </div>
      )}
      {/* Resto de la lógica del chat permanece intacta */}
      {isMissionSuccess && (
        <div className="fixed inset-0 z-[120] bg-orange-500 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10 animate-fade-in">
          <div className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-[3rem] p-10 md:p-16 shadow-3xl text-center relative overflow-hidden">
             <div className="relative z-10 space-y-8">
               <div className="w-24 h-24 bg-orange-500 rounded-[2rem] flex items-center justify-center text-white mx-auto animate-bounce"><PartyPopper className="w-12 h-12" /></div>
               <div className="space-y-2"><h2 className="text-4xl md:text-6xl font-black italic text-white uppercase tracking-tighter">¡Sobreviviste!</h2><p className="text-slate-400 font-black uppercase tracking-widest text-sm">Has dejado al holandés con la boca abierta</p></div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">XP Ganado</p><p className="text-3xl font-black text-orange-500 italic">+250</p></div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status Final</p><p className="text-3xl font-black text-green-500 italic">VIVO</p></div>
               </div>
               <button onClick={() => { stopAudio(); setSelectedScenario(null); setIsMissionSuccess(false); }} className="w-full py-6 bg-orange-500 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] hover:bg-orange-600 transition-all shadow-2xl active:scale-95">Volver al Cuartel</button>
             </div>
          </div>
        </div>
      )}
      {!selectedScenario && (
        <>
          <div className="bg-slate-900 rounded-[32px] p-6 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-1000"><Skull className="w-80 h-80" /></div>
            <div className="relative z-10 flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-6xl font-black mb-4 leading-tight italic tracking-tighter">¡Habla o <span className="text-orange-500">Muere!</span></h2>
              <p className="text-slate-400 text-sm md:text-lg leading-relaxed font-medium max-w-xl">Entrena tus reflejos lingüísticos antes de que te toque hablar en la vida real.</p>
            </div>
            <div className="relative z-10 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center min-w-[180px] backdrop-blur-md">
                <div className="flex flex-col gap-2 w-full">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Nivel de Valentía</span>
                    <div className="flex flex-wrap gap-1 bg-black/20 p-1 rounded-xl">
                      {Object.values(ProficiencyLevel).map((level) => (
                        <button key={level} onClick={() => setCurrentLevel(level)} className={`flex-1 px-3 py-1.5 text-[8px] font-black rounded-lg transition-all uppercase active:scale-95 ${currentLevel === level ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{level.split(' ')[0]}</button>
                      ))}
                    </div>
                </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 md:px-0">
            {scenarios.map((s, index) => (
              <button key={s.id} onClick={() => handleSelectMission(s)} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 text-left hover:border-orange-500/50 transition-all group flex flex-col h-full hover:-translate-y-3 duration-500 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-150 transition-transform duration-1000"><Skull className="w-32 h-32" /></div>
                <div className="flex items-center justify-between mb-8"><div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-orange-500 group-hover:text-white transition-all">{s.icon}</div><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ESCENA {index + 1}</span></div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-4 group-hover:text-orange-500 transition-colors leading-tight">{s.title}</h3>
                <p className="text-sm text-slate-500 font-medium mb-10 line-clamp-3 flex-grow leading-[1.6]">{s.summary}</p>
                <div className="flex items-center justify-between mt-auto pt-8 border-t border-slate-50 dark:border-slate-800"><div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover:bg-orange-500 group-hover:text-white rounded-xl transition-all shadow-sm">¡A por ellos!</div></div>
              </button>
            ))}
          </div>
        </>
      )}
      {/* El resto del chat con selectedScenario sigue funcionando igual */}
      {selectedScenario && !isBriefingOpen && (
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 md:gap-16 animate-fade-in w-full box-border pb-24 md:pb-0">
          <div className="lg:col-span-8 flex flex-col bg-white dark:bg-slate-900 rounded-[3rem] md:rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden relative min-h-[70vh] md:h-[850px]">
            <div className="px-8 md:px-14 py-8 md:py-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
              <button onClick={() => { stopAudio(); setSelectedScenario(null); setShowMasteryPanel(false); setFreePracticeMode(false); }} className="flex items-center gap-3 text-[11px] font-black uppercase text-slate-400 hover:text-orange-500 transition-all active:scale-95 group"><ChevronLeft className="w-5 h-5" /><span className="hidden sm:inline">Me rindo</span></button>
              <div className="text-center md:text-right overflow-hidden"><h4 className="text-lg md:text-xl font-black dark:text-white uppercase tracking-tighter italic truncate px-2">{selectedScenario.title}</h4></div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-14 py-10 md:py-14 space-y-10 md:space-y-12 script-scroll bg-slate-50/20 dark:bg-slate-950/20">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                  <div className={`max-w-[90%] md:max-w-[75%] p-7 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] text-[16px] md:text-[18px] font-medium leading-[1.8] shadow-sm relative ${m.role === 'user' ? 'bg-orange-500 text-white rounded-tr-none shadow-xl' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'}`}>{renderFormattedText(m.text)}</div>
                </div>
              ))}
              {isProcessing && <div className="flex justify-start animate-fade-in pl-4"><div className="bg-white dark:bg-slate-800 px-8 py-6 rounded-full border border-slate-100 dark:border-slate-800 flex gap-4 shadow-md"><div className="w-2.5 h-2.5 rounded-full animate-bounce bg-orange-500" /><div className="w-2.5 h-2.5 rounded-full animate-bounce [animation-delay:0.2s] bg-orange-500" /><div className="w-2.5 h-2.5 rounded-full animate-bounce [animation-delay:0.4s] bg-orange-500" /></div></div>}
            </div>
            <form onSubmit={handleSendMessage} className="p-6 md:p-12 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex gap-4 md:gap-6 max-w-4xl mx-auto"><input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Suelta tu neerlandés..." className="flex-1 px-6 md:px-10 py-5 md:py-7 rounded-[2rem] md:rounded-[2.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-orange-500 outline-none transition-all font-semibold text-base md:text-lg shadow-inner" disabled={isProcessing} /><button type="submit" disabled={isProcessing || !userInput.trim()} className="w-16 h-16 md:w-20 md:h-20 text-white bg-orange-500 hover:bg-orange-600 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-2xl transition-all active:scale-90 disabled:opacity-50"><Send className="w-6 h-6 md:w-8 md:h-8" /></button></div>
            </form>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-8 md:gap-12 pb-10">
            <div className="rounded-[3rem] p-10 bg-slate-900 border border-white/5 text-white shadow-2xl relative overflow-hidden">
               <div className="flex items-center justify-between mb-10 relative z-10"><h3 className="text-[12px] font-black uppercase tracking-[0.2em] flex items-center gap-3"><Trophy className="w-6 h-6 text-orange-400" /> Status Misión</h3><span className="text-3xl font-black italic">{Math.round((selectedScenario.objectives.filter(o => o.completed).length / selectedScenario.objectives.length) * 100)}%</span></div>
               <div className="space-y-8 relative z-10">
                  {selectedScenario.objectives.map((obj) => (
                    <div key={obj.id} className={`flex items-start gap-6 transition-all duration-500 ${obj.completed ? 'opacity-100' : 'opacity-40'}`}><div className={`mt-1 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all ${obj.completed ? 'bg-green-500 border-green-500 scale-110 shadow-lg' : 'border-white/20'}`}>{obj.completed ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />}</div><div className="flex-1"><span className={`text-[13px] leading-tight uppercase tracking-tight ${obj.completed ? 'text-white font-black' : 'text-slate-100 font-bold'}`}>{obj.description}</span></div></div>
                  ))}
               </div>
            </div>
            {/* Feedback simplificado */}
            {(grammarFeedback || culturalFeedback) && (
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-6">Feedback del Pro</h3>
                 <p className="text-sm font-bold text-slate-700 dark:text-slate-300 italic">{grammarFeedback || culturalFeedback}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleplayHub;