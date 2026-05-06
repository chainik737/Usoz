import { ArrowRight, School, Star, MapPin, ShieldCheck, CheckCircle2, Trophy, Users, BadgeCheck, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { TopAppBar, BottomNavBar, VerificationBadge } from "@/src/components/Navigation";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useEffect, useState } from "react";
import { db } from "@/src/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { useConfig } from "../components/ConfigProvider";

export default function ExploreScreen() {
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useConfig();
  const isVacation = localStorage.getItem("vacationMode") === "true";

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const tutorsQuery = query(
          collection(db, "users"),
          where("role", "==", "tutor"),
          limit(8)
        );
        const snapshot = await getDocs(tutorsQuery);
        const tutorsData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        setTutors(tutorsData);
      } catch (error) {
        console.error("Error fetching tutors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, []);

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <TopAppBar />
      <main className="mt-20 px-5 max-w-7xl mx-auto space-y-12">
        {/* Vacation Mode Banner */}
        {isVacation && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-6 p-6 bg-amber-50 border border-amber-200 rounded-[2rem] flex items-center gap-6 shadow-sm"
          >
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Sun size={28} />
            </div>
            <div>
              <p className="text-sm font-black text-amber-800 uppercase tracking-tight">Vacation Mode Active</p>
              <p className="text-xs font-medium text-amber-600 leading-relaxed mt-1">Your profile is currently hidden from search results. Go to Settings to resume tutoring.</p>
            </div>
            <Link to="/settings" className="ml-auto px-6 py-3 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-600/20 active:scale-95 transition-all">
              Settings
            </Link>
          </motion.div>
        )}

        {/* Adjusted Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden bg-primary shadow-2xl mt-6 group"
        >
          <div className="absolute inset-0 opacity-20 group-hover:scale-105 transition-transform duration-[10s]">
            <img 
              className="w-full h-full object-cover" 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop" 
              alt="Kazakhstan students learning together" 
              referrerPolicy="no-referrer"
              decoding="async"
            />
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 z-10">
            <div className="p-8 md:p-14 flex flex-col justify-center space-y-6 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full w-fit">
                <BadgeCheck size={14} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Kazakhstan's #1 P2P Learning</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">Level up with Almaty's top mentors.</h1>
              <p className="text-lg text-white/80 max-w-md leading-relaxed font-medium">Find the perfect educator for SAT, IELTS, or Math right in your neighborhood. Verified mentors from NU, KBTU, and SDU.</p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/search" className="px-8 py-4 bg-white text-primary rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest">
                  {t("search")}
                  <ArrowRight size={20} />
                </Link>
                <Link to="/verification" className="px-8 py-4 bg-sky-400 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-sky-500 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest">
                  {t("tutors")}
                  <School size={20} />
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Stats Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatMiniCard icon={<Users size={20}/>} value="10k+" label="Active Learners" />
          <StatMiniCard icon={<Trophy size={20}/>} value="98%" label="Score Increase" />
          <StatMiniCard icon={<ShieldCheck size={20}/>} value="100%" label="Verified Tutors" />
          <StatMiniCard icon={<MapPin size={20}/>} value="15+" label="Cities in KZ" />
        </section>

        {/* Value Propositions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ValueCard 
            icon="verified_user" 
            title="Rigorous Verification" 
            description="We manually check diplomas, IDs, and conduct background interviews for every mentor joining our platform."
            badge="Top Security"
            color="text-emerald-600 bg-emerald-50"
          />
          <ValueCard 
            icon="location_on" 
            title="Neighborhood Friendly" 
            description="Prioritize in-person learning. Use our map view to find mentors within walking distance in Esil or Bostandyk."
            metric="Active in Almaty & Astana"
            color="text-sky-600 bg-sky-50"
          />
          <ValueCard 
            icon="star" 
            title="Results Guaranteed" 
            description="Our P2P model ensures relatable teaching methods that actually work for modern students."
            rating="4.9/5 Student Rating"
            color="text-amber-600 bg-amber-50"
          />
        </section>

        {/* Featured Tutors - Polished Section */}
        <section className="space-y-8">
          <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
            <div>
              <h2 className="text-3xl font-black text-on-surface tracking-tight">{t("tutors")}</h2>
              <p className="text-on-surface-variant font-bold text-sm">Hand-picked educators with the highest performance ratings.</p>
            </div>
            <Link to="/search" className="text-primary-container font-bold hover:underline flex items-center gap-2 text-sm uppercase tracking-widest">
              {t("explore")} <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl border border-outline-variant/10 h-[400px] animate-pulse overflow-hidden">
                  <div className="bg-slate-100 h-[250px] w-full" />
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : tutors.length > 0 ? (
              tutors.map((tutor) => (
                <TutorCard 
                  key={tutor.id}
                  id={tutor.id} 
                  name={tutor.name} 
                  subjects={tutor.subjects?.join(" • ") || "General Study"} 
                  distance={tutor.university || "Kazakhstan"} 
                  price={tutor.price || "5,000"} 
                  image={tutor.imageUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop"} 
                  rating={tutor.rating}
                  reviewsCount={tutor.reviewsCount}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-outline-variant/30">
                <p className="text-on-surface-variant font-bold">No tutors found nearby yet.</p>
                <Link to="/verification" className="text-primary text-sm font-bold mt-2 inline-block">Be the first to teach!</Link>
              </div>
            )}
          </div>
        </section>

        {/* Steps */}
        <section className="bg-white p-12 rounded-[3rem] border border-outline-variant/30 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <School size={200} />
          </div>
          <div className="text-center mb-14 relative z-10">
            <h2 className="text-3xl font-black text-on-surface">Start your journey today</h2>
            <p className="text-on-surface-variant font-medium mt-2">Connecting students and mentors in 4 simple steps.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
            <Step number="01" title="Create Profile" desc="Sign up and tell us what you want to learn or teach." />
            <Step number="02" title="Find Experts" desc="Browse our verified network in Kazakhstan." />
            <Step number="03" title="Schedule" desc="Pick dates and times that work for both of you." />
            <Step number="04" title="Learn & Grow" desc="Meet safely and achieve your academic goals." />
          </div>
        </section>

        {/* Quick Links Footer - HTML Style Navigation */}
        <footer className="pt-8 pb-12 text-center space-y-6">
          <div className="h-px bg-outline-variant/20 w-full mb-8" />
          <h3 className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">Quick Navigation</h3>
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
             <Link to="/" className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors hover:underline underline-offset-4">Home</Link>
             <Link to="/search" className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors hover:underline underline-offset-4">Find Tutors</Link>
             <Link to="/learning" className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors hover:underline underline-offset-4">My Learning</Link>
             <Link to="/messages" className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors hover:underline underline-offset-4">Messages</Link>
             <Link to="/profile" className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors hover:underline underline-offset-4">My Profile</Link>
          </nav>
          <p className="text-[9px] font-bold text-outline uppercase tracking-widest opacity-50 mt-8">&copy; 2026 USOZ P2P. Built with passion in Kazakhstan.</p>
        </footer>
      </main>
      <BottomNavBar />
    </div>
  );
}

function StatMiniCard({ icon, value, label }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-4 shadow-sm">
      <div className="p-2 bg-primary/5 text-primary rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-lg font-black text-on-surface leading-none">{value}</p>
        <p className="text-[10px] font-bold text-outline uppercase tracking-wider mt-1">{label}</p>
      </div>
    </div>
  )
}

