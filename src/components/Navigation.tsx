/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Search, 
  MessageCircle, 
  User, 
  Menu,
  CheckCircle2,
  X,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Star,
  Compass,
  ArrowLeft,
  Briefcase,
  Layers,
  GraduationCap
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "@/src/lib/firebase";
import { useConfig } from "../components/ConfigProvider";

export function TopAppBar({ title = "USOZ", showBack = false, onBack }: { title?: string; showBack?: boolean; onBack?: () => void }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const notificationsCount = 12; // Example for demo
  const { t } = useConfig();

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 h-16 bg-surface-container-low/80 backdrop-blur-md border-b border-outline-variant/20 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          {showBack ? (
            <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-full transition-all text-primary">
               <ArrowLeft size={24} />
            </button>
          ) : (
            <button onClick={() => setIsDrawerOpen(true)} className="text-primary-container hover:bg-surface-container p-2 rounded-full transition-all">
              <Menu size={24} />
            </button>
          )}
          <h1 className="text-xl font-bold tracking-tight text-primary-container font-lexend uppercase">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/notifications" className="text-primary-container hover:bg-surface-container p-2 rounded-full transition-all relative mr-1">
            <Bell size={22} className="text-primary-container" />
            <div className="absolute -top-1.5 -right-1.5 min-w-[24px] h-[24px] bg-red-600 text-white text-[12px] font-black flex items-center justify-center rounded-full border-2 border-white px-1 shadow-[0_0_20px_rgba(220,38,38,1)] animate-pulse z-[60]">
              {notificationsCount > 9 ? '9+' : notificationsCount}
            </div>
            {/* Added multiple animated rings for maximum visibility */}
            <div className="absolute -top-1.5 -right-1.5 min-w-[24px] h-[24px] rounded-full border-2 border-red-500 animate-ping opacity-75" />
            <div className="absolute -top-1.5 -right-1.5 min-w-[24px] h-[24px] rounded-full border border-red-400 animate-ping opacity-40 delay-300" />
          </Link>
          <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary-container/20 hover:scale-105 transition-transform">
            <img 
              className="w-full h-full object-cover" 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1288&auto=format&fit=crop" 
              alt="User avatar"
            />
          </Link>
        </div>
      </header>

      {/* Side Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-[280px] bg-surface-container-lowest z-[101] shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-2xl font-black text-primary-container tracking-tighter">USOZ</span>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-surface-container rounded-full text-on-surface">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <DrawerItem icon={<Compass size={20}/>} label={t("explore")} path="/" onClick={() => setIsDrawerOpen(false)} />
                <DrawerItem icon={<Briefcase size={20}/>} label="Active Sessions" path="/active-sessions" onClick={() => setIsDrawerOpen(false)} />
                <DrawerItem icon={<Bell size={20}/>} label={t("notifications")} path="/notifications" onClick={() => setIsDrawerOpen(false)} />
                <DrawerItem icon={<CreditCard size={20}/>} label="Payments" path="/payments" onClick={() => setIsDrawerOpen(false)} />
                <DrawerItem icon={<Star size={20}/>} label="Saved Tutors" path="/saved" onClick={() => setIsDrawerOpen(false)} />
                <div className="h-px bg-outline-variant/10 my-4" />
                <DrawerItem icon={<Settings size={20}/>} label={t("settings")} path="/settings" onClick={() => setIsDrawerOpen(false)} />
                <DrawerItem icon={<HelpCircle size={20}/>} label="Help & Support" path="/help" onClick={() => setIsDrawerOpen(false)} />
              </div>

              <button 
                onClick={async () => {
                  try {
                    await auth.signOut();
                    setIsDrawerOpen(false);
                  } catch (error) {
                    console.error("Logout error:", error);
                  }
                }}
                className="mt-auto flex items-center gap-3 p-3 text-error font-bold hover:bg-error-container/10 rounded-xl transition-all"
              >
                <LogOut size={20} />
                {t("logOut")}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function DrawerItem({ icon, label, path, onClick }: any) {
  return (
    <Link 
      to={path} 
      onClick={onClick}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary-container/5 text-on-surface hover:text-primary-container font-bold text-sm transition-all group"
    >
      <div className="text-outline group-hover:text-primary-container transition-colors">
        {icon}
      </div>
      {label}
    </Link>
  );
}

export function BottomNavBar() {
  const location = useLocation();
  const { t } = useConfig();
  
  const navItems = [
    { label: t("explore"), key: "explore", icon: Search, path: "/" },
    { label: t("learning"), key: "learning", icon: GraduationCap, path: "/learning" },
    { label: t("messages"), key: "messages", icon: MessageCircle, path: "/messages" },
    { label: t("profile"), key: "profile", icon: "/profile", path: "/profile", customIcon: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 pb-safe bg-surface/80 backdrop-blur-md border-t border-outline-variant/20 shadow-[0_-4px_12px_0_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.key}
            to={item.path} 
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-150 active:scale-90",
              isActive ? "text-primary-container" : "text-outline/60 hover:text-primary-container/70"
            )}
          >
            {item.customIcon ? (
              <User size={24} fill={isActive ? "currentColor" : "none"} />
            ) : (
              <item.icon size={24} fill={isActive ? "currentColor" : "none"} />
            )}
            <span className={cn("text-[11px] font-medium mt-0.5", isActive && "font-bold")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function VerificationBadge({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn(
      "bg-white/90 backdrop-blur-md rounded-full flex items-center gap-1 shadow-sm", 
      size === "md" ? "px-2 py-1" : "px-1.5 py-0.5",
      className
    )}>
      <CheckCircle2 size={size === "md" ? 12 : 10} className="text-on-tertiary-container" fill="currentColor" />
      <span className={cn(
        "text-on-tertiary-container font-bold uppercase tracking-wider",
        size === "md" ? "text-[10px]" : "text-[8px]"
      )}>Verified</span>
    </div>
  );
}
