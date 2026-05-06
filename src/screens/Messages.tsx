import { TopAppBar, BottomNavBar } from "@/src/components/Navigation";
import { Search as SearchIcon, Edit2, Verified, Check, MessageCircle, User, Archive, MoreHorizontal, Inbox } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/components/FirebaseProvider";
import { db } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";

export default function MessagesScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const participants = data.participants || [];
        const otherId = participants.find((p: string) => p !== user.uid);
        return {
          id: doc.id,
          name: data.participantNames?.[otherId] || "Member",
          img: data.participantImages?.[otherId],
          msg: data.lastMessage || "No messages yet",
          time: formatChatTime(data.lastMessageTime),
          timestamp: data.lastMessageTime?.toDate(),
          unread: data.unreadCounts?.[user.uid] || 0, 
          online: false,
          isGroup: participants.length > 2,
          isArchived: data.isArchived || false,
          initials: (data.participantNames?.[otherId] || "M").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
          otherId: otherId
        };
      });
      setChats(chatsData);
      setLoading(false);
    }, (error) => {
      console.error("Error in chats snapshot:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatChatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleArchive = async (e: React.MouseEvent, chatId: string, currentStatus: boolean) => {
    e.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "chats", chatId), {
        isArchived: !currentStatus
      });
    } catch (err) {
      console.error("Error archiving chat:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredChats = chats.filter(chat => {
    if (activeTab === "All") return !chat.isArchived;
    if (activeTab === "Groups") return chat.isGroup && !chat.isArchived;
    if (activeTab === "Tutors") return !chat.isGroup && !chat.isArchived;
    if (activeTab === "Archive") return chat.isArchived;
    return true;
  });

  return (
    <div className="min-h-screen bg-surface font-sans">
      <TopAppBar />
      <main className="pt-20 pb-28 px-5 max-w-2xl mx-auto">
        <header className="flex flex-col gap-1 mb-8">
          <h2 className="text-3xl font-black text-primary tracking-tighter uppercase italic">Community</h2>
          <p className="text-xs font-bold text-outline uppercase tracking-widest">Connect with mentors & groups</p>
        </header>

        <section className="mb-8 p-5 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between gap-4 shadow-xl shadow-slate-200/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-container text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-container/20">
                 <MessageCircle size={22} />
              </div>
              <div>
                 <p className="text-sm font-black text-on-surface uppercase italic tracking-tight">Booking Chats</p>
                 <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Direct access to your mentors</p>
              </div>
           </div>
           <Link to="/active-chats" className="px-5 py-2.5 bg-on-surface text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-md active:scale-95">View All</Link>
        </section>

        <section className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          {[
            { id: "All", label: "All", icon: <Inbox size={14} /> },
            { id: "Groups", label: "Groups", icon: <MessageCircle size={14} /> },
            { id: "Tutors", label: "Tutors", icon: <User size={14} /> },
            { id: "Archive", label: "Hidden", icon: <Archive size={14} /> }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-shrink-0 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border flex items-center gap-2",
                activeTab === tab.id 
                  ? "bg-primary text-white shadow-xl shadow-primary/20 border-primary" 
                  : "bg-white text-outline border-slate-100 hover:border-primary/30 hover:text-primary"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </section>

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-3xl" />
            ))
          ) : filteredChats.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-50 text-center space-y-4 shadow-sm">
               <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                 <User size={32} />
               </div>
               <p className="text-xs font-bold text-outline uppercase tracking-widest">No conversations found in {activeTab}</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <article 
                key={chat.id} 
                onClick={() => navigate(`/chat/${chat.id}`)}
                className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-50 flex items-center gap-4 transition-all active:scale-[0.98] cursor-pointer group hover:border-primary/20"
              >
              <div className="relative flex-shrink-0">
                {chat.img ? (
                  <img className="w-14 h-14 rounded-full object-cover border border-outline-variant/30" src={chat.img} alt={chat.name} />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold text-lg">{chat.initials}</div>
                )}
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-tertiary-fixed-dim border-2 border-white rounded-full shadow-sm"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <div className="flex items-center gap-1">
                    <h3 className="font-bold text-base text-on-surface truncate group-hover:text-primary-container transition-colors">{chat.name}</h3>
                    {chat.verified && <Verified size={14} className="text-on-tertiary-container fill-current" />}
                  </div>
                  <span className="text-[10px] font-bold text-outline uppercase">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <p className={cn(
                    "text-xs truncate transition-all flex-1",
                    chat.unread ? "text-on-surface font-bold" : "text-outline font-medium"
                  )}>
                    {chat.msg}
                  </p>
                  <div className="flex items-center gap-2">
                    {chat.unread > 0 && (
                      <div className="w-5 h-5 bg-primary-container text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">{chat.unread}</div>
                    )}
                    <button 
                      onClick={(e) => handleArchive(e, chat.id, chat.isArchived)}
                      className="p-2 bg-slate-50 text-outline hover:bg-slate-100 rounded-xl transition-all"
                      title={chat.isArchived ? "Unarchive" : "Archive"}
                    >
                      <Archive size={14} className={cn(chat.isArchived && "text-primary")} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
            ))
          )}
        </div>
      </main>

      <button className="fixed right-6 bottom-24 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-90 z-40">
        <Edit2 size={24} />
      </button>
      <BottomNavBar />
    </div>
  );
}
