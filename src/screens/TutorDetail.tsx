import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { VerificationBadge } from "@/src/components/Navigation";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, 
  School, 
  ShieldCheck, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  History, 
  Calendar as CalendarIcon, 
  Clock, 
  Check,
  Settings2,
  Save as SaveIcon,
  Plus,
  Trash2,
  X,
  Heart,
  CreditCard,
  MoreVertical,
  Flag,
  MessageSquare,
  Smartphone
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/components/FirebaseProvider";
import { db } from "@/src/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { sendNotification } from "@/src/services/notificationService";
import { submitReview as dbSubmitReview } from "@/src/services/reviewService";

export default function TutorDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tutor, setTutor] = useState<any>(null);
  const [workingHours, setWorkingHours] = useState({ start: "09:00", end: "21:00" });

  useEffect(() => {
    const fetchTutor = async () => {
      if (!id) return;
      try {
        const tutorDoc = await getDoc(doc(db, "users", id));
        if (tutorDoc.exists()) {
          const data = tutorDoc.data();
          setTutor({ id: tutorDoc.id, ...data });
          setTutorImage(data.imageUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop");
          setTutorBio(data.bio || "");
          setTutorSubjects(data.subjects || []);
          setTutorCredentials(data.credentials || []);
          if (data.availability) {
            setManuallyBlockedDays(data.availability.blockedDays || []);
            setWorkingHours(data.availability.workingHours || { start: "09:00", end: "21:00" });
          }
        }
      } catch (error) {
        console.error("Error fetching tutor:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTutor();
  }, [id]);

  const isOwner = useMemo(() => user?.uid === id, [user, id]);
  const [isEditing, setIsEditing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'Verified' | 'Pending' | 'Rejected'>(tutor?.verificationStatus || 'Verified');

  // Profile State
  const [tutorImage, setTutorImage] = useState("");
  const [tutorBio, setTutorBio] = useState("");
  const [tutorSubjects, setTutorSubjects] = useState<string[]>([]);
  const [tutorCredentials, setTutorCredentials] = useState<any[]>([]);

  const [newSubject, setNewSubject] = useState("");
  const [newCredTitle, setNewCredTitle] = useState("");
  const [newCredSub, setNewCredSub] = useState("");

  const handleSaveProfile = async () => {
    if (!id || !user) return;
    try {
      await updateDoc(doc(db, "users", id), {
        bio: tutorBio,
        subjects: tutorSubjects,
        credentials: tutorCredentials,
        imageUrl: tutorImage,
        updatedAt: serverTimestamp()
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const addSubject = () => {
    if (newSubject.trim() && !tutorSubjects.includes(newSubject.trim())) {
      setTutorSubjects([...tutorSubjects, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const removeSubject = (sub: string) => {
    setTutorSubjects(tutorSubjects.filter(s => s !== sub));
  };

  const addCredential = () => {
    if (newCredTitle.trim() && newCredSub.trim()) {
      setTutorCredentials([...tutorCredentials, {
        id: Date.now(),
        title: newCredTitle,
        sub: newCredSub,
        type: "education"
      }]);
      setNewCredTitle("");
      setNewCredSub("");
    }
  };

  const removeCredential = (id: number) => {
    setTutorCredentials(tutorCredentials.filter(c => c.id !== id));
  };

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QR' | null>(null);
  const [bookingStep, setBookingStep] = useState<'calendar' | 'review' | 'payment' | 'confirmed'>('calendar');

  // Review State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "reviews"), where("tutorId", "==", id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data);
    });
    return () => unsubscribe();
  }, [id]);

  const handleSubmitReview = async () => {
    if (newRating === 0 || !newComment.trim() || !user || !id) return;
    
    try {
      await dbSubmitReview(id, user.uid, user.displayName || profile?.name || "Student", profile?.imageUrl || user.photoURL, newRating, newComment);
      setNewRating(0);
      setNewComment("");
      setShowReviewForm(false);
      // Refresh tutor data to update rating UI
      const updatedTutor = await getDoc(doc(db, "users", id));
      if (updatedTutor.exists()) {
        setTutor({ id: updatedTutor.id, ...updatedTutor.data() });
      }
    } catch (err) {
      alert("Failed to submit review.");
    }
  };

  const totalReviews = tutor?.reviewsCount || reviews.length;
  const averageRating = useMemo(() => {
    if (totalReviews === 0) return "0.0";
    if (tutor?.rating) return tutor.rating.toFixed(1);
    const localSum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    return (localSum / reviews.length).toFixed(1);
  }, [reviews, totalReviews, tutor]);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);

  useEffect(() => {
    const checkBookings = async () => {
      if (!user || !id) return;
      const q = query(
        collection(db, "sessions"), 
        where("studentId", "==", user.uid),
        where("tutorId", "==", id)
      );
      const snap = await getDocs(q);
      setHasActiveBooking(!snap.empty);
    };
    checkBookings();
  }, [user, id]);

  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "sessions"),
      where("tutorId", "==", id),
      where("status", "in", ["confirmed", "pending"])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booked: Record<string, string[]> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.timing) {
          const parts = data.timing.split(" • ");
          if (parts.length === 2) {
            const [dateStr, slot] = parts;
            if (!booked[dateStr]) booked[dateStr] = [];
            booked[dateStr].push(slot);
          }
        }
      });
      setBookedSlotsData(booked);
    }, (err) => {
      console.error("Error fetching booked slots:", err);
    });
    
    return () => unsubscribe();
  }, [id]);

  const handleStartChat = async () => {
    if (!user || !id || !tutor) return;
    
    try {
      // Find existing chat
      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid)
      );
      const snap = await getDocs(q);
      let chatId = "";
      
      const existingChat = snap.docs.find(doc => {
        const parts = doc.data().participants;
        return parts.includes(id);
      });

      if (existingChat) {
        chatId = existingChat.id;
      } else {
        const newChat = await addDoc(collection(db, "chats"), {
          participants: [user.uid, id],
          lastMessage: "",
          lastMessageTime: serverTimestamp(),
          participantNames: {
            [user.uid]: user.displayName || "Student",
            [id]: tutor.name || "Mentor"
          },
          participantImages: {
            [user.uid]: user.photoURL,
            [id]: tutor.imageUrl
          },
          createdAt: serverTimestamp()
        });
        chatId = newChat.id;
      }
      
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error("Error starting chat:", err);
      alert("Failed to start chat.");
    }
  };
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const [selectedReportReason, setSelectedReportReason] = useState("");

  const handleReport = async () => {
    if (!selectedReportReason) {
      alert("Please select a reason");
      return;
    }

    try {
      await addDoc(collection(db, "reports"), {
        reportedId: id,
        reporterId: user?.uid,
        reason: selectedReportReason,
        status: "pending",
        timestamp: serverTimestamp(),
        type: "tutor_report"
      });
      alert("Этого пользователя заблокировали, и ваш запрос был отправлен модераторам для проверки. Мы свяжемся с вами в ближайшее время.");
      setShowReport(false);
      setShowMenu(false);
      navigate(-1);
    } catch (err) {
      console.error("Error reporting tutor:", err);
      alert("Failed to send report. Please check your connection.");
    }
  };

  const handleBookSession = () => {
    if (selectedDates.length === 0 || !selectedSlot) return;
    setBookingStep('review');
    setShowConfirmation(true);
  };

  const confirmBooking = async () => {
    if (!paymentMethod || !user || !tutor) return;
    setIsBooking(true);
    try {
      // For each selected date, create a session
      for (const date of selectedDates) {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const initialStatus = "pending"; // Always pending initially so mentor can accept
        
        const sessionRef = await addDoc(collection(db, "sessions"), {
          studentId: user.uid,
          tutorId: tutor.id,
          status: initialStatus,
          paymentStatus: paymentMethod === 'QR' ? "paid_pending_verify" : "pending",
          timing: `${dateStr} • ${selectedSlot}`,
          subject: tutor.expertise || tutor.subjects?.[0] || "Academic Mentorship",
          price: tutor.price || 5000,
          paymentMethod: paymentMethod,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Notify Mentor
        await sendNotification(
          tutor.id,
          "New Session Request!",
          `${profile?.name || "A student"} wants to book a session on ${dateStr} at ${selectedSlot}.`,
          "booking",
          sessionRef.id
        );
      }
      setBookingStep('confirmed');
    } catch (error) {
      console.error("Error booking session:", error);
      alert("Failed to book session. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const toggleDateSelection = (date: Date) => {
    const dateValue = new Date(date).setHours(0,0,0,0);
    const exists = selectedDates.find(d => 
      new Date(d).setHours(0,0,0,0) === dateValue
    );

    if (exists) {
      setSelectedDates(selectedDates.filter(d => new Date(d).setHours(0,0,0,0) !== dateValue));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of current month
    const firstDay = new Date(year, month, 1);
    // Last day of current month
    const lastDay = new Date(year, month + 1, 0);
    
    // Previous month's trailing days
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Adjust for Monday start
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Fill trailing days from prev month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: month - 1,
        year,
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        day: i,
        month: month,
        year,
        isCurrentMonth: true
      });
    }
    
    // Trailing days of next month to fill grid (6 rows of 7 = 42)
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
        days.push({
          day: i,
          month: month + 1,
          year,
          isCurrentMonth: false
        });
    }
    
    return days;
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const isToday = (day: number, month: number, year: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day: number, month: number, year: number) => {
    return selectedDates.some(d => d.getDate() === day && d.getMonth() === month && d.getFullYear() === year);
  };

  const [bookedSlotsData, setBookedSlotsData] = useState<Record<string, string[]>>({});

  const [manuallyBlockedDays, setManuallyBlockedDays] = useState<string[]>([]);

  const getDayStatus = (day: number, month: number, year: number) => {
    const d = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Past dates are busy/unavailable
    const today = new Date();
    today.setHours(0,0,0,0);
    if (d < today) return "busy";

    if (manuallyBlockedDays.includes(dateStr)) return "busy";
    const booked = bookedSlotsData[dateStr] || [];
    if (booked.length >= timeSlots.length) return "busy";
    if (booked.length > 0) return "partial";
    return "available";
  };

  const isSlotBooked = (dates: Date[], slot: string) => {
    if (dates.length === 0) return false;
    // For simplicity, if any of the selected dates has this slot booked, mark as busy
    return dates.some(date => {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return bookedSlotsData[dateStr]?.includes(slot) || manuallyBlockedDays.includes(dateStr);
    });
  };

  const toggleSlotManual = (slot: string) => {
    if (!isEditing || selectedDates.length === 0) return;
    const date = selectedDates[0];
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    setBookedSlotsData(prev => {
      const current = prev[dateStr] || [];
      if (current.includes(slot)) {
        return { ...prev, [dateStr]: current.filter(s => s !== slot) };
      } else {
        return { ...prev, [dateStr]: [...current, slot] };
      }
    });
  };

  const toggleDayManual = () => {
    if (!isEditing || selectedDates.length === 0) return;
    const date = selectedDates[0];
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    setManuallyBlockedDays(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  const timeSlots = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30", "20:00"];

  return (
    <div className="min-h-screen pb-10 bg-surface">
      <header className="fixed top-0 z-50 w-full h-16 flex justify-between items-center px-5 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all">
            <ChevronLeft size={24} className="text-primary-container" />
          </button>
          <h1 className="text-xl font-bold text-primary-container tracking-tight font-lexend uppercase">Usoz</h1>
        </div>
        <div className="flex items-center gap-3">
          {!isOwner && (
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all text-outline"
              >
                <MoreVertical size={20} />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[60]"
                  >
                    <button 
                      onClick={() => setShowReport(true)}
                      className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <Flag size={14} /> Report Tutor
                    </button>
                    <button 
                      className="w-full text-left px-4 py-3 text-xs font-bold text-on-surface hover:bg-slate-50 transition-colors border-t border-slate-50"
                    >
                      Share Profile
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-primary-container/20">
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTmDkUy1lqSIWuobZdnuuxENuf2cBZQjQJVW9tZpKg7UJIVysYYehVveyM7e3-hc_SvX-mfIy3GBecu03L_-dhuMZYJGvk_oJ8L7qa7aPZOeV1qQsBsVykxHX4fnco1DOqjp-Q2iboZ4txXPGMyqR2I4ehKQRkKgn2PQQq8brAw8M6qQ8nMLDh-KLjAgRXm2DiS91yV_C_Y8ZysofTgCFyeBdVvYVRkqOJ6_zdf5Qk7kIJXWBa9wAh-erq4r2qnrhHPDSOqW_P5reN" 
              alt="Profile" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-left">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReport(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl space-y-6"
            >
              <h3 className="text-2xl font-black text-on-surface uppercase tracking-tighter italic">Safety Report</h3>
              <p className="text-sm font-medium text-outline leading-relaxed italic">"Our priority is your safety. Please tell us why you're reporting this mentor."</p>
              
              <div className="space-y-2">
                {["Inappropriate content", "Harassment", "Fraud or Scam", "False credentials", "Other"].map(opt => (
                  <button 
                    key={opt} 
                    onClick={() => setSelectedReportReason(opt)}
                    className={cn(
                      "w-full p-4 rounded-xl border font-bold text-xs transition-all text-left flex justify-between items-center",
                      selectedReportReason === opt 
                        ? "border-primary-container bg-primary-container/10 text-on-surface" 
                        : "border-slate-100 text-outline hover:bg-slate-50"
                    )}
                  >
                    {opt}
                    {selectedReportReason === opt && <div className="w-2 h-2 bg-primary rounded-full" />}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleReport}
                  className="w-full py-5 bg-red-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                >
                  Submit Report
                </button>
                <button 
                  onClick={() => setShowReport(false)}
                  className="w-full py-4 text-xs font-bold text-outline hover:underline"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="pt-20 px-5 max-w-5xl mx-auto space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-4">
            <div className="relative group/avatar">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-sm border border-outline-variant relative">
                <img 
                  className="w-full h-full object-cover" 
                  src={tutorImage} 
                  alt={`Portrait of ${tutor.name}`} 
                  referrerPolicy="no-referrer"
                  decoding="async"
                />
                {isEditing && (
                  <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setTutorImage(URL.createObjectURL(file));
                        }
                      }} 
                    />
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-2">
                      <Plus size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Change Photo</span>
                  </label>
                )}
              </div>
              <VerificationBadge className="absolute top-4 right-4" />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <StatCard label={`${totalReviews} Reviews`} value={averageRating} icon={<div className="flex text-secondary-container"><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/></div>} />
              <StatCard label="Years Exp." value={tutor.exp} icon={<History size={16} />} />
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col space-y-6">
            {isOwner && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-2xl border flex flex-col gap-3 shadow-sm",
                  verificationStatus === 'Verified' && "bg-emerald-50 border-emerald-100",
                  verificationStatus === 'Pending' && "bg-amber-50 border-amber-100",
                  verificationStatus === 'Rejected' && "bg-red-50 border-red-100"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      verificationStatus === 'Verified' && "bg-emerald-500 text-white",
                      verificationStatus === 'Pending' && "bg-amber-500 text-white",
                      verificationStatus === 'Rejected' && "bg-red-500 text-white"
                    )}>
                      {verificationStatus === 'Verified' ? <Check size={16} /> : verificationStatus === 'Pending' ? <ShieldCheck size={16} /> : <X size={16} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase tracking-widest leading-none mb-1">Account Status</p>
                      <h4 className={cn(
                        "font-bold text-sm",
                        verificationStatus === 'Verified' && "text-emerald-700",
                        verificationStatus === 'Pending' && "text-amber-700",
                        verificationStatus === 'Rejected' && "text-red-700"
                      )}>
                        {verificationStatus === 'Verified' ? "Profile Verified" : verificationStatus === 'Pending' ? "Verification Pending" : "Verification Rejected"}
                      </h4>
                    </div>
                  </div>
                  {verificationStatus !== 'Verified' && (
                    <Link 
                      to="/verification" 
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        verificationStatus === 'Pending' && "bg-amber-100 text-amber-700 hover:bg-amber-200",
                        verificationStatus === 'Rejected' && "bg-red-100 text-red-700 hover:bg-red-200"
                      )}
                    >
                      {verificationStatus === 'Pending' ? "Check Details" : "Re-apply Now"}
                    </Link>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-outline text-opacity-70 uppercase tracking-tighter">
                    <span>Progress</span>
                    <span>{verificationStatus === 'Verified' ? '100%' : verificationStatus === 'Pending' ? '65%' : '30%'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ 
                        width: verificationStatus === 'Verified' ? '100%' : verificationStatus === 'Pending' ? '65%' : '30%' 
                      }}
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        verificationStatus === 'Verified' && "bg-emerald-500",
                        verificationStatus === 'Pending' && "bg-amber-500",
                        verificationStatus === 'Rejected' && "bg-red-500"
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-1 relative">
              {isOwner && !isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute top-0 right-0 p-2 text-primary-container hover:bg-primary-container/5 rounded-full transition-all flex items-center gap-2 font-bold text-xs"
                >
                  <Settings2 size={18} />
                  Edit Profile
                </button>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-bold text-on-surface">{tutor.name}</h2>
                  <div className="px-2 py-0.5 border border-outline-variant rounded-full flex items-center gap-1">
                    <Star size={14} className="text-secondary-container fill-current" />
                    <span className="text-xs font-bold">{averageRating}</span>
                  </div>
                </div>
                {!isOwner && (
                  <button 
                    onClick={() => setIsSaved(!isSaved)}
                    className={cn(
                      "p-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center border",
                      isSaved 
                        ? "bg-red-50 text-red-500 border-red-100 shadow-sm shadow-red-500/10" 
                        : "bg-white text-outline border-outline-variant/30 hover:border-primary/30 hover:text-primary"
                    )}
                  >
                    <Heart size={24} fill={isSaved ? "currentColor" : "none"} />
                  </button>
                )}
              </div>
              <p className="text-lg text-on-surface-variant font-medium">{tutor.expertise}</p>
            </div>

            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-8 bg-white p-6 rounded-2xl border border-primary-container/10 shadow-sm"
                >
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-primary-container uppercase tracking-wider flex items-center gap-2">
                      <Plus size={16} /> Manage Subjects
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tutorSubjects.map(s => (
                        <span key={s} className="px-3 py-1.5 bg-primary-container/10 text-primary-container text-xs rounded-lg font-bold flex items-center gap-2 border border-primary-container/10">
                          {s}
                          <button onClick={() => removeSubject(s)}>
                            <X size={14} className="hover:text-red-500" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Add subject (e.g. Calculus III)"
                        className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-primary-container transition-all"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSubject()}
                      />
                      <button onClick={addSubject} className="bg-surface-container px-4 rounded-xl text-primary-container font-bold text-xs hover:bg-primary-container/10 transition-all">Add</button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-primary-container uppercase tracking-wider">Manage Credentials</h3>
                    <div className="space-y-3">
                      {tutorCredentials.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <School size={16} className="text-outline" />
                            </div>
                            <div>
                              <p className="font-bold text-xs">{c.title}</p>
                              <p className="text-[10px] text-outline font-medium">{c.sub}</p>
                            </div>
                          </div>
                          <button onClick={() => removeCredential(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="Degree / Certificate" 
                        className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-primary-container transition-all"
                        value={newCredTitle}
                        onChange={(e) => setNewCredTitle(e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="Institution" 
                        className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-primary-container transition-all"
                        value={newCredSub}
                        onChange={(e) => setNewCredSub(e.target.value)}
                      />
                    </div>
                    <button onClick={addCredential} className="w-full py-2 bg-surface-container text-primary-container rounded-xl font-bold text-xs hover:bg-primary-container/10 transition-all border border-dashed border-primary-container/30">
                      Add Credential
                    </button>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-primary-container uppercase tracking-wider">About Me</h3>
                    <textarea 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm font-medium focus:border-primary-container outline-none transition-all min-h-[120px]"
                      value={tutorBio}
                      onChange={(e) => setTutorBio(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 px-4 border border-outline-variant rounded-xl text-xs font-bold text-outline hover:bg-surface-container transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="flex-2 py-3 px-8 bg-primary-container text-white rounded-xl text-xs font-bold shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <SaveIcon size={16} />
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="display-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-outline uppercase tracking-wider">Subjects Taught</h3>
                    <div className="flex flex-wrap gap-2">
                      {tutorSubjects.map(s => (
                        <span key={s} className="px-3 py-1 bg-primary-container text-white text-sm rounded-lg font-medium">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-outline uppercase tracking-wider">Credentials</h3>
                    <div className="space-y-3">
                      {tutorCredentials.map(c => (
                        <CredentialItem key={c.id} icon={<School size={20}/>} title={c.title} sub={c.sub} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 italic text-on-surface-variant leading-relaxed shadow-sm">
                    "{tutorBio}"
                  </div>

                  {tutor.paymentQr && (
                    <div className="space-y-4 pt-4">
                      <h3 className="text-xs font-bold text-outline uppercase tracking-wider flex items-center gap-2">
                        <Smartphone size={16} className="text-primary" /> Verified Payment QR
                      </h3>
                      <div className="flex items-center gap-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                        <div className="w-20 h-20 bg-white p-2 rounded-xl border border-emerald-100 shadow-sm shrink-0">
                          <img src={tutor.paymentQr.preview} className="w-full h-full object-contain" alt="Payment QR" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-on-surface">Kaspi QR Available</p>
                          <p className="text-xs text-on-surface-variant font-medium mt-1">This mentor accepts direct path payments via Kaspi QR for instant confirmation.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 lg:sticky lg:top-24">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Book a Session</h3>
                <span className="text-primary-container text-xl font-bold">12,000 ₸<span className="text-xs font-normal text-outline">/hr</span></span>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center p-1 bg-surface-container-low rounded-xl">
                   <button 
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all active:scale-90"
                   >
                    <ChevronLeft size={20} className="text-primary-container" />
                   </button>
                   <span className="font-bold text-sm text-on-surface">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                   </span>
                   <button 
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all active:scale-90"
                   >
                    <ChevronRight size={20} className="text-primary-container" />
                   </button>
                </div>
                
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-tertiary-fixed-dim rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-on-surface uppercase tracking-widest">Next Available: Today, 14:00</span>
                    </div>
                  </div>
                  {!isOwner && (
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleStartChat}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
                      >
                        <MessageSquare size={18} />
                        Message Mentor
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedDates([new Date()]); 
                          setSelectedSlot("14:00");
                          setBookingStep('payment');
                          setShowConfirmation(true);
                        }}
                        className="w-full py-4 bg-secondary-container text-on-secondary-container rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-secondary-container/20 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
                      >
                        <Clock size={18} />
                        Book Now (Soonest)
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-bold text-outline uppercase tracking-widest">Or Pick a Date</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <div>
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-outline mb-2">
                    {['M','T','W','T','F','S','S'].map((d, i) => <span key={`${d}-${i}`}>{d}</span>)}
                  </div>

                  <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                    {calendarData.map((data, i) => {
                      const selected = isSelected(data.day, data.month, data.year);
                      const today = isToday(data.day, data.month, data.year);
                      const status = getDayStatus(data.day, data.month, data.year);
                      
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (data.isCurrentMonth) {
                              if (isEditing) {
                                setSelectedDates([new Date(data.year, data.month, data.day)]);
                              } else {
                                toggleDateSelection(new Date(data.year, data.month, data.day));
                              }
                              setSelectedSlot(null);
                            }
                          }}
                          disabled={!data.isCurrentMonth || (status === "busy" && !isEditing)}
                          className={cn(
                            "aspect-square flex flex-col items-center justify-center text-xs rounded-xl transition-all relative overflow-hidden transition-transform active:scale-95",
                            !data.isCurrentMonth && "text-slate-200 opacity-0 pointer-events-none",
                            data.isCurrentMonth && !selected && !today && "hover:bg-primary-container/10 text-on-surface font-bold",
                            today && !selected && "bg-secondary-container/20 text-on-secondary-container font-black",
                            selected && "bg-primary-container text-white shadow-xl shadow-primary-container/30 font-black scale-105 z-10",
                            status === "busy" && data.isCurrentMonth && !isEditing && "bg-slate-50 opacity-40 grayscale cursor-not-allowed",
                            status === "busy" && data.isCurrentMonth && isEditing && "bg-red-50 text-red-500 border-2 border-red-200"
                          )}
                        >
                          <span className={cn(
                            "relative z-10 transition-colors",
                            selected ? "text-white" : status === "busy" ? "text-slate-400" : "text-on-surface"
                          )}>
                            {data.day}
                          </span>
                          
                          {data.isCurrentMonth && !selected && (
                            <div className="absolute top-1 right-1">
                               {status === "available" && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                               {status === "partial" && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />}
                               {status === "busy" && <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />}
                            </div>
                          )}

                          {today && !selected && (
                            <div className="absolute bottom-1 w-4 h-0.5 bg-on-secondary-container/30 rounded-full" />
                          )}
                          
                          {selected && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -bottom-1 -right-1 bg-white/20 p-2 rounded-full backdrop-blur-sm"
                            >
                              <Check size={12} strokeWidth={4} />
                            </motion.div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-outline px-2 py-3 bg-slate-50/50 rounded-xl border border-slate-100">
                   <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/20" /> Available</div>
                   <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-amber-400 rounded-full shadow-sm shadow-amber-400/20" /> Limited</div>
                   <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-400 rounded-full shadow-sm shadow-red-400/20" /> Fully Booked</div>
                </div>

                <div className="space-y-4" id="time-slots-section">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-primary-container" />
                        <span className="text-xs font-bold text-on-surface uppercase tracking-widest">Select Available Time</span>
                    </div>
                    {selectedDates.length > 0 && (
                       <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-primary-container uppercase px-2.5 py-1 bg-primary-container/10 rounded-lg border border-primary-container/20">
                           {selectedDates.length === 1 
                             ? selectedDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                             : `${selectedDates.length} Dates`}
                         </span>
                         <button 
                          onClick={() => setSelectedDates([])}
                          className="text-[10px] text-red-500 hover:underline font-bold uppercase tracking-widest"
                         >
                          Reset
                         </button>
                       </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {timeSlots.map(slot => {
                      const booked = isSlotBooked(selectedDates, slot);
                      return (
                        <button 
                          key={slot}
                          disabled={booked && !isEditing}
                          onClick={() => isEditing ? toggleSlotManual(slot) : setSelectedSlot(slot)}
                          className={cn(
                            "px-4 py-4 border-2 rounded-2xl font-bold text-sm transition-all flex items-center justify-between relative group overflow-hidden",
                            selectedSlot === slot 
                              ? "bg-primary-container border-primary-container text-white shadow-xl shadow-primary-container/30 scale-[1.02] z-10" 
                              : booked 
                                ? "bg-slate-50 border-slate-100 text-slate-200 cursor-not-allowed" 
                                : "bg-white border-outline-variant/30 text-on-surface-variant hover:border-primary-container/40 hover:bg-primary-container/5",
                            isEditing && booked && "border-red-500 bg-red-50 text-red-500"
                          )}
                        >
                          {booked && !isEditing && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                              <X size={80} strokeWidth={4} className="text-red-900" />
                            </div>
                          )}
                          <div className="flex items-center gap-2 relative z-10">
                            {selectedSlot === slot ? (
                              <Check size={18} strokeWidth={3} />
                            ) : booked && !isEditing ? (
                              <X size={16} className="text-red-400" />
                            ) : (
                              <Clock size={16} className={cn("transition-colors", booked ? "opacity-20" : "group-hover:text-primary-container")} />
                            )}
                            <span className={cn(booked && !isEditing && "opacity-30")}>{slot}</span>
                          </div>
                          {booked && !isEditing && (
                            <div className="flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 relative z-10">
                              <span className="text-[8px] font-black uppercase tracking-widest text-red-400">
                                Busy
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {isEditing && selectedDates.length > 0 && (
                    <button 
                      onClick={toggleDayManual}
                      className="w-full py-2 bg-red-50 text-red-500 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-red-200"
                    >
                      {manuallyBlockedDays.includes(`${selectedDates[0].getFullYear()}-${String(selectedDates[0].getMonth() + 1).padStart(2, '0')}-${String(selectedDates[0].getDate()).padStart(2, '0')}`) 
                        ? "Unblock Entire Day" 
                        : "Block Entire Day"}
                    </button>
                  )}
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl flex items-center gap-3 border border-slate-50">
                  <div className="w-10 h-10 bg-[#E11F26] rounded-xl flex items-center justify-center font-bold text-white text-[10px] shadow-sm">Kaspi</div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Secure Payment</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">Pay instantly via Kaspi QR</p>
                  </div>
                </div>

                <button 
                  onClick={handleBookSession}
                  disabled={selectedDates.length === 0 || !selectedSlot}
                  className={cn(
                    "w-full mt-6 py-4 rounded-2xl font-bold flex items-center justify-center transition-all shadow-xl",
                    selectedDates.length > 0 && selectedSlot 
                      ? "bg-primary-container text-white shadow-primary-container/20 hover:scale-[1.02] active:scale-95" 
                      : "bg-surface-container text-outline cursor-not-allowed opacity-50"
                  )}
                >
                  {selectedDates.length > 1 ? `Book ${selectedDates.length} Sessions` : 'Book Session'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-on-surface">Community Feedback</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star size={16} fill="currentColor" className="text-secondary-container" />
                  <span className="font-bold text-lg">{averageRating}</span>
                  <span className="text-outline text-sm font-medium">({totalReviews} reviews)</span>
                </div>
                {!showReviewForm && (
                  <button 
                    onClick={() => setShowReviewForm(true)}
                    className="text-xs font-bold text-primary-container px-4 py-2 bg-primary-container/10 rounded-full hover:bg-primary-container/20 transition-all uppercase tracking-widest"
                  >
                    Write Review
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {showReviewForm && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-primary-container/5 border border-primary-container/10 p-6 rounded-2xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-primary-container">Your Review</h4>
                    <button onClick={() => setShowReviewForm(false)} className="text-outline hover:text-on-surface transition-colors">
                      <ChevronRight className="rotate-90" size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Select Rating</p>
                    <div className="flex gap-2 text-secondary-container">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setNewRating(star)} className="p-1 hover:scale-110 transition-transform">
                          <Star size={24} fill={star <= newRating ? "currentColor" : "none"} stroke="currentColor" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Your Comment</p>
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your experience with Elena..."
                      className="w-full bg-white border border-outline-variant rounded-xl p-4 text-sm font-medium focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all min-h-[100px]"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      onClick={() => setShowReviewForm(false)}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold text-outline hover:bg-surface-container transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSubmitReview}
                      disabled={newRating === 0 || !newComment.trim()}
                      className="px-8 py-2.5 bg-primary-container text-white rounded-xl text-xs font-bold shadow-md shadow-primary-container/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Post Review
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review, i) => (
                <ReviewCard 
                  key={i} 
                  name={review.studentName} 
                  sub="Student" 
                  rating={review.rating} 
                  text={review.comment} 
                  img={review.studentImage || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop"} 
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {showConfirmation && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmation(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              {bookingStep === 'review' ? (
                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-on-surface">Confirm Selection</h3>
                    <p className="text-xs text-outline mt-1">Review your session details</p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-white">
                        <img src={tutorImage} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-on-surface">{tutor.name}</p>
                        <p className="text-[10px] text-outline font-bold uppercase tracking-widest">{tutor.expertise}</p>
                      </div>
                    </div>

                    <div className="h-px bg-slate-200" />

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-outline">
                          <CalendarIcon size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Date</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface">
                          {selectedDates[0]?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-outline">
                          <Clock size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Time Slot</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface">{selectedSlot}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-outline">
                          <CreditCard size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Duration</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface">60 Minutes</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      onClick={() => setBookingStep('payment')}
                      className="w-full py-4 bg-primary-container text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary-container/30 hover:scale-[1.02] active:scale-95 transition-all text-sm"
                    >
                      Continue to Payment
                    </button>
                    <button 
                      onClick={() => setShowConfirmation(false)}
                      className="w-full py-4 bg-white text-outline rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-100"
                    >
                      Change Details
                    </button>
                  </div>
                </div>
              ) : bookingStep === 'payment' ? (
                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-on-surface">Payment Method</h3>
                    <p className="text-xs text-outline mt-1">Choose how you'd like to pay for your sessions</p>
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => setPaymentMethod('Cash')}
                      className={cn(
                        "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all",
                        paymentMethod === 'Cash' ? "border-primary-container bg-primary-container/5" : "border-outline-variant hover:border-primary-container/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined">payments</span>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">Cash Payment</p>
                          <p className="text-[10px] text-outline">Pay directly to the tutor</p>
                        </div>
                      </div>
                      {paymentMethod === 'Cash' && <Check size={20} className="text-primary-container" />}
                    </button>

                    <button 
                      onClick={() => setPaymentMethod('QR')}
                      className={cn(
                        "w-full p-4 rounded-2xl border-2 flex flex-col items-stretch transition-all",
                        paymentMethod === 'QR' ? "border-primary-container bg-primary-container/5" : "border-outline-variant hover:border-primary-container/30"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3 w-full">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 text-[#E11F26] rounded-xl flex items-center justify-center font-bold text-[10px]">QR</div>
                          <div className="text-left">
                            <p className="font-bold text-sm">Kaspi QR</p>
                            <p className="text-[10px] text-outline">Instant and secure transfer</p>
                          </div>
                        </div>
                        {paymentMethod === 'QR' && <Check size={20} className="text-primary-container" />}
                      </div>

                      {paymentMethod === 'QR' && tutor.paymentQr && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-white rounded-xl p-4 border border-emerald-100 flex flex-col items-center gap-3 mb-1"
                        >
                          <div className="w-32 h-32 border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                            <img src={tutor.paymentQr.preview} className="w-full h-full object-contain" alt="Tutor QR" />
                          </div>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Scan to pay mentor directly</p>
                        </motion.div>
                      )}
                    </button>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/30">
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold text-outline">Total Amount:</span>
                        <span className="text-lg font-black text-primary-container">
                          {new Intl.NumberFormat('kk-KZ').format(12000 * selectedDates.length)} ₸
                        </span>
                     </div>
                     <button 
                      onClick={confirmBooking}
                      disabled={!paymentMethod || isBooking}
                      className="w-full py-4 bg-primary-container text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20 disabled:opacity-50 transition-all"
                    >
                      {isBooking ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Complete Booking"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-primary-container p-6 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check size={32} />
                    </div>
                    <h3 className="text-xl font-bold">Session Booked!</h3>
                    <p className="text-white/80 text-xs mt-1 font-medium">Your request has been sent to {tutor.name.split(' ')[0]}</p>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-widest text-center">Booking Summary</p>
                      <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 space-y-3 font-medium">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-outline">Tutor</span>
                          <span className="text-xs font-bold text-on-surface">{tutor.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-outline">Dates</span>
                          <span className="text-xs font-bold text-on-surface">
                            {selectedDates.length === 1 
                              ? selectedDates[0].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                              : `${selectedDates.length} sessions booked`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-outline">Time</span>
                          <span className="text-xs font-bold text-on-surface">{selectedSlot}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-outline">Total Price</span>
                          <span className="text-xs font-black text-primary-container">
                            {new Intl.NumberFormat('kk-KZ').format(tutor.price * selectedDates.length)} ₸
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-outline-variant/30">
                          <span className="text-xs text-outline">Payment</span>
                          <span className="text-xs font-bold text-emerald-600">{paymentMethod === 'Cash' ? 'Cash on Arrival' : 'Kaspi QR Paid'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleStartChat}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                      >
                        <MessageSquare size={16} />
                        Message Mentor
                      </button>
                      <Link 
                        to="/learning"
                        className="w-full py-4 bg-primary-container text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary-container/20"
                      >
                        View My Bookings
                      </Link>
                      <Link 
                        to="/"
                        className="w-full py-4 bg-surface-container text-on-surface rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant flex flex-col items-center justify-center text-center">
      <span className="text-xl font-bold text-primary">{value}</span>
      {icon}
      <span className="text-[10px] font-bold text-outline uppercase mt-1 tracking-wider">{label}</span>
    </div>
  );
}

function CredentialItem({ icon, title, sub }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-surface-container p-3 rounded-xl text-primary-container shadow-sm">{icon}</div>
      <div>
        <p className="font-bold text-on-surface leading-tight">{title}</p>
        <p className="text-xs text-on-surface-variant font-medium">{sub}</p>
      </div>
    </div>
  );
}

function ReviewCard({ name, sub, rating, text, img }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-50 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <img 
            className="w-10 h-10 rounded-full object-cover" 
            src={img} 
            alt={`Avatar of ${name}`} 
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
          <div>
            <p className="font-bold text-sm">{name}</p>
            <p className="text-[10px] text-outline font-bold">{sub}</p>
          </div>
        </div>
        <div className="flex text-secondary-container">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={12} fill={i < rating ? "currentColor" : "none"} stroke="currentColor" />
          ))}
        </div>
      </div>
      <p className="text-sm text-on-surface-variant leading-relaxed opacity-90">"{text}"</p>
    </div>
  );
}
