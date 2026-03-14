import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Utensils, Plus, Trash2, Zap, Flame, Sparkles, Loader2 } from "lucide-react";

interface MealItem {
  id: string;
  name: string;
  quantity: string;
  calories: number;
}

export default function DietLog({ user, onUpdateXP }: { user: any, onUpdateXP: (amount: number) => void }) {
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [newItem, setNewItem] = useState({ name: "", quantity: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const addMeal = () => {
    if (!newItem.name || !newItem.quantity) return;
    const item: MealItem = {
      id: Math.random().toString(36).substring(7),
      name: newItem.name,
      quantity: newItem.quantity,
      calories: Math.floor(Math.random() * 500) + 100 // Mock calorie estimation
    };
    setMeals([...meals, item]);
    setNewItem({ name: "", quantity: "" });
  };

  const removeMeal = (id: string) => {
    setMeals(meals.filter(m => m.id !== id));
  };

  const handleSubmit = async () => {
    if (meals.length === 0) return;
    setLoading(true);
    
    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
    
    try {
      const response = await fetch("/api/diet/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          log_date: new Date().toISOString().split('T')[0],
          meals: meals,
          total_calories: totalCalories,
          guilt_score: Math.floor(Math.random() * 100), // AI would calculate this
          fomo_message: "Bhai, itna khayega toh transformation kab hogi? Control kar!"
        })
      });
      
      const data = await response.json();
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
              className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between"
            >
              <div>
                <h4 className="font-black text-white uppercase tracking-tight">{meal.name}</h4>
                <p className="text-zinc-500 text-xs font-bold">{meal.quantity} • ~{meal.calories} kcal</p>
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
          className="bg-zinc-900 border-2 border-emerald-500/30 rounded-3xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-black italic text-xl">AI ANALYSIS</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-zinc-500 uppercase">Guilt Score:</span>
              <span className={`text-xl font-black ${result.guilt_score > 70 ? 'text-red-500' : result.guilt_score > 40 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                {result.guilt_score}
              </span>
            </div>
          </div>
          <p className="text-zinc-300 font-medium italic leading-relaxed">
            "{result.fomo_message}"
          </p>
          <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase mb-1">
                <span>Daily Calorie Impact</span>
                <span>{result.total_calories} kcal</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${Math.min(100, (result.total_calories / 2000) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
