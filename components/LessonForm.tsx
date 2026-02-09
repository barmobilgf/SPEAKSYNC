import React from 'react';
import { ProficiencyLevel, LessonTone } from '../types';
import { Sparkles, Zap, PlayCircle, Loader2, Info, Film } from 'lucide-react';

interface LessonFormProps {
  topic: string;
  setTopic: (t: string) => void;
  level: ProficiencyLevel;
  setLevel: (l: ProficiencyLevel) => void;
  tone: LessonTone;
  setTone: (t: LessonTone) => void;
  isLoading: boolean;
  credits: number;
  onGenerate: () => void;
}

const LessonForm: React.FC<LessonFormProps> = ({ 
  topic, setTopic, isLoading, credits, onGenerate 
}) => {
  return (
    <div className="w-full h-full flex flex-col animate-enter bg-white dark:bg-slate-950 overflow-hidden">
      {/* HERO CARD */}
      <div className="mx-4 mt-4 md:mx-6 md:mt-6 bg-slate-900 rounded-[1.25rem] md:rounded-[3rem] p-6 md:p-12 text-white shadow-2xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
          <Film className="w-48 h-48 md:w-64 md:h-64" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500 rounded-full mb-4 shadow-lg shadow-orange-500/25">
            <Zap size={12} />
            <span className="text-[8px] font-black uppercase tracking-tight">Director de Cine IA</span>
          </div>
          
          <h2 className="text-2xl md:text-5xl font-black italic mb-3 leading-none tracking-tight">
            Crea tu propia <span className="text-orange-500">Peli.</span>
          </h2>
          
          <p className="text-slate-400 font-medium text-xs md:text-lg leading-relaxed max-w-xl mb-6">
            Dinos qué situación te da miedo enfrentar mañana y la IA te escribirá el guion perfecto para que brilles.
          </p>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-2xl font-black italic text-orange-500 leading-none">{credits}</span>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Balas de fogueo</span>
            </div>
            <button 
                onClick={onGenerate}
                disabled={isLoading || !topic.trim()}
                className="px-6 py-3.5 bg-orange-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest tap-active active:scale-95 flex items-center gap-2 shadow-xl shadow-orange-500/30 disabled:opacity-20"
            >
                {isLoading ? <Loader2 size={12} className="animate-spin" /> : <PlayCircle size={12} />}
                ¡Que empiece la acción!
            </button>
          </div>
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="flex-1 relative mt-2 px-4 md:px-0">
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Escribe tu escena... Ej: 'Pelearme con el vecino por la basura' o 'Cita romántica en un canal'."
          className="w-full h-full p-6 md:p-14 bg-transparent text-lg md:text-3xl font-bold text-slate-800 dark:text-slate-200 outline-none resize-none placeholder-slate-200 dark:placeholder-slate-800 transition-all leading-relaxed italic tracking-tight"
          autoFocus
          disabled={isLoading}
        />
        
        <div className="absolute bottom-6 left-10 flex items-center gap-2 text-slate-200 dark:text-slate-800 pointer-events-none">
           <Info size={14} />
           <span className="text-[8px] font-black uppercase tracking-widest">Maestro de Ceremonias Activo</span>
        </div>
      </div>
    </div>
  );
};

export default LessonForm;