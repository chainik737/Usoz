import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopAppBar, BottomNavBar, VerificationBadge } from "@/src/components/Navigation";
import { motion, AnimatePresence } from "motion/react";
import { Search as SearchIcon, Map, Filter, ChevronDown, Check, Star, Clock, MapPin, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function SearchScreen() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["All"]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([5000, 100000]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [availableNowOnly, setAvailableNowOnly] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const categories = ["All", "SAT", "IELTS", "TOEFL", "ACT", "Math", "Physics", "English", "Biology", "Chemistry"];
  const skills = ["Writing", "Speaking", "Calculus", "Derivatives", "Grammar", "Coding", "Piano", "Art"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
 
  const toggleCategory = (cat: string) => {
    if (cat === "All") {
      setSelectedCategories(["All"]);
      return;
    }
    const newCats = selectedCategories.filter(c => c !== "All");
    if (newCats.includes(cat)) {
      const filtered = newCats.filter(c => c !== cat);
      setSelectedCategories(filtered.length === 0 ? ["All"] : filtered);
    } else {
      setSelectedCategories([...newCats, cat]);
    }
  };
 
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const tutorsQuery = query(
          collection(db, "users"),
          where("role", "==", "tutor")
        );
        const snapshot = await getDocs(tutorsQuery);
        const tutorsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          // Ensure compatibility with existing fields
          cats: (doc.data() as any).subjects || [],
          image: (doc.data() as any).imageUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop",
          distance: (doc.data() as any).university || "Kazakhstan",
          next: (doc.data() as any).availability || "Contact for schedule",
          mapPos: (doc.data() as any).mapPos || { top: "50%", left: "50%" },
          regionId: (doc.data() as any).regionId || "almaty",
          subject: (doc.data() as any).subjects?.join(" & ") || "Tutor"
        }));
        setTutors(tutorsData);
      } catch (error) {
        console.error("Error fetching tutors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, []);

  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tutor.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.includes("All") || 
                             selectedCategories.some(cat => tutor.cats.includes(cat));
    const matchesRating = !minRating || tutor.rating >= minRating;
    const matchesPrice = tutor.price >= priceRange[0] && tutor.price <= priceRange[1];
    const matchesAvailability = !availableNowOnly || tutor.next.toLowerCase().includes("now");
    const matchesSkills = selectedSkills.length === 0 || selectedSkills.every(skill => tutor.subject.toLowerCase().includes(skill.toLowerCase()));
    const matchesRegion = !selectedRegion || tutor.regionId === selectedRegion;
    
    return matchesSearch && matchesCategory && matchesRating && matchesPrice && matchesAvailability && matchesSkills && matchesRegion;
  });

  return (
    <div className="min-h-screen pb-28">
      <TopAppBar title="USOZ" />
      <main className="pt-20 px-5 max-w-5xl mx-auto">
        <section className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-on-background"> {viewMode === "list" ? "Find your perfect tutor" : "Neighborhood Map"}</h1>
            <button 
              onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
              className="flex items-center gap-2 px-4 py-2 bg-secondary-container/10 text-on-secondary-container rounded-xl font-bold text-xs hover:bg-secondary-container/20 transition-all border border-secondary-container/20 shadow-sm"
            >
              {viewMode === "list" ? (
                <>
                  <Map size={16} /> Map View
                </>
              ) : (
                <>
                  <Filter size={16} /> List View
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-outline mb-6">
            {viewMode === "list" 
              ? "Discover top-rated P2P educators in Almaty, Astana and across Kazakhstan." 
              : "Discover tutors currently available in your neighborhood or city."}
          </p>
          
          <div className="flex flex-col gap-4">
            <div className="relative group">
              <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
              <input 
                className="w-full pl-12 pr-4 py-4 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm" 
                placeholder="Search for tutors in Almaty, Astana, Shymkent..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto pb-2 -mx-5 px-5 flex gap-2 items-center no-scrollbar">
              {categories.map(cat => (
                <Chip 
                  key={cat} 
                  active={selectedCategories.includes(cat)} 
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </Chip>
              ))}
              <div className="w-px h-6 bg-slate-200 mx-2 shrink-0" />
              <Chip 
                active={minRating !== null} 
                onClick={() => setMinRating(minRating ? null : 4.5)}
                icon={<Star size={14} fill="currentColor" />}
              >
                4.5+
              </Chip>
              <Chip 
                active={priceRange[1] < 100000}
                onClick={() => setShowFilterModal(true)}
                icon={<span className="material-symbols-outlined text-[16px]">payments</span>}
              >
                {priceRange[1] < 100000 ? `Up to ${priceRange[1]}₸` : "Price"}
              </Chip>
            </div>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {viewMode === "list" ? (
            <motion.div 
              key="list-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {filteredTutors.length > 0 ? (
                filteredTutors.map(tutor => (
                  <TutorResultCard 
                    key={tutor.id}
                    id={tutor.id}
                    name={tutor.name}
                    subject={tutor.subject}
                    rating={tutor.rating.toString()}
                    reviews={tutor.reviews.toString()}
                    price={tutor.price}
                    currency="₸"
                    image={tutor.image}
                    distance={tutor.distance}
                    next={tutor.next}
                    verified={tutor.verified}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-outline opacity-50">
                    <SearchIcon size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">No tutors found</h3>
                  <p className="text-sm text-outline">Try adjusting your filters or search query.</p>
                  <button 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategories(["All"]);
                      setMinRating(null);
                      setPriceRange([5000, 100000]);
                    }}
                    className="text-primary font-bold text-xs uppercase tracking-widest bg-primary/5 px-6 py-2 rounded-full"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}

              <div className="bg-primary-container text-white rounded-xl p-8 flex flex-col justify-center items-center text-center border border-primary relative overflow-hidden group">
                <div className="absolute inset-0 opacity-10 pointer-events-none transition-transform group-hover:scale-110 duration-700">
                  <img 
                    className="w-full h-full object-cover" 
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2674&auto=format&fit=crop" 
                    alt="Library background" 
                    referrerPolicy="no-referrer"
                    decoding="async"
                    loading="lazy"
                  />
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6">
                    <Map size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Prefer a Map View?</h3>
                  <p className="text-sm opacity-80 mb-6 max-w-[200px]">See exactly where tutors are located in your city.</p>
                  <button 
                    onClick={() => setViewMode("map")}
                    className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-bold active:scale-95 transition-all shadow-lg"
                  >
                    Switch to Map View
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <MapView 
              key="map-view" 
              tutors={filteredTutors} 
              selectedRegion={selectedRegion}
              onRegionSelect={setSelectedRegion}
              onReset={() => {
                setSearchQuery("");
                setSelectedCategories(["All"]);
                setMinRating(null);
                setPriceRange([5000, 100000]);
                setSelectedRegion(null);
              }} 
              onOpenFilters={() => setShowFilterModal(true)}
              onClose={() => setViewMode("list")}
            />
          )}
        </AnimatePresence>

        {/* Filter Modal */}
        <AnimatePresence>
          {showFilterModal && (
            <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 max-w-lg w-full space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar"
              >
                <div className="flex justify-between items-center sticky top-0 bg-white z-20 pb-2">
                  <div>
                    <h3 className="text-xl font-black text-on-surface leading-tight">Advanced Filters</h3>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest mt-1">Refine your search results</p>
                  </div>
                  <button onClick={() => setShowFilterModal(false)} className="p-3 bg-slate-100 text-outline rounded-2xl hover:bg-slate-200 transition-colors"><X size={20}/></button>
                </div>

                <div className="space-y-8">
                  {/* Availability */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-outline uppercase tracking-widest">Availability</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-outline-variant/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">Available Now Only</p>
                          <p className="text-[10px] font-medium text-outline">Show tutors ready for a session</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setAvailableNowOnly(!availableNowOnly)}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-colors duration-300",
                          availableNowOnly ? "bg-emerald-500" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                          availableNowOnly ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                  </div>

                  {/* Skills/Tags */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-outline uppercase tracking-widest">Specific Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.map(skill => (
                        <button 
                          key={skill}
                          onClick={() => {
                            if (selectedSkills.includes(skill)) {
                              setSelectedSkills(selectedSkills.filter(s => s !== skill));
                            } else {
                              setSelectedSkills([...selectedSkills, skill]);
                            }
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                            selectedSkills.includes(skill) 
                              ? "bg-primary-container text-white border-primary" 
                              : "bg-white text-outline border-outline-variant/30 hover:border-primary/30"
                          )}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-outline uppercase tracking-widest">Max Hourly Rate</p>
                        <p className="text-xl font-black text-primary-container">{new Intl.NumberFormat('kk-KZ').format(priceRange[1])}₸</p>
                      </div>
                    </div>
                    <div className="px-2">
                       <input 
                         type="range" 
                         min="5000" 
                         max="100000" 
                         step="1000"
                         value={priceRange[1]}
                         onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                         className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                       />
                       <div className="flex justify-between mt-2 text-[10px] text-outline font-bold">
                          <span>5,000₸</span>
                          <span>100,000₸</span>
                       </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-outline uppercase tracking-widest">Minimum Rating</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[3.0, 4.0, 4.5, 4.9].map(val => (
                        <button 
                          key={val}
                          onClick={() => setMinRating(minRating === val ? null : val)}
                          className={cn(
                            "py-3 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center gap-1",
                            minRating === val ? "border-primary bg-primary/5 text-primary" : "border-outline-variant text-outline hover:border-outline"
                          )}
                        >
                          <Star size={14} fill={minRating === val ? "currentColor" : "none"} />
                          {val}+
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategories(["All"]);
                      setMinRating(null);
                      setPriceRange([5000, 100000]);
                      setAvailableNowOnly(false);
                      setSelectedSkills([]);
                    }}
                    className="flex-1 py-4 border-2 border-outline-variant rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Reset All
                  </button>
                  <button 
                     onClick={() => setShowFilterModal(false)}
                     className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
                  >
                    Apply Results
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <button 
        onClick={() => setShowFilterModal(true)}
        className="fixed bottom-24 right-6 bg-secondary-container text-on-secondary-container p-4 rounded-2xl shadow-xl z-50 flex items-center gap-2 active:scale-95 transition-transform"
      >
        <Filter size={20} />
        <span className="font-bold text-sm md:block hidden">Filters</span>
      </button>

      <BottomNavBar />
    </div>
  );
}

function MapView({ tutors, selectedRegion, onRegionSelect, onReset, onOpenFilters, onClose }: { tutors: any[], selectedRegion: string | null, onRegionSelect: (id: string | null) => void, onReset: () => void, onOpenFilters: () => void, onClose: () => void, key?: string }) {
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Calculate tutor counts per region
  const tutorCounts = tutors.reduce((acc: Record<string, number>, tutor) => {
    if (tutor.regionId) {
      acc[tutor.regionId] = (acc[tutor.regionId] || 0) + 1;
    }
    return acc;
  }, {});

  // 17 detailed paths for Kazakhstan regions with shared boundaries (2022 updates)
  // Normalized to 800x600 viewBox
  const regions = [
    // --- WEST ---
    { id: "west_kaz", name: "Западно-Казахстанская", color: "rgba(224, 242, 241, 0.4)", d: "M10,120 L80,90 L160,110 L200,160 L180,220 L100,230 L30,220 Z" },
    { id: "atyrau", name: "Атырауская", color: "rgba(178, 223, 219, 0.4)", d: "M10,120 L80,90 L110,140 L160,180 L140,220 L70,225 L30,220 Z" },
    { id: "mangystau", name: "Мангистауская", color: "rgba(128, 203, 196, 0.4)", d: "M30,220 L140,220 L160,260 L140,350 L80,360 L40,320 Z" },
    { id: "aktobe", name: "Актюбинская", color: "rgba(77, 182, 172, 0.4)", d: "M200,160 L280,120 L330,130 L350,180 L350,280 L250,300 L200,280 L180,220 Z" },

    // --- NORTH & CENTER-NORTH ---
    { id: "kostanay", name: "Костанайская", color: "rgba(38, 166, 154, 0.4)", d: "M280,120 L350,100 L400,110 L420,180 L380,240 L350,180 L330,130 Z" },
    { id: "north_kaz", name: "Северо-Казахстанская", color: "rgba(0, 150, 136, 0.4)", d: "M400,110 L450,70 L520,100 L510,150 L420,150 L400,110 Z" },
    { id: "akmola", name: "Акмолинская", color: "rgba(0, 137, 123, 0.4)", d: "M420,150 L510,150 L540,180 L520,240 L450,250 L420,180 Z" },
    { id: "pavlodar", name: "Павлодарская", color: "rgba(0, 121, 107, 0.4)", d: "M520,100 L600,100 L650,150 L630,200 L550,210 L540,180 L510,150 Z" },

    // --- CENTRAL (NEW) ---
    { id: "ulytau", name: "Улытауская", color: "rgba(255, 112, 67, 0.4)", d: "M350,180 L380,240 L450,250 L420,380 L350,420 L280,410 L250,300 L350,280 Z" },
    { id: "karaganda", name: "Карагандинская", color: "rgba(0, 105, 92, 0.4)", d: "M450,250 L520,240 L550,210 L630,200 L680,250 L700,320 L620,400 L550,420 L420,380 Z" },

    // --- EAST & SOUTH-EAST ---
    { id: "abai", name: "Абайская", color: "rgba(186, 104, 200, 0.4)", d: "M630,200 L710,180 L750,220 L720,320 L700,320 L680,250 Z" },
    { id: "east_kaz", name: "Восточно-Казахстанская", color: "rgba(0, 77, 64, 0.4)", d: "M710,180 L790,190 L800,260 L750,320 L750,220 Z" },
    { id: "jetisu", name: "Жетысуская", color: "rgba(79, 195, 247, 0.4)", d: "M620,400 L700,320 L720,320 L750,400 L680,440 L600,430 Z" },
    { id: "almaty", name: "Алматинская", color: "rgba(129, 199, 132, 0.4)", d: "M600,430 L680,440 L750,520 L680,560 L580,560 L550,520 Z" },

    // --- SOUTH & SOUTH-WEST ---
    { id: "zhambyl", name: "Жамбылская", color: "rgba(165, 214, 167, 0.4)", d: "M420,380 L550,420 L550,520 L480,560 L420,540 L450,480 Z" },
    { id: "turkistan", name: "Туркестанская", color: "rgba(200, 230, 201, 0.4)", d: "M350,420 L450,480 L420,540 L350,560 L300,500 L320,450 Z" },
    { id: "kyzylorda", name: "Кызылординская", color: "rgba(232, 245, 233, 0.4)", d: "M250,300 L350,280 L350,420 L320,450 L300,500 L220,490 L180,430 L200,350 Z" },
  ];

  const handleRegionClick = (regionId: string) => {
    onRegionSelect(selectedRegion === regionId ? null : regionId);
  };

  const currentHoveredRegionInfo = regions.find(r => r.id === hoveredRegion);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 top-16 bottom-[72px] z-[40] bg-slate-950 overflow-hidden flex items-center justify-center p-4"
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      
      {/* Exit Map Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-[100] p-3 bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-2xl transition-all active:scale-95 group"
        title="Exit Map View"
      >
        <X size={24} className="group-hover:rotate-90 transition-all duration-300" />
      </button>

      {/* Floating Hover Tooltip */}
      <AnimatePresence>
        {hoveredRegion && !selectedRegion && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-[100] bg-slate-900/90 backdrop-blur-xl border border-white/20 p-3 rounded-2xl pointer-events-none shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            style={{ 
              left: mousePos.x + 15, 
              top: mousePos.y + 15 
            }}
          >
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{currentHoveredRegionInfo?.name}</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {tutorCounts[hoveredRegion] || 0} Available Tutors
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full h-full max-w-4xl max-h-[600px] cursor-grab active:cursor-grabbing">
        <motion.div 
          className="w-full h-full relative"
          initial={{ scale: 1 }}
          animate={{ 
            scale: selectedRegion ? 1.05 : 1
          }}
          transition={{ type: "spring", stiffness: 80, damping: 25 }}
        >
          {/* Real Topographic Background */}
          <div className="absolute inset-0 z-0 opacity-80 mix-blend-luminosity">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/b/b3/Relief_Map_of_Kazakhstan.png" 
              className="w-full h-full object-contain pointer-events-none"
              alt="Kazakhstan Relief Map"
            />
          </div>

          <motion.svg 
            viewBox="0 0 800 600" 
            className="w-full h-full drop-shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative z-10"
          >
            <g>
              {regions.map((region) => {
                const isSelected = selectedRegion === region.id;
                const isHovered = hoveredRegion === region.id;
                const anySelected = selectedRegion !== null;
                const shouldDim = anySelected && !isSelected;

                return (
                  <motion.path
                    key={region.id}
                    d={region.d}
                    fill={isSelected ? "rgba(16, 185, 129, 0.4)" : isHovered ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)"}
                    stroke={isSelected ? "#10b981" : isHovered ? "rgba(16, 185, 129, 0.6)" : "rgba(255, 255, 255, 0.15)"}
                    strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                    className="cursor-pointer transition-all"
                    initial={false}
                    animate={{
                      scale: isSelected ? 1.03 : 1,
                      opacity: shouldDim ? 0.3 : 1,
                      filter: isSelected 
                        ? "drop-shadow(0 0 15px rgba(16, 185, 129, 0.6)) brightness(1.2)" 
                        : isHovered 
                          ? "brightness(1.1)" 
                          : "none"
                    }}
                    whileHover={{ 
                      scale: isSelected ? 1.03 : 1.015,
                    }}
                    onMouseEnter={() => setHoveredRegion(region.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => handleRegionClick(region.id)}
                  />
                );
              })}
            </g>

            {/* City Labels */}
            <motion.g animate={{ opacity: selectedRegion ? 0.1 : 1 }}>
              <text x="500" y="150" className="text-[14px] font-black fill-white pointer-events-none uppercase tracking-widest drop-shadow-lg">Астана</text>
              <text x="650" y="320" className="text-[14px] font-black fill-white pointer-events-none uppercase tracking-widest drop-shadow-lg">Алматы</text>
              <text x="400" y="440" className="text-[14px] font-black fill-white pointer-events-none uppercase tracking-widest drop-shadow-lg">Шымкент</text>
            </motion.g>

            {/* Interactive Pins with Tooltips */}
            {tutors.map((tutor) => {
              const x = parseInt(tutor.mapPos.left) * 8;
              const y = parseInt(tutor.mapPos.top) * 6;
              const isSelected = selectedTutor?.id === tutor.id;
              
              return (
                <motion.g 
                  key={tutor.id}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: selectedRegion ? 0 : 1,
                    opacity: selectedRegion ? 0 : 1
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTutor(isSelected ? null : tutor);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Pin Base Shadow */}
                  <ellipse cx={x} cy={y + 2} rx="4" ry="2" fill="black" opacity="0.2" />
                  
                  {/* Pin Pulse */}
                  <motion.circle 
                    cx={x} cy={y} r="12" 
                    fill="#4CAF50" 
                    className="opacity-20"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  {/* Main Pin */}
                  <motion.path
                    d={`M${x} ${y} L${x-4} ${y-8} A4 4 0 1 1 ${x+4} ${y-8} Z`}
                    fill={isSelected ? "#FFD700" : "#4CAF50"}
                    stroke="white"
                    strokeWidth="1.5"
                    animate={{ y: isSelected ? -5 : 0 }}
                  />

                  <circle cx={x} cy={y-8} r="1.5" fill="white" />

                  {/* Mini Price Tag */}
                  {!isSelected && (
                    <foreignObject x={x - 30} y={y - 30} width="60" height="16">
                      <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-full px-1.5 py-0.5 text-[7px] font-black text-white text-center uppercase tracking-tighter shadow-lg">
                          {Math.round(tutor.price / 1000)}k₸
                      </div>
                    </foreignObject>
                  )}

                  {/* Interactive Tooltip Callout */}
                  <AnimatePresence>
                    {isSelected && (
                      <foreignObject x={x - 70} y={y - 120} width="140" height="100" style={{ overflow: 'visible' }}>
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          className="bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2.5 border border-white/10 flex flex-col gap-2 relative backdrop-blur-3xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                             <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10">
                               <img src={tutor.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={tutor.name} />
                             </div>
                             <div className="min-w-0">
                                <p className="text-[10px] font-black text-white truncate italic">{tutor.name}</p>
                                <div className="flex items-center gap-1">
                                   <Star size={8} className="text-yellow-500 fill-current" />
                                   <span className="text-[8px] font-bold text-white/60">4.9</span>
                                </div>
                                <p className="text-[9px] font-black text-emerald-400">{new Intl.NumberFormat('kk-KZ').format(tutor.price)}₸</p>
                             </div>
                          </div>
                          
                          <Link 
                            to={`/tutor/${tutor.id}`}
                            className="bg-white text-black py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] text-center hover:bg-emerald-400 hover:text-white transition-all shadow-lg active:scale-95"
                          >
                            Explore
                          </Link>

                          {/* Close Button Inside Tooltip */}
                          <button 
                            onClick={() => setSelectedTutor(null)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/40"
                          >
                            <X size={8} />
                          </button>

                          {/* Arrow */}
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-white/10 rotate-45" />
                        </motion.div>
                      </foreignObject>
                    )}
                  </AnimatePresence>
                </motion.g>
              );
            })}
          </motion.svg>
        </motion.div>
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-black/60 backdrop-blur-xl text-white shadow-2xl rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex flex-col items-center gap-1 pointer-events-none">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            Topographic Network
         </div>
         <p className="opacity-40 text-[8px]">Satellite & Digital Elevation Data</p>
      </div>

      <AnimatePresence>
        {selectedRegion && (
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="absolute top-24 left-8 bg-black/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] text-white space-y-6 max-w-[280px] shadow-2xl"
          >
             <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1 block">Active Region</span>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{regions.find(r => r.id === selectedRegion)?.name}</h3>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Available Tutors</p>
                   <p className="text-lg font-bold">{tutorCounts[selectedRegion] || 0}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Demand</p>
                   <p className="text-lg font-bold text-emerald-400">
                    {tutorCounts[selectedRegion] && tutorCounts[selectedRegion] > 1 ? "Extreme" : "Stable"}
                   </p>
                </div>
             </div>

             <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[11px] font-medium leading-relaxed italic text-white/70">
                   {tutorCounts[selectedRegion] && tutorCounts[selectedRegion] > 0 
                     ? `Strategic corridor. ${tutorCounts[selectedRegion]} expert${tutorCounts[selectedRegion] === 1 ? '' : 's'} verified in this sector.`
                     : "Satellite data indicates lower tutor density in this perimeter. Expanding search..."}
                </p>
             </div>

             <button 
               onClick={() => onRegionSelect(null)}
               className="w-full py-4 bg-white text-black hover:bg-emerald-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-black/20"
             >
               Full System Scan
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom tutor card removed in favor of pin tooltips */}
    </motion.div>
  );
}

function MapFilterItem({ label, active, onClick }: { label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 cursor-pointer group text-left w-full">
      <div className={cn(
        "w-3 h-3 border rounded flex items-center justify-center transition-colors",
        active ? "bg-primary-container border-primary-container" : "border-outline group-hover:border-primary-container"
      )}>
        {active && <Check size={8} className="text-white" />}
      </div>
      <span className={cn("text-[10px] font-bold transition-colors", active ? "text-primary-container" : "text-on-surface")}>{label}</span>
    </button>
  )
}

function Chip({ children, active, icon, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm whitespace-nowrap",
        active ? "bg-primary-container text-white" : "bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
      )}
    >
      {children} {icon}
    </button>
  );
}

function TutorResultCard({ id, name, subject, rating, reviews, price, currency = "$", image, distance, next, verified }: any) {
  return (
    <Link to={`/tutor/${id}`} className="bg-white rounded-xl border border-outline-variant/30 shadow-md overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="relative h-48 overflow-hidden">
        <img 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          src={image} 
          alt={`Portrait of ${name}`} 
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
        {verified && <VerificationBadge className="absolute top-3 right-3 shadow-lg" />}
        <div className="absolute bottom-3 left-3">
          <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg border border-outline-variant/30 flex items-center gap-1.5 grayscale-0">
            <Star size={14} className="text-secondary-container fill-current" />
            <span className="font-bold text-sm text-on-surface">{rating}</span>
            <span className="text-outline text-[11px]">({reviews})</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-on-surface leading-tight">{name}</h3>
            <p className="text-sm text-outline tracking-tight">{subject}</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-primary-container">{new Intl.NumberFormat('kk-KZ').format(price)}{currency}</span>
            <span className="text-outline text-[12px] block font-bold">/hr</span>
          </div>
        </div>
        <div className="flex items-center gap-6 pt-4 border-t border-outline-variant/20">
          <div className="flex items-center gap-1 text-outline">
            <MapPin size={16} />
            <span className="text-[11px] font-bold">{distance}</span>
          </div>
          <div className="flex items-center gap-1 text-outline">
            <Clock size={16} />
            <span className="text-[11px] font-bold">{next}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
