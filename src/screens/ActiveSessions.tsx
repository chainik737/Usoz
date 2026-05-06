import { TopAppBar, BottomNavBar } from "@/src/components/Navigation";
import { Clock, Calendar, CheckCircle2, XCircle, MoreVertical, MessageCircle, AlertCircle, Send, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/components/FirebaseProvider";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, query, where, getDocs, getDoc, doc, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { sendNotification } from "@/src/services/notificationService";

export default function ActiveSessionsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'learning' | 'teaching'>('learning');
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

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const field = activeTab === 'learning' ? 'studentId' : 'tutorId';
        const q = query(
          collection(db, "sessions"),
          where(field, "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const data = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const sessionData = docSnap.data();
          const isLearning = activeTab === 'learning';
          const otherUserId = isLearning ? sessionData.tutorId : sessionData.studentId;
          const userDoc = await getDoc(doc(db, "users", otherUserId));
          const userData = userDoc.data();
          
          return {
            id: docSnap.id,
            ...sessionData,
            type: activeTab, // Assign type to match filtering
            name: userData?.name || "Unknown User",
            image: userData?.imageUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop"
          };
        }));
        setSessions(data);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [user, activeTab]);

  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({});

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChat) return;
    const msg = {
      id: Date.now(),
      text: newMessage,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), msg]
    }));
    setNewMessage("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeChat]);

  const handleAccept = async (session: any) => {
    try {
      await updateDoc(doc(db, "sessions", session.id), { 
        status: "confirmed", 
        updatedAt: serverTimestamp() 
      });
      
      setSessions(sessions.map(s => s.id === session.id ? { ...s, status: "confirmed" } : s));
      
      // Notify Student
      await sendNotification(
        session.studentId,
        "Request Accepted!",
        `${user?.displayName || "Your mentor"} has accepted your session request for ${session.timing}.`,
        "booking",
        session.id
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (session: any) => {
    try {
      await updateDoc(doc(db, "sessions", session.id), { 
        status: "completed", 
        updatedAt: serverTimestamp() 
      });
      setSessions(sessions.map(s => s.id === session.id ? { ...s, status: "completed" } : s));

      // Notify Student
      await sendNotification(
        session.studentId,
        "Session Completed!",
        "How was your lesson? Please leave a review for your mentor.",
        "booking",
        session.id
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelAction = async (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;

    try {
      await updateDoc(doc(db, "sessions", id), { 
        status: "cancelled", 
        updatedAt: serverTimestamp() 
      });
      
      setSessions(sessions.map(s => s.id === id ? { ...s, status: "cancelled" } : s));
      setCancelModal(null);

      // Notify other party
      const otherId = activeTab === 'learning' ? session.tutorId : session.studentId;
      await sendNotification(
        otherId,
        "Session Cancelled",
        `The session on ${session.timing} has been cancelled.`,
        "booking",
        id
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (activeTab === 'learning') return s.studentId === user?.uid;
    return s.tutorId === user?.uid;
  });

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <TopAppBar 
        title="Active Sessions" 
        showBack={false} 
      />
      
      <main className="mt-20 px-5 max-w-2xl mx-auto space-y-6">
        <AnimatePresence mode="wait">
          <motion.div 
            key="sessions-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
              {/* Tabs */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button 
                  onClick={() => setActiveTab('learning')}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                    activeTab === 'learning' ? "bg-white text-primary shadow-sm" : "text-outline"
                  )}
                >
                  Learning
                </button>
                <button 
                  onClick={() => setActiveTab('teaching')}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                    activeTab === 'teaching' ? "bg-white text-primary shadow-sm" : "text-outline"
                  )}
                >
                  Teaching
                </button>
              </div>

              <div className="space-y-4">
                {filteredSessions.map((session, i) => (
                  <motion.div 
                    key={session.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-5 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4 group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-2 ring-primary/5">
                          <img 
                            src={session.image} 
                            className="w-full h-full object-cover" 
                            alt={`Portrait of ${session.name}`} 
                            referrerPolicy="no-referrer"
                            decoding="async"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-on-surface">
                            {session.name}
                          </h3>
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{session.subject}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        session.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {session.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-outline">
                          <Calendar size={16} />
                        </div>
                        <div className="text-[11px] font-bold text-on-surface-variant">{session.timing || session.date}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-outline">
                          <span className="material-symbols-outlined text-[16px]">payments</span>
                        </div>
                        <div className="text-[11px] font-bold text-on-surface">{session.price}₸ Total</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                       {activeTab === 'teaching' && session.status === 'pending' && (
                         <button 
                           onClick={() => handleAccept(session)}
                           className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mb-1"
                         >
                           Accept Session Request
                         </button>
                       )}

                       {activeTab === 'teaching' && session.status === 'confirmed' && (
                         <button 
                           onClick={() => handleComplete(session)}
                           className="w-full py-4 bg-primary-container text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary-container/20 active:scale-95 transition-all mb-1"
                         >
                           Mark as Completed
                         </button>
                       )}

                       {activeTab === 'learning' && session.status === 'completed' && (
                         <button 
                           onClick={() => navigate(`/tutor/${session.tutorId}`)}
                           className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all mb-1"
                         >
                           Leave a Review
                         </button>
                       )}

                       <div className="flex gap-3 w-full">
                        <button 
                          onClick={() => handleStartChat(activeTab === 'learning' ? session.tutorId : session.studentId, { name: session.name, imageUrl: session.image })}
                          className="flex-1 py-3 bg-white border border-outline-variant/30 text-on-surface rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                          <MessageCircle size={16} /> Message
                        </button>
                        {session.status !== 'cancelled' && session.status !== 'completed' && (
                          <button 
                            onClick={() => setCancelModal(session.id)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <XCircle size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {filteredSessions.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-outline-variant/30">
                    <AlertCircle size={48} className="text-slate-100 mx-auto mb-4" />
                    <p className="text-sm font-bold text-outline uppercase tracking-widest">No active sessions found</p>
                  </div>
                )}
              </div>
            </motion.div>
        </AnimatePresence>
      </main>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-on-surface">Cancel Session?</h3>
                <p className="text-sm font-medium text-outline">Are you sure you want to cancel this session? This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCancelModal(null)} className="flex-1 py-4 border border-outline-variant rounded-2xl font-bold text-xs uppercase tracking-widest">Keep It</button>
                <button onClick={() => handleCancelAction(cancelModal)} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all">Yes, Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNavBar />
    </div>
  );
}
