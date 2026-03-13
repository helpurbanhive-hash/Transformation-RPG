import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Utensils, Plus, Trash2, Send, AlertTriangle, CheckCircle, Search, Info } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import Fuse from "fuse.js";
import { INDIAN_FOOD_DATA, HINGLISH_TAUNTS, FoodItem } from "../constants/foodData";
import { ROCKY_BRO_SYSTEM_PROMPT } from "../constants/prompts";
import { XP_VALUES } from "../services/progressionService";

export default function DietLog({ user, onUpdate, onUpdateXP }: { user: any, onUpdate: (user: any) => void, onUpdateXP: (amount: number) => void }) {
  const [meals, setMeals] = useState<any[]>([]);
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [isJunk, setIsJunk] = useState(false);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [activeTaunt, setActiveTaunt] = useState("");
  const [calorieGoal, setCalorieGoal] = useState(user.daily_calorie_goal || 2000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(user.daily_calorie_goal || 2000);

  const fuse = new Fuse(INDIAN_FOOD_DATA, {
    keys: ["name"],
    threshold: 0.4,
  });

  useEffect(() => {
    const junkMeals = meals.filter(m => m.isJunk);
    if (junkMeals.length > 0) {
      const lastJunk = junkMeals[junkMeals.length - 1];
      const taunts = [
        `Oho! ${lastJunk.name} pel diya? Kal extra cardio karna padega!`,
        `Bhai, ${lastJunk.name} khane se muscles nahi bante, sirf pet nikalta hai.`,
        `Aaj toh tune ${lastJunk.name} kha ke calories ki baarish kar di. Sharam kar!`,
        `Tera rival has raha hoga ki tu ${lastJunk.name} kha raha hai.`,
        `Bhai, ${lastJunk.name} tujhe kamzor bana raha hai. Jaag ja!`,
        `Ek aur junk item? ${lastJunk.name} kha ke transformation bhool ja.`,
      ];
      setActiveTaunt(taunts[Math.floor(Math.random() * taunts.length)]);
    } else {
      setActiveTaunt("");
    }
  }, [meals]);

  useEffect(() => {
    if (mealName.length > 1) {
      const results = fuse.search(mealName).map(r => r.item).slice(0, 5);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  }, [mealName]);

  const selectSuggestion = (food: FoodItem) => {
    setMealName(food.name);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFat(food.fat.toString());
    setIsJunk(food.isJunk);
    setSuggestions([]);
  };

  const addMeal = () => {
    if (!mealName || !calories) return;
    setMeals([...meals, { 
      name: mealName, 
      calories: parseInt(calories),
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      isJunk
    }]);
    setMealName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setIsJunk(false);
    
    // Award XP for logging a meal
    onUpdateXP(XP_VALUES.DIET_LOG_MEAL);
    if (!isJunk) {
      onUpdateXP(XP_VALUES.DIET_HEALTHY_BONUS);
    } else {
      onUpdateXP(XP_VALUES.DIET_JUNK_PENALTY);
    }
  };

  const removeMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index));
  };

  const submitLog = async () => {
    setLoading(true);
    const total_calories = meals.reduce((sum, m) => sum + m.calories, 0);
    const total_protein = meals.reduce((sum, m) => sum + m.protein, 0);
    const total_carbs = meals.reduce((sum, m) => sum + m.carbs, 0);
    const total_fat = meals.reduce((sum, m) => sum + m.fat, 0);
    const junk_count = meals.filter(m => m.isJunk).length;
    
    let fomo_message = "Keep going!";
    let guilt_score = 0;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Night";
      
      const prompt = `
        User Profile:
        - Name: ${user.name}
        - Goal: ${user.diet_goal} (weight_loss, muscle_gain, or maintain)
        - Current Level: ${user.current_level}
        - Time of Day: ${timeOfDay}
        
        Today's Intake:
        - Meals: ${JSON.stringify(meals.map(m => ({ name: m.name, cal: m.calories, junk: m.isJunk })))}
        - Total Calories: ${total_calories}
        - Junk Items Count: ${junk_count}
        
        Task:
        Generate a highly aggressive, funny, and context-aware Hinglish "guilt" message (FOMO style).
        The message MUST:
        1. Mention specific foods the user ate (especially the junk ones).
        2. Use "Desi" psychology - tell them their rivals are getting ahead while they eat junk.
        3. Be biting and sarcastic if they ate junk or exceeded calories.
        4. Be encouraging but firm if they did well.
        5. Use Hinglish (Hindi + English).
        6. Incorporate the Time of Day (e.g., "Raat ko itna heavy?" or "Subah subah kachori?").
        
        Example for bad day: "Bhai ${user.name}, ${timeOfDay === 'Morning' ? 'Subah subah' : 'Raat ko'} tune aaj ${meals[0]?.name} kha liya? Tera rival Level ${user.current_level + 1} pe pahunch gaya aur tu yahan tel pel raha hai. Sharam kar!"
        
        Return JSON format: { "message": "...", "score": 0-100 }
        Score 0 is perfect, 100 is total disaster.
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
      fomo_message = result.message || fomo_message;
      guilt_score = result.score || guilt_score;

      const res = await fetch("/api/diet/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          log_date: new Date().toISOString().split('T')[0],
          meals,
          total_calories,
          guilt_score,
          fomo_message
        })
      });
      const data = await res.json();
      setReport(data);
      onUpdate(data.user);
      onUpdateXP(XP_VALUES.DIET_FULL_DAY);
    } catch (e) {
      console.error("AI/API Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const updateCalorieGoal = async () => {
    try {
      const res = await fetch("/api/users/calorie-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, daily_calorie_goal: tempGoal })
      });
      const data = await res.json();
      setCalorieGoal(data.user.daily_calorie_goal);
      setIsEditingGoal(false);
      onUpdate(data.user);
    } catch (e) {
      console.error("Error updating calorie goal:", e);
    }
  };

  const totalConsumed = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);
  const totalMacroGrams = totalProtein + totalCarbs + totalFat;

  const progressPercent = Math.min(100, (totalConsumed / calorieGoal) * 100);

  const hasJunk = meals.some(m => m.isJunk);

  if (report) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="space-y-6"
      >
        <div className={`p-8 rounded-3xl border-2 ${report.guilt_score > 50 ? 'bg-red-900/20 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]'}`}>
          <div className="flex justify-center mb-6">
            {report.guilt_score > 50 ? (
              <AlertTriangle size={64} className="text-red-500 animate-bounce" />
            ) : (
              <CheckCircle size={64} className="text-emerald-500 animate-pulse" />
            )}
          </div>
          
          <h2 className="text-4xl font-black italic tracking-tighter text-center mb-2 uppercase">
            {report.guilt_score > 50 ? 'SHARAM KARO!' : 'SHABASH!'}
          </h2>
          <p className="text-center text-zinc-400 font-bold uppercase tracking-widest text-xs mb-6">GUILT SCORE: {report.guilt_score}</p>
          
          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-8">
            <p className="text-lg font-bold italic text-center leading-tight text-white">
              "{report.fomo_message}"
            </p>
          </div>

          <button 
            onClick={() => setReport(null)}
            className="w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors"
          >
            BACK TO ARENA
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-emerald-500">KHAANA KHAZANA</h2>
        <div className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* Calorie Goal Progress */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Daily Calorie Goal</h3>
            <div className="flex items-center gap-2">
              {isEditingGoal ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={tempGoal}
                    onChange={e => setTempGoal(parseInt(e.target.value) || 0)}
                    className="w-24 bg-black border border-zinc-700 rounded-lg p-1 text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button 
                    onClick={updateCalorieGoal}
                    className="bg-emerald-500 text-black text-[10px] font-black px-2 py-1 rounded-md uppercase"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => { setIsEditingGoal(false); setTempGoal(calorieGoal); }}
                    className="text-zinc-500 text-[10px] font-black uppercase"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-2xl font-black italic text-white">{calorieGoal}</span>
                  <span className="text-zinc-500 text-[10px] font-black uppercase">KCAL</span>
                  <button 
                    onClick={() => setIsEditingGoal(true)}
                    className="ml-2 text-emerald-500 text-[10px] font-black uppercase hover:underline"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Consumed</p>
            <p className="text-2xl font-black italic text-emerald-500">{totalConsumed} <span className="text-[10px] text-zinc-500 uppercase">KCAL</span></p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700 p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className={`h-full rounded-full transition-colors duration-500 ${
                progressPercent > 100 ? 'bg-red-500' : 
                progressPercent > 85 ? 'bg-yellow-500' : 'bg-emerald-500'
              }`}
              style={{ boxShadow: progressPercent > 100 ? '0 0 10px rgba(239,68,68,0.5)' : '0 0 10px rgba(16,185,129,0.5)' }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className={progressPercent > 100 ? 'text-red-500' : 'text-zinc-500'}>
              {progressPercent > 100 ? 'OVER LIMIT!' : `${Math.floor(progressPercent)}% of goal`}
            </span>
            <span className="text-zinc-500">{calorieGoal - totalConsumed > 0 ? `${calorieGoal - totalConsumed} left` : '0 left'}</span>
          </div>
        </div>
      </div>

      {hasJunk && activeTaunt && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center gap-3"
        >
          <AlertTriangle size={20} className="text-red-500 shrink-0" />
          <p className="text-xs font-bold text-red-500 italic">
            "{activeTaunt}"
          </p>
        </motion.div>
      )}

      {/* Add Meal Form */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text" 
            placeholder="Search Desi Food (e.g. Samosa, Dal Tadka)"
            value={mealName}
            onChange={e => setMealName(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          
          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-50 shadow-2xl"
              >
                {suggestions.map((food, i) => (
                  <button 
                    key={i}
                    onClick={() => selectSuggestion(food)}
                    className="w-full p-3 text-left hover:bg-zinc-800 flex items-center justify-between border-b border-zinc-800 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-bold">{food.name}</p>
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{food.calories} KCAL</p>
                    </div>
                    {food.isJunk && <span className="text-[8px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-black uppercase">Junk</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest text-center block">Calories</label>
            <input 
              type="number" 
              value={calories}
              onChange={e => setCalories(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-center focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest text-center block">Protein</label>
            <input 
              type="number" 
              value={protein}
              onChange={e => setProtein(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-center focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest text-center block">Carbs</label>
            <input 
              type="number" 
              value={carbs}
              onChange={e => setCarbs(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-center focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest text-center block">Fat</label>
            <input 
              type="number" 
              value={fat}
              onChange={e => setFat(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-center focus:border-emerald-500"
            />
          </div>
        </div>

        <button 
          onClick={addMeal}
          className="w-full bg-emerald-500 text-black font-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all transform active:scale-95"
        >
          <Plus size={16} /> ADD TO THALI
        </button>
      </div>

      {/* Meal List */}
      <div className="space-y-3">
        <AnimatePresence>
          {meals.map((meal, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex items-center justify-between p-4 bg-zinc-900/30 border rounded-xl ${meal.isJunk ? 'border-red-500/30' : 'border-zinc-800'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meal.isJunk ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                  <Utensils size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{meal.name}</p>
                    {meal.isJunk && <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Junk</span>}
                  </div>
                  <div className="flex gap-2 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                    <span>{meal.calories} Cal</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>F: {meal.fat}g</span>
                  </div>
                </div>
              </div>
              <button onClick={() => removeMeal(i)} className="text-zinc-600 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {meals.length > 0 && (
        <div className="space-y-4">
          {/* Macro Breakdown Chart */}
          <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Macro Split</h3>
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-black text-zinc-400 uppercase">Protein</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[8px] font-black text-zinc-400 uppercase">Carbs</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-[8px] font-black text-zinc-400 uppercase">Fat</span>
                </div>
              </div>
            </div>

            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden flex">
              {totalMacroGrams > 0 ? (
                <>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(totalProtein / totalMacroGrams) * 100}%` }}
                    className="h-full bg-emerald-500"
                  />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(totalCarbs / totalMacroGrams) * 100}%` }}
                    className="h-full bg-blue-500"
                  />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(totalFat / totalMacroGrams) * 100}%` }}
                    className="h-full bg-yellow-500"
                  />
                </>
              ) : (
                <div className="w-full h-full bg-zinc-800" />
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[10px] font-black text-emerald-500 uppercase">{totalProtein}g</p>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Protein</p>
              </div>
              <div className="text-center border-x border-zinc-800">
                <p className="text-[10px] font-black text-blue-500 uppercase">{totalCarbs}g</p>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Carbs</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-yellow-500 uppercase">{totalFat}g</p>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Fat</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Intake</span>
              <span className="text-sm font-black text-emerald-500">{meals.reduce((sum, m) => sum + m.calories, 0)} KCAL</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-black/50 p-2 rounded-lg">
                <p className="text-[8px] text-zinc-500 font-black uppercase">Protein</p>
                <p className="text-xs font-bold">{meals.reduce((sum, m) => sum + m.protein, 0)}g</p>
              </div>
              <div className="bg-black/50 p-2 rounded-lg">
                <p className="text-[8px] text-zinc-500 font-black uppercase">Carbs</p>
                <p className="text-xs font-bold">{meals.reduce((sum, m) => sum + m.carbs, 0)}g</p>
              </div>
              <div className="bg-black/50 p-2 rounded-lg">
                <p className="text-[8px] text-zinc-500 font-black uppercase">Fat</p>
                <p className="text-xs font-bold">{meals.reduce((sum, m) => sum + m.fat, 0)}g</p>
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            onClick={submitLog}
            className="w-full bg-emerald-500 disabled:opacity-50 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform active:scale-95"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Info size={20} /></motion.div>
                CALCULATING DESI GUILT...
              </div>
            ) : 'SUBMIT THALI'} <Send size={20} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

