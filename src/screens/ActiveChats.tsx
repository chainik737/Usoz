import { TopAppBar, BottomNavBar } from "@/src/components/Navigation";
import { MessageCircle, Clock, Calendar, ChevronRight, User } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/src/components/FirebaseProvider";
import { db } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function ActiveChatsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const otherId = data.participants.find((p: string) => p !== user.uid);
        return {
          id: doc.id,
          name: data.participantNames?.[otherId] || "Mentor",
          image: data.participantImages?.[otherId],
          lastMsg: data.lastMessage || "Start a conversation",
          time: data.lastMessageTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "",
          sub: "Direct Chat",
          unread: (data.unreadCounts?.[user.uid] || 0) > 0
        };
      });
      setChats(chatsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <TopAppBar title="Active Session Chats" showBack onBack={() => navigate(-1)} />
      <main className="mt-20 px-5 max-w-2xl mx-auto space-y-4">
        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex items-center gap-3">
          <div className="p-2 bg-primary text-white rounded-xl shadow-lg">
            <MessageCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-primary">Direct Communication</p>
            <p className="text-[10px] font-medium text-primary/70">These chats are linked to your current active sessions.</p>
          </div>
        </div>

        <div className="space-y-3">
          {chats.map((chat, i) => (
            <motion.button 
              key={chat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className={cn(
                "w-full p-4 bg-white border rounded-2xl flex items-center gap-4 transition-all hover:shadow-lg group",
                chat.unread ? "border-primary/20 bg-primary/5 shadow-sm" : "border-outline-variant/30"
              )}
            >
              <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm ring-1 ring-slate-100">
                <img src={chat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1 text-left space-y-0.5">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-on-surface">{chat.name}</h3>
                  <span className="text-[10px] text-outline font-bold">{chat.time}</span>
                </div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{chat.sub}</p>
                <p className={cn(
                  "text-xs truncate max-w-[200px]",
                  chat.unread ? "font-bold text-on-surface" : "font-medium text-outline"
                )}>
                  {chat.lastMsg}
                </p>
              </div>
              {chat.unread && <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-lg shadow-primary/20" />}
              <ChevronRight size={18} className="text-outline group-hover:translate-x-1 transition-transform" />
            </motion.button>
          ))}
        </div>

        {chats.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-outline-variant/30">
            <User size={48} className="text-slate-100 mx-auto mb-4" />
            <p className="text-sm font-bold text-outline uppercase tracking-widest">No active session chats</p>
          </div>
        )}
      </main>
      <BottomNavBar />
    </div>
  );
}
