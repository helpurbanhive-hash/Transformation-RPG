import React, { useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, MapPin, Target, User } from "lucide-react";

export default function Onboarding({ onComplete }: { onComplete: (data: any) => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    diet_goal: "weight_loss",
    life_goal: "",
    city: "",
    pincode: "",
    lat: 0,
    lng: 0
  });

  const nextStep = () => setStep(s => s + 1);

  const handleComplete = () => {
    onComplete(formData);
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        // Mock city/pincode for demo
        setFormData(prev => ({ ...prev, city: "Mumbai", pincode: "400001" }));
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
          ))}
        </div>

        {step === 1 && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
            <h2 className="text-3xl font-black italic tracking-tighter">WHO ARE YOU?</h2>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Display Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Beast Rahul"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 pl-12 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <button 
              disabled={!formData.name}
              onClick={nextStep}
              className="w-full bg-emerald-500 disabled:opacity-50 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              NEXT <ChevronRight size={20} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
            <h2 className="text-3xl font-black italic tracking-tighter">WHAT'S THE GOAL?</h2>
            <div className="grid grid-cols-1 gap-3">
              {['weight_loss', 'muscle_gain', 'maintain'].map(goal => (
                <button
                  key={goal}
                  onClick={() => setFormData({ ...formData, diet_goal: goal })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.diet_goal === goal ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <p className="font-bold uppercase tracking-widest text-xs">{goal.replace('_', ' ')}</p>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Life Goal (Optional)</label>
              <textarea 
                value={formData.life_goal}
                onChange={e => setFormData({ ...formData, life_goal: e.target.value })}
                placeholder="e.g. Want to look sharp for my sister's wedding"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 h-24"
              />
            </div>
            <button 
              onClick={nextStep}
              className="w-full bg-emerald-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              NEXT <ChevronRight size={20} />
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
            <h2 className="text-3xl font-black italic tracking-tighter">WHERE ARE YOU?</h2>
            <p className="text-zinc-500 text-sm">We use this to find rivals in your area. Competition is the best motivation.</p>
            
            <button 
              onClick={detectLocation}
              className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-center gap-2 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <MapPin size={20} /> DETECT LOCATION
            </button>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">City</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Pincode</label>
                <input 
                  type="text" 
                  value={formData.pincode}
                  onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button 
              onClick={handleComplete}
              className="w-full bg-emerald-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              ENTER THE ARENA <Target size={20} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
