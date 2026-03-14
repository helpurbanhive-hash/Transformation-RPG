import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Star, Zap, Sparkles, ChevronRight } from "lucide-react";
import confetti from "canvas-confetti";

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

export default function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  useEffect(() => {
    // Trigger confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const getRank = (lvl: number) => {
    if (lvl < 5) return "Rookie Grinder";
    if (lvl < 10) return "Iron Warrior";
    if (lvl < 20) return "Steel Hustler";
    if (lvl < 35) return "Elite Beast";
    if (lvl < 50) return "Titan of Discipline";
    return "God Mode Legend";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-zinc-900 border-2 border-emerald-500 rounded-[2rem] p-8 text-center relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.3)]"
      >
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />
        
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="inline-block mb-6"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
            <Trophy size={48} className="text-black" />
          </div>
        </motion.div>

        <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Achievement Unlocked</h2>
        <h1 className="text-5xl font-black italic tracking-tighter text-white mb-2 uppercase">Level Up!</h1>
        
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="text-zinc-500 line-through text-2xl font-black italic">LVL {level - 1}</div>
          <ChevronRight className="text-emerald-500" />
          <div className="text-emerald-500 text-5xl font-black italic drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">LVL {level}</div>
        </div>

        <div className="bg-black/50 border border-zinc-800 rounded-2xl p-4 mb-8">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">New Rank Attained</p>
          <p className="text-white font-black italic text-xl uppercase tracking-tight">{getRank(level)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700">
            <Zap size={16} className="text-yellow-500 mx-auto mb-1" />
            <p className="text-[8px] font-black text-zinc-500 uppercase">Energy Boost</p>
            <p className="text-white font-bold">+10%</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700">
            <Star size={16} className="text-emerald-500 mx-auto mb-1" />
            <p className="text-[8px] font-black text-zinc-500 uppercase">Respect</p>
            <p className="text-white font-bold">+50</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95"
        >
          CONTINUE THE GRIND <ChevronRight size={18} />
        </button>
      </motion.div>
    </div>
  );
}
