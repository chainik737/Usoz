import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  ShieldCheck, 
  AlertCircle, 
  Activity, 
  MessageSquare, 
  ArrowRight,
  UserCheck,
  UserX,
  Search,
  GraduationCap,
  FileText
} from "lucide-react";
import { TopAppBar, BottomNavBar } from "@/src/components/Navigation";
import { useAuth } from "@/src/components/FirebaseProvider";
import { db } from "@/src/lib/firebase";
import { collection, query, getDocs, doc, updateDoc, where, serverTimestamp } from "firebase/firestore";
import { cn } from "@/src/lib/utils";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'tutors' | 'reports' | 'applications'>('users');
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const uSnap = await getDocs(query(collection(db, "users")));
        const usersData = uSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        setUsers(usersData);

        const appsData = usersData.filter((u: any) => u.verificationStatus === 'pending');
        setApplications(appsData);

        const rSnap = await getDocs(query(collection(db, "reports"), where("status", "==", "pending")));
        const reportsData = await Promise.all(rSnap.docs.map(async (docSnap) => {
          const report = docSnap.data();
          const targetUser = usersData.find((u: any) => u.id === report.reportedId);
          const reporterUser = usersData.find((u: any) => u.id === report.reporterId);
          return {
            id: docSnap.id,
            ...report,
            targetName: targetUser?.name || "Unknown",
            targetImage: targetUser?.imageUrl,
            reporterName: reporterUser?.name || "Unknown"
          };
        }));
        setReports(reportsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleResolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, "reports", reportId), { status: "resolved" });
      setReports(reports.filter(r => r.id !== reportId));
    } catch (err) {
      alert("Failed to resolve report");
    }
  };

  const handleApproveTutor = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { 
        role: "tutor",
        isVerified: true,
        verificationStatus: "verified",
        updatedAt: serverTimestamp()
      });
      setApplications(applications.filter(a => a.id !== userId));
      setUsers(users.map(u => u.id === userId ? { ...u, role: "tutor", isVerified: true, verificationStatus: "verified" } : u));
    } catch (err) {
      alert("Failed to approve tutor");
    }
  };

  const handleRejectTutor = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { 
        verificationStatus: "rejected", 
        role: "student", // Revert to student if they were pending_tutor
        updatedAt: serverTimestamp() 
      });
      setApplications(applications.filter(a => a.id !== userId));
      setUsers(users.map(u => u.id === userId ? { ...u, role: "student", verificationStatus: "rejected" } : u));
    } catch (err) {
      alert("Failed to reject tutor");
    }
  };

  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), { isVerified: !currentStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, isVerified: !currentStatus } : u));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="w-10 h-10 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div></div>;

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-10 text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-2xl font-black text-on-surface uppercase italic tracking-tighter">Admin Access Required</h1>
        <p className="text-sm text-outline font-medium">This area is restricted to system administrators.</p>
        <button onClick={() => navigate("/")} className="px-8 py-4 bg-on-surface text-white rounded-2xl font-bold uppercase text-xs tracking-widest">Back Home</button>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(u => {
    if (activeTab === 'tutors') return u.role === 'tutor';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8faff] pb-32">
      <TopAppBar title="Admin Panel" showBack onBack={() => navigate(-1)} />
      
      <main className="pt-24 px-6 max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-on-surface uppercase italic tracking-tighter">System Control</h2>
            <p className="text-[10px] font-black text-outline uppercase tracking-widest">{users.length} Total Platform Users</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm flex items-center gap-3 border border-slate-100">
            <Search size={18} className="text-outline" />
            <input 
              placeholder="Search users..." 
              className="bg-transparent border-none outline-none text-xs font-bold text-on-surface w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <section className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={16}/>} label="All Users" />
          <TabButton active={activeTab === 'tutors'} onClick={() => setActiveTab('tutors')} icon={<UserCheck size={16}/>} label="Mentors" />
          <TabButton active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} icon={<GraduationCap size={16}/>} label={`Applications (${applications.length})`} />
          <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<AlertCircle size={16}/>} label="Reports" />
        </section>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-3xl" />)
          ) : activeTab === 'reports' ? (
            reports.length === 0 ? (
              <div className="bg-white p-10 rounded-[2.5rem] text-center border border-slate-100">
                <p className="text-sm font-bold text-outline">No pending reports found.</p>
              </div>
            ) : (
              reports.map(report => (
                <motion.div 
                  layout
                  key={report.id} 
                  className="bg-white p-5 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-red-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-red-50 p-3 rounded-2xl text-red-500">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-on-surface uppercase italic tracking-tighter">
                        Reported: {report.targetName}
                      </h4>
                      <p className="text-[10px] font-bold text-outline">Reason: {report.reason}</p>
                      <p className="text-[8px] font-black text-primary mt-1 uppercase tracking-widest">By: {report.reporterName}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleResolveReport(report.id)}
                    className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-600/5 active:scale-95"
                  >
                    Resolve
                  </button>
                </motion.div>
              ))
            )
          ) : activeTab === 'applications' ? (
            applications.length === 0 ? (
              <div className="bg-white p-10 rounded-[2.5rem] text-center border border-slate-100">
                <p className="text-sm font-bold text-outline">No pending applications found.</p>
              </div>
            ) : (
              applications.map(app => (
                <motion.div 
                  layout
                  key={app.id} 
                  className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col gap-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden relative">
                        <img src={app.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.name}`} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                        <h4 className="font-black text-on-surface uppercase italic tracking-tighter">{app.name}</h4>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest mt-0.5">{app.university || "No Univ."}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => handleRejectTutor(app.id)}
                         className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                       >Reject</button>
                       <button 
                         onClick={() => handleApproveTutor(app.id)}
                         className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-center"
                       >Approve</button>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Subjects</p>
                      <div className="flex flex-wrap gap-1">
                        {app.subjects?.map((s: string) => (
                          <span key={s} className="bg-white px-2 py-1 rounded-md text-[8px] font-bold text-on-surface border border-slate-200">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Rate & Experience</p>
                      <p className="text-xs font-bold text-on-surface">{app.price}₸/hr • {app.experience || "No exp."}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Bio / Portfolio</p>
                      <p className="text-xs text-on-surface-variant font-medium leading-relaxed italic">"{app.bio || "No bio provided"}"</p>
                    </div>
                    <div className="col-span-2">
                       <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Payment QR & Attachments</p>
                       <div className="flex flex-wrap gap-2">
                         {app.paymentQr && (
                           <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 text-[10px] font-bold text-emerald-700">
                             <div className="w-6 h-6 rounded bg-white overflow-hidden border border-emerald-100">
                               <img src={app.paymentQr.preview} className="w-full h-full object-contain" alt="" />
                             </div>
                             Kaspi QR
                           </div>
                         )}
                         {app.applicationFiles?.map((f: any, i: number) => (
                           <a 
                             key={i} 
                             href={f.url} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 text-[10px] font-bold hover:bg-primary/5 transition-all"
                           >
                             <FileText size={12} className="text-primary" /> {f.name}
                           </a>
                         ))}
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )
          ) : (
            filteredUsers.map((user) => (
              <motion.div 
                layout
                key={user.id} 
                className="bg-white p-5 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden relative">
                    <img src={user.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-full h-full object-cover" alt="" />
                    {user.role === 'admin' && <div className="absolute top-0 right-0 p-1 bg-primary text-white rounded-bl-xl"><ShieldCheck size={12}/></div>}
                  </div>
                  <div>
                    <h4 className="font-black text-on-surface uppercase italic tracking-tighter">{user.name || "Unnamed User"}</h4>
                    <p className="text-[10px] font-bold text-outline lowercase">{user.email}</p>
                    <div className="flex gap-2 mt-1">
                       <span className={cn(
                         "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest",
                         user.role === 'tutor' ? "bg-primary-container text-white" : "bg-slate-100 text-outline"
                       )}>{user.role || 'student'}</span>
                       {user.isVerified && <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">Verified</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user.role === 'tutor' && (
                    <button 
                      onClick={() => handleToggleVerify(user.id, user.isVerified)}
                      className={cn(
                        "p-3 rounded-2xl transition-all active:scale-90",
                        user.isVerified ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"
                      )}
                    >
                      {user.isVerified ? <UserX size={20}/> : <UserCheck size={20}/>}
                    </button>
                  )}
                  <button className="p-3 bg-slate-50 text-outline rounded-2xl hover:bg-on-surface hover:text-white transition-all">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all",
        active ? "bg-white text-on-surface shadow-sm" : "text-outline/60 hover:text-on-surface"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
