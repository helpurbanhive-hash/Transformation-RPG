import React, { useState } from "react";
import { motion } from "motion/react";
import { User, Camera, Save, X, MapPin, Target, Flame, Trophy, Zap, Star, Heart } from "lucide-react";
import { ACHIEVEMENTS } from "../constants/achievements";

export default function Profile({ user, onUpdate, onClose }: { user: any, onUpdate: (data: any) => void, onClose: () => void }) {
  const earnedBadgeIds = JSON.parse(user.badges || "[]");
  const earnedBadges = ACHIEVEMENTS.filter(a => earnedBadgeIds.includes(a.id));

  const [formData, setFormData] = useState({
    name: user.name || "",
    diet_goal: user.diet_goal || "weight_loss",
    life_goal: user.life_goal || "",
    city: user.city || "",
    pincode: user.pincode || "",
    body_image_url: user.body_image_url || null
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, body_image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onUpdate(formData);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col p-6 overflow-y-auto"
    >
      <div className="max-w-md mx-auto w-full space-y-8 pb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-emerald-500">WARRIOR PROFILE</h2>
          <button onClick={onClose} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-zinc-900 border-2 border-zinc-800 overflow-hidden relative">
              {formData.body_image_url ? (
                <img src={formData.body_image_url} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-700">
                  <User size={64} />
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={24} className="text-white mb-1" />
                <span className="text-[10px] font-black uppercase text-white">Change</span>
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black w-10 h-10 rounded-xl flex items-center justify-center font-black border-4 border-black">
              {user.current_level}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black italic text-white uppercase tracking-tight">{user.name}</h3>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Member since {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-center">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Score</p>
            <p className="text-xl font-black text-emerald-500">{user.transformation_score}</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-center flex flex-col items-center justify-center">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Current Streak</p>
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-orange-500" />
              <p className="text-xl font-black text-white">{user.current_streak}</p>
            </div>
          </div>
        </div>
        
        {/* Badges Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Earned Badges</h4>
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {earnedBadges.map(badge => (
                <div key={badge.id} className="bg-zinc-900 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                    {badge.icon === "Flame" && <Flame size={20} />}
                    {badge.icon === "Zap" && <Zap size={20} />}
                    {badge.icon === "Star" && <Star size={20} />}
                    {badge.icon === "Trophy" && <Trophy size={20} />}
                    {badge.icon === "Target" && <Target size={20} />}
                    {badge.icon === "Heart" && <Heart size={20} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase leading-none mb-1">{badge.title}</p>
                    <p className="text-[8px] text-zinc-500 uppercase leading-tight">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900/30 border border-dashed border-zinc-800 p-8 rounded-2xl text-center">
              <Trophy size={32} className="text-zinc-800 mx-auto mb-2" />
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No badges earned yet. Keep training!</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Basic Info</h4>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Warrior Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Enter your name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">City</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Pincode</label>
                <input 
                  type="text" 
                  value={formData.pincode}
                  onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Transformation Goals</h4>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Current Focus</label>
              <select 
                value={formData.diet_goal}
                onChange={e => setFormData({ ...formData, diet_goal: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
              >
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="maintain">Maintain</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Life Goal</label>
              <textarea 
                value={formData.life_goal}
                onChange={e => setFormData({ ...formData, life_goal: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors h-24 resize-none"
                placeholder="What drives you?"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-2xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all transform active:scale-95"
        >
          <Save size={20} /> SAVE CHANGES
        </button>
      </div>
    </motion.div>
  );
}
