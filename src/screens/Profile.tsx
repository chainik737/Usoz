import { useState, useEffect } from "react";
import { TopAppBar, BottomNavBar } from "@/src/components/Navigation";
import { 
  User as UserIcon, 
  Settings, 
  HelpCircle, 
  LogOut, 
  CheckCircle2, 
  ChevronRight, 
  Verified, 
  Briefcase,
  Smartphone,
  Wallet,
  Settings2,
  Calendar as CalendarIcon,
  ShieldCheck,
  Plus,
  Save,
  X,
  GraduationCap,
  Hourglass,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/components/FirebaseProvider";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, signOut, storage, ref, uploadBytes, getDownloadURL } from "@/src/lib/firebase";

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Profile State
  const [profileImage, setProfileImage] = useState("");
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [bio, setBio] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [paymentQr, setPaymentQr] = useState<any>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [paymentQrFile, setPaymentQrFile] = useState<File | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileImage(profile.imageUrl || "");
      setName(profile.name || "");
      setUniversity(profile.university || "");
      setBio(profile.bio || "");
      setSubjects(profile.subjects || []);
      setPaymentQr(profile.paymentQr || null);
    }
  }, [profile]);

  // Backup for cancellation
  const [backup, setBackup] = useState<any>(null);

  const startEditing = () => {
    setBackup({ name, university, bio, subjects: [...subjects], profileImage, paymentQr });
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (backup) {
      setName(backup.name);
      setUniversity(backup.university);
      setBio(backup.bio);
      setSubjects(backup.subjects);
      setProfileImage(backup.profileImage);
      setPaymentQr(backup.paymentQr);
    }
    setIsEditing(false);
    setBackup(null);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      let finalImageUrl = profileImage;
      let finalPaymentQr = paymentQr;

      // Upload profile image if new
      if (profileImageFile) {
        const imageRef = ref(storage, `profile_images/${user.uid}/${Date.now()}_${profileImageFile.name}`);
        const uploadResult = await uploadBytes(imageRef, profileImageFile);
        finalImageUrl = await getDownloadURL(uploadResult.ref);
      }

      // Upload payment QR if new
      if (paymentQrFile) {
        const qrRef = ref(storage, `tutor_qrs/${user.uid}/${Date.now()}_${paymentQrFile.name}`);
        const uploadResult = await uploadBytes(qrRef, paymentQrFile);
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        finalPaymentQr = { name: paymentQrFile.name, preview: downloadUrl };
      }

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        name,
        university,
        bio,
        subjects,
        imageUrl: finalImageUrl,
        paymentQr: finalPaymentQr,
        updatedAt: serverTimestamp(),
      });
      setIsEditing(false);
      setBackup(null);
      setProfileImageFile(null);
      setPaymentQrFile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const addSubject = () => {
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const removeSubject = (sub: string) => {
    setSubjects(subjects.filter(s => s !== sub));
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <TopAppBar />
      <main className="pt-20 px-5 max-w-2xl mx-auto">
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8 flex flex-col items-center text-center relative overflow-hidden">

          <div className="relative mb-6 group">
            <div className="w-24 h-24 rounded-full border-4 border-surface-container-high overflow-hidden shadow-md relative">
              <img 
                className="w-full h-full object-cover" 
                src={profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1480&auto=format&fit=crop"} 
                alt="Profile" 
                referrerPolicy="no-referrer"
              />
              {isEditing && (
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity group-hover:bg-black/60">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProfileImage(URL.createObjectURL(file));
                        setProfileImageFile(file);
                      }
                    }} 
                  />
                  <Plus size={24} className="text-white" />
                </label>
              )}
            </div>
            {!isEditing && (
              <div className="absolute bottom-0 right-0 bg-tertiary-fixed-dim text-white p-1 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                <CheckCircle2 size={16} fill="white" className="text-emerald-500" />
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="w-full space-y-4 px-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-1">Display Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-base font-bold focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all"
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-1">University</label>
                <input 
                  type="text" 
                  value={university} 
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all"
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-on-surface tracking-tight">{name}</h2>
              <div className="mt-1">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-secondary-container/20 text-on-secondary-container px-3 py-1 rounded-full border border-secondary-container/10">
                  {university || "Set University"}
                </span>
              </div>
              <button 
                onClick={startEditing}
                className="mt-4 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-on-surface rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2"
              >
                <Settings2 size={14} />
                Edit Profile
              </button>
            </>
          )}
          
          <div className="mt-8 flex gap-4 w-full">
            <div className="flex-1 bg-surface-container-low p-4 rounded-xl border border-slate-50 transition-all hover:bg-white hover:shadow-md cursor-default text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Courses</p>
              <p className="text-2xl font-bold text-primary-container">0</p>
            </div>
            <div className="flex-1 bg-surface-container-low p-4 rounded-xl border border-slate-50 transition-all hover:bg-white hover:shadow-md cursor-default text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Hours</p>
              <p className="text-2xl font-bold text-primary-container">0</p>
            </div>
          </div>

          <div className="w-full mt-8 pt-8 border-t border-slate-50 space-y-6 text-left">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Academic Bio</p>
              {isEditing ? (
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 min-h-[100px] text-sm font-medium leading-relaxed outline-none focus:border-primary-container transition-all"
                  placeholder="Tell us about your academic journey..."
                />
              ) : (
                <p className="text-sm text-on-surface-variant leading-relaxed italic">"{bio || "Adding a bio helps tutors and students find you."}"</p>
              )}
            </div>
            
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleCancel}
                  className="flex-1 py-3 border border-slate-200 text-on-surface rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all text-center"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-[2] py-3 bg-primary-container text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary-container/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={14} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Subject Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(sub => (
                    <span key={sub} className="bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-primary/10 flex items-center gap-2">
                      {sub}
                      {isEditing && (
                        <button onClick={() => removeSubject(sub)}>
                          <X size={10} className="hover:text-red-500" />
                        </button>
                      )}
                    </span>
                  ))}
                  {isEditing && (
                    <div className="w-full flex gap-2 mt-2">
                      <input 
                        type="text"
                        placeholder="Add subject..."
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSubject()}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:border-primary-container"
                      />
                      <button 
                        onClick={addSubject}
                        className="px-3 bg-surface-container text-primary-container rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-primary-container/10 transition-all border border-primary-container/10"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {(isEditing && (profile?.role === 'tutor' || profile?.isVerified)) && (
                <div className="space-y-3 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Payment QR Code</p>
                  <div className="flex flex-col gap-3">
                    {paymentQr ? (
                      <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                        <img src={paymentQr.preview} className="w-full h-full object-cover" alt="QR" />
                        <button 
                          onClick={() => setPaymentQr(null)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-32 h-32 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all">
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPaymentQr({
                                name: file.name,
                                preview: URL.createObjectURL(file)
                              });
                              setPaymentQrFile(file);
                            }
                          }} 
                        />
                        <Plus size={20} className="text-outline" />
                        <span className="text-[8px] font-black uppercase text-outline">Upload QR</span>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
        </section>

        <AnimatePresence mode="wait">
          {!isEditing && (
            <motion.div 
              key="profile-menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {profile?.role === 'admin' && (
                <div className="md:col-span-2">
                  <MenuCard 
                    onClick={() => navigate("/admin")} 
                    icon={<ShieldCheck size={20}/>} 
                    title="Control Center" 
                    sub="System reports & user management" 
                    color="bg-on-surface text-white shadow-lg shadow-on-surface/20" 
                  />
                </div>
              )}
              {profile?.role === 'tutor' && (
                <div className="md:col-span-2">
                  <MenuCard 
                    onClick={() => navigate("/tutor-dashboard")} 
                    icon={<CalendarIcon size={20}/>} 
                    title="Mentor Dashboard" 
                    sub="Manage schedule & availability" 
                    color="bg-primary-container text-white shadow-lg shadow-primary-container/20" 
                  />
                </div>
              )}
              <MenuCard 
                onClick={() => navigate("/learning")} 
                icon={<CalendarIcon size={20}/>} 
                title="Lesson History" 
                sub="Your past and upcoming sessions" 
                color="bg-amber-100 text-amber-600 shadow-sm" 
              />
              <MenuCard onClick={() => setIsEditing(true)} icon={<UserIcon size={20}/>} title="Personal Info" sub="Account details & contact" color="bg-primary-container/10 text-primary-container" />
              
              {profile?.verificationStatus === 'pending' ? (
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-center gap-4 text-left shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                    <Hourglass size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-on-surface leading-tight">Verification Pending</h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">Your mentor application is being reviewed.</p>
                  </div>
                </div>
              ) : profile?.role === 'tutor' || profile?.isVerified ? (
                <MenuCard icon={<Verified size={20}/>} title="Verified Mentor" sub="Your account is fully verified" color="bg-emerald-100 text-emerald-600" />
              ) : (
                <MenuCard 
                  onClick={() => navigate("/verification")} 
                  icon={<GraduationCap size={20}/>} 
                  title="Become a Mentor" 
                  sub="Verify your skills & start teaching" 
                  color="bg-primary-container text-white shadow-lg shadow-primary-container/20" 
                />
              )}
              
              <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Wallet size={20} className="text-primary-container" />
                  <h3 className="font-bold text-lg text-on-surface">Payment Methods</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                        <Smartphone size={20} className="text-red-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Kaspi QR</p>
                        <p className="text-[9px] uppercase tracking-widest text-outline font-bold">Default Payment</p>
                      </div>
                    </div>
                    <CheckCircle2 size={20} className="text-emerald-500" fill="currentColor" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                        <Briefcase size={20} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Cash</p>
                        <p className="text-[9px] uppercase tracking-widest text-outline font-bold">Pay in Person</p>
                      </div>
                    </div>
                    <button className="text-primary-container text-[10px] font-bold uppercase tracking-widest hover:underline px-2 py-1">Select</button>
                  </div>
                </div>
              </div>

              <MenuCard onClick={() => navigate("/settings")} icon={<Settings size={20}/>} title="Settings" sub="App preferences & security" color="bg-slate-100 text-slate-600" />
              <MenuCard onClick={() => navigate("/help")} icon={<HelpCircle size={20}/>} title="Help & Support" sub="FAQs & support" color="bg-slate-100 text-slate-600" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 mb-12 text-center overflow-hidden">
          <button 
            onClick={handleLogout}
            className="px-10 py-4 bg-red-50 text-red-600 rounded-full font-bold text-sm transition-all active:scale-95 flex items-center gap-3 mx-auto shadow-sm hover:shadow-md border border-red-100"
          >
            <LogOut size={20} /> Log Out
          </button>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

function MenuCard({ icon, title, sub, color, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="bg-white rounded-2xl p-6 border border-slate-100 flex items-center gap-4 text-left transition-all hover:shadow-md active:scale-[0.98] group shadow-sm"
    >
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors group-hover:scale-110", color)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-base text-on-surface leading-tight">{title}</h3>
        <p className="text-xs text-on-surface-variant font-medium mt-0.5">{sub}</p>
      </div>
      <ChevronRight size={20} className="text-slate-300 group-hover:text-primary-container transition-colors shrink-0" />
    </button>
  );
}
