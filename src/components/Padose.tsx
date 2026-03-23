import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Trophy, Users, TrendingUp, Zap, Target, Share2, MessageSquare, X } from "lucide-react";

export default function Padose({ user }: { user: any }) {
  const [padose, setPadose] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const prevRivalsRef = useRef<any[]>([]);

  const APP_URL = "https://ais-pre-aq4usca6itvyorbk2im3oo-643578630783.asia-southeast1.run.app";

  const handleInvite = () => {
    const message = `Bhai, Transform RPG join kar! Mere saath compete kar aur apni life transform kar. Level up kar aur asli khiladi ban. Join here: ${APP_URL}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const addNotification = (notif: any) => {
    const id = Date.now();
    setNotifications(prev => [{ ...notif, id }, ...prev].slice(0, 3));
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const MOCK_RIVALS = [
    { id: 'mock1', name: 'Beast Rahul', city: 'Delhi', transformation_score: 1250, current_level: 15, type: 'Powerlifter' },
    { id: 'mock2', name: 'Shredded Aman', city: 'Delhi', transformation_score: 980, current_level: 12, type: 'Calisthenics' },
    { id: 'mock3', name: 'Yoga Priya', city: 'Delhi', transformation_score: 1500, current_level: 18, type: 'Yogi' },
    { id: 'mock4', name: 'Cardio King', city: 'Delhi', transformation_score: 850, current_level: 10, type: 'Runner' },
    { id: 'mock5', name: 'Iron Simran', city: 'Delhi', transformation_score: 1100, current_level: 14, type: 'CrossFit' },
    { id: 'mock6', name: 'Bulk Master', city: 'Delhi', transformation_score: 720, current_level: 8, type: 'Bodybuilder' }
  ];

  const fetchData = () => {
    if (!user) return;
    const lat = demoMode ? 28.6139 : user.location_lat;
    const lng = demoMode ? 77.2090 : user.location_lng;

    Promise.all([
      fetch(`/api/rivals/nearby?lat=${lat}&lng=${lng}&id=${user.id}`).then(res => res.json()),
      fetch("/api/leaderboard").then(res => res.json())
    ]).then(([rivalsData, leaderboardData]) => {
      let rivals = rivalsData.rivals || [];
      
      if (demoMode) {
        const existingIds = new Set(rivals.map((r: any) => r.id));
        const newMocks = MOCK_RIVALS.filter(m => !existingIds.has(m.id));
        rivals = [...rivals, ...newMocks].sort((a, b) => b.transformation_score - a.transformation_score);
      }
      
      if (prevRivalsRef.current.length > 0) {
        rivals.forEach((rival: any) => {
          const prevRival = prevRivalsRef.current.find((r: any) => r.id === rival.id);
          if (prevRival) {
            if (rival.current_level > prevRival.current_level) {
              addNotification({
                type: 'level',
                name: rival.name,
                value: rival.current_level
              });
            } else if (rival.transformation_score >= prevRival.transformation_score + 50) {
              addNotification({
                type: 'score',
                name: rival.name,
                value: rival.transformation_score - prevRival.transformation_score
              });
            }
          }
        });
      }

      setPadose(rivals);
      prevRivalsRef.current = rivals;
      setLeaderboard(leaderboardData.leaderboard || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds for demo purposes
    return () => clearInterval(interval);
  }, [user, demoMode]);

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Zap size={32} className="text-emerald-500 animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 relative"
    >
      {/* Rival Notifications */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-full max-w-xs space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-black/80 backdrop-blur-md border border-emerald-500/50 p-3 rounded-2xl shadow-2xl pointer-events-auto flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notif.type === 'level' ? 'bg-yellow-500 text-black' : 'bg-emerald-500 text-black'}`}>
                {notif.type === 'level' ? <Trophy size={20} /> : <TrendingUp size={20} />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Rival Update</p>
                <p className="text-xs font-bold text-white">
                  <span className="text-emerald-400">{notif.name}</span> {notif.type === 'level' ? `reached Level ${notif.value}!` : `gained ${notif.value} XP!`}
                </p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Invite Friends Banner */}
      <section 
        onClick={handleInvite}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 cursor-pointer shadow-lg shadow-emerald-900/20 relative overflow-hidden group active:scale-95 transition-transform"
      >
        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
          <Share2 size={80} />
        </div>
        <div className="relative z-10">
          <h3 className="text-xl font-black italic tracking-tighter uppercase text-white mb-1">DOSTON KO CHALLENGE KAR</h3>
          <p className="text-emerald-100 text-xs font-bold mb-4 opacity-80">Invite friends on WhatsApp and build your squad.</p>
          <div className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">
            <MessageSquare size={14} /> INVITE ON WHATSAPP
          </div>
        </div>
      </section>

      {/* Nearby Padose */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2 text-emerald-500">
            <MapPin size={20} className="text-red-500" /> ILAAKE KE PADOSE
          </h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDemoMode(!demoMode)}
              className={`text-[10px] font-black px-2 py-1 rounded border transition-all ${demoMode ? 'bg-emerald-500 text-black border-emerald-500' : 'text-zinc-500 border-zinc-800'}`}
            >
              {demoMode ? 'DEMO ON (DELHI)' : 'DEMO MODE'}
            </button>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">2KM KE ANDAR</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {padose.length > 0 ? padose.map((padosi, i) => (
            <PadosiCard key={i} padosi={padosi} index={i} />
          )) : (
            <div 
              onClick={handleInvite}
              className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-3xl text-center cursor-pointer hover:bg-zinc-900/50 transition-colors"
            >
              <p className="text-zinc-500 text-sm italic mb-4">Abhi koi padosi nahi mila. Doston ko bulao!</p>
              <div className="inline-flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                <Share2 size={14} /> INVITE FRIENDS NOW
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Global Leaderboard */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2 text-yellow-500">
            <Trophy size={20} className="text-yellow-500" /> ASLI KHILADI
          </h2>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">POORA BHARAT</span>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          {leaderboard.map((player, i) => (
            <div 
              key={i}
              className={`flex items-center justify-between p-5 border-b border-zinc-800/50 last:border-0 ${player.name === user.name ? 'bg-emerald-500/10' : ''}`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-8 text-center font-black italic tracking-tighter ${i < 3 ? 'text-yellow-500 text-2xl' : 'text-zinc-600 text-sm'}`}>
                  {i + 1}
                </span>
                <div>
                  <p className="font-bold text-sm text-white">{player.name}</p>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{player.city}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-emerald-500 font-bold text-lg leading-none">{player.transformation_score}</p>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">LVL {player.current_level}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function PadosiCard({ padosi, index }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between group hover:border-emerald-500/50 transition-all hover:bg-zinc-900 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 font-black text-2xl group-hover:bg-emerald-500 group-hover:text-black transition-all transform group-hover:rotate-3">
          {padosi.current_level}
        </div>
        <div>
          <h3 className="font-bold text-sm text-white">{padosi.name}</h3>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            {padosi.city} {padosi.type ? `• ${padosi.type}` : ''}
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-emerald-500 font-mono font-bold text-lg justify-end">
          <TrendingUp size={16} /> {padosi.transformation_score}
        </div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">LEVEL {padosi.current_level}</p>
      </div>
    </motion.div>
  );
}

