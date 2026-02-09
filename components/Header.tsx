
import React, { useEffect, useState } from 'react';
import { Mic2, History, Sun, Moon, CloudCheck, ShieldCheck } from 'lucide-react';
import { supabase } from '../services/supabase';

interface HeaderProps {
  onHistoryClick?: () => void;
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onHistoryClick, 
  darkMode, 
  toggleDarkMode
}) => {
  const [isCloudActive, setIsCloudActive] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConn = async () => {
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
        setIsCloudActive(!error);
      } catch (e) {
        setIsCloudActive(false);
      }
    };
    checkConn();
    const interval = setInterval(checkConn, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900 sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-12 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-1.5 rounded-lg shadow-sm">
            <Mic2 size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-black text-gray-900 dark:text-white tracking-tight italic uppercase">
              SPEAK<span className="text-orange-500">SYNC</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase px-2 py-1 rounded-full transition-all ${
              isCloudActive === true
                ? 'text-green-600 bg-green-500/10' 
                : isCloudActive === false
                ? 'text-blue-500 bg-blue-500/10'
                : 'text-slate-400'
            }`}>
               {isCloudActive === true ? <CloudCheck size={12} /> : isCloudActive === false ? <ShieldCheck size={12} /> : <div className="w-3 h-3 border border-slate-300 border-t-transparent rounded-full animate-spin" />}
               <span className="hidden sm:inline">
                 {isCloudActive === true ? 'Cloud Active' : 'Offline'}
               </span>
            </div>

            <button
                onClick={toggleDarkMode}
                className="p-2 text-slate-400 hover:text-orange-500 transition-colors tap-active"
            >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
                onClick={onHistoryClick}
                className="p-2 text-slate-400 hover:text-orange-500 transition-colors tap-active"
            >
                <History size={18} />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