function ValueCard({ icon, title, description, badge, metric, rating, color }: any) {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] border border-outline-variant/30 shadow-sm flex flex-col h-full group hover:shadow-xl transition-all duration-500">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform", color)}>
        {icon === "verified_user" && <ShieldCheck size={28} />}
        {icon === "location_on" && <MapPin size={28} />}
        {icon === "star" && <Star size={28} />}
      </div>
      <h3 className="text-xl font-bold text-on-surface mb-3">{title}</h3>
      <p className="text-on-surface-variant leading-relaxed text-sm font-medium flex-1">{description}</p>
      <div className="mt-8 border-t border-outline-variant/20 pt-6">
        {badge && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/50 px-4 py-2 rounded-full uppercase tracking-widest">{badge}</span>}
        {metric && <span className="text-xs font-bold text-on-surface-variant">{metric}</span>}
        {rating && <span className="text-xs font-bold text-on-surface-variant flex items-center gap-2"><Star size={18} className="text-amber-500 fill-current" /> {rating}</span>}
      </div>
    </div>
  );
}

function TutorCard({ id, name, subjects, distance, price, image, className, verified = true, rating, reviewsCount }: any) {
  return (
    <Link to={`/tutor/${id}`} className={cn("bg-white rounded-3xl border border-outline-variant/20 shadow-md overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500", className)}>
      <div className="relative aspect-[4/5] overflow-hidden">
        <img 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          src={image} 
          alt={`Portrait of ${name}`} 
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
        {verified && <VerificationBadge size="sm" className="absolute top-4 right-4 shadow-xl" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
        <div className="absolute bottom-4 left-4 right-4 text-white">
           <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md w-fit px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/20">
             <MapPin size={10} /> {distance.split(',')[1] || distance}
           </div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <h4 className="font-bold text-lg text-on-surface truncate tracking-tight">{name}</h4>
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{subjects.split('•')[0]}</p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
          <div className="flex items-center gap-1 font-bold text-on-surface-variant">
            <Star size={14} className="text-amber-400 fill-current" />
            <span className="text-xs">{rating ? rating.toFixed(1) : "0.0"} ({reviewsCount || 0})</span>
          </div>
          <div className="text-right">
             <span className="text-lg font-black text-primary-container">{price}₸</span>
             <span className="text-[10px] font-bold text-outline-variant">/hr</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Step({ number, title, desc }: any) {
  return (
    <div className="text-left space-y-4">
      <div className="text-5xl font-black text-primary/10 tracking-tighter">{number}</div>
      <h4 className="font-extrabold text-xl text-on-surface">{title}</h4>
      <p className="text-sm font-medium text-on-surface-variant leading-relaxed">{desc}</p>
    </div>
  );
}
