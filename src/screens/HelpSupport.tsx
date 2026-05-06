import { TopAppBar, BottomNavBar } from "@/src/components/Navigation";
import { Phone, Mail, MessageCircle, ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { cn } from "@/src/lib/utils";
import { useLocation } from "react-router-dom";

export default function HelpSupportScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const faqs = [
    { q: "How do I book a session?", a: "Find a tutor on the search screen, select your preferred dates and times, choose a payment method, and confirm. The tutor will be notified instantly and you can start chatting." },
    { q: "Can I pay with Kaspi QR?", a: "Yes! We support both Cash on Arrival and Kaspi QR. When selecting QR, you'll receive the tutor's details for a secure transfer. Tutors are encouraged to keep their QR codes ready." },
    { q: "What is a Verified Tutor?", a: "Verified tutors have undergone a manual document verification process where we check university diplomas, national IDs, and specific test scores (like SAT/IELTS)." },
    { q: "How can I become a tutor?", a: "Go to the 'Explore' screen and click 'Teach & Earn' or complete your profile verification under Settings. You'll need to upload proof of expertise." },
    { q: "Are sessions conducted online or in person?", a: "The platform supports both. You can check the tutor's profile or chat with them directly to arrange the meeting location or link." },
    { q: "Is there a cancellation fee?", a: "Cancellations made more than 24 hours before the session are free. Late cancellations may incur a fee depending on the tutor's specific policy." },
    { q: "How do I report a problem with a tutor?", a: "If you encounter any issues during or after a session, please use the 'Call Us' or 'WhatsApp' buttons above to reach our support team immediately." },
  ];

  const [showLegal, setShowLegal] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.openLegal) {
      setShowLegal(location.state.openLegal);
      // Clear state so it doesn't reopen on back navigation
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const legalContent: Record<string, { title: string, content: string }> = {
    "Terms of Service": {
      title: "Terms of Service",
      content: "Welcome to Neighbor Mentor. By using our application, you agree to these terms. (1) Our platform connects students with P2P mentors in Kazakhstan. (2) We do not process payments directly; users use Kaspi QR or Cash. (3) You are responsible for your safety during in-person sessions. (4) Misuse of the platform, including harassment or fraud, will lead to instant account termination."
    },
    "Privacy Policy": {
      title: "Privacy Policy",
      content: "Your privacy is paramount. (1) We collect your name, university info, and contact details solely for facilitating mentors-student connections. (2) We use Firebase for secure data storage. (3) We do not sell your data to third parties. (4) You can delete your account and all associated data at any time via Settings."
    },
    "Tutor Guidelines": {
      title: "Tutor Guidelines",
      content: "As a Neighbor Mentor tutor: (1) You must provide accurate background information. (2) Professional conduct is mandatory at all times. (3) Verification is required to earn the 'Verified' badge. (4) Be punctual and prepared for all booked sessions."
    },
    "Student Handbook": {
      title: "Student Handbook",
      content: "For students: (1) Respect your mentors time. (2) Payments should be settled immediately after the session. (3) Providing feedback helps the community grow. (4) Report any issues to our global support team via the contact channels provided."
    }
  };

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24 bg-[#f8faff]">
      <TopAppBar title="Help & Support" showBack />
      <main className="mt-24 px-5 max-w-2xl mx-auto space-y-12">
        {/* Search Bar */}
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search help topics..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-3xl px-12 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
          />
          <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={20} />
        </div>

        {/* Contact info */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-outline uppercase tracking-widest">Connect with Us</h3>
            <div className="h-px bg-slate-100 flex-1 ml-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ContactCard 
              icon={<Phone size={20}/>} 
              label="Call Us" 
              value="8 705 900 9380" 
              link="tel:87059009380"
              color="bg-sky-50 text-sky-600" 
            />
            <ContactCard 
              icon={<MessageCircle size={20}/>} 
              label="WhatsApp" 
              value="8 705 900 9380" 
              link="https://wa.me/87059009380"
              color="bg-emerald-50 text-emerald-600" 
            />
            <ContactCard 
              icon={<Mail size={20}/>} 
              label="Email" 
              value="support@usoz.kz" 
              link="mailto:support@usoz.kz"
              color="bg-amber-50 text-amber-600" 
            />
          </div>
        </section>

        {/* FAQs */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-outline uppercase tracking-widest">Frequently Asked Questions</h3>
            <div className="h-px bg-slate-100 flex-1 ml-4" />
          </div>
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, i) => (
                <FaqItem key={i} question={faq.q} answer={faq.a} />
              ))
            ) : (
                <div className="text-center py-12 px-8 bg-white rounded-3xl border border-dashed border-outline-variant/50">
                  <HelpCircle size={48} className="mx-auto text-outline/30 mb-4" />
                  <p className="text-sm font-bold text-on-surface">No matching questions found</p>
                  <p className="text-[10px] text-outline font-medium mt-1 uppercase tracking-widest">Try adjusting your search criteria</p>
                </div>
            )}
          </div>
        </section>

        {/* Quick Links */}
        <section className="space-y-4">
          <h3 className="text-xs font-black text-outline uppercase tracking-widest px-1">More Resources</h3>
          <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden divide-y divide-outline-variant/10">
            {Object.keys(legalContent).map(label => (
              <ResourceLink key={label} label={label} onClick={() => setShowLegal(label)} />
            ))}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {showLegal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-left">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLegal(null)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl space-y-6"
            >
              <h3 className="text-2xl font-black text-on-surface uppercase tracking-tighter italic">{legalContent[showLegal].title}</h3>
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-sm font-medium text-outline leading-relaxed">
                  {legalContent[showLegal].content}
                </p>
              </div>
              <button 
                onClick={() => setShowLegal(null)}
                className="w-full py-5 bg-on-surface text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all"
              >
                Close Document
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNavBar />
    </div>
  );
}

function ContactCard({ icon, label, value, color, link }: any) {
  return (
    <a 
      href={link}
      className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col items-center text-center space-y-3 hover:shadow-lg hover:-translate-y-1 transition-all"
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", color)}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-outline uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xs font-bold text-on-surface">{value}</p>
      </div>
    </a>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string, key?: number | string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={cn(
      "bg-white border rounded-[2rem] overflow-hidden transition-all duration-500",
      isOpen ? "border-primary shadow-xl shadow-primary/5 ring-4 ring-primary/5" : "border-slate-100 shadow-sm"
    )}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full p-6 flex items-center justify-between text-left transition-all",
          isOpen ? "bg-primary/5" : "hover:bg-slate-50"
        )}
      >
        <span className={cn(
          "text-sm font-bold leading-tight transition-colors",
          isOpen ? "text-primary" : "text-on-surface"
        )}>{question}</span>
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500",
          isOpen ? "bg-primary text-white rotate-180" : "bg-slate-100 text-outline"
        )}>
          <ChevronDown size={16} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="px-6 pb-6 pt-2 text-xs font-medium text-on-surface-variant leading-relaxed opacity-80">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResourceLink({ label, onClick }: { label: string, onClick?: () => void, key?: string }) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all font-bold text-sm text-on-surface text-left"
    >
      {label}
      <ArrowRight size={16} className="text-outline" />
    </button>
  );
}
