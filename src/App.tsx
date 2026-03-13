/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Flame, 
  Users, 
  Utensils, 
  Home, 
  Settings,
  ChevronRight,
  Zap,
  Target,
  MapPin,
  Dumbbell,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Components
import Dashboard from "./components/Dashboard";
import DietLog from "./components/DietLog";
import Padose from "./components/Padose";
import ExercisePlan from "./components/ExercisePlan";
import GoalSystem from "./components/GoalSystem";
import Onboarding from "./components/Onboarding";
import FutureSelf from "./components/FutureSelf";
import Profile from "./components/Profile";
import RockyAI from "./components/RockyAI";
import { Sparkles, User as UserIcon, Star } from "lucide-react";
import { getLevelProgress } from "./services/progressionService";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("transform_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      fetch(`/api/users/${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("transform_user", JSON.stringify(data.user));
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (mobile: string) => {
    setLoading(true);
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile_no: mobile })
    })
    .then(res => res.json())
    .then(data => {
      setUser(data.user);
      localStorage.setItem("transform_user", JSON.stringify(data.user));
    })
    .finally(() => setLoading(false));
  };

  const handleUpdateProfile = (profileData: any) => {
    setLoading(true);
    fetch("/api/users/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profileData, id: user.id })
    })
    .then(res => res.json())
    .then(data => {
      setUser(data.user);
      localStorage.setItem("transform_user", JSON.stringify(data.user));
    })
    .finally(() => setLoading(false));
  };

  const handleUpdateXP = (amount: number) => {
    if (!user) return;
    
    import("./services/progressionService").then(m => {
      const { newXP, newLevel, gained } = m.addXP(user.transformation_score || 0, amount, user.current_streak || 0);
      
      const updatedUser = { 
        ...user, 
        transformation_score: newXP,
        current_level: newLevel
      };
      
      setUser(updatedUser);
      localStorage.setItem("transform_user", JSON.stringify(updatedUser));
      
      // Sync with backend
      fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: user.id, 
          transformation_score: newXP,
          current_level: newLevel 
        })
      });

      // Optional: Show a toast or notification about XP gained
      console.log(`Gained ${gained} XP!`);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-emerald-500 font-mono text-xl"
        >
          LOADING TRANSFORM RPG...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center">
            <h1 className="text-5xl font-black tracking-tighter italic text-emerald-500 mb-2">TRANSFORM RPG</h1>
            <p className="text-zinc-500 text-sm uppercase tracking-widest">Desi Psychology + Game Mechanics</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Mobile Number</label>
              <input 
                type="tel" 
                placeholder="+91 98765 43210"
                className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin(e.currentTarget.value);
                }}
              />
            </div>
            <button 
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling?.querySelector('input');
                if (input) handleLogin(input.value);
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              START TRANSFORMATION <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user.name || user.name === "New User") {
    return <Onboarding onComplete={handleUpdateProfile} />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      {/* HUD Header */}
      <header className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-md border-b border-zinc-800 z-50 p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group flex-1"
            onClick={() => setShowProfile(true)}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden flex items-center justify-center transition-all group-hover:border-emerald-500">
                {user.body_image_url ? (
                  <img src={user.body_image_url} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <UserIcon size={20} className="text-zinc-600" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black border-2 border-black">
                {user.current_level}
              </div>
            </div>
            <div className="flex-1 max-w-[120px]">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Level {user.current_level}</p>
                <Star size={8} className="text-emerald-500 fill-emerald-500" />
              </div>
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${getLevelProgress(user.transformation_score || 0)}%` }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Score</p>
              <p className="font-mono text-emerald-500 font-bold leading-none">{user.transformation_score}</p>
            </div>
            <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-full border border-zinc-800">
              <Flame size={14} className="text-orange-500" />
              <span className="text-xs font-bold">{user.current_streak}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pt-24 p-4">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard user={user} onNavigate={setActiveTab} />
            </motion.div>
          )}
          {activeTab === "future" && (
            <motion.div key="future" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FutureSelf user={user} onUpdate={setUser} />
            </motion.div>
          )}
          {activeTab === "diet" && (
            <motion.div key="diet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DietLog user={user} onUpdate={setUser} onUpdateXP={handleUpdateXP} />
            </motion.div>
          )}
          {activeTab === "rivals" && (
            <motion.div key="rivals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Padose user={user} />
            </motion.div>
          )}
          {activeTab === "exercise" && (
            <motion.div key="exercise" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ExercisePlan user={user} onUpdateXP={handleUpdateXP} />
            </motion.div>
          )}
          {activeTab === "mindset" && (
            <motion.div key="mindset" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GoalSystem user={user} onUpdate={setUser} onUpdateXP={handleUpdateXP} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-zinc-800 p-4 z-50">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <NavButton 
            active={activeTab === "home"} 
            onClick={() => setActiveTab("home")} 
            icon={<Home size={24} />} 
            label="Home" 
          />
          <NavButton 
            active={activeTab === "future"} 
            onClick={() => setActiveTab("future")} 
            icon={<Sparkles size={24} />} 
            label="Future" 
          />
          <NavButton 
            active={activeTab === "diet"} 
            onClick={() => setActiveTab("diet")} 
            icon={<Utensils size={24} />} 
            label="Diet" 
          />
          <NavButton 
            active={activeTab === "exercise"} 
            onClick={() => setActiveTab("exercise")} 
            icon={<Dumbbell size={24} />} 
            label="Train" 
          />
          <NavButton 
            active={activeTab === "mindset"} 
            onClick={() => setActiveTab("mindset")} 
            icon={<Brain size={24} />} 
            label="Mindset" 
          />
          <NavButton 
            active={activeTab === "rivals"} 
            onClick={() => setActiveTab("rivals")} 
            icon={<Users size={24} />} 
            label="Padose" 
          />
        </div>
      </nav>

      <AnimatePresence>
        {showProfile && (
          <Profile 
            user={user} 
            onUpdate={handleUpdateProfile} 
            onClose={() => setShowProfile(false)} 
          />
        )}
      </AnimatePresence>

      <RockyAI user={user} />
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-emerald-500' : 'text-zinc-500'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

