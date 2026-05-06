import { TopAppBar, BottomNavBar, VerificationBadge } from "@/src/components/Navigation";
import { Star, MapPin, X, Heart } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

export default function SavedTutorsScreen() {
  const savedTutors: any[] = [];

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <TopAppBar title="Saved Tutors" />
      <main className="mt-20 px-5 max-w-2xl mx-auto space-y-6">
        <p className="text-xs font-bold text-outline uppercase tracking-widest px-1">Your Favorite Mentors ({savedTutors.length})</p>
        
        {savedTutors.map((tutor, i) => (
          <motion.div 
            key={tutor.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm group hover:shadow-lg transition-all"
          >
            <Link to={`/tutor/${tutor.id}`} className="flex items-center p-3 gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                <img 
                  src={tutor.image} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt={`Portrait of ${tutor.name}`} 
                  referrerPolicy="no-referrer"
                  decoding="async"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-on-surface">{tutor.name}</span>
                  <VerificationBadge size="sm" />
                </div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{tutor.sub}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-secondary-container fill-current" />
                    <span className="text-[10px] font-bold">{tutor.rating}</span>
                  </div>
                  <div className="text-[10px] font-black text-on-surface">{tutor.price}₸/hr</div>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Remove logic would go here
                }}
                className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-all z-10"
              >
                  <Heart size={18} fill="currentColor" />
              </button>
            </Link>
          </motion.div>
        ))}

        {savedTutors.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-outline-variant/30">
            <Heart size={48} className="text-slate-100 mx-auto mb-4" />
            <p className="text-sm font-bold text-outline uppercase tracking-widest">No tutors saved yet</p>
            <Link to="/search" className="inline-block mt-4 text-xs font-bold text-primary-container uppercase tracking-widest hover:underline">Start Exploring</Link>
          </div>
        )}
      </main>
      <BottomNavBar />
    </div>
  );
}
