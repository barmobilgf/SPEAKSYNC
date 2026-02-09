import React from 'react';
import { X, Clock, ChevronRight, Trash2, Ghost } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, history, onSelect, onClear }) => {
  return (
    <>
      {/* Backdrop con Blur */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed z-[70] transition-all duration-500 ease-[cubic-bezier(0.16, 1, 0.3, 1)]
        md:top-0 md:right-0 md:h-full md:w-[400px] md:border-l md:rounded-l-[2.5rem]
        bottom-0 left-0 right-0 h-[80vh] w-full rounded-t-[2.5rem] md:rounded-t-none
        bg-white dark:bg-slate-900 border-t md:border-t-0 border-slate-200 dark:border-slate-800 shadow-2xl
        ${isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'}
      `}>
        <div className="flex flex-col h-full w-full overflow-hidden relative">
          
          <div className="md:hidden w-full flex justify-center py-3">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>

          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <Ghost className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                  Tus <span className="text-orange-500">Batallitas</span>
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Memoria de Elefante</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-orange-500 bg-slate-50 dark:bg-slate-800 rounded-full transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-10">
                <Ghost className="w-16 h-16 mb-4 text-slate-300" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Aún no has sincronizado ninguna batallita, novato.
                </p>
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="w-full text-left bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 hover:border-orange-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all group relative overflow-hidden active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full uppercase tracking-tighter border border-orange-500/10">
                      {item.level.split(' ')[0]}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight text-sm uppercase tracking-tight group-hover:text-orange-500 transition-colors">
                    {item.topic}
                  </h4>
                  <div className="mt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-orange-500">
                    <span>Repetir Escena</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))
            )}
          </div>

          {history.length > 0 && (
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                onClick={onClear}
                className="w-full flex items-center justify-center gap-3 text-red-500 hover:text-white hover:bg-red-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-red-100 dark:border-red-900/30 active:scale-[0.97]"
              >
                <Trash2 className="w-4 h-4" />
                Borrar Cassette
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;