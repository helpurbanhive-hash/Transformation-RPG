import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, MapPin, Target, User, Phone, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "../config/supabase";

export default function Onboarding({ onComplete }: { onComplete: (data: any) => void }) {
  const [step, setStep] = useState(0); // Start at 0 for Auth
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    diet_goal: "weight_loss",
    life_goal: "",
    city: "",
    pincode: "",
    lat: 0,
    lng: 0,
    phone: ""
  });

  const nextStep = () => {
    setError(null);
    setStep(s => s + 1);
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      console.log("Sending OTP to:", formattedPhone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        console.error("Supabase Auth Error:", error);
        throw error;
      }
      
      setFormData(prev => ({ ...prev, phone: formattedPhone }));
      setStep(0.5); // OTP step
    } catch (err: any) {
      console.error("OTP Send Error:", err);
      setError(err.message || "Failed to send OTP. Ensure SMS provider is enabled in Supabase.");
      
      // If it fails, we still show the error but allow demo bypass if they are stuck
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formData.phone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        // Specifically handle invalid OTP error message as requested
        throw new Error("Invalid OTP. Please try again.");
      }
      
      if (data.session) {
        console.log("OTP Verified! Session created.");
        nextStep(); // Move to Step 1 (Name)
      } else {
        throw new Error("Verification successful but no session created.");
      }
    } catch (err: any) {
      console.error("OTP Verify Error:", err);
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md">
        <div className="flex gap-2 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-xs font-bold">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="step0"
              initial={{ x: 20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-black italic tracking-tighter text-emerald-500">TRANSFORM RPG</h2>
                <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">Enter your mobile to begin</p>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                  <div className="absolute left-12 top-1/2 -translate-y-1/2 text-zinc-400 font-bold border-r border-zinc-800 pr-3">+91</div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 pl-24 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button 
                disabled={phone.length < 10 || loading}
                onClick={handleSendOTP}
                className="w-full bg-emerald-500 disabled:opacity-50 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>SEND OTP <ChevronRight size={20} /></>}
              </button>

              <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">
                By continuing, you agree to the Warrior Code & Privacy Policy
              </p>

              {/* Demo Bypass for development if keys aren't set */}
              {!import.meta.env.VITE_SUPABASE_URL && (
                <button 
                  onClick={() => setStep(1)}
                  className="w-full text-zinc-700 text-[10px] font-black uppercase tracking-widest hover:text-zinc-500 transition-colors"
                >
                  Demo Mode (Skip Auth)
                </button>
              )}
            </motion.div>
          )}

          {step === 0.5 && (
            <motion.div 
              key="step0.5"
              initial={{ x: 20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic tracking-tighter">VERIFY CODE</h2>
                <p className="text-zinc-500 font-bold text-sm">Sent to {formData.phone}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">6-Digit OTP</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                  <input 
                    type="text" 
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 pl-12 text-white font-mono text-2xl tracking-[0.5em] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button 
                disabled={otp.length < 6 || loading}
                onClick={handleVerifyOTP}
                className="w-full bg-emerald-500 disabled:opacity-50 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.2)]"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>VERIFY & ENTER <Target size={20} /></>}
              </button>

              <button 
                onClick={() => setStep(0)}
                className="w-full text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Change Number
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ x: 20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-black italic tracking-tighter">WHO ARE YOU?</h2>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Beast Rahul"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 pl-12 text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <button 
                disabled={!formData.name}
                onClick={nextStep}
                className="w-full bg-emerald-500 disabled:opacity-50 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.2)]"
              >
                NEXT <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ x: 20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-black italic tracking-tighter">WHAT'S THE GOAL?</h2>
              <div className="grid grid-cols-1 gap-3">
                {['weight_loss', 'muscle_gain', 'maintain'].map(goal => (
                  <button
                    key={goal}
                    onClick={() => setFormData({ ...formData, diet_goal: goal })}
                    className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      formData.diet_goal === goal ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <p className="font-black uppercase tracking-widest text-[10px]">{goal.replace('_', ' ')}</p>
                    {formData.diet_goal === goal && (
                      <motion.div layoutId="goal-active" className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Target size={16} />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Life Goal (Optional)</label>
                <textarea 
                  value={formData.life_goal}
                  onChange={e => setFormData({ ...formData, life_goal: e.target.value })}
                  placeholder="e.g. Want to look sharp for my sister's wedding"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-emerald-500 h-32 resize-none"
                />
              </div>
              <button 
                onClick={nextStep}
                className="w-full bg-emerald-500 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.2)]"
              >
                NEXT <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ x: 20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-black italic tracking-tighter">WHERE ARE YOU?</h2>
              <p className="text-zinc-500 font-bold text-sm">We use this to find rivals in your area. Competition is the best motivation.</p>
              
              <button 
                onClick={detectLocation}
                className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-center gap-3 text-zinc-300 hover:bg-zinc-800 transition-all font-black uppercase tracking-widest text-[10px]"
              >
                <MapPin size={20} className="text-emerald-500" /> DETECT LOCATION
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">City</label>
                  <input 
                    type="text" 
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Pincode</label>
                  <input 
                    type="text" 
                    value={formData.pincode}
                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button 
                onClick={handleComplete}
                className="w-full bg-emerald-500 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:bg-emerald-400 transition-all"
              >
                ENTER THE ARENA <Target size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
