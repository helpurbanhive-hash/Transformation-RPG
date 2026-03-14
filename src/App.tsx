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
  Brain,
  Sparkles, 
  User as UserIcon, 
  Star,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "./config/supabase";

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
import LevelUpModal from "./components/LevelUpModal";
import XPToast from "./components/XPToast";
import { getLevelProgress } from "./services/progressionService";

import { ACHIEVEMENTS } from "./constants/achievements";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const [xpGained, setXpGained] = useState<number | null>(null);

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Try to fetch from backend (which uses SQLite for now)
      // In a real Supabase app, you'd fetch from Supabase 'users' table
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();
      
      if (data.user) {
        setUser(data.user);
        checkDailyLogin(data.user);
      } else {
        // If user doesn't exist in DB yet, create a skeleton
        // This will trigger Onboarding
        setUser({ id: userId, name: "New User", current_level: 1, transformation_score: 0, current_streak: 0 });
      }
    } catch (err) {
      console.error("Profile Fetch Error:", err);
      // Fallback for demo
      setUser({ id: userId, name: "New User", current_level: 1, transformation_score: 0, current_streak: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (profileData: any) => {
    setLoading(true);
    
    // Try to get ID from multiple sources
    let userId = profileData.id || session?.user?.id || user?.id;
    
    // If still no ID, try to fetch session directly from Supabase (race condition fallback)
    if (!userId) {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id;
    }
    
    if (!userId) {
      console.error("No User ID found for profile update");
      setLoading(false);
      return;
    }

    fetch("/api/users/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profileData, id: userId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        setUser(data.user);
        checkAchievements(data.user);
      }
    })
    .catch(err => console.error("Update Profile Error:", err))
    .finally(() => setLoading(false));
  };

  const checkDailyLogin = (userData: any) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = today.toISOString().split('T')[0];
    
    if (userData.last_active_date === todayStr) return;

    let newStreak = 1;
    if (userData.last_active_date) {
      const lastActiveDate = new Date(userData.last_active_date);
      const lastActive = new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate());
      
      const diffTime = today.getTime() - lastActive.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak = (userData.current_streak || 0) + 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    handleUpdateXP(50); // Daily login bonus
    
    // Update last active date and streak in backend
    fetch("/api/users/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id: userData.id, 
        last_active_date: todayStr,
        current_streak: newStreak
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) setUser(data.user);
    });
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
      setXpGained(gained);
      
      if (newLevel > (user.current_level || 1)) {
        setShowLevelUp(newLevel);
      }
      
      // Check for achievements
      checkAchievements(updatedUser);

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

      console.log(`Gained ${gained} XP!`);
    });
  };

  const checkAchievements = (userData: any) => {
    if (!userData) return;
    
    const currentBadges = JSON.parse(userData.badges || "[]");
    const newBadges = [...currentBadges];
    let changed = false;

    ACHIEVEMENTS.forEach(achievement => {
      if (!newBadges.includes(achievement.id) && achievement.condition(userData)) {
        newBadges.push(achievement.id);
        changed = true;
      }
    });

    if (changed) {
      const updatedBadges = JSON.stringify(newBadges);
      setUser({ ...userData, badges: updatedBadges });
      fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: userData.id, 
          badges: updatedBadges
        })
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="text-emerald-500"
          >
            <Zap size={40} fill="currentColor" />
          </motion.div>
          <p className="text-emerald-500 font-black italic tracking-widest text-xs animate-pulse uppercase">
            Initializing Transform RPG...
          </p>
        </div>
      </div>
    );
  }

  // 1. If user is loaded and complete, show the app (Priority)
  if (user && user.name && user.name !== "New User") {
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
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Streak</p>
                <div className="flex items-center gap-1 justify-end">
                  <Flame size={12} className="text-orange-500 fill-orange-500" />
                  <p className="font-mono text-orange-500 font-bold leading-none">{user.current_streak || 0}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Score</p>
                <p className="font-mono text-emerald-500 font-bold leading-none">{user.transformation_score}</p>
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

        <AnimatePresence>
          {showLevelUp && (
            <LevelUpModal 
              level={showLevelUp} 
              onClose={() => setShowLevelUp(null)} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {xpGained !== null && (
            <XPToast 
              amount={xpGained} 
              onClose={() => setXpGained(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 2. If no session and no user, show Onboarding
  if (!session && !user) {
    return <Onboarding onComplete={handleUpdateProfile} />;
  }

  // 3. If session exists but user profile is not loaded yet
  if (session && !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-emerald-500 animate-spin" size={40} />
          <p className="text-emerald-500 font-black italic tracking-widest text-xs uppercase">
            Loading Profile...
          </p>
        </div>
      </div>
    );
  }

  // 4. If user exists but profile is incomplete
  if (user && (!user.name || user.name === "New User")) {
    return <Onboarding onComplete={handleUpdateProfile} />;
  }

  // Fallback
  return <Onboarding onComplete={handleUpdateProfile} />;
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

