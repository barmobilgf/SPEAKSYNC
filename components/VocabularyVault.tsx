import React, { useState, useEffect } from 'react';
import { fetchVaultVocab, updateVocabMastery } from '../services/supabase';
import { VocabularyItem, VocabMastery } from '../types';
import { Database, Search, Filter, Flame, CheckCircle2, Star, Timer, BookOpen, Trash2, Zap, Sparkles, Loader2, PenTool, Gem } from 'lucide-react';
import FlashSync from './FlashSync';

const VocabularyVault: React.FC = () => {
  const [vocab, setVocab] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<VocabMastery | 'all'>('all');
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    loadVocab();
  }, []);

  const loadVocab = async () => {
    setLoading(true);
    const data = await fetchVaultVocab();
    setVocab(data);
    setLoading(false);
  };

  if (isTraining) {
    return <FlashSync vocabSource={vocab} onFinish={() => { setIsTraining(false); loadVocab(); }} />;
  }

  const getMasteryIcon = (mastery: VocabMastery) => {
    switch (mastery) {
      case VocabMastery.MASTERED: return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case VocabMastery.LEARNING: return <Zap className="w-4 h-4 text-orange-500" />;
      case VocabMastery.CRITICAL: return <Flame className="w-4 h-4 text-red-500 animate-pulse" />;
      default: return <Star className="w-4 h-4 text-slate-300" />;
    }
  };

  const getMasteryColor = (mastery: VocabMastery) => {
    switch (mastery) {
      case VocabMastery.MASTERED: return 'bg-green-500/10 text-green-600 border-green-500/20';
      case VocabMastery.LEARNING: return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case VocabMastery.CRITICAL: return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const filteredVocab = vocab.filter(v => {
    const matchesSearch = v.dutch.toLowerCase().includes(search.toLowerCase()) || 
                         v.spanish.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'all' || v.mastery === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Vault Header */}
      <div className="bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-14 text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
          <Gem className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500 rounded-full mb-6 shadow-lg shadow-orange-500/25">
            <Gem className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-tighter text-white">Tesorería Sync v5.0</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black italic mb-4 leading-tight">
            Mi <span className="text-orange-500">Botín.</span>
          </h2>
          <p className="text-slate-400 font-medium text-sm md:text-lg leading-relaxed max-w-2xl mb-10">
            Cada palabra que aprendes es un tesoro que le robas al idioma. Entrénalas para que no se escapen de tu memoria.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 md:gap-12">
            <div className="flex flex-col">
              <span className="text-3xl font-black italic text-orange-500">{vocab.length}</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tesoros Acumulados</span>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
            <button 
                onClick={() => setIsTraining(true)}
                disabled={vocab.length < 3}
                className="px-8 py-4 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30 flex items-center gap-3 active:scale-95 disabled:opacity-50"
            >
                <PenTool className="w-4 h-4" />
                Pulir el Botín
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar entre mis joyas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-6 py-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-slate-700 dark:text-white shadow-sm transition-all"
          />
        </div>
        <div className="flex bg-white dark:bg-slate-900 p-2 rounded-3xl border border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto no-scrollbar">
          {(['all', ...Object.values(VocabMastery)] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95
                ${activeFilter === f ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {f === 'all' ? 'Todo' : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Contando monedas...</span>
        </div>
      ) : filteredVocab.length === 0 ? (
        <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] text-center p-12">
          <Gem className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-6" />
          <h3 className="text-xl font-black uppercase tracking-tighter text-slate-400">Cofre Vacío</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVocab.map((v) => (
            <div 
              key={v.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase border flex items-center gap-2 ${getMasteryColor(v.mastery as VocabMastery)}`}>
                  {getMasteryIcon(v.mastery as VocabMastery)}
                  {v.mastery}
                </span>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                  Botín x{v.sync_count}
                </span>
              </div>

              <div className="space-y-1 mb-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter group-hover:text-orange-500 transition-colors">{v.dutch}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{v.type}</p>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-slate-600 dark:text-slate-300 font-bold leading-relaxed">{v.spanish}</p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase">
                  <Timer className="w-3.5 h-3.5" />
                  {new Date(v.last_practiced!).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VocabularyVault;