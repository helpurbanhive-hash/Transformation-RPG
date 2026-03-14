import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap } from "lucide-react";

interface XPToastProps {
  amount: number;
  onClose: () => void;
}

export default function XPToast({ amount, onClose }: XPToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] bg-emerald-500 text-black px-4 py-2 rounded-full font-black italic flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
    >
      <Zap size={16} fill="currentColor" />
      <span>+{amount} XP</span>
    </motion.div>
  );
}
