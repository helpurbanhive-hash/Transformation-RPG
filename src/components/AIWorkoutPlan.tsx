import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dumbbell, Sparkles, Loader2, Play, CheckCircle2, ChevronRight, Info, Zap, Timer, Trophy } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import { ROCKY_BRO_SYSTEM_PROMPT } from "../constants/prompts";
import { XP_VALUES } from "../services/progressionService";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  description: string;
  intensity: "High" | "Medium" | "Low";
}

interface WorkoutPlan {
  title: string;
  description: string;
  exercises: Exercise[];
}

export default function AIWorkoutPlan({ user, onUpdateXP }: { user: any, onUpdateXP: (amount: number) => void }) {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [activeExercise, setActiveExercise] = useState<number | null>(null);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [lastCompleted, setLastCompleted] = useState<number | null>(null);
  const [previewExercise, setPreviewExercise] = useState<number | null>(null);
  const [workoutStarted, setWorkoutStarted] = useState(false);

  const generatePlan = async () => {
    if (!goal) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const prompt = `
        User Profile:
        - Name: ${user.name}
        - Current Level: ${user.current_level}
        - Fitness Goal: ${goal}
        
        Task:
        Generate a personalized, high-intensity daily workout routine in Hinglish style.
        The plan should be aggressive and motivational.
        
        Return JSON format:
        {
          "title": "...",
          "description": "...",
          "exercises": [
            {
              "name": "...",
              "sets": 3,
              "reps": "12",
              "rest": "60s",
              "description": "...",
              "intensity": "High" | "Medium" | "Low"
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: ROCKY_BRO_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    sets: { type: Type.NUMBER },
                    reps: { type: Type.STRING },
                    rest: { type: Type.STRING },
                    description: { type: Type.STRING },
                    intensity: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                  },
                  required: ["name", "sets", "reps", "rest", "description", "intensity"]
                }
              }
            },
            required: ["title", "description", "exercises"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      setPlan(result);
      setCompletedExercises([]);
      setActiveExercise(null);
    } catch (e) {
      console.error("Error generating workout plan:", e);
    } finally {
      setLoading(false);
    }
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
      if (plan && completedExercises.length + 1 === plan.exercises.length) {
        onUpdateXP(XP_VALUES.WORKOUT_COMPLETE);
      }
      
      setTimeout(() => setLastCompleted(null), 1000);
    }
  };

  const progress = plan ? (completedExercises.length / plan.exercises.length) * 100 : 0;

  if (!plan) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase text-orange-500">AI WORKOUT GEN</h2>
          <div className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            BETA ARENA
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-black italic tracking-tighter uppercase text-white">WHAT'S YOUR TARGET?</h3>
            <p className="text-zinc-500 text-xs font-bold leading-relaxed">
              Bhai, bata tu kya hasil karna chahta hai? Strength, Weight Loss, ya Endurance? AI tere liye customized plan banayega.
            </p>
          </div>

          <div className="space-y-4">
            <textarea 
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. I want to build muscle and lose belly fat in 30 days. I have access to a gym."
              className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-sm min-h-[120px] focus:outline-none focus:border-orange-500 transition-colors resize-none"
            />

            <button 
              onClick={generatePlan}
              disabled={loading || !goal}
              className="w-full bg-orange-500 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:bg-orange-400 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {loading ? "GENERATING PLAN..." : "GENERATE AI PLAN"}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!workoutStarted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase text-orange-500">AI WARRIOR PLAN</h2>
          <button 
            onClick={() => setPlan(null)}
            className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
          >
            REGENERATE
          </button>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Dumbbell size={120} />
          </div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-black italic tracking-tighter mb-2 text-white uppercase">{plan.title}</h1>
            <p className="text-zinc-400 text-sm font-bold leading-relaxed mb-8 italic">"{plan.description}"</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Estimated Time</p>
                <p className="text-xl font-black italic text-white">~50 MIN</p>
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
              <Play size={20} fill="currentColor" /> START AI TRAINING
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest px-1">AI GENERATED ROUTINE</h3>
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
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{ex.sets} SETS × {ex.reps}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${
                    ex.intensity === 'High' ? 'bg-red-500/20 text-red-500' : 
                    ex.intensity === 'Medium' ? 'bg-orange-500/20 text-orange-500' : 
                    'bg-blue-500/20 text-blue-500'
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
          <Timer size={16} className="text-orange-500" />
          <span className="font-mono text-sm font-bold">AI LIVE SESSION</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
          <span>AI Plan Progress</span>
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
        {plan.exercises.map((ex, i) => (
          <motion.div 
            key={i}
            layout
            initial={false}
            animate={{ 
              scale: completedExercises.includes(i) ? 0.98 : 1,
              opacity: completedExercises.includes(i) ? 0.6 : 1,
              boxShadow: completedExercises.includes(i) ? '0 0 20px rgba(16,185,129,0.1)' : 'none'
            }}
            className={`bg-zinc-900/50 border rounded-3xl overflow-hidden transition-all relative ${
              activeExercise === i ? 'border-orange-500 ring-1 ring-orange-500/50' : 
              completedExercises.includes(i) ? 'border-emerald-500/30' : 'border-zinc-800'
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
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all relative overflow-hidden ${
                    completedExercises.includes(i) ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {completedExercises.includes(i) ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <CheckCircle2 size={16} className="text-black" />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </button>
                <div>
                  <h4 className={`font-bold transition-all ${completedExercises.includes(i) ? 'text-zinc-500 line-through' : 'text-white'}`}>
                    {ex.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      {ex.sets} SETS × {ex.reps}
                    </p>
                    {completedExercises.includes(i) && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded"
                      >
                        DONE
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight 
                size={20} 
                className={`text-zinc-600 transition-transform ${activeExercise === i ? 'rotate-90' : ''}`} 
              />
            </div>

            <AnimatePresence>
              {activeExercise === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 pb-5 border-t border-zinc-800/50 pt-4"
                >
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
                      <p className="text-xs font-bold text-white">{ex.rest}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {progress === 100 && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-24 left-6 right-6 z-50"
        >
          <div className="bg-emerald-500 p-6 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.4)] flex items-center justify-between">
            <div>
              <h4 className="text-black font-black italic text-xl uppercase tracking-tighter">AI WORKOUT COMPLETE!</h4>
              <p className="text-emerald-900 text-xs font-bold">+{XP_VALUES.WORKOUT_COMPLETE} TRANSFORMATION XP</p>
            </div>
            <Trophy size={40} className="text-emerald-900" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
