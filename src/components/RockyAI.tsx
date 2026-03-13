import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Send, 
  Loader2, 
  Dumbbell, 
  Utensils, 
  Sparkles, 
  Cpu, 
  Terminal,
  Activity,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { ROCKY_BRO_SYSTEM_PROMPT } from "../constants/prompts";

interface Message {
  role: "user" | "model";
  text: string;
}

export default function RockyAI({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: `Oye ${user.name}! Rocky Bro reporting for duty. Kya doubt hai? Diet, workout, ya life — sab set kar denge. Bol!` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: ROCKY_BRO_SYSTEM_PROMPT,
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const response = await chat.sendMessage({ message: userMessage });
      const text = response.text || "Bhai, network thoda down hai, phir se bol?";
      
      setMessages(prev => [...prev, { role: "model", text }]);
    } catch (error) {
      console.error("Rocky AI Error:", error);
      setMessages(prev => [...prev, { role: "model", text: "Bhai, system thoda hang ho gaya. Ek baar phir try kar?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Professional Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-6 z-50 flex items-center gap-3 bg-zinc-900 border border-emerald-500/30 pl-4 pr-2 py-2 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl group"
      >
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] hidden sm:block">AI Coach</span>
        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-transform group-hover:rotate-12">
          <Cpu size={20} className="text-black" />
        </div>
      </motion.button>

      {/* Professional Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed inset-0 z-[60] p-4 flex flex-col items-center justify-end pointer-events-none"
          >
            <div className="w-full max-w-lg bg-[#0A0A0A] border border-zinc-800 rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.9)] flex flex-col h-[75vh] pointer-events-auto overflow-hidden">
              
              {/* Technical Header */}
              <div className="px-6 py-5 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/20">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-zinc-900 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                      <Terminal size={24} className="text-emerald-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0A0A0A]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black italic tracking-tighter text-lg text-white">ROCKY_SYSTEM_v3.1</h3>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Active</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Activity size={10} className="text-zinc-600" />
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">Latency: 12ms</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={10} className="text-zinc-600" />
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">Encrypted</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 bg-zinc-900/50 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  <ChevronDown size={20} />
                </button>
              </div>

              {/* Chat Feed */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-gradient-to-b from-transparent to-emerald-500/[0.02]"
              >
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`group relative max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-5 py-3.5 rounded-3xl text-sm leading-relaxed transition-all ${
                        m.role === 'user' 
                          ? 'bg-emerald-500 text-black font-bold rounded-tr-none shadow-[0_10px_20px_rgba(16,185,129,0.2)]' 
                          : 'bg-zinc-900/50 text-zinc-200 rounded-tl-none border border-zinc-800 backdrop-blur-sm'
                      }`}>
                        {m.text}
                      </div>
                      <p className={`text-[8px] font-mono text-zinc-600 mt-1 uppercase tracking-widest ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {m.role === 'user' ? 'User_Input' : 'Rocky_Response'}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/30 rounded-full border border-zinc-800/50">
                      <Loader2 size={14} className="animate-spin text-emerald-500" />
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Processing_Query...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar border-t border-zinc-800/30">
                {[
                  { icon: <Utensils size={12} />, text: "Diet_Log" },
                  { icon: <Dumbbell size={12} />, text: "Workout_Plan" },
                  { icon: <Sparkles size={12} />, text: "Motivation" }
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s.text.replace('_', ' '))}
                    className="shrink-0 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest hover:border-emerald-500/50 hover:text-emerald-500 transition-all active:scale-95"
                  >
                    {s.icon} {s.text}
                  </button>
                ))}
              </div>

              {/* Input Console */}
              <div className="p-6 bg-zinc-900/40 border-t border-zinc-800/50">
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 relative group">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Enter command or query..."
                      className="w-full bg-black border border-zinc-800 rounded-2xl p-4 pl-5 text-sm font-mono text-emerald-500 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-700 group-focus-within:text-emerald-500/30">
                      [ENTER]
                    </div>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-[0_10px_20px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
