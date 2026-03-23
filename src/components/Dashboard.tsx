import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Trophy, Flame, Target, Zap, TrendingUp, ChevronRight } from "lucide-react";
import RotatingQuote from "./RotatingQuote";
import { getLevelProgress } from "../services/progressionService";

export default function Dashboard({ user, onNavigate }: { user: any, onNavigate: (tab: string) => void }) {
  if (!user) return null;
  const levelProgress = getLevelProgress(user.transformation_score || 0);
  const [quests, setQuests] = useState<any[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(true);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const res = await fetch(`/api/users/${user.id}/quests`);
        const data = await res.json();
        if (data.quests) setQuests(data.quests);
      } catch (e) {
        console.error("Failed to fetch quests:", e);
      } finally {
        setLoadingQuests(false);
      }
    };
    fetchQuests();
  }, [user.id]);

  const incompleteCount = quests.filter(q => !q.completed).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <RotatingQuote />

      {/* Level Card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Trophy size={120} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
              {user.current_level >= 10 ? 'ELITE WARRIOR' : 'ROOKIE GRINDER'}
            </div>
            <div className="flex items-center gap-1 text-orange-500 text-[10px] font-black uppercase tracking-widest">
              <Flame size={12} /> {user.current_streak} DAY STREAK
            </div>
          </div>

          <h1 className="text-5xl font-black italic tracking-tighter mb-1 text-white">LEVEL {user.current_level}</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-6">TRANSFORMATION SCORE: {user.transformation_score}</p>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span>Next Level</span>
              <span>{Math.floor(levelProgress)}%</span>
            </div>
            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700 p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={<Zap className="text-yellow-500" />} 
          label="Energy" 
          value="85%" 
          color="yellow" 
        />
        <StatCard 
          icon={<Target className="text-red-500" />} 
          label="Goal" 
          value={user.diet_goal === 'weight_loss' ? 'Cut' : 'Bulk'} 
          color="red" 
        />
      </div>

      {/* Daily Quest */}
      <div className={`bg-zinc-900/50 border rounded-3xl p-6 transition-all duration-500 ${incompleteCount > 0 ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-zinc-800'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-black italic tracking-tighter text-lg uppercase text-zinc-300">DAILY QUESTS</h3>
            {incompleteCount > 0 && (
              <motion.span 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-emerald-500 text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase"
              >
                {incompleteCount} REMAINING
              </motion.span>
            )}
          </div>
          <TrendingUp size={16} className="text-emerald-500" />
        </div>
        
        <div className="space-y-3">
          {loadingQuests ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : quests.length > 0 ? (
            quests.map((quest) => (
              <QuestItem 
                key={quest.id} 
                title={quest.title} 
                completed={quest.completed} 
                reward={quest.id === 'workout' ? '+100 XP' : quest.id === 'calories' ? '+50 XP' : '+200 XP'} 
                highlight={!quest.completed}
              />
            ))
          ) : (
            <>
              <QuestItem title="Log 3 Meals" completed={false} reward="+50 XP" />
              <QuestItem title="30 Min Workout" completed={false} reward="+100 XP" />
              <QuestItem title="No Junk Food" completed={true} reward="+200 XP" />
            </>
          )}
        </div>

        {incompleteCount > 0 && (
          <p className="mt-4 text-[10px] font-black text-emerald-500/70 uppercase tracking-widest text-center animate-pulse">
            Finish your quests to level up faster!
          </p>
        )}
      </div>

      {/* Future Self Teaser */}
      <div 
        onClick={() => onNavigate('future')}
        className="bg-gradient-to-br from-emerald-900/20 to-black border border-emerald-500/20 rounded-3xl p-6 flex items-center justify-between group cursor-pointer hover:border-emerald-500/40 transition-all"
      >
        <div>
          <h3 className="font-black italic tracking-tighter text-emerald-500 uppercase">FUTURE SELF VISUALIZER</h3>
          <p className="text-zinc-500 text-xs font-bold">See your body after 90 days of discipline.</p>
        </div>
        <div className="bg-emerald-500 p-2 rounded-full group-hover:translate-x-1 transition-transform">
          <ChevronRight className="text-black" size={20} />
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
      </div>
      <p className="text-2xl font-black italic tracking-tighter text-white">{value}</p>
    </div>
  );
}

function QuestItem({ title, completed, reward, highlight }: any) {
  return (
    <motion.div 
      whileHover={{ x: 5 }}
      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
        completed 
          ? 'bg-black/20 border-zinc-900/50' 
          : highlight 
            ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
            : 'bg-black/40 border-zinc-800/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${completed ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700'}`}>
          {completed && <Zap size={10} className="text-black fill-current" />}
        </div>
        <span className={`text-sm font-bold transition-colors ${completed ? 'text-zinc-600 line-through' : 'text-white'}`}>{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {!completed && highlight && (
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
        )}
        <span className="text-[10px] font-black text-emerald-500">{reward}</span>
      </div>
    </motion.div>
  );
}
