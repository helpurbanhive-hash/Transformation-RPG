import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dumbbell, Play, CheckCircle2, ChevronRight, Info, Zap, Flame, Trophy, Timer, Sparkles } from "lucide-react";
import { WORKOUT_PLANS, Exercise } from "../constants/exerciseData";
import AIWorkoutPlan from "./AIWorkoutPlan";
import { XP_VALUES } from "../services/progressionService";

export default function ExercisePlan({ user, onUpdateXP }: { user: any, onUpdateXP: (amount: number) => void }) {
  const [mode, setMode] = useState<'standard' | 'ai'>('standard');
  const goal = user.diet_goal || 'maintain';
  const plan = WORKOUT_PLANS[goal] || WORKOUT_PLANS.maintain;
  
  const [activeExercise, setActiveExercise] = useState<number | null>(null);
  const [previewExercise, setPreviewExercise] = useState<number | null>(null);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [lastCompleted, setLastCompleted] = useState<number | null>(null);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'work' | 'rest'>('work');

  React.useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      // Optional: Add a sound or haptic feedback here
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startTimer = (seconds: number, mode: 'work' | 'rest') => {
    setTimeLeft(seconds);
    setTimerMode(mode);
    setTimerActive(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleComplete = (index: number) => {
    if (completedExercises.includes(index)) {
      setCompletedExercises(completedExercises.filter(i => i !== index));
      setLastCompleted(null);
    } else {
      setCompletedExercises([...completedExercises, index]);
      setLastCompleted(index);
      onUpdateXP(XP_VALUES.EXERCISE_LOG);
      
      // Check if this was the last exercise
      if (completedExercises.length + 1 === plan.exercises.length) {
        onUpdateXP(XP_VALUES.WORKOUT_COMPLETE);
      }
      
      setTimeout(() => setLastCompleted(null), 1000);
    }
  };

  const progress = (completedExercises.length / plan.exercises.length) * 100;

  if (mode === 'ai') {
    return (
      <div className="space-y-6">
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setMode('standard')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'standard' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
          >
            Standard
          </button>
          <button 
            onClick={() => setMode('ai')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'ai' ? 'bg-orange-500 text-black' : 'text-zinc-500'}`}
          >
            <Sparkles size={12} /> AI Generator
          </button>
        </div>
        <AIWorkoutPlan user={user} onUpdateXP={onUpdateXP} />
      </div>
    );
  }

  if (!workoutStarted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setMode('standard')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'standard' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
          >
            Standard
          </button>
          <button 
            onClick={() => setMode('ai')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'ai' ? 'bg-orange-500 text-black' : 'text-zinc-500'}`}
          >
            <Sparkles size={12} /> AI Generator
          </button>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase text-orange-500">WARRIOR TRAINING</h2>
          <div className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            {plan.goal} PLAN
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Dumbbell size={120} />
          </div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-black italic tracking-tighter mb-2 text-white">{plan.title}</h1>
            <p className="text-zinc-400 text-sm font-bold leading-relaxed mb-8">{plan.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Duration</p>
                <p className="text-xl font-black italic text-white">~45 MIN</p>
              </div>
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Exercises</p>
                <p className="text-xl font-black italic text-white">{plan.exercises.length} TOTAL</p>
              </div>
            </div>

            <button 
              onClick={() => setWorkoutStarted(true)}
              className="w-full bg-orange-500 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:bg-orange-400 transition-all transform active:scale-95"
            >
              <Play size={20} fill="currentColor" /> START TRAINING
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest px-1">PREVIEW WORKOUT</h3>
          {plan.exercises.map((ex, i) => (
            <div key={i} className="space-y-2">
              <div 
                onClick={() => setPreviewExercise(previewExercise === i ? null : i)}
                className={`bg-zinc-900/30 border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-zinc-800/50 ${previewExercise === i ? 'border-orange-500/50' : 'border-zinc-800'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 font-black">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{ex.name}</p>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{ex.sets} SETS × {ex.reps} REPS</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    ex.intensity === 'High' ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 
                    ex.intensity === 'Medium' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.1)]' : 
                    'bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                  }`}>
                    {ex.intensity}
                  </div>
                  <Info size={14} className={`transition-colors ${previewExercise === i ? 'text-orange-500' : 'text-zinc-600'}`} />
                </div>
              </div>
              
              <AnimatePresence>
                {previewExercise === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-black/20 border border-zinc-800/50 rounded-2xl p-4 mx-2">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Info size={10} /> Exercise Detail
                      </p>
                      <p className="text-xs text-zinc-400 leading-relaxed italic">"{ex.description}"</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-24"
    >
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setWorkoutStarted(false)}
          className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1 text-xs font-black uppercase tracking-widest"
        >
          EXIT
        </button>
        <div className="flex items-center gap-2">
          {timerActive && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${timerMode === 'work' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-blue-500/10 border-blue-500 text-blue-500'}`}>
              <Timer size={14} className="animate-pulse" />
              <span className="font-mono text-xs font-black">{formatTime(timeLeft)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Timer size={16} className="text-orange-500" />
            <span className="font-mono text-sm font-bold">LIVE SESSION</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
          <span>Workout Progress</span>
          <span>{Math.floor(progress)}%</span>
        </div>
        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
          />
        </div>
      </div>

      <div className="space-y-4">
        {plan.exercises.map((ex, i) => {
          const isCompleted = completedExercises.includes(i);
          const isCurrent = !isCompleted && (i === 0 || completedExercises.includes(i - 1));
          const isNext = !isCompleted && !isCurrent && (i > 0 && completedExercises.includes(i - 2) || (i === 1 && completedExercises.includes(0)));
          // Simpler logic for isNext: first uncompleted after isCurrent
          const firstUncompleted = plan.exercises.findIndex((_, idx) => !completedExercises.includes(idx));
          const isTrulyCurrent = i === firstUncompleted;
          const isTrulyNext = i === plan.exercises.findIndex((_, idx) => !completedExercises.includes(idx) && idx > firstUncompleted);

          return (
            <motion.div 
              key={i}
              layout
              initial={false}
              animate={{ 
                scale: isCompleted ? 0.98 : isTrulyCurrent ? 1.02 : 1,
                opacity: isCompleted ? 0.6 : 1,
                boxShadow: isTrulyCurrent ? '0 10px 30px rgba(249,115,22,0.2)' : isCompleted ? '0 0 20px rgba(16,185,129,0.1)' : 'none',
                backgroundColor: isTrulyCurrent ? 'rgba(24, 24, 27, 0.8)' : 'rgba(24, 24, 27, 0.5)'
              }}
              className={`border rounded-3xl overflow-hidden transition-all relative ${
                activeExercise === i ? 'border-orange-500 ring-2 ring-orange-500/30' : 
                isTrulyCurrent ? 'border-orange-500/50' :
                isCompleted ? 'border-emerald-500/30' : 'border-zinc-800'
              }`}
            >
              <AnimatePresence>
                {lastCompleted === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -40 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-1/2 -translate-x-1/2 top-4 z-50 pointer-events-none"
                  >
                    <span className="text-emerald-500 font-black text-xs whitespace-nowrap bg-black/80 px-2 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      +{XP_VALUES.EXERCISE_LOG} XP
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div 
                onClick={() => setActiveExercise(activeExercise === i ? null : i)}
                className="p-5 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleComplete(i);
                    }}
                    className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all relative overflow-hidden ${
                      isCompleted ? 'bg-emerald-500 border-emerald-500' : isTrulyCurrent ? 'border-orange-500/50 bg-orange-500/5' : 'border-zinc-700'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 45 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <CheckCircle2 size={20} className="text-black" />
                        </motion.div>
                      ) : (
                        <span className={`text-xs font-black ${isTrulyCurrent ? 'text-orange-500' : 'text-zinc-500'}`}>{i + 1}</span>
                      )}
                    </AnimatePresence>
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className={`font-bold transition-all ${isCompleted ? 'text-zinc-500 line-through' : 'text-white'}`}>
                        {ex.name}
                      </h4>
                      {isTrulyCurrent && (
                        <span className="bg-orange-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter animate-pulse">
                          CURRENT
                        </span>
                      )}
                      {isTrulyNext && (
                        <span className="bg-zinc-800 text-zinc-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                          NEXT UP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        {ex.sets} SETS × {ex.reps} REPS
                      </p>
                      <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        ex.intensity === 'High' ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 
                        ex.intensity === 'Medium' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.1)]' : 
                        'bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                      }`}>
                        {ex.intensity}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isCompleted && (
                    <div className="bg-emerald-500/20 p-1 rounded-full">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    </div>
                  )}
                  <ChevronRight 
                    size={20} 
                    className={`text-zinc-600 transition-transform ${activeExercise === i ? 'rotate-90' : ''}`} 
                  />
                </div>
              </div>

            <AnimatePresence>
              {activeExercise === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 pb-5 border-t border-zinc-800/50 pt-4"
                >
                  <div className="flex gap-2 mb-4">
                    <button 
                      onClick={() => startTimer(60, 'work')}
                      className="flex-1 bg-orange-500 text-black font-black py-3 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Play size={14} fill="currentColor" /> Start Set
                    </button>
                    <button 
                      onClick={() => startTimer(60, 'rest')}
                      className="flex-1 bg-zinc-800 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Timer size={14} /> Start Rest
                    </button>
                  </div>

                  <div className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl mb-4">
                    <Info size={18} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-zinc-400 leading-relaxed">{ex.description}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 bg-zinc-800/50 p-3 rounded-xl text-center">
                      <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Intensity</p>
                      <p className={`text-xs font-bold ${
                        ex.intensity === 'High' ? 'text-red-500' : 
                        ex.intensity === 'Medium' ? 'text-orange-500' : 'text-blue-500'
                      }`}>{ex.intensity}</p>
                    </div>
                    <div className="flex-1 bg-zinc-800/50 p-3 rounded-xl text-center">
                      <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Rest</p>
                      <p className="text-xs font-bold text-white">60 SEC</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          );
        })}
      </div>

      {progress === 100 && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-24 left-6 right-6 z-50"
        >
          <div className="bg-emerald-500 p-6 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.4)] flex items-center justify-between">
            <div>
              <h4 className="text-black font-black italic text-xl uppercase tracking-tighter">WORKOUT COMPLETE!</h4>
              <p className="text-emerald-900 text-xs font-bold">+{XP_VALUES.WORKOUT_COMPLETE} TRANSFORMATION XP</p>
            </div>
            <Trophy size={40} className="text-emerald-900" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
