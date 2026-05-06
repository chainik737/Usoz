import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopAppBar, BottomNavBar } from "@/src/components/Navigation";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  ShieldCheck, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight, 
  Upload, 
  Trash2, 
  Plus, 
  X,
  FileCheck,
  Check,
  Home,
  Hourglass,
  DollarSign,
  History,
  Smartphone
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/components/FirebaseProvider";
import { db, storage, ref, uploadBytes, getDownloadURL } from "@/src/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function VerificationScreen() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [others, setOthers] = useState<string[]>([]);
  const [newOther, setNewOther] = useState("");
  const [files, setFiles] = useState<{file: File, preview?: string}[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrCode, setQrCode] = useState<{file: File, preview: string} | null>(null);

  // Profile Details State
  const [price, setPrice] = useState("5000");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");

  const expertiseOptions = ["SAT Prep", "IELTS Intensive", "TOEFL Prep", "ACT Boot", "Math (All levels)", "Physics (A-Level)", "Chemistry", "Biology", "Calculus", "Linear Algebra", "English Literature", "Critical Writing"];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((f: File) => ({
        file: f,
        preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    const file = files[index];
    if (file.preview) URL.revokeObjectURL(file.preview);
    setFiles(files.filter((_, i) => i !== index));
  };

  const toggleExpertise = (exp: string) => {
    if (selectedExpertise.includes(exp)) {
      setSelectedExpertise(selectedExpertise.filter(e => e !== exp));
    } else {
      setSelectedExpertise([...selectedExpertise, exp]);
    }
  };

  const addOtherExpertise = () => {
    if (newOther.trim() && !others.includes(newOther.trim())) {
      setOthers([...others, newOther.trim()]);
      setNewOther("");
    }
  };

  const submitApplication = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // 1. Upload QR Code to Storage if exists
      let qrData = null;
      if (qrCode) {
        const qrRef = ref(storage, `tutor_qrs/${user.uid}/${Date.now()}_${qrCode.file.name}`);
        const uploadResult = await uploadBytes(qrRef, qrCode.file);
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        qrData = { name: qrCode.file.name, preview: downloadUrl };
      }

      // 2. Upload Credential Files to Storage
      const uploadedFiles = await Promise.all(
        files.map(async ({ file }) => {
          const fileRef = ref(storage, `tutor_credentials/${user.uid}/${Date.now()}_${file.name}`);
          const uploadResult = await uploadBytes(fileRef, file);
          const downloadUrl = await getDownloadURL(uploadResult.ref);
          return { 
            name: file.name, 
            size: (file.size / 1024 / 1024).toFixed(1) + "MB",
            url: downloadUrl 
          };
        })
      );

      // 3. Update Firestore Profile
      const allSubjects = [...selectedExpertise, ...others];
      
      await updateDoc(doc(db, "users", user.uid), {
        verificationStatus: 'pending',
        role: profile?.role === 'admin' ? 'admin' : 'pending_tutor',
        price: parseInt(price),
        experience: experience,
        bio: bio,
        subjects: allSubjects,
        paymentQr: qrData,
        applicationFiles: uploadedFiles,
        appliedAt: serverTimestamp()
      });

      setIsSubmitted(true);
      // Mock sound
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.volume = 0.2;
        audio.play().catch(() => {});
      } catch (e) {}
    } catch (error) {
      console.error("Error submitting verification:", error);
      alert("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <TopAppBar title="Tutor Verification" showBack onBack={() => navigate('/profile')} />
      <main className="mt-20 px-5 max-w-2xl mx-auto">
        
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-center gap-12 pt-4">
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    step >= 1 ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                  )}>1</div>
                  <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Expertise</span>
                </div>
                <div className="w-12 h-px bg-slate-200" />
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    step >= 3 ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                  )}>3</div>
                  <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Credentials</span>
                </div>
              </div>

              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-black text-on-surface">What do you teach?</h2>
                    <p className="text-sm text-outline font-medium mt-2">Select your areas of specialization.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {expertiseOptions.map(exp => (
                      <button 
                        key={exp}
                        onClick={() => toggleExpertise(exp)}
                        className={cn(
                          "p-4 rounded-2xl border-2 font-bold text-sm transition-all text-left flex justify-between items-center",
                          selectedExpertise.includes(exp) ? "border-primary bg-primary/5 text-primary" : "border-outline-variant/30 text-on-surface-variant hover:border-primary/30"
                        )}
                      >
                        {exp}
                        {selectedExpertise.includes(exp) && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">Other Subjects</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {others.map(o => (
                        <span key={o} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2">
                          {o} <button onClick={() => setOthers(others.filter(x => x !== o))}><X size={14}/></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Add others (e.g. Piano, Kazakh)..."
                        className="flex-1 bg-white border border-outline-variant p-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/10 outline-none"
                        value={newOther}
                        onChange={(e) => setNewOther(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addOtherExpertise()}
                      />
                      <button onClick={addOtherExpertise} className="bg-primary text-white px-6 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">Add</button>
                    </div>
                  </div>

                  <button 
                    disabled={selectedExpertise.length === 0 && others.length === 0}
                    onClick={() => setStep(2)}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Continue <ArrowRight size={20} />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-black text-on-surface">Experience & Rates</h2>
                    <p className="text-sm text-outline font-medium mt-2">Tell us about your teaching history and set your hourly rate.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-[10px] font-black text-outline uppercase tracking-widest ml-1">
                        <History size={12} /> Years of Experience
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. 5 years as Math Olympiad coach"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full bg-white border border-outline-variant p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/10 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-[10px] font-black text-outline uppercase tracking-widest ml-1">
                        <DollarSign size={12} /> Hourly Rate (₸)
                      </label>
                      <input 
                        type="number"
                        placeholder="5000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-white border border-outline-variant p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/10 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5 pt-4">
                      <label className="flex items-center gap-2 text-[10px] font-black text-outline uppercase tracking-widest ml-1">
                        <Smartphone size={12} /> Payment QR Code (Kaspi QR)
                      </label>
                      <div className="flex flex-col gap-3">
                        <label className="border-2 border-dashed border-outline-variant rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all">
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setQrCode({
                                  file: file,
                                  preview: URL.createObjectURL(file)
                                });
                              }
                            }} 
                          />
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <Upload size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-on-surface">Upload Payment QR</p>
                            <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-0.5">Students will scan this to pay</p>
                          </div>
                        </label>
                        
                        {qrCode && (
                          <div className="flex justify-between items-center p-3 bg-white border border-emerald-100 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100">
                                <img src={qrCode.preview} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-on-surface truncate max-w-[150px]">{qrCode.file.name}</p>
                                <p className="text-[9px] text-emerald-600 font-bold uppercase">Ready to upload</p>
                              </div>
                            </div>
                            <button onClick={() => setQrCode(null)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-[10px] font-black text-outline uppercase tracking-widest ml-1">
                        <FileText size={12} /> Short Portfolio Bio
                      </label>
                      <textarea 
                        placeholder="Highlight your best achievements..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-white border border-outline-variant p-4 rounded-xl text-sm font-medium min-h-[120px] focus:ring-2 focus:ring-primary/10 outline-none text-left"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="flex-1 py-4 border border-outline-variant rounded-2xl font-bold text-xs uppercase tracking-widest text-outline">Back</button>
                    <button 
                      disabled={!experience || !price || !bio}
                      onClick={() => setStep(3)}
                      className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-black text-on-surface">Upload Credentials</h2>
                    <p className="text-sm text-outline font-medium mt-2">Upload your diplomas, certificates or score reports (PDF/JPG).</p>
                  </div>

                  <div className="space-y-4">
                    <label className="border-2 border-dashed border-outline-variant rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all">
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                         <Upload size={28} />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">Drop files here or browse</p>
                        <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1">Maximum size 10MB per file</p>
                      </div>
                    </label>

                    {files.length > 0 && (
                      <div className="space-y-2">
                        {files.map((file, i) => (
                          <div key={i} className="flex justify-between items-center p-4 bg-white border border-outline-variant/30 rounded-2xl shadow-sm">
                              <div className="flex items-center gap-3">
                                <FileCheck size={20} className="text-primary" />
                                <div>
                                  <p className="text-xs font-bold text-on-surface truncate max-w-[150px]">{file.file.name}</p>
                                  <p className="text-[10px] text-outline font-medium">{(file.file.size / 1024 / 1024).toFixed(1)}MB</p>
                                </div>
                              </div>
                             <button onClick={() => removeFile(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(2)} className="flex-1 py-4 border border-outline-variant rounded-2xl font-bold text-xs uppercase tracking-widest text-outline">Back</button>
                    <button 
                      disabled={files.length === 0 || isSubmitting}
                      onClick={submitApplication}
                      className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? "Submitting..." : "Submit for Review"}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 space-y-8"
            >
              <div className="relative inline-block">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                  className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto relative z-10 shadow-2xl"
                >
                  <Check size={48} />
                </motion.div>
                <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-20" />
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-black text-on-surface">Ваше резюме было отправлено!</h2>
                <p className="text-on-surface-variant font-medium leading-relaxed max-w-xs mx-auto">Ждите 24-48 часов для проверки вашей анкеты.</p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-outline-variant/30 text-left max-w-xs mx-auto mt-4">
                  <p className="text-[10px] font-black uppercase text-outline mb-2">Submitted Documents:</p>
                  <div className="space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-on-surface truncate">
                        <FileCheck size={12} className="text-emerald-500" /> {f.file.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => navigate('/')}
                  className="w-full max-w-xs py-5 bg-on-surface text-white rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl"
                >
                  <Home size={20} />
                  Идти домой
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
      <BottomNavBar />
    </div>
  );
}
