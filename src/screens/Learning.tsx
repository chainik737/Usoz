import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopAppBar, BottomNavBar } from "@/src/components/Navigation";
import { MessageCircle, TrendingUp, Plus, Calendar, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/src/components/FirebaseProvider";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp, getDocs, updateDoc } from "firebase/firestore";

export default function LearningScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"Upcoming" | "Completed">("Upcoming");
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleStartChat = async (otherId: string, otherParty: any) => {
    if (!user || !otherId) return;
    
    try {
      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid)
      );
      const snap = await getDocs(q);
      let chatId = "";
      
      const existingChat = snap.docs.find(doc => {
        const parts = doc.data().participants;
        return parts.includes(otherId);
      });

      if (existingChat) {
        chatId = existingChat.id;
      } else {
        const newChat = await addDoc(collection(db, "chats"), {
          participants: [user.uid, otherId],
          lastMessage: "",
          lastMessageTime: serverTimestamp(),
          participantNames: {
            [user.uid]: user.displayName || "User",
            [otherId]: otherParty?.name || "Member"
          },
          participantImages: {
            [user.uid]: user.photoURL,
            [otherId]: otherParty?.imageUrl
          },
          createdAt: serverTimestamp()
        });
        chatId = newChat.id;
      }
      
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  const handleAcceptSession = async (sessionId: string) => {
    try {
      await updateDoc(doc(db, "sessions", sessionId), {
        status: "confirmed",
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error accepting session:", err);
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await updateDoc(doc(db, "sessions", sessionId), {
        status: "completed",
        paymentStatus: "paid", // Mark as paid when completed if it was cash
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error completing session:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    const studentQuery = query(collection(db, "sessions"), where("studentId", "==", user.uid));
    const tutorQuery = query(collection(db, "sessions"), where("tutorId", "==", user.uid));

    const fetchOtherParty = async (session: any) => {
      const otherId = session.studentId === user.uid ? session.tutorId : session.studentId;
      try {
        const otherDoc = await getDoc(doc(db, "users", otherId));
        return {
          ...session,
          otherParty: otherDoc.exists() ? otherDoc.data() : { name: "Unknown User" }
        };
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${otherId}`);
      }
    };

    let studentSessions: any[] = [];
    let tutorSessions: any[] = [];

    const updateSessions = () => {
      const combined = [...studentSessions, ...tutorSessions];
      // Filter out duplicates by ID
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setSessions(unique);
      setLoading(false);
    };

    const unsubStudent = onSnapshot(studentQuery, async (snapshot) => {
      studentSessions = await Promise.all(snapshot.docs.map(d => fetchOtherParty({ id: d.id, ...d.data() })));
      updateSessions();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "sessions (student)");
    });

    const unsubTutor = onSnapshot(tutorQuery, async (snapshot) => {
      tutorSessions = await Promise.all(snapshot.docs.map(d => fetchOtherParty({ id: d.id, ...d.data() })));
      updateSessions();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "sessions (tutor)");
    });

    return () => {
      unsubStudent();
      unsubTutor();
    };
  }, [user]);

  const filteredSessions = sessions.filter(s => {
    if (activeTab === "Upcoming") return s.status !== "completed" && s.status !== "cancelled";
    return s.status === "completed";
  });

  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar title="Learning Center" />
      <main className="pt-20 pb-24 px-5 max-w-5xl mx-auto">
        <section className="mb-8">
          <div className="flex justify-between items-end mb-6">
            <div>
               <h2 className="text-3xl font-black text-on-surface tracking-tight">Active Sessions</h2>
               <p className="text-on-surface-variant font-bold text-sm">Manage your neighbor-to-neighbor learning.</p>
            </div>
          </div>
          <div className="flex p-1 bg-surface-container-low rounded-2xl w-full sm:w-fit border border-outline-variant/10">
            <button 
              onClick={() => setActiveTab("Upcoming")}
              className={cn(
                "flex-1 sm:px-10 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                activeTab === "Upcoming" ? "bg-primary-container text-white shadow-lg" : "text-on-surface-variant hover:bg-surface-variant/30"
              )}
            >
              Upcoming
            </button>
            <button 
              onClick={() => setActiveTab("Completed")}
              className={cn(
                "flex-1 sm:px-10 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                activeTab === "Completed" ? "bg-primary-container text-white shadow-lg" : "text-on-surface-variant hover:bg-surface-variant/30"
              )}
            >
              Completed
            </button>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white rounded-[2rem] animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
                  {filteredSessions.map((session) => (
                    <LessonCard 
                      key={session.id}
                      status={session.status.toUpperCase()}
                      type={session.tutorId === user?.uid ? "Student" : "Tutor"}
                      name={session.otherParty?.name}
                      subject={session.subject || "Academic Mentorship"}
                      time={session.timing || "Scheduled Session"}
                      img={session.otherParty?.imageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1480&auto=format&fit=crop"}
                      pending={session.status === "pending" && session.tutorId === user?.uid}
                      isStudent={session.studentId === user?.uid}
                      isTutor={session.tutorId === user?.uid}
                      primary={session.status === "confirmed"}
                      actionLabel={
                        session.status === "confirmed" 
                          ? (session.tutorId === user?.uid ? "End Session" : "Schedule Chat") 
                          : "View Profile"
                      }
                      onAction={() => {
                        if (session.status === "pending" && session.tutorId === user?.uid) {
                          handleAcceptSession(session.id);
                        } else if (session.status === "confirmed" && session.tutorId === user?.uid) {
                          handleCompleteSession(session.id);
                        } else if (session.status === "confirmed") {
                          handleStartChat(session.otherParty?.uid || session.tutorId, session.otherParty);
                        } else {
                          navigate(`/tutor/${session.tutorId}`);
                        }
                      }}
                      onMessage={() => handleStartChat(session.otherParty?.uid || (session.tutorId === user?.uid ? session.studentId : session.tutorId), session.otherParty)}
                    />
                  ))}
            </AnimatePresence>
            
            {activeTab === "Upcoming" && filteredSessions.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-outline-variant/30">
                <p className="text-on-surface-variant font-bold">No upcoming sessions. Time to start learning!</p>
              </div>
            )}

            {activeTab === "Upcoming" && (
              <>
                <article className="bg-primary text-white rounded-[2rem] p-8 shadow-xl md:col-span-2 lg:col-span-1 flex flex-col justify-between relative overflow-hidden group">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-2 tracking-tight">Weekly Milestone</h3>
                    <p className="text-sm font-medium opacity-70 mb-8 leading-relaxed">Boost your knowledge sharing in the neighborhood.</p>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">PROGRESS GOAL</span>
                        <span className="font-bold">0 / 20 hrs</span>
                      </div>
                      <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "5%" }}
                          className="bg-emerald-400 h-full rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <TrendingUp size={160} />
                  </div>
                </article>

                <article 
                  onClick={() => navigate("/search")}
                  className="bg-surface-container-low/30 border-2 border-dashed border-outline-variant/40 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center gap-5 group cursor-pointer hover:border-primary-container/60 hover:bg-white transition-all shadow-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center group-hover:bg-primary-container group-hover:text-white group-hover:scale-110 transition-all">
                    <Plus size={32} />
                  </div>
                  <div>
                    <h3 className="font-black text-on-surface uppercase tracking-widest text-sm">Schedule Now</h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">Book a local mentor in your area</p>
                  </div>
                </article>
              </>
            )}
          </div>
        )}
      </main>
      <BottomNavBar />
    </div>
  );
}

function LessonCard({ status, type, name, subject, time, img, pending, isStudent, isTutor, primary, actionLabel, onAction, onMessage }: any) {
  return (
    <motion.article 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className="bg-white border border-outline-variant/30 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-300 group"
    >
      <div>
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="relative group/avatar">
              <img 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-surface-container-high group-hover/avatar:scale-105 transition-transform" 
                src={img} 
                alt={`Avatar of ${name}`} 
                referrerPolicy="no-referrer"
              />
              {status === "CONFIRMED" && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-1 border-2 border-white shadow-lg">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-outline uppercase tracking-widest">{type}</p>
              <h3 className="font-extrabold text-on-surface leading-tight text-lg tracking-tight truncate max-w-[140px]">{name}</h3>
            </div>
          </div>
          <span className={cn(
            "px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase",
            status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" : 
            status === "COMPLETED" ? "bg-sky-100 text-sky-700" :
            "bg-amber-100 text-amber-700"
          )}>{status}</span>
        </div>
        <div className="space-y-4 mb-10">
           <InfoRow icon={<MapPin size={16} className="text-primary-container" />} text={subject} />
           <InfoRow icon={<Calendar size={16} className="text-outline" />} text={time.split('•')[0]} />
           <InfoRow icon={<Clock size={16} className="text-outline" />} text={time.split('•')[1]} />
        </div>
      </div>
      {pending ? (
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onAction}
            className="py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-center"
          >
            Accept Request
          </button>
          <button 
            onClick={onMessage}
            className="py-4 bg-slate-100 text-on-surface rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 active:scale-95 transition-all text-center"
          >
            Message
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {isTutor && status === "CONFIRMED" && (
            <p className="text-[9px] font-bold text-center text-outline mb-1 uppercase tracking-widest bg-emerald-50 py-2 rounded-lg">Ongoing Academic Mentorship</p>
          )}
          <button 
            onClick={onAction}
            className={cn(
              "w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md",
              primary ? "bg-primary-container text-white shadow-primary-container/20 hover:bg-emerald-500 hover:shadow-emerald-500/20" : "bg-white border-2 border-primary-container text-primary-container hover:bg-primary-container/5"
            )}
          >
            {primary ? <CheckCircle2 size={14} /> : <MessageCircle size={14} />}
            {actionLabel}
          </button>
          {status === "CONFIRMED" && (
            <button 
              onClick={onMessage}
              className="w-full py-3 bg-surface-container-low text-on-surface rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-surface-container transition-all"
            >
              Contact {type}
            </button>
          )}
        </div>
      )}
    </motion.article>
  );
}

function InfoRow({ icon, text }: any) {
  return (
    <div className="flex items-center gap-3 transition-transform cursor-default group/row">
      <div className="group-hover/row:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-xs font-bold text-on-surface-variant tracking-tight">{text}</span>
    </div>
  );
}
