import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Target, Calendar, TrendingUp, AlertTriangle, CheckCircle, Zap, Info, Bell, Trash2 } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { HINGLISH_GOAL_QUOTES } from "../constants/foodData";
import RotatingQuote from "./RotatingQuote";
import { ROCKY_BRO_SYSTEM_PROMPT } from "../constants/prompts";
import { XP_VALUES } from "../services/progressionService";

export default function GoalSystem({ user, onUpdate, onUpdateXP }: { user: any, onUpdate: (user: any) => void, onUpdateXP: (amount: number) => void }) {
  const [goal, setGoal] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState("");
  const [checkInType, setCheckInType] = useState<"info" | "warning" | "danger">("info");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [generatingNotification, setGeneratingNotification] = useState(false);
  const [recentLogs, setRecentLogs] = useState<any>({ dietLogs: [], fitnessLogs: [] });

  useEffect(() => {
    if (!user) return;
    fetchGoal();
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/logs/${user.id}`);
      const data = await res.json();
      setRecentLogs(data);
    } catch (e) {
      console.error("Error fetching logs:", e);
    }
  };

  useEffect(() => {
    if (goal) {
      generateDailyNotification();
    }
  }, [goal]);

  const generateDailyNotification = async () => {
    if (!goal) return;
    setGeneratingNotification(true);
    try {
      const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const lastCheckIn = goal.last_check_in;
      const isMissedToday = lastCheckIn !== new Date().toISOString().split('T')[0];
      
      // Activity summary for prompt
      const dietSummary = recentLogs.dietLogs.length > 0 
        ? recentLogs.dietLogs.map((l: any) => `${l.log_date}: ${l.total_calories} cal, guilt: ${l.guilt_score}`).join("; ")
        : "No recent diet logs";
      const fitnessSummary = recentLogs.fitnessLogs.length > 0
        ? recentLogs.fitnessLogs.map((l: any) => `${l.log_date}: ${l.workout_type}, ${l.duration_mins} mins`).join("; ")
        : "No recent fitness logs";

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const prompt = `
        User Goal: ${goal.title}
        Target: ${goal.target_value}
        Deadline: ${goal.deadline} (${daysLeft} days left)
        Last Check-in: ${lastCheckIn || 'Never'}
        Missed Today: ${isMissedToday ? 'Yes' : 'No'}
        
        Recent Diet Activity: ${dietSummary}
        Recent Fitness Activity: ${fitnessSummary}
        
        Generate a highly aggressive, guilt-inducing, and personalized Hinglish notification message.
        If they missed today or are close to the deadline, be VERY biting and sarcastic.
        If they have been inactive (no logs), call them out on their laziness.
        If they have been active but the goal is far, remind them that consistency is key but they need to push harder.
        Use "Desi" psychology - mention their family's expectations or their rivals laughing at them.
        Example: "Bhai, ${daysLeft} din bache hain aur tu abhi tak soya hai? Tera rival Level up kar raha hai aur tu wahi ka wahi hai. Sharam kar!"
        
        Return JSON format: { "message": "...", "type": "warning" | "danger" | "info" }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          systemInstruction: ROCKY_BRO_SYSTEM_PROMPT,
          responseMimeType: "application/json" 
        }
      });

      const result = JSON.parse(response.text || "{}");
      setNotifications([result]);
    } catch (e) {
      console.error("Error generating notification:", e);
    } finally {
      setGeneratingNotification(false);
    }
  };

  const fetchGoal = async () => {
    try {
      const res = await fetch(`/api/goals/${user.id}`);
      const data = await res.json();
      if (data.goal) {
        setGoal(data.goal);
        setTitle(data.goal.title);
        setTargetValue(data.goal.target_value);
        setDeadline(data.goal.deadline);
        setProgress(data.goal.progress || 0);
      }
    } catch (e) {
      console.error("Error fetching goal:", e);
    }
  };

  const saveGoal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          title,
          target_value: targetValue,
          deadline,
          progress
        })
      });
      const data = await res.json();
      setGoal(data.goal);
      if (progress === 100) {
        onUpdateXP(XP_VALUES.QUEST_COMPLETE);
      }
    } catch (e) {
      console.error("Error saving goal:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (status: 'done' | 'half' | 'none') => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          progress_status: status
        })
      });
      const data = await res.json();
      setCheckInMessage(data.message);
      setCheckInType(data.type);
      onUpdate(data.user);
      onUpdateXP(status === 'done' ? XP_VALUES.GOAL_CHECK_IN : status === 'half' ? Math.floor(XP_VALUES.GOAL_CHECK_IN / 2) : 0);
      
      // Refresh goal to update last_check_in
      fetchGoal();
    } catch (e) {
      console.error("Error checking in:", e);
    } finally {
      setLoading(false);
    }
  };

  const daysLeft = goal?.deadline ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const calculateTimeProgress = () => {
    if (!goal) return 0;
    const start = new Date(goal.created_at).getTime();
    const end = new Date(goal.deadline).getTime();
    const now = new Date().getTime();
    if (now >= end) return 100;
    const total = end - start;
    const elapsed = now - start;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  const timeProgress = calculateTimeProgress();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-blue-500">GOAL TRACKER</h2>
        <div className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          MINDSET ARENA
        </div>
      </div>

      <RotatingQuote />

      {/* AI Notification Center */}
      <AnimatePresence>
        {(notifications.length > 0 || generatingNotification) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {generatingNotification ? (
              <div className="p-5 rounded-3xl border-2 border-zinc-800 bg-zinc-900/50 flex items-center gap-4 animate-pulse">
                <div className="p-2 rounded-xl bg-zinc-800">
                  <Zap size={20} className="text-blue-500 animate-spin" />
                </div>
                <p className="text-xs font-bold text-zinc-500 italic">Rocky Bro is analyzing your laziness...</p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div 
                  key={i}
                  className={`p-5 rounded-3xl border-2 flex items-start gap-4 transition-all shadow-lg ${
                    n.type === 'danger' ? 'bg-red-500/5 border-red-500/20 text-red-500 shadow-red-500/5' :
                    n.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-500 shadow-yellow-500/5' :
                    'bg-blue-500/5 border-blue-500/20 text-blue-500 shadow-blue-500/5'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${
                    n.type === 'danger' ? 'bg-red-500/20' :
                    n.type === 'warning' ? 'bg-yellow-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    <Bell size={20} className="shrink-0" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
                        {n.type === 'danger' ? 'URGENT WARNING' : n.type === 'warning' ? 'GOAL ALERT' : 'DAILY BRIEFING'}
                      </p>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        n.type === 'danger' ? 'bg-red-500' :
                        n.type === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                    </div>
                    <p className="text-sm font-bold italic leading-relaxed">
                      "{n.message}"
                    </p>
                    <button 
                      onClick={generateDailyNotification}
                      className="mt-3 text-[8px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 flex items-center gap-1"
                    >
                      <Zap size={10} /> Refresh AI Reminder
                    </button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!goal ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-black italic tracking-tighter uppercase text-white">SET YOUR FUTURE GOAL</h3>
          <p className="text-zinc-500 text-xs font-bold leading-relaxed">
            Bhai, bina goal ke zindagi bekar hai. Set kar ki tu kya hasil karna chahta hai.
          </p>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Goal Title</label>
              <input 
                type="text" 
                placeholder="e.g. Earn 12,00,000"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Value</label>
              <input 
                type="text" 
                placeholder="e.g. 12 Lakhs"
                value={targetValue}
                onChange={e => setTargetValue(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Deadline</label>
              <input 
                type="date" 
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button 
            onClick={saveGoal}
            disabled={loading || !title || !deadline}
            className="w-full bg-blue-500 text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all transform active:scale-95 disabled:opacity-50"
          >
            LOCK IN GOAL
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Goal Display Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Target size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
                  ACTIVE GOAL
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">DAYS LEFT</p>
                  <p className="text-xl font-black italic text-white leading-none">{daysLeft}</p>
                </div>
              </div>

              <h1 className="text-4xl font-black italic tracking-tighter mb-1 text-white uppercase">{goal.title}</h1>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4">TARGET: {goal.target_value}</p>

              {/* Enhanced Progress Visualization */}
              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Goal Progress</span>
                    {goal && (
                      <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${progress >= timeProgress ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                        {progress >= timeProgress ? 'AHEAD OF SCHEDULE' : 'BEHIND SCHEDULE'}
                      </div>
                    )}
                  </div>
                  <span className="text-2xl font-black italic text-white">{progress}%</span>
                </div>

                <div className="relative">
                  {/* Main Achievement Bar */}
                  <div className="h-6 bg-black/50 rounded-full border border-white/10 p-1 relative overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className={`h-full rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] ${progress >= timeProgress ? 'bg-blue-500' : 'bg-blue-600/80'}`}
                    />
                    
                    {/* Time Progress Marker (Vertical Line) */}
                    <motion.div 
                      initial={{ left: 0 }}
                      animate={{ left: `${timeProgress}%` }}
                      className="absolute top-0 bottom-0 w-1 bg-white/40 z-20 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    >
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-zinc-500 whitespace-nowrap">
                        TIME ELAPSED
                      </div>
                    </motion.div>
                  </div>

                  {/* Secondary Time Progress Bar (Subtle background) */}
                  <div className="absolute inset-0 h-6 bg-transparent pointer-events-none">
                    <div 
                      style={{ width: `${timeProgress}%` }}
                      className="h-full bg-white/5 rounded-full"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={isNaN(progress) ? 0 : progress}
                    onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
                    onMouseUp={saveGoal}
                    onTouchEnd={saveGoal}
                    className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-zinc-600 uppercase">Slide to update</span>
                    <span className="text-[8px] font-black text-zinc-400 uppercase">Target: {goal.target_value}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Time Progress</p>
                    <p className={`text-sm font-black italic ${timeProgress > 90 ? 'text-red-500' : 'text-white'}`}>{Math.floor(timeProgress)}%</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Days Remaining</p>
                    <p className="text-sm font-black italic text-white">{daysLeft} Days</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Deadline</p>
                  <p className="text-sm font-bold text-white">{new Date(goal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <button onClick={() => setGoal(null)} className="text-zinc-600 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Daily Check-in Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black italic tracking-tighter text-lg uppercase text-zinc-300">DAILY CHECK-IN</h3>
              <TrendingUp size={16} className="text-blue-500" />
            </div>

            <p className="text-zinc-500 text-xs font-bold leading-relaxed">
              Aaj tune apne goal ke liye kya kiya? Sach bolna, varna AI tera rival ban jayega!
            </p>

            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleCheckIn('done')}
                className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-emerald-500/20 transition-all"
              >
                <CheckCircle size={24} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase text-emerald-500">Done</span>
              </button>
              <button 
                onClick={() => handleCheckIn('half')}
                className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-yellow-500/20 transition-all"
              >
                <Zap size={24} className="text-yellow-500" />
                <span className="text-[10px] font-black uppercase text-yellow-500">Partial</span>
              </button>
              <button 
                onClick={() => handleCheckIn('none')}
                className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-red-500/20 transition-all"
              >
                <AlertTriangle size={24} className="text-red-500" />
                <span className="text-[10px] font-black uppercase text-red-500">Nothing</span>
              </button>
            </div>

            <AnimatePresence>
              {checkInMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-5 rounded-3xl border-2 flex flex-col gap-3 shadow-xl ${
                    checkInType === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                    checkInType === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {checkInType === 'danger' ? <AlertTriangle size={16} /> : 
                     checkInType === 'warning' ? <Zap size={16} /> : 
                     <CheckCircle size={16} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      ROCKY BRO SAYS:
                    </span>
                  </div>
                  <p className="text-sm font-bold italic leading-relaxed text-white">
                    "{checkInMessage}"
                  </p>
                  <button 
                    onClick={() => setCheckInMessage("")}
                    className="self-end text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
                  >
                    SAMAJH GAYA
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}
