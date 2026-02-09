
import React, { useState } from 'react';
import { VocabularyItem } from '../types';
import { BookA, Database, Check } from 'lucide-react';
import { saveVocabToVault } from '../services/supabase';

interface VocabularyListProps {
  items: VocabularyItem[];
}

const VocabularyList: React.FC<VocabularyListProps> = ({ items }) => {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const handleSaveToVault = async (item: VocabularyItem, idx: number) => {
    const id = `${item.dutch}-${idx}`;
    if (savedIds.has(id)) return;

    await saveVocabToVault(item);
    setSavedIds(prev => new Set([...Array.from(prev), id]));
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto text-slate-300">
            <BookA className="w-6 h-6" />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[8px]">Sin glosario disponible</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in grid gap-3 sm:grid-cols-2">
      {items.map((item, idx) => {
        const isSaved = savedIds.has(`${item.dutch}-${idx}`);
        return (
          <div 
            key={idx} 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm group transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[7px] font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded uppercase tracking-widest border border-orange-100 dark:border-orange-800/50 leading-none">
                {item.type}
              </span>
              <button 
                onClick={() => handleSaveToVault(item, idx)}
                className={`p-1 rounded-lg transition-all ${isSaved ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-slate-300 hover:text-orange-500'}`}
              >
                {isSaved ? <Check className="w-3 h-3" /> : <Database className="w-3 h-3" />}
              </button>
            </div>
            
            <h4 className="text-[15px] font-black text-slate-900 dark:text-white italic tracking-tight leading-tight">{item.dutch}</h4>
            <p className="text-slate-600 dark:text-slate-300 font-medium text-[13px] leading-tight mt-1.5">
              {item.spanish}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default VocabularyList;
