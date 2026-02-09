
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, Activity, XCircle, Info, MessageSquare, User, Bot, Loader2, ShieldOff } from 'lucide-react';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const LiveConversation: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const currentInputText = useRef('');
  const currentOutputText = useRef('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const cleanup = () => {
    sourceNodesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourceNodesRef.current.clear();

    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      try { inputAudioContextRef.current.close(); } catch(e) {}
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      try { outputAudioContextRef.current.close(); } catch(e) {}
      outputAudioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    sessionRef.current = null;
    setIsActive(false);
    setIsConnecting(false);
    nextStartTimeRef.current = 0;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const startSession = async () => {
    setError("El acceso por voz está deshabilitado por el administrador.");
    /* 
    // MICROPHONE ACCESS DISABLED BY USER REQUEST
    setError(null);
    setIsConnecting(true);
    setTranscripts([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      inputAudioContextRef.current = new AudioCtx({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const connectPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: 'Eres SPEAKSYNC, un tutor experto en holandés para hispanohablantes...',
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            
            if (inputAudioContextRef.current) {
              const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current!);
              const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionRef.current?.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContextRef.current.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // ... (rest of audio processing)
          },
          onclose: () => cleanup(),
          onerror: () => {
            setError("Error de conexión con SPEAKSYNC.");
            cleanup();
          }
        }
      });

      sessionRef.current = connectPromise;
    } catch (err: any) {
      setError(err.message || "No se pudo iniciar SPEAKSYNC Live.");
      setIsConnecting(false);
      cleanup();
    }
    */
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Mic Control Card */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center transition-all h-fit lg:sticky lg:top-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900/30 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-6">
          <ShieldOff className="w-3 h-3" />
          Hardware Bloqueado
        </div>
        
        <div className="relative mb-8">
          <button
            onClick={() => setError("Módulo de voz deshabilitado temporalmente.")}
            className="relative z-10 w-32 h-32 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-300 cursor-not-allowed border-4 border-dashed border-slate-200 dark:border-slate-800 shadow-inner"
          >
            <Mic className="w-12 h-12 opacity-20" />
          </button>
        </div>

        <h3 className="text-xl font-bold dark:text-white mb-2 text-slate-400">Voz No Disponible</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
          El acceso al micrófono ha sido restringido por seguridad.
        </p>

        {error && (
          <div className="w-full p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="w-full text-left bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-xs space-y-2">
            <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Status de Privacidad</p>
            <div className="flex items-center gap-2 text-slate-400">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Micrófono Desconectado
            </div>
        </div>
      </div>

      {/* Transcript Card */}
      <div className="lg:col-span-3 flex flex-col h-[550px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden opacity-50">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-400 text-sm">Transcripción Desactivada</span>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 script-scroll bg-slate-50/30 dark:bg-slate-800/50">
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-center space-y-3 px-8">
              <ShieldOff className="w-12 h-12 opacity-10" />
              <p className="text-sm italic">Habilita el hardware para ver transcripciones.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveConversation;
