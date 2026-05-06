import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, ArrowRight, Chrome, GraduationCap, Globe } from "lucide-react";
import { auth, signInWithGoogle, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "@/src/lib/firebase";

export default function LoginScreen() {
  const navigate = useNavigate();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code === "auth/operation-not-allowed") {
        setError("Google sign-in is not enabled. Please enable it in the Firebase Console.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup closed before completion. Please try again.");
      } else {
        setError(err.message || "Google sign in failed");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col px-6 py-12 justify-center items-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-outline-variant/20 text-center space-y-10"
      >
        <div className="space-y-4">
          <div className="w-24 h-24 bg-primary-container rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-primary-container/20">
            <GraduationCap size={56} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter uppercase italic">Neighbor Mentor</h1>
          <p className="text-sm text-outline font-medium">Kazakhstan's most trusted P2P learning network.</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-5 bg-primary-container text-white rounded-[1.75rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-primary-container/20 relative overflow-hidden group"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Chrome size={20} className="text-white" />
                Вход через Google
              </>
            )}
          </button>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-red-500 font-bold bg-red-50 p-4 rounded-2xl border border-red-100"
            >
              {error}
            </motion.p>
          )}
        </div>

        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-outline-variant/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-[10px] font-black text-outline/40 tracking-widest italic">Protected Securely</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-outline/40">
             <Globe size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">Available in Kazakhstan Only</span>
          </div>
          <p className="text-[10px] text-outline/60 font-medium px-8 leading-relaxed">
            By continuing, you agree to our <Link to="/help" className="text-primary font-bold hover:underline">Terms of Service</Link> and <Link to="/help" className="text-primary font-bold hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
