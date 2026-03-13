import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Sparkles, Loader2, Check, AlertCircle, RefreshCw, Trophy, ArrowRight, User, Maximize2, X } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { buildTransformationPrompt, UserGoalData, GOAL_DESCRIPTIONS } from "../utils/transformPromptBuilder";

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function FutureSelf({ user, onUpdate }: { user: any, onUpdate: (user: any) => void }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [afterImageUrl, setAfterImageUrl] = useState<string | null>(user.future_self_image_url || null);
  const [error, setError] = useState<string | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const [goals, setGoals] = useState<UserGoalData>({
    bodyGoal: 'weight_loss',
    currentWeight: 80,
    goalWeight: 70,
    timeline: '6 months',
    currentBodyType: 'average',
    specificNotes: '',
    gender: 'male'
  });

  const resizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resized = await resizeImage(reader.result as string);
        setUserPhoto(resized);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateFutureSelf = async () => {
    if (!userPhoto) {
      setError("Bhai, pehle apni photo toh upload kar!");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Use the default environment key for 2.5 models
      const apiKey = process.env.GEMINI_API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });
      const { mainPrompt } = buildTransformationPrompt(goals);

      // Extract base64 data
      const base64Data = userPhoto.split(',')[1];
      const mimeType = userPhoto.split(',')[0].split(':')[1].split(';')[0];

      const generateImage = async (prompt: string) => {
        return await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
              {
                text: prompt,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "3:4"
            }
          }
        });
      };

      let response = await generateImage(mainPrompt);
      let generatedUrl = null;

      const findImageUrl = (res: any) => {
        for (const part of res.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        return null;
      };

      generatedUrl = findImageUrl(response);

      // Retry once with a simpler prompt if it fails
      if (!generatedUrl) {
        console.log("Retrying with simplified prompt...");
        const simplePrompt = `Professional fitness transformation of the person in the image. Athletic physique, ${GOAL_DESCRIPTIONS[goals.bodyGoal]}, same face, high quality photography.`;
        response = await generateImage(simplePrompt);
        generatedUrl = findImageUrl(response);
      }

      if (generatedUrl) {
        setAfterImageUrl(generatedUrl);
        // Save to backend
        const res = await fetch("/api/users/future-self", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user.id,
            future_self_image_url: generatedUrl
          })
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Server error: ${res.status} - ${errorText.substring(0, 100)}`);
        }

        const data = await res.json();
        onUpdate(data.user);
      } else {
        // Check if there's text in the response (might be a safety refusal)
        const textPart = response.candidates?.[0]?.content?.parts.find(p => p.text)?.text;
        if (textPart) {
          throw new Error(`AI Refusal: ${textPart}`);
        }
        throw new Error("Bhai, AI ne image nahi di. Try a different photo or goal.");
      }

    } catch (err: any) {
      console.error("Future Self Error:", err);
      setError(err.message || "Generation failed. Try again!");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-emerald-500">FUTURE SELF</h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Visualize Your Transformation</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
          <Sparkles size={12} className="text-emerald-500" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">AI POWERED</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Inputs */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Upload Current Photo</span>
                <div className="relative group cursor-pointer">
                  <div className="w-full aspect-[3/4] bg-black border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center transition-all group-hover:border-emerald-500/50 overflow-hidden">
                    {userPhoto ? (
                      <img src={userPhoto} className="w-full h-full object-cover" alt="Current" />
                    ) : (
                      <>
                        <Camera size={40} className="text-zinc-700 mb-2 group-hover:text-emerald-500 transition-colors" />
                        <p className="text-[10px] font-black text-zinc-600 uppercase">Click to upload</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                </div>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Body Goal</label>
                  <select 
                    value={goals.bodyGoal}
                    onChange={e => setGoals({...goals, bodyGoal: e.target.value as any})}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="weight_loss">Weight Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="six_pack">Six Pack</option>
                    <option value="bodybuilder">Bodybuilder</option>
                    <option value="fit_active">Fit & Active</option>
                    <option value="bulk">Bulk</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Body Type</label>
                  <select 
                    value={goals.currentBodyType}
                    onChange={e => setGoals({...goals, currentBodyType: e.target.value as any})}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="slim">Slim</option>
                    <option value="average">Average</option>
                    <option value="overweight">Overweight</option>
                    <option value="obese">Obese</option>
                    <option value="athletic">Athletic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Current Weight (kg)</label>
                  <input 
                    type="number"
                    value={goals.currentWeight}
                    onChange={e => setGoals({...goals, currentWeight: +e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Goal Weight (kg)</label>
                  <input 
                    type="number"
                    value={goals.goalWeight}
                    onChange={e => setGoals({...goals, goalWeight: +e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Timeline</label>
                <input 
                  type="text"
                  placeholder="e.g. 6 months"
                  value={goals.timeline}
                  onChange={e => setGoals({...goals, timeline: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2 text-red-500">
                <AlertCircle size={14} />
                <p className="text-[10px] font-black uppercase">{error}</p>
              </div>
            )}

            <button 
              onClick={generateFutureSelf}
              disabled={isGenerating}
              className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  GENERATING MAGIC...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  SEE YOUR FUTURE SELF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Result */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              {afterImageUrl ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full space-y-6"
                >
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] group/img">
                    <img src={afterImageUrl} className="w-full h-full object-cover" alt="Future Self" />
                    <div className="absolute top-4 right-4 bg-emerald-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <Trophy size={10} />
                      GOAL ACHIEVED
                    </div>
                    <button 
                      onClick={() => setShowFullscreen(true)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-black uppercase text-[10px] tracking-widest"
                    >
                      <Maximize2 size={20} />
                      Full Screen
                    </button>
                  </div>
                  
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                    <p className="text-sm font-bold italic text-emerald-500 text-center">
                      "Bhai, yeh hai tera asli potential. Ab bas mehnat karni hai. Rukkna mat!"
                    </p>
                  </div>

                  <button 
                    onClick={() => setAfterImageUrl(null)}
                    className="w-full border border-zinc-800 text-zinc-500 font-black py-3 rounded-xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
                  >
                    <RefreshCw size={14} />
                    REGENERATE
                  </button>
                </motion.div>
              ) : isGenerating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-pulse" size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">AI is sculpting your</p>
                    <p className="text-lg font-black italic text-white uppercase tracking-tighter">Dream Physique</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto">
                    <User size={32} className="text-zinc-700" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Upload and generate to see</p>
                    <p className="text-lg font-black italic text-zinc-700 uppercase tracking-tighter">Your Future Self</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showFullscreen && afterImageUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10"
            onClick={() => setShowFullscreen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full aspect-[3/4] rounded-3xl overflow-hidden border-2 border-emerald-500/30 shadow-[0_0_100px_rgba(16,185,129,0.3)]"
              onClick={e => e.stopPropagation()}
            >
              <img src={afterImageUrl} className="w-full h-full object-contain bg-black" alt="Future Self Full" />
              <button 
                onClick={() => setShowFullscreen(false)}
                className="absolute top-6 right-6 w-12 h-12 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
              >
                <X size={24} />
              </button>
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div className="bg-emerald-500 text-black px-4 py-2 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2">
                  <Trophy size={14} />
                  YOUR FUTURE VERSION
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
