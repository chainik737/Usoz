import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TopAppBar } from "@/src/components/Navigation";
import { Send, Image, Plus, MoreVertical, CheckCheck, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/components/FirebaseProvider";
import { db, doc, getDoc, updateDoc, addDoc, collection, query, orderBy, onSnapshot, serverTimestamp, increment } from "@/src/lib/firebase";

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
}

export default function ChatDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [chatInfo, setChatInfo] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;

    // Fetch chat info (Real-time)
    const unsubscribeChat = onSnapshot(doc(db, "chats", id), (chatDoc) => {
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        const otherId = data.participants.find((p: string) => p !== user.uid);
        setChatInfo({
          id: chatDoc.id,
          name: data.participantNames?.[otherId] || "Member",
          img: data.participantImages?.[otherId],
          status: "Online", // Simplified
          isArchived: data.isArchived || false,
          otherId: otherId,
          unreadCounts: data.unreadCounts || {}
        });
      }
    });

    // Listen for messages
    const q = query(
      collection(db, "chats", id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribeMsgs = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      
      // Mark messages from others as read
      snapshot.docs.forEach(async (msgDoc) => {
        const data = msgDoc.data();
        if (data.senderId !== user.uid && !data.read) {
          await updateDoc(doc(db, "chats", id, "messages", msgDoc.id), {
            read: true
          });
        }
      });
      
      // Update last seen for the current user in this chat
      updateDoc(doc(db, "chats", id), {
        [`lastRead.${user.uid}`]: serverTimestamp(),
        [`unreadCounts.${user.uid}`]: 0
      });
    }, (error) => {
      console.error("Error in messages snapshot:", error);
    });

    return () => {
      unsubscribeChat();
      unsubscribeMsgs();
    };
  }, [id, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !id || !user) return;

    const text = inputText;
    setInputText("");

    try {
      await addDoc(collection(db, "chats", id, "messages"), {
        text,
        senderId: user.uid,
        timestamp: serverTimestamp(),
        read: false
      });

      // Update chat last message and increment unread count for the other person
      const receiverId = chatInfo.otherId;
      await updateDoc(doc(db, "chats", id), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        [`unreadCounts.${receiverId}`]: increment(1)
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (!chatInfo) return (
    <div className="flex items-center justify-center h-screen bg-surface">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const handleArchive = async () => {
    if (!id) return;
    try {
      await updateDoc(doc(db, "chats", id), {
        isArchived: !chatInfo.isArchived
      });
      alert(chatInfo.isArchived ? "Chat unarchived" : "Chat archived");
      navigate("/messages");
    } catch (err) {
      console.error("Error archiving chat:", err);
    }
  };

  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleReport = () => {
    alert("Пользователь был заблокирован, и отчет был отправлен модераторам. Спасибо за помощь в обеспечении безопасности сообщества.");
    setShowReport(false);
    setShowMenu(false);
    navigate("/messages");
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8faff]">
      <div className="fixed top-0 left-0 right-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-on-surface">
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                {chatInfo.img ? (
                  <img src={chatInfo.img} className="w-10 h-10 rounded-full object-cover" alt={chatInfo.name} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {chatInfo.name[0]}
                  </div>
                )}
                {chatInfo.status === "Online" && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div>
                <h2 className="font-bold text-sm text-on-surface">{chatInfo.name}</h2>
                <p className={cn(
                  "text-[10px] font-medium tracking-wide",
                  chatInfo.status === "Online" ? "text-emerald-500" : "text-outline"
                )}>{chatInfo.status}</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-outline"
            >
              <MoreVertical size={20} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                >
                  <button 
                    onClick={handleArchive}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-on-surface hover:bg-slate-50 transition-colors"
                  >
                    {chatInfo.isArchived ? "Unarchive Chat" : "Archive Chat"}
                  </button>
                  <button 
                    onClick={() => setShowReport(true)}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors border-t border-slate-50"
                  >
                    Report & Block
                  </button>
                  <button className="w-full text-left px-4 py-3 text-xs font-bold text-on-surface hover:bg-slate-50 transition-colors border-t border-slate-50">
                    Mute Notifications
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

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
              <p className="text-sm font-medium text-outline leading-relaxed italic">"Is this user violating our community standards? Please specify the issue to help us keep Neighbor Mentor safe."</p>
              
              <div className="space-y-2">
                {["Inappropriate behavior", "Spam or Scam", "Academic dishonesty", "Other"].map(opt => (
                  <button key={opt} className="w-full p-4 rounded-xl border border-slate-100 font-bold text-xs text-on-surface hover:border-primary-container hover:bg-primary-container/5 transition-all">
                    {opt}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleReport}
                  className="w-full py-5 bg-red-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                >
                  Submit & Block
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

      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-20 pb-24 px-4 space-y-6 max-w-2xl mx-auto w-full no-scrollbar"
      >
        <div className="flex justify-center py-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-outline/50 bg-slate-100 px-3 py-1 rounded-full">Today</span>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex flex-col max-w-[85%]",
                msg.senderId === user?.uid ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm font-medium shadow-sm leading-relaxed",
                msg.senderId === user?.uid 
                  ? "bg-primary-container text-white rounded-tr-none" 
                  : "bg-white text-on-surface border border-slate-100 rounded-tl-none"
              )}>
                {msg.text}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 px-1">
                <span className="text-[9px] font-bold text-outline uppercase tracking-tight">
                  {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.senderId === user?.uid && (
                  <CheckCheck size={12} className={cn(msg.read ? "text-sky-400" : "text-outline")} />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-8 z-50">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button className="p-3 bg-slate-100 text-outline rounded-2xl hover:bg-slate-200 transition-colors">
            <Plus size={20} />
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="w-full bg-slate-100 border-none rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 placeholder:text-outline/50"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary">
              <Image size={20} />
            </button>
          </div>
          <button 
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className={cn(
              "p-3.5 rounded-2xl shadow-xl transition-all active:scale-90",
              inputText.trim() ? "bg-primary text-white shadow-primary/20" : "bg-slate-100 text-outline"
            )}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
