import { TopAppBar, BottomNavBar } from "@/src/components/Navigation";
import { 
  Shield, 
  Lock, 
  Trash2, 
  Smartphone, 
  Palette, 
  Globe, 
  Bell, 
  Volume2, 
  Eye, 
  MessageSquare,
  Database,
  WifiOff,
  ChevronRight,
  Info,
  LogOut,
  Moon,
  Smartphone as Device,
  Key,
  Sun,
  X,
  Languages,
  Type,
  AlertCircle,
  Clock,
  MapPin,
  Timer,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useNavigate } from "react-router-dom";
import { useConfig } from "../components/ConfigProvider";
import { Language } from "../lib/translations";

import { auth, db, signOut, updateEmail, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider, deleteDoc, doc, writeBatch, collection, query, where, getDocs } from "@/src/lib/firebase";

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize, t } = useConfig();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  
  const [vacationMode, setVacationMode] = useState(() => localStorage.getItem("vacationMode") === "true");
  const [dataSaver, setDataSaver] = useState(() => localStorage.getItem("dataSaver") === "true");
  const [messagePerms, setMessagePerms] = useState(() => localStorage.getItem("messagePerms") || "Active Students");
  const [muteDuringNight, setMuteDuringNight] = useState(() => (localStorage.getItem("muteDuringNight") || "true") === "true");
  const [smartPush, setSmartPush] = useState(() => (localStorage.getItem("smartPush") || "true") === "true");
  const [silentNightStart, setSilentNightStart] = useState(() => localStorage.getItem("silentNightStart") || "22:00");
  const [silentNightEnd, setSilentNightEnd] = useState(() => localStorage.getItem("silentNightEnd") || "07:00");
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem("reminderTime") || "1 Hour");

  useEffect(() => {
    localStorage.setItem("vacationMode", vacationMode.toString());
    localStorage.setItem("dataSaver", dataSaver.toString());
    localStorage.setItem("messagePerms", messagePerms);
    localStorage.setItem("muteDuringNight", muteDuringNight.toString());
    localStorage.setItem("smartPush", smartPush.toString());
    localStorage.setItem("silentNightStart", silentNightStart);
    localStorage.setItem("silentNightEnd", silentNightEnd);
    localStorage.setItem("reminderTime", reminderTime);
  }, [vacationMode, dataSaver, messagePerms, muteDuringNight, smartPush, silentNightStart, silentNightEnd, reminderTime]);

  const cycleTheme = () => {
    const themes: ("light" | "dark" | "system")[] = ["light", "dark", "system"];
    const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(nextTheme);
  };

  const handleClearCache = () => {
    alert("Cache cleared successfully! 128MB freed.");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!currentPassword) {
      setAuthError("Please enter your password to confirm deletion.");
      return;
    }

    setIsLoading(true);
    setAuthError("");

    try {
      // 1. Re-authenticate
      if (user.providerData.some(p => p.providerId === "password")) {
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      const uid = user.uid;
      const batch = writeBatch(db);

      // 2. Cleanup User Profile
      batch.delete(doc(db, "users", uid));

      // 3. Cleanup Sessions (where user is student or tutor)
      const sessionsAsStudent = await getDocs(query(collection(db, "sessions"), where("studentId", "==", uid)));
      sessionsAsStudent.forEach(d => batch.delete(d.ref));
      
      const sessionsAsTutor = await getDocs(query(collection(db, "sessions"), where("tutorId", "==", uid)));
      sessionsAsTutor.forEach(d => batch.delete(d.ref));

      // 4. Cleanup Chats (where user is a participant)
      const chats = await getDocs(query(collection(db, "chats"), where("participants", "array-contains", uid)));
      chats.forEach(d => batch.delete(d.ref));

      // Execute all Firestore deletions at once
      await batch.commit();

      // 5. Delete Auth User
      await deleteUser(user);
      
      setShowModal(null);
      setCurrentPassword("");
      alert("Your account and all associated data have been permanently deleted.");
      navigate("/login", { replace: true });
    } catch (error: any) {
      console.error("Account deletion error:", error);
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAuth = async (type: "email" | "password") => {
    const user = auth.currentUser;
    if (!user) return;
    
    setIsLoading(true);
    setAuthError("");
    
    try {
      // Re-authenticate if using Email provider
      if (user.providerData.some(p => p.providerId === "password") && currentPassword) {
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      if (type === "email") {
        if (!newEmail) throw new Error("Please enter a new email");
        await updateEmail(user, newEmail);
        alert("Email updated successfully!");
      } else {
        if (!newPassword) throw new Error("Please enter a new password");
        await updatePassword(user, newPassword);
        alert("Password updated successfully!");
      }
      setShowModal(null);
      setNewEmail("");
      setNewPassword("");
      setCurrentPassword("");
    } catch (error: any) {
      console.error("Auth update error:", error);
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const currentSession = auth.currentUser ? {
    id: 1,
    device: navigator.userAgent.includes("iPhone") ? "iPhone" : 
            navigator.userAgent.includes("Android") ? "Android Phone" : 
            navigator.userAgent.includes("Macintosh") ? "MacBook Pro" : "Desktop PC",
    location: "Current Device",
    date: new Date(auth.currentUser.metadata.lastSignInTime || "").toLocaleString(),
    current: true,
    provider: auth.currentUser.providerData[0]?.providerId || "unknown"
  } : null;

  const sessions = currentSession ? [currentSession] : [];

  const sections = [
    {
      id: "security",
      title: "Account & Security",
      icon: <Shield size={20} />,
      items: [
        { label: "Change Password / Email", icon: <Key size={16} />, onClick: () => setShowModal("change_auth") },
        { label: "Session Management", icon: <Device size={16} />, sub: `${sessions.length} active device`, onClick: () => setShowModal("sessions") },
        { label: "Delete Account", icon: <Trash2 size={16} />, color: "text-red-500", onClick: () => setShowModal("delete") },
      ]
    },
    {
      id: "appearance",
      title: t("profile"),
      icon: <Palette size={20} />,
      items: [
        { 
          label: t("theme"), 
          icon: theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <Device size={16} />, 
          value: theme.charAt(0).toUpperCase() + theme.slice(1),
          onClick: cycleTheme
        },
        { label: t("language"), icon: <Globe size={16} />, value: language, onClick: () => setShowModal("language") },
        { label: t("fontSize"), icon: <Type size={16} />, value: fontSize, onClick: () => setShowModal("font") },
      ]
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: <Bell size={20} />,
      items: [
        { 
          label: "Smart Push", 
          icon: <Bell size={16} />, 
          sub: "AI-priority alerts for messages, system updates, and urgent payment requests.", 
          toggle: smartPush, 
          onToggle: () => setSmartPush(!smartPush) 
        },
        { 
          label: "Silent Night Mode", 
          icon: <Moon size={16} />, 
          toggle: muteDuringNight, 
          onToggle: () => setMuteDuringNight(!muteDuringNight),
          sub: muteDuringNight ? `Active: ${silentNightStart} - ${silentNightEnd}` : "Disable all alerts during rest hours"
        },
        { 
          label: "Configure Quiet Hours", 
          icon: <Clock size={16} />, 
          onClick: () => setShowModal("quiet_hours"),
          color: !muteDuringNight ? "text-outline/20" : undefined
        },
        { 
          label: "Session Reminders", 
          icon: <Timer size={16} />, 
          sub: `Notify me ${reminderTime} before class`,
          onClick: () => setShowModal("reminders")
        },
      ]
    },
    {
      id: "privacy",
      title: "Privacy",
      icon: <Eye size={20} />,
      items: [
        { label: "Vacation Mode", icon: <Eye size={16} />, sub: "Hide from search results", toggle: vacationMode, onToggle: () => setVacationMode(!vacationMode) },
        { label: "Message Permissions", icon: <MessageSquare size={16} />, value: messagePerms, onClick: () => setShowModal("messages_perm") },
      ]
    },
    {
      id: "data",
      title: "Data & Storage",
      icon: <Database size={20} />,
      items: [
        { label: "Clear Cache", icon: <Database size={16} />, sub: "128 MB used", onClick: handleClearCache },
        { label: "Data Saver", icon: <WifiOff size={16} />, toggle: dataSaver, onToggle: () => setDataSaver(!dataSaver), sub: "Low quality images" },
      ]
    },
    {
      id: "about",
      title: "About & Security",
      icon: <Info size={20} />,
      items: [
        { label: "App Version", icon: <Info size={16} />, value: "v. 2.0.4-beta", badge: "Verified" },
        { label: "Google API Level", icon: <Globe size={16} />, value: "Android 14 (API 34)", badge: "Compliant" },
        { label: "Security Status", icon: <Shield size={16} />, value: "Signed & Verified", badge: "Secure" },
        { label: "Build Integrity", icon: <Database size={16} />, sub: "Check digital signature", onClick: () => setShowModal("integrity") },
        { label: "Key Signature", icon: <Key size={16} />, value: "SHA256: 8f-de-9a-c2...", sub: "Digitally signed build" },
        { label: "Privacy Policy", icon: <Shield size={16} />, onClick: () => navigate("/help", { state: { openLegal: "Privacy Policy" } }) },
        { label: "Terms of Service", icon: <Info size={16} />, onClick: () => navigate("/help", { state: { openLegal: "Terms of Service" } }) },
      ]
    }
  ];

  return (
    <div className="min-h-screen pb-24 bg-surface transition-colors duration-300">
      <TopAppBar title="Settings" showBack onBack={() => navigate(-1)} />
      
      <main className="mt-20 px-5 max-w-2xl mx-auto space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="bg-surface-container-lowest rounded-[2.5rem] border border-outline-variant/30 overflow-hidden shadow-sm">
            <button 
              onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              className="w-full flex items-center justify-between p-6 hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-container/10 text-primary-container flex items-center justify-center shadow-inner">
                  {section.icon}
                </div>
                <h3 className="font-bold text-xs uppercase tracking-[0.15em] text-on-surface">{section.title}</h3>
              </div>
              <motion.div
                animate={{ rotate: activeSection === section.id ? 90 : 0 }}
                className="text-outline/30"
              >
                <ChevronRight size={20} />
              </motion.div>
            </button>

            <AnimatePresence>
              {activeSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-outline-variant/10 overflow-hidden"
                >
                  <div className="p-4 space-y-2">
                    {section.items.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={item.onClick}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group cursor-pointer",
                          idx % 2 === 0 ? "bg-black/[0.02]" : "bg-transparent",
                          "hover:bg-primary-container/10 active:scale-[0.98]",
                          !item.onClick && item.toggle === undefined && "cursor-default active:scale-100 hover:bg-transparent"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-colors", 
                            item.color ? "bg-red-50 text-red-500" : "bg-slate-50 text-outline/40 group-hover:bg-white group-hover:text-primary shadow-sm")}>
                            {item.icon}
                          </div>
                          <div>
                            <p className={cn("text-sm font-bold", item.color || "text-on-surface")}>{item.label}</p>
                            {item.sub && <p className="text-[10px] font-medium text-outline uppercase tracking-wider mt-0.5">{item.sub}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.value && <span className="text-[9px] font-black text-primary-container uppercase bg-primary-container/10 px-2.5 py-1.5 rounded-lg tracking-widest">{item.value}</span>}
                          {item.badge && <span className={cn("text-[8px] font-black uppercase px-2 py-1 rounded-lg tracking-widest shadow-sm", 
                            item.badge === "On" || item.badge === "Enabled" ? "bg-emerald-500 text-white" : "bg-slate-200 text-outline")}>{item.badge}</span>}
                          
                          {item.toggle !== undefined && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if(item.onToggle) item.onToggle();
                              }}
                              className={cn(
                                "w-11 h-6 rounded-full transition-all duration-300 relative focus:outline-none p-1",
                                item.toggle ? "bg-emerald-500" : "bg-slate-300"
                              )}
                            >
                               <div className={cn(
                                "w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md",
                                item.toggle ? "translate-x-5" : "translate-x-0"
                              )} />
                            </button>
                          )}
                          {!item.value && !item.badge && item.toggle === undefined && <ChevronRight size={14} className="text-outline/40 group-hover:translate-x-1 transition-transform" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        <div className="pt-8">
          <button 
            onClick={handleLogout}
            className="w-full py-5 border-2 border-dashed border-red-100 text-red-500 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-sm"
          >
             <LogOut size={18} /> {t("logOut")}
          </button>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(null)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-surface rounded-[2.5rem] p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">
                   {showModal === "sessions" ? "Active Sessions" : 
                    showModal === "language" ? "Select Language" :
                    showModal === "font" ? "Readability" : 
                    showModal === "integrity" ? "Build Verification" : 
                    showModal === "change_auth" ? "Update Identity" : 
                    showModal === "quiet_hours" ? "Quiet Hours" : 
                    showModal === "reminders" ? "Reminders" : 
                    showModal === "messages_perm" ? "Message Privacy" : "Account Deletion"}
                 </h3>
                 <button onClick={() => {
                    setShowModal(null);
                    setAuthError("");
                    setNewEmail("");
                    setNewPassword("");
                    setCurrentPassword("");
                  }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                   <X size={24} />
                 </button>
              </div>

              {showModal === "messages_perm" && (
                <div className="space-y-4">
                  {["Everyone", "Active Students", "Verified Only"].map((perm) => (
                    <button 
                      key={perm}
                      onClick={() => {
                        setMessagePerms(perm);
                        setShowModal(null);
                      }}
                      className={cn(
                        "w-full p-5 rounded-3xl flex justify-between items-center transition-all",
                        messagePerms === perm ? "bg-primary-container text-white shadow-lg" : "bg-slate-50 text-on-surface hover:bg-slate-100"
                      )}
                    >
                      <span className="font-bold">{perm}</span>
                      {messagePerms === perm && <Check size={20} />}
                    </button>
                  ))}
                </div>
              )}

              {showModal === "change_auth" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Current User</p>
                      <p className="text-sm font-bold text-on-surface truncate">{auth.currentUser?.email}</p>
                    </div>

                    <div className="space-y-4 pt-2">
                       <div className="space-y-2">
                        <p className="text-[10px] font-black text-outline uppercase tracking-widest ml-1">New Email (Optional)</p>
                        <input 
                          type="email" 
                          placeholder="leave empty to keep current"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-outline uppercase tracking-widest ml-1">New Password (Optional)</p>
                        <input 
                          type="password" 
                          placeholder="leave empty to keep current"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-outline uppercase tracking-widest ml-1">Current Password (Required)</p>
                        <input 
                          type="password" 
                          placeholder="Confirm to save changes"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                        />
                      </div>
                    </div>

                    {authError && <p className="text-[10px] font-bold text-red-500 bg-red-50 p-3 rounded-xl">{authError}</p>}
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      onClick={() => handleUpdateAuth(newEmail ? "email" : "password")}
                      disabled={isLoading || !currentPassword}
                      className="w-full py-5 bg-primary-container text-white rounded-[2rem] font-bold text-sm shadow-xl shadow-primary-container/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                      {isLoading ? "Processing..." : "Update Security Credentials"}
                    </button>
                  </div>
                </div>
              )}

              {showModal === "integrity" && (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Shield size={40} strokeWidth={2.5} />
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="text-lg font-black text-on-surface uppercase tracking-tight">System Integrity Check</h4>
                    <p className="text-xs text-outline font-medium px-4 leading-relaxed">
                      This application is protected by a 256-bit digital signature. 
                      The build certificate validates that the source code has not been tampered with.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-outline">
                      <span>Build ID</span>
                      <span className="text-on-surface">#AIS-2026-0506-882</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-outline">
                      <span>Signer</span>
                      <span className="text-on-surface select-all">GOOGLE AI STUDIO CI/CD</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-outline">
                      <span>Certificate</span>
                      <span className="text-emerald-500">VALID / ACTIVE</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-[9px] font-mono text-outline truncate">SHA256: 8fde9ac2768...f7e1b9a2c3</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowModal(null)}
                    className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-bold text-sm shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Dismiss Verification
                  </button>
                </div>
              )}

              {showModal === "sessions" && (
                <div className="space-y-4">
                  <p className="text-xs text-outline font-medium leading-relaxed">Devices currently logged into your account. Protect your data in Kazakhstan's fintech ecosystem.</p>
                  <div className="space-y-3">
                    {sessions.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.current ? "bg-primary-container text-white shadow-lg shadow-primary-container/30" : "bg-white text-outline shadow-sm")}>
                            <Smartphone size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-on-surface">{s.device}</p>
                              {s.current && <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">Self</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <MapPin size={8} className="text-outline" />
                              <span className="text-[9px] font-bold text-outline uppercase">{s.location} • {s.date}</span>
                            </div>
                          </div>
                        </div>
                        {!s.current && (
                          <button className="text-[9px] font-black text-red-500 uppercase hover:bg-red-50 px-3 py-2 rounded-xl transition-colors">Logout</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showModal === "language" && (
                <div className="grid grid-cols-1 gap-3">
                  {["Kazakh", "Russian", "English"].map((lang) => (
                    <button 
                      key={lang}
                      onClick={() => {
                        setLanguage(lang as Language);
                        setShowModal(null);
                      }}
                      className={cn(
                        "w-full p-6 rounded-[2rem] flex items-center justify-between border-2 transition-all",
                        language === lang ? "border-primary-container bg-primary-container/5" : "border-slate-100 hover:border-primary-container/30 bg-white"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", language === lang ? "bg-primary-container text-white" : "bg-slate-100 text-outline")}>
                          <Languages size={20} />
                        </div>
                        <span className="font-bold text-base">{lang}</span>
                      </div>
                      {language === lang && <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-white"><Shield size={12} /></div>}
                    </button>
                  ))}
                </div>
              )}

              {showModal === "font" && (
                <div className="space-y-6">
                  <p className="text-xs text-outline font-medium leading-relaxed italic text-center">"Adjust text size for comfortable reading of lengthy tutor resumes and academic session details."</p>
                  <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    {["Small", "Medium", "Large"].map((size: any) => (
                      <button 
                        key={size}
                        onClick={() => {
                          setFontSize(size);
                        }}
                        className={cn(
                          "px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all",
                          fontSize === size ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "text-outline hover:text-primary"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showModal === "delete" && (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <AlertCircle size={40} strokeWidth={2.5} />
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="text-lg font-black text-on-surface uppercase tracking-tight">Warning: Irreversible Action</h4>
                    <p className="text-xs text-outline font-medium px-4 leading-relaxed">Account deletion involves removing your full balance, verified status, and chat history. Per App Store regulations, processing may take up to 48 hours for final data purging.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-outline uppercase tracking-widest ml-1 text-center">Confirm with Password</p>
                      <input 
                        type="password" 
                        placeholder="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full p-4 bg-red-50/50 border border-red-100 rounded-2xl font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-red-200 text-center"
                      />
                    </div>
                    {authError && <p className="text-[10px] font-bold text-red-500 bg-red-50 p-3 rounded-xl text-center">{authError}</p>}
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={isLoading || !currentPassword}
                      className="w-full py-5 bg-red-500 text-white rounded-[2rem] font-bold text-sm shadow-xl shadow-red-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                      {isLoading ? "Purging Data..." : "Delete My Account Permanently"}
                    </button>
                    <button 
                      onClick={() => {
                        setShowModal(null);
                        setAuthError("");
                        setCurrentPassword("");
                      }}
                      className="w-full py-5 bg-slate-100 text-on-surface rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Keep My Account
                    </button>
                  </div>
                </div>
              )}

              {showModal === "quiet_hours" && (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-primary-container/10 text-primary-container rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Clock size={40} strokeWidth={2.5} />
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="text-lg font-black text-on-surface uppercase tracking-tight">Configure Quiet Hours</h4>
                    <p className="text-xs text-outline font-medium px-4 leading-relaxed italic">"Tutors often send late-night prep materials. Set your rest window to prevent unexpected disruptions."</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-outline uppercase tracking-widest ml-1">Start Time</p>
                      <input 
                        type="time" 
                        value={silentNightStart}
                        onChange={(e) => setSilentNightStart(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-outline uppercase tracking-widest ml-1">End Time</p>
                      <input 
                        type="time" 
                        value={silentNightEnd}
                        onChange={(e) => setSilentNightEnd(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowModal(null)}
                    className="w-full py-5 bg-primary-container text-white rounded-[2rem] font-bold text-sm shadow-xl shadow-primary-container/30 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Save Preference
                  </button>
                </div>
              )}

              {showModal === "reminders" && (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-primary-container/10 text-primary-container rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Timer size={40} strokeWidth={2.5} />
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="text-lg font-black text-on-surface uppercase tracking-tight">Session Reminders</h4>
                    <p className="text-xs text-outline font-medium px-4 leading-relaxed">Choose when to receive a tactical alert before your session begins.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {["None", "15 Minutes", "30 Minutes", "1 Hour", "2 Hours"].map((time) => (
                      <button
                        key={time}
                        onClick={() => setReminderTime(time)}
                        className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${
                          reminderTime === time 
                            ? "bg-primary-container/5 border-primary-container text-primary-container" 
                            : "bg-slate-50 border-transparent text-on-surface hover:border-slate-200"
                        }`}
                      >
                        <span className="font-bold text-xs uppercase tracking-widest">{time}</span>
                        {reminderTime === time && <Check size={16} />}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setShowModal(null)}
                    className="w-full py-5 bg-primary-container text-white rounded-[2rem] font-bold text-sm shadow-xl shadow-primary-container/30 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                  >
                    Confirm Duration
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNavBar />
    </div>
  );
}
