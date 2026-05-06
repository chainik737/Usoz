import { TopAppBar, BottomNavBar } from "@/src/components/Navigation";
import { Bell, Clock, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useNavigate } from "react-router-dom";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/components/FirebaseProvider";
import { db } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from "firebase/firestore";

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: formatNotifTime(doc.data().createdAt)
      }));
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatNotifTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <TopAppBar title="Notifications" showBack onBack={() => navigate(-1)} />
      <main className="mt-20 px-5 max-w-2xl mx-auto space-y-4">
        {notifications.map((notif, i) => (
          <motion.div 
            key={notif.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => markAsRead(notif.id)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${!notif.isRead ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white border-outline-variant/30 opacity-70'}`}
          >
            <div className="flex gap-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                !notif.isRead ? (
                  notif.type === 'booking' ? "bg-amber-500 text-white" :
                  notif.type === 'chat' ? "bg-emerald-500 text-white" :
                  "bg-primary text-white"
                ) : "bg-slate-100 text-slate-400"
              )}>
                {notif.type === 'booking' ? (
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                ) : notif.type === 'chat' ? (
                   <Bell size={20} />
                ) : (
                  <Bell size={20} />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-on-surface">{notif.title}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-outline font-bold">
                    <Clock size={10} /> {notif.time}
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{notif.body}</p>
              </div>
              {!notif.isRead && <div className="w-2 h-2 bg-primary rounded-full mt-2" />}
            </div>
          </motion.div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
               <Bell size={32} />
            </div>
            <p className="text-sm font-bold text-outline uppercase tracking-widest">No new notifications</p>
          </div>
        )}
      </main>
      <BottomNavBar />
    </div>
  );
}
