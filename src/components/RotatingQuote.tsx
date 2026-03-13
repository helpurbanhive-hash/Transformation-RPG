import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Bell, AlertTriangle } from "lucide-react";
import { getQuoteByTime, Quote } from "../constants/quotes";

export default function RotatingQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const updateQuote = () => {
      setQuote(getQuoteByTime());
    };

    updateQuote();
    const interval = setInterval(updateQuote, 15000); // Rotate every 15s
    return () => clearInterval(interval);
  }, []);

  if (!quote) return null;

  const getVibeStyles = () => {
    switch (quote.vibe) {
      case "aggressive":
        return "bg-red-500/10 border-red-500/30 text-red-500";
      case "taunting":
        return "bg-orange-500/10 border-orange-500/30 text-orange-500";
      default:
        return "bg-blue-500/10 border-blue-500/30 text-blue-500";
    }
  };

  const getVibeIcon = () => {
    switch (quote.vibe) {
      case "aggressive":
        return <AlertTriangle size={16} className="text-red-500" />;
      case "taunting":
        return <Bell size={16} className="text-orange-500" />;
      default:
        return <Zap size={16} className="text-blue-500" />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={quote.text}
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        className={`p-4 rounded-2xl border relative overflow-hidden transition-colors duration-500 ${getVibeStyles()}`}
      >
        <div className="absolute -right-2 -top-2 opacity-5">
          {getVibeIcon()}
        </div>
        <div className="relative z-10 flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${quote.vibe === 'aggressive' ? 'bg-red-500' : quote.vibe === 'taunting' ? 'bg-orange-500' : 'bg-blue-500'}`}>
            {React.cloneElement(getVibeIcon() as React.ReactElement, { className: "text-black" })}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">
              {quote.vibe === 'aggressive' ? 'COMMAND' : quote.vibe === 'taunting' ? 'REALITY CHECK' : 'DAILY FUEL'}
            </p>
            <p className="text-sm font-bold italic leading-tight">
              "{quote.text}"
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
