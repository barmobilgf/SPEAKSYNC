
import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle2, XCircle, HelpCircle, RefreshCcw, ChevronRight } from 'lucide-react';

interface QuizProps {
  questions: QuizQuestion[];
}

const Quiz: React.FC<QuizProps> = ({ questions }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (questionIdx: number, optionIdx: number) => {
    if (showResults) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIdx] = optionIdx;
    setSelectedAnswers(newAnswers);
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answer, idx) => {
      return answer === questions[idx].correctAnswer ? score + 1 : score;
    }, 0);
  };

  const resetQuiz = () => {
    setSelectedAnswers(new Array(questions.length).fill(-1));
    setShowResults(false);
  };

  if (questions.length === 0) {
    return <div className="p-8 text-center text-gray-500">No se pudieron generar preguntas.</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-black italic tracking-tighter uppercase">Sync <span className="text-orange-500">Score</span></h3>
        {showResults && (
           <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg">
             Aciertos: {calculateScore()} / {questions.length}
           </span>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
            <h4 className="text-[14px] md:text-[15px] font-bold text-slate-800 dark:text-slate-100 mb-4 flex gap-3 leading-snug">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[9px] font-black">
                {qIdx + 1}
              </span>
              {q.question}
            </h4>

            <div className="space-y-2">
              {q.options.map((option, oIdx) => {
                const isSelected = selectedAnswers[qIdx] === oIdx;
                const isCorrect = oIdx === q.correctAnswer;
                
                let btnStyle = "border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800";
                
                if (showResults) {
                  if (isCorrect) btnStyle = "border-green-500 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 font-bold";
                  else if (isSelected) btnStyle = "border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400";
                  else btnStyle = "border-slate-50 dark:border-slate-800 opacity-40";
                } else if (isSelected) {
                  btnStyle = "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20";
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelect(qIdx, oIdx)}
                    disabled={showResults}
                    className={`w-full text-left p-3 rounded-xl border text-[13px] transition-all active:scale-[0.98] flex items-center justify-between ${btnStyle} leading-tight`}
                  >
                    <span>{option}</span>
                    {showResults && isCorrect && <CheckCircle2 className="w-4 h-4" />}
                    {showResults && isSelected && !isCorrect && <XCircle className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>

            {showResults && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-200 text-[11px] rounded-lg border border-blue-100 dark:border-blue-800 italic leading-relaxed">
                {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center pb-10">
        {!showResults ? (
          <button
            onClick={() => setShowResults(true)}
            disabled={selectedAnswers.includes(-1)}
            className="w-full py-5 bg-orange-500 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-orange-500/25 active:scale-95 transition-all disabled:opacity-30"
          >
            Evaluar Resultados
          </button>
        ) : (
          <button
            onClick={resetQuiz}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-lg"
          >
            <RefreshCcw className="w-4 h-4" /> Reintentar Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
