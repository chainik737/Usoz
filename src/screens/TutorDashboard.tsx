import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  X, 
  Save, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { TopAppBar, BottomNavBar } from "@/src/components/Navigation";
import { useAuth } from "@/src/components/FirebaseProvider";
import { db } from "@/src/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { cn } from "@/src/lib/utils";

export default function TutorDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [blockedDays, setBlockedDays] = useState<string[]>([]);
  const [workingHours, setWorkingHours] = useState({ start: "09:00", end: "21:00" });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (profile?.availability) {
      setBlockedDays(profile.availability.blockedDays || []);
      setWorkingHours(profile.availability.workingHours || { start: "09:00", end: "21:00" });
    }
  }, [profile]);

  const toggleDay = (day: number) => {
    const dateStr = `2026-05-${day.toString().padStart(2, '0')}`; // Simplification for demo
    if (blockedDays.includes(dateStr)) {
      setBlockedDays(blockedDays.filter(d => d !== dateStr));
    } else {
      setBlockedDays([...blockedDays, dateStr]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        availability: {
          blockedDays,
          workingHours
        }
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Failed to save. Check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (profile?.role !== 'tutor') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-10 text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-2xl font-black text-on-surface uppercase italic tracking-tighter">Access Denied</h1>
        <p className="text-sm text-outline font-medium">This dashboard is only available for verified mentors.</p>
        <button onClick={() => navigate("/")} className="px-8 py-4 bg-on-surface text-white rounded-2xl font-bold uppercase text-xs tracking-widest">Back Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faff] pb-32">
      <TopAppBar title="Mentor Dashboard" showBack onBack={() => navigate(-1)} />
      
      <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
        <section className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <div>
              <h2 className="text-2xl font-black text-on-surface uppercase italic tracking-tighter">Manage Availability</h2>
              <p className="text-[10px] font-black text-outline uppercase tracking-widest">May 2026</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-3 bg-primary-container text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary-container/20 hover:scale-105 active:scale-95 transition-all"
            >
              {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>

          <AnimatePresence>
            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs font-bold"
              >
                <CheckCircle2 size={18} />
                Your schedule updated successfully.
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-6 px-1">
              Select days to block (Unavailable for bookings)
            </p>
            
            <div className="grid grid-cols-7 gap-2 mb-8">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                <div key={d} className="text-center text-[10px] font-black text-outline/40 py-2">{d}</div>
              ))}
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const dateStr = `2026-05-${day.toString().padStart(2, '0')}`;
                const isBlocked = blockedDays.includes(dateStr);
                
                return (
                  <button
                    key={i}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "aspect-square rounded-xl flex items-center justify-center text-sm font-black transition-all",
                      isBlocked 
                        ? "bg-red-50 text-red-500 border border-red-100" 
                        : "bg-slate-50 text-on-surface hover:bg-slate-100 border border-transparent"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-50">
              <h3 className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Standard Working Hours</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline/60 px-1">START TIME</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input 
                      type="time" 
                      value={workingHours.start}
                      onChange={(e) => setWorkingHours({...workingHours, start: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-xs font-black outline-none focus:ring-2 focus:ring-primary-container"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline/60 px-1">END TIME</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input 
                      type="time" 
                      value={workingHours.end}
                      onChange={(e) => setWorkingHours({...workingHours, end: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-xs font-black outline-none focus:ring-2 focus:ring-primary-container"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-outline/50 font-medium italic leading-relaxed px-1">
                Students will only be able to request sessions within this time range on your available days.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-black text-outline uppercase tracking-widest px-2">Booking Policies</h2>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-4">
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
               <div className="space-y-1">
                 <p className="text-xs font-black text-on-surface uppercase tracking-tight">Instant Booking</p>
                 <p className="text-[10px] text-outline font-medium">Allow students to book without approval</p>
               </div>
               <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer opacity-50">
                 <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
               </div>
             </div>
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
               <div className="space-y-1">
                 <p className="text-xs font-black text-on-surface uppercase tracking-tight">Minimum Notice</p>
                 <p className="text-[10px] text-outline font-medium">Prevent last-minute bookings</p>
               </div>
               <span className="text-[10px] font-black text-primary">24 HOURS</span>
             </div>
          </div>
        </section>
      </main>

      <BottomNavBar />
    </div>
  );
}
