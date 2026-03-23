import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Utensils, Plus, Trash2, Zap, Flame, Sparkles, Loader2, Target, MapPin, Coffee, ShoppingBag, AlertCircle } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { ROCKY_BRO_SYSTEM_PROMPT } from "../constants/prompts";
import { INDIAN_FOOD_DATA, HINGLISH_TAUNTS, HINGLISH_MOTIVATION } from "../constants/foodData";

interface MealItem {
  id: string;
  name: string;
  quantity: string;
  calories: number;
  isJunk: boolean;
}

export default function DietLog({ user, onUpdate, onUpdateXP }: { user: any, onUpdate: (user: any) => void, onUpdateXP: (amount: number) => void }) {
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [newItem, setNewItem] = useState({ name: "", quantity: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [calorieGoal, setCalorieGoal] = useState(user?.daily_calorie_goal || 2000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    if (user?.daily_calorie_goal) {
      setCalorieGoal(user.daily_calorie_goal);
    }
  }, [user?.daily_calorie_goal]);

  if (!user) return null;

  const totalConsumed = meals.reduce((sum, m) => sum + m.calories, 0);
  const safeCalorieGoal = isNaN(calorieGoal) || calorieGoal <= 0 ? 2000 : calorieGoal;
  const remainingCalories = Math.max(0, safeCalorieGoal - totalConsumed);
  const progressPercent = Math.min(100, Math.floor((totalConsumed / safeCalorieGoal) * 100));

  const addMeal = () => {
    if (!newItem.name || !newItem.quantity) return;
    
    // Auto-detect calories and junk status from data
    const lowerName = newItem.name.toLowerCase();
    const foundFood = INDIAN_FOOD_DATA.find(f => 
      lowerName.includes(f.name.toLowerCase().split('(')[0].trim())
    );

    const junkKeywords = ["pizza", "burger", "samosa", "fries", "coke", "pepsi", "chips", "kurkure", "momos", "chowmein", "pasta", "cake", "pastry", "donut"];
    const isJunkKeyword = junkKeywords.some(k => lowerName.includes(k));

    const item: MealItem = {
      id: Math.random().toString(36).substring(7),
      name: newItem.name,
      quantity: newItem.quantity,
      calories: foundFood ? foundFood.calories : Math.floor(Math.random() * 500) + 100,
      isJunk: foundFood ? foundFood.isJunk : isJunkKeyword
    };
    setMeals([...meals, item]);
    setNewItem({ name: "", quantity: "" });
  };

  const removeMeal = (id: string) => {
    setMeals(meals.filter(m => m.id !== id));
  };

  const updateCalorieGoal = async () => {
    try {
      const res = await fetch("/api/users/calorie-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, daily_calorie_goal: calorieGoal })
      });
      const data = await res.json();
      if (data.user) {
        onUpdate(data.user);
        setIsEditingGoal(false);
      }
    } catch (e) {
      console.error("Error updating calorie goal:", e);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const prompt = `
        User Location: ${user.city || 'India'}
        Remaining Calories for today: ${remainingCalories}
        Diet Goal: ${user.diet_goal || 'General Fitness'}
        
        Suggest 3-4 best, healthy, and highly AFFORDABLE food and drink items that are EASILY available in ${user.city || 'local Indian markets'}.
        Focus on items like: Coconut water, Sprouts, Eggs, Paneer, Chana, Buttermilk, etc.
        
        Return JSON format: 
        {
          "recommendations": [
            { "name": "...", "calories": number, "price_range": "Cheap/Affordable", "why": "...", "type": "food" | "drink" }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          systemInstruction: ROCKY_BRO_SYSTEM_PROMPT,
          responseMimeType: "application/json" 
        }
      });

      const data = JSON.parse(response.text || "{}");
      setRecommendations(data.recommendations || []);
    } catch (e) {
      console.error("Error fetching recommendations:", e);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleSubmit = async () => {
    if (meals.length === 0) return;
    setLoading(true);
    
    try {
      // AI-powered Guilt Engine
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const prompt = `
        Analyze the following meals: ${JSON.stringify(meals)}.
        Total calories: ${totalConsumed}.
        Diet goal: ${user.diet_goal || 'General Fitness'}.

        Act as "Rocky Bro", a tough but motivating fitness coach who uses Hinglish (Hindi + English).
        Give me a guilt score (0-100) and a short, punchy feedback message (fomo_message).
        If the user ate junk food, be harsh but motivating. If they ate healthy, be encouraging.

        Return JSON:
        {
          "guilt_score": number,
          "fomo_message": string
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          systemInstruction: ROCKY_BRO_SYSTEM_PROMPT,
          responseMimeType: "application/json" 
        }
      });

      const aiFeedback = JSON.parse(response.text || '{"guilt_score": 50, "fomo_message": "Keep going!"}');

      const responseBackend = await fetch("/api/diet/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          log_date: new Date().toISOString().split('T')[0],
          meals: meals,
          total_calories: totalConsumed,
          guilt_score: aiFeedback.guilt_score,
          fomo_message: aiFeedback.fomo_message
        })
      });
      
      const data = await responseBackend.json();
      setResult(data);
      onUpdateXP(Math.max(0, 100 - data.guilt_score));
      setMeals([]);
    } catch (error) {
      console.error("Diet Log Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-emerald-500">DIET LOG</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">What did you eat today, Warrior?</p>
        </div>
        <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
          <Utensils className="text-emerald-500" size={24} />
        </div>
      </div>

      {/* Calorie Goal Card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="text-emerald-500" size={18} />
            <h3 className="font-black italic text-lg uppercase">CALORIE GOAL</h3>
          </div>
          {isEditingGoal ? (
            <button onClick={updateCalorieGoal} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Save</button>
          ) : (
            <button onClick={() => setIsEditingGoal(true)} className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Edit</button>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            {isEditingGoal ? (
              <input 
                type="number" 
                value={isNaN(calorieGoal) ? "" : calorieGoal}
                onChange={e => setCalorieGoal(parseInt(e.target.value) || 0)}
                className="bg-black border border-emerald-500/50 rounded-xl p-2 text-2xl font-black italic w-32 focus:outline-none"
              />
            ) : (
              <p className="text-4xl font-black italic tracking-tighter text-white">{calorieGoal || 0} <span className="text-xs text-zinc-500 uppercase not-italic tracking-widest">KCAL</span></p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Consumed</p>
            <p className="text-xl font-black italic text-emerald-500">{totalConsumed} KCAL</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700 p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className={`h-full rounded-full ${totalConsumed > safeCalorieGoal ? 'bg-red-500' : 'bg-emerald-500'}`}
            />
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-500" size={18} />
            <h3 className="font-black italic text-lg uppercase">AI SUGGESTIONS</h3>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            <MapPin size={12} /> {user.city || 'Local'}
          </div>
        </div>

        {recommendations.length === 0 && !loadingRecs ? (
          <div className="text-center py-4">
            <p className="text-zinc-500 text-xs font-bold mb-4">Need help completing your {remainingCalories} kcal goal?</p>
            <button 
              onClick={fetchRecommendations}
              className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500/20 transition-all"
            >
              Get Local Suggestions
            </button>
          </div>
        ) : loadingRecs ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="text-yellow-500 animate-spin" size={24} />
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Searching local markets...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="bg-black/40 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
                <div className={`p-3 rounded-xl ${rec.type === 'drink' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  {rec.type === 'drink' ? <Coffee size={20} /> : <ShoppingBag size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-white uppercase tracking-tight text-sm">{rec.name}</h4>
                    <span className="text-[8px] font-black bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase">{rec.price_range}</span>
                  </div>
                  <p className="text-zinc-500 text-[10px] font-bold mb-1">{rec.calories} KCAL • {rec.why}</p>
                </div>
              </div>
            ))}
            <button 
              onClick={fetchRecommendations}
              className="text-center text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-2 hover:text-zinc-400"
            >
              Refresh Suggestions
            </button>
          </div>
        )}
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Food Item</label>
            <input 
              type="text"
              placeholder="e.g. Paneer Tikka"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Quantity</label>
            <input 
              type="text"
              placeholder="e.g. 200g / 2 plates"
              value={newItem.quantity}
              onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
              className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <button 
          onClick={addMeal}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <Plus size={20} /> ADD TO LIST
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {meals.map((meal) => (
            <motion.div 
              key={meal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`bg-zinc-900 border p-4 rounded-2xl flex items-center justify-between transition-colors ${meal.isJunk ? 'border-red-500/30 bg-red-500/5' : 'border-zinc-800'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meal.isJunk ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                  {meal.isJunk ? <AlertCircle size={20} /> : <Utensils size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-white uppercase tracking-tight">{meal.name}</h4>
                    {meal.isJunk && (
                      <span className="bg-red-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">
                        JUNK
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-xs font-bold">{meal.quantity} • ~{meal.calories} kcal</p>
                </div>
              </div>
              <button 
                onClick={() => removeMeal(meal.id)}
                className="text-zinc-600 hover:text-red-500 transition-colors p-2"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {meals.length > 0 && (
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-emerald-500 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <>ANALYZE DIET <Sparkles size={20} /></>}
        </button>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-zinc-900 border-2 rounded-3xl p-6 space-y-4 shadow-2xl ${result.guilt_score > 70 ? 'border-red-500/50 shadow-red-500/10' : 'border-emerald-500/30'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-black italic text-xl uppercase">
                {result.guilt_score > 70 ? 'ROCKY BRO IS ANGRY' : 'AI ANALYSIS'}
              </h3>
              {result.guilt_score > 70 && <AlertCircle className="text-red-500 animate-bounce" size={20} />}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-zinc-500 uppercase">Guilt Score:</span>
              <span className={`text-xl font-black ${result.guilt_score > 70 ? 'text-red-500' : result.guilt_score > 40 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                {result.guilt_score}
              </span>
            </div>
          </div>
          <div className={`p-4 rounded-2xl ${result.guilt_score > 70 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            <p className="font-black italic leading-relaxed text-lg">
              "{result.fomo_message}"
            </p>
          </div>
          <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase mb-1">
                <span>Daily Calorie Impact</span>
                <span>{result.total_calories} kcal</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
